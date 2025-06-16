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

export const deleteFile = mutation({
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
				throw new Error("Message not found");
			}

			// Verify that the requested storageId is actually in this message.
			const fileInMessage = message.files?.some(
				(file) => file.storageId === storageId,
			);
			if (!fileInMessage) {
				throw new Error("File not found in message");
			}

			// Get the conversation to verify ownership.
			const conversation = await ctx.db.get(message.conversationId);
			if (!conversation) {
				throw new Error("Conversation not found");
			}

			// Verify the user owns the conversation.
			if (conversation.userId !== userId) {
				throw new Error("Unauthorized");
			}

			// Delete the file from storage
			await ctx.storage.delete(storageId);

			return { success: true };
		} catch (e) {
			console.error("Error deleting file:", e);
			throw e;
		}
	},
});

// todo: add cleanup util

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
