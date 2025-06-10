import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Map model IDs to their corresponding AI assistant names
const MODEL_ASSISTANT_MAP: Record<string, string> = {
  "openai/gpt-4o-mini": "ChatGPT",
  "openai/chatgpt-4o-latest": "ChatGPT", 
  "anthropic/claude-sonnet-4": "Claude",
  "google/gemini-2.5-flash-preview-05-20": "Gemini"
};

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }): Promise<Doc<"messages">[]> => {
    const userId = await getAuthUserId(ctx);
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
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    return messages;
  },
});

export const send = mutation({
  args: { 
    body: v.string(), 
    author: v.string(),
    conversationId: v.id("conversations"),
    model: v.optional(v.string()),
    files: v.optional(v.array(v.object({
      filename: v.string(),
      fileType: v.string(),
      storageId: v.id("_storage"),
    }))),
  },
  handler: async (ctx, { body, author, conversationId, model = "openai/gpt-4o-mini", files }) => {
    // Get the current user's ID using Convex Auth
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Check if this is the first user message (for title generation)
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    
    const isFirstUserMessage = existingMessages.length === 0 && author === "User";

    // Send our message.
    await ctx.db.insert("messages", { 
      body, 
      author, 
      userId, 
      conversationId,
      files
    });

    // Update conversation's last activity
    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
    });

    // If this is the first user message, generate an AI-powered title
    if (isFirstUserMessage) {
      ctx.scheduler.runAfter(0, internal.conversations.generateTitle, {
        conversationId,
        firstMessage: body
      });
    }

    // Fetch messages for context with smart prioritization
    // Always include messages with files, then fill up to 50 with recent messages
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    
    // Get all messages with files (images, PDFs, etc.)
    const messagesWithFiles = allMessages.filter(msg => msg.files && msg.files.length > 0);
    
    // Get recent messages (last 50) 
    const recentMessages = allMessages
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 50);
    
    // Combine and deduplicate, prioritizing messages with files
    const contextMessages = new Map();
    
    // First add all messages with files
    messagesWithFiles.forEach(msg => {
      contextMessages.set(msg._id, msg);
    });
    
    // Then add recent messages
    recentMessages.forEach(msg => {
      contextMessages.set(msg._id, msg);
    });
    
    // Convert back to array and sort chronologically
    const messages = Array.from(contextMessages.values())
      .sort((a, b) => a._creationTime - b._creationTime);
    
    // Determine AI assistant name based on model
    const aiAssistant = MODEL_ASSISTANT_MAP[model] || "ChatGPT";
    
    // Insert a message with a placeholder body.
    const messageId = await ctx.db.insert("messages", {
      author: aiAssistant,
      body: "...",
      userId,
      conversationId,
      isStreaming: true,
      model: model,
    });
    
    // Schedule an action that calls OpenRouter with the specified model
    ctx.scheduler.runAfter(0, internal.router.chat, { 
      messages, 
      messageId, 
      model 
    });
  },
});

// Updates a message with a new body.
export const update = internalMutation({
  args: { messageId: v.id("messages"), body: v.string() },
  handler: async (ctx, { messageId, body }) => {
    await ctx.db.patch(messageId, { body });
  },
});

// Updates a message with annotations (web search citations)
export const updateAnnotations = internalMutation({
  args: { messageId: v.id("messages"), annotations: v.array(v.any()) },
  handler: async (ctx, { messageId, annotations }) => {
    await ctx.db.patch(messageId, { annotations });
  },
});

// Updates streaming status of a message
export const updateStreamingStatus = internalMutation({
  args: { 
    messageId: v.id("messages"), 
    isStreaming: v.optional(v.boolean()),
    isCancelled: v.optional(v.boolean())
  },
  handler: async (ctx, { messageId, isStreaming, isCancelled }) => {
    const updates: any = {};
    if (isStreaming !== undefined) updates.isStreaming = isStreaming;
    if (isCancelled !== undefined) updates.isCancelled = isCancelled;
    await ctx.db.patch(messageId, updates);
  },
});

// Get a specific message by ID
export const getMessage = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    return await ctx.db.get(messageId);
  },
});

// Cancel a streaming message
export const cancelStream = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    // Mark the message as cancelled immediately
    // The streaming action will detect this change and stop
    await ctx.db.patch(messageId, { 
      isStreaming: false,
      isCancelled: true
    });
  },
});

// Get the latest streaming message for a conversation
export const getStreamingMessage = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the conversation belongs to the user
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Find the most recent AI message that is streaming
    const streamingMessage = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .filter((q) => q.and(
        q.neq(q.field("author"), "User"),
        q.eq(q.field("isStreaming"), true)
      ))
      .order("desc")
      .first();

    return streamingMessage;
  },
});


