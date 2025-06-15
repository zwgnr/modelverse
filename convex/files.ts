import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getAuthenticatedUserId } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { storageId, messageId }) => {
    try {
      const userId = await getAuthenticatedUserId(ctx);

      // Get the message to verify ownership and file existence.
      const message = await ctx.db.get(messageId);
      if (!message) {
        return null;
      }

      // Verify that the requested storageId is actually in this message.
      const fileInMessage = message.files?.some(
        (file) => file.storageId === storageId,
      );
      if (!fileInMessage) {
        return null;
      }

      // Get the conversation to verify ownership.
      const conversation = await ctx.db.get(message.conversationId);
      if (!conversation) {
        return null;
      }

      // Verify the user owns the conversation.
      if (conversation.userId !== userId) {
        return null;
      }

      return await ctx.storage.getUrl(storageId);
    } catch (e) {
      console.error(e);
      return null;
    }
  },
});
