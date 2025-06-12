import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { internal } from "./_generated/api";

export const list = query({
  handler: async (ctx): Promise<Doc<"conversations">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    // Get conversations ordered by most recently updated
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return conversations;
  },
});


export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, { title }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const now = Date.now();
    const conversationTitle = title || "New Chat";

    const conversationId = await ctx.db.insert("conversations", {
      userId,
      title: conversationTitle,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

export const updateTitle = mutation({
  args: { conversationId: v.id("conversations"), title: v.string() },
  handler: async (ctx, { conversationId, title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    await ctx.db.patch(conversationId, {
      title,
      updatedAt: Date.now(),
    });
  },
});

export const updateLastActivity = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
    });
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(conversationId);
  },
});

export const updateTitleInternal = internalMutation({
  args: { conversationId: v.id("conversations"), title: v.string() },
  handler: async (ctx, { conversationId, title }) => {
    await ctx.db.patch(conversationId, {
      title,
      updatedAt: Date.now(),
    });
  },
});

export const generateTitle = internalAction({
  args: {
    conversationId: v.id("conversations"),
    firstMessage: v.string(),
  },
  handler: async (ctx, { conversationId, firstMessage }) => {
    const apiKey = process.env.OPEN_ROUTER_API_KEY!;
    const openrouter = createOpenRouter({ apiKey });

    try {
      const result = await generateText({
        model: openrouter.chat("openai/gpt-4o-mini"),
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates short, descriptive titles for conversations. Generate a concise title (2-5 words) that captures the main topic or purpose of the conversation based on the first user message. Do not use quotes or extra formatting.",
          },
          {
            role: "user",
            content: `Generate a short title for a conversation that starts with: "${firstMessage}"`,
          },
        ],
        maxTokens: 50,
      });

      // Update the conversation title using internal mutation
      await ctx.runMutation(internal.conversations.updateTitleInternal, {
        conversationId,
        title: result.text.trim(),
      });
    } catch (e) {
      console.error("Failed to generate conversation title:", e);
      // If title generation fails, we'll just keep the default "New Chat" title
    }
  },
});
