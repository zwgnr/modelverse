import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { streamingComponent } from "./streaming";
import { StreamId } from "@convex-dev/persistent-text-streaming";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }): Promise<Doc<"messages">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Get messages for this conversation in chronological order
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    return messages;
  },
});

export const saveResponse = mutation({
  args: { messageId: v.id("messages"), response: v.string() },
  handler: async (ctx, { messageId, response }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the message belongs to the user
    const message = await ctx.db.get(messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    await ctx.db.patch(messageId, { response });
  },
});

export const cancelStream = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the message belongs to the user
    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    // Mark the message as cancelled by updating it
    await ctx.db.patch(args.messageId, {
      cancelled: true,
    });
  },
});

export const send = mutation({
  args: {
    prompt: v.string(),
    conversationId: v.id("conversations"),
    model: v.optional(v.string()),
    files: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          fileType: v.string(),
          storageId: v.id("_storage"),
        }),
      ),
    ),
  },
  handler: async (
    ctx,
    { prompt, conversationId, model = "openai/gpt-4o-mini", files },
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Check if this is the first message (for title generation)
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    const isFirstMessage = existingMessages.length === 0;

    // Create a response stream
    const responseStreamId = await streamingComponent.createStream(ctx);

    // Insert message with prompt and stream ID (like reference)
    const messageId = await ctx.db.insert("messages", {
      userId,
      conversationId,
      prompt,
      model,
      responseStreamId,
      files,
    });

    // Update conversation's last activity
    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
    });

    // If this is the first message, generate an AI-powered title
    if (isFirstMessage) {
      ctx.scheduler.runAfter(0, internal.conversations.generateTitle, {
        conversationId,
        firstMessage: prompt,
      });
    }

    return messageId;
  },
});

export const getHistory = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    // Get messages for this conversation
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    // Get all messages with files (images, PDFs, etc.)
    const messagesWithFiles = allMessages.filter(
      (msg) => msg.files && msg.files.length > 0,
    );

    // Get recent messages (last 50)
    const recentMessages = allMessages
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 50);

    // Combine and deduplicate, prioritizing messages with files
    const contextMessages = new Map<Id<"messages">, Doc<"messages">>();

    // First add all messages with files
    messagesWithFiles.forEach((msg) => {
      contextMessages.set(msg._id, msg);
    });

    // Then add recent messages
    recentMessages.forEach((msg) => {
      contextMessages.set(msg._id, msg);
    });

    // Convert back to array and sort chronologically
    const messages = Array.from(contextMessages.values()).sort(
      (a, b) => a._creationTime - b._creationTime,
    );

    // Join the user messages with the assistant messages
    const joinedResponses = await Promise.all(
      messages.map(async (message) => {
        // Create user message with proper multimodal content format for AI SDK
        let userMessage;

        if (message.files && message.files.length > 0) {
          // Build content array with text and images - proper AI SDK format
          const content: Array<
            { type: "text"; text: string } | { type: "image"; image: string }
          > = [];

          // Add text content if present
          if (message.prompt.trim()) {
            content.push({
              type: "text",
              text: message.prompt,
            });
          }

          // Add images using proper AI SDK format
          for (const file of message.files) {
            if (file.fileType.startsWith("image/")) {
              const imageUrl = await ctx.storage.getUrl(
                file.storageId as Id<"_storage">,
              );
              if (imageUrl) {
                content.push({
                  type: "image",
                  image: imageUrl,
                });
              }
            }
            // For non-image files like PDFs, add a text description for now
            else {
              content.push({
                type: "text",
                text: `[Attached file: ${file.filename}]`,
              });
            }
          }

          userMessage = {
            role: "user" as const,
            content: content,
          };
        } else {
          // Simple text-only message
          userMessage = {
            role: "user" as const,
            content: message.prompt,
          };
        }

        // Use saved response if available, otherwise get from stream
        let responseContent = message.response;
        if (!responseContent) {
          const streamBody = await streamingComponent.getStreamBody(
            ctx,
            message.responseStreamId as StreamId,
          );
          responseContent = streamBody.text;
        }

        const assistantMessage = {
          role: "assistant" as const,
          content: responseContent,
        };

        // If the assistant message is empty, it's probably because we have not
        // started streaming yet so let's not include it in the history
        if (!assistantMessage.content) return [userMessage];

        return [userMessage, assistantMessage];
      }),
    );

    return joinedResponses.flat();
  },
});

export const getMessageByStreamId = internalQuery({
  args: { streamId: v.string() },
  handler: async (ctx, { streamId }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_stream", (q) => q.eq("responseStreamId", streamId))
      .first();

    return message;
  },
});
