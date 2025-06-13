import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { modelId } from "./schema";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }): Promise<Doc<"messages">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();
  },
});

export const send = mutation({
  args: {
    prompt: v.string(),
    conversationId: v.id("conversations"),
    model: v.optional(modelId),
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
  handler: async (ctx, { prompt, conversationId, model, files }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject as Id<"users">;

    // --- Track usage ---
    if (model) {
      const user = await ctx.db.get(userId);
      if (!user) throw new Error("User not found");

      const modelUsage = user.modelUsage ?? [];
      const modelIndex = modelUsage.findIndex((u) => u.model === model);

      if (modelIndex === -1) {
        modelUsage.push({ model, count: 1 });
      } else {
        modelUsage[modelIndex].count++;
      }

      await ctx.db.patch(userId, {
        modelUsage,
      });
    }
    // --- End track usage ---

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== userId) throw new Error("Unauthorized");

    const isFirstMessage =
      (
        await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversationId),
          )
          .collect()
      ).length === 0;

    const messageId = await ctx.db.insert("messages", {
      userId,
      conversationId,
      prompt,
      model,
      files,
      // `response` is omitted initially
    });

    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
      // Set pending flag if this is the first message (from index page flow)
      ...(isFirstMessage ? { hasPendingInitialMessage: true } : {}),
    });

    if (isFirstMessage) {
      ctx.scheduler.runAfter(0, internal.conversations.generateTitle, {
        conversationId,
        firstMessage: prompt,
      });
    }

    return messageId;
  },
});

export const saveResponse = mutation({
  args: { messageId: v.id("messages"), response: v.string() },
  handler: async (ctx, { messageId, response }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    if (message.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(messageId, { response });
  },
});
