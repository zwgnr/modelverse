import { v } from "convex/values";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
	internalAction,
	internalMutation,
	mutation,
	query,
} from "./_generated/server";

export const get = query({
	handler: async (ctx): Promise<Doc<"conversations">[]> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}
		const userId = identity.subject;

		// Get conversations ordered by most recently updated
		const conversations = await ctx.db
			.query("conversations")
			.withIndex("by_user_pinned_updated", (q) => q.eq("userId", userId))
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

export const clearPendingInitialMessage = mutation({
	args: { conversationId: v.id("conversations") },
	handler: async (ctx, { conversationId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const conversation = await ctx.db.get(conversationId);
		if (!conversation || conversation.userId !== userId) {
			throw new Error("Conversation not found or unauthorized");
		}

		await ctx.db.patch(conversationId, {
			hasPendingInitialMessage: false,
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

export const togglePin = mutation({
	args: { conversationId: v.id("conversations") },
	handler: async (ctx, { conversationId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const userId = identity.subject;

		const conversation = await ctx.db.get(conversationId);
		if (!conversation || conversation.userId !== userId) {
			throw new Error("Conversation not found or unauthorized");
		}

		await ctx.db.patch(conversationId, {
			isPinned: !conversation.isPinned,
			updatedAt: Date.now(),
		});
	},
});

export const createBranchedConversation = mutation({
	args: {
		conversationId: v.id("conversations"),
		title: v.optional(v.string()),
	},
	handler: async (ctx, { conversationId, title }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const userId = identity.subject;

		// Find the original conversation
		const originalConversation = await ctx.db.get(conversationId);
		if (!originalConversation) {
			throw new Error("Conversation not found");
		}

		// User can branch their own conversations or any conversation they have access to
		// For now, let's allow branching any conversation the user can access
		const userCanAccess = originalConversation.userId === userId;
		if (!userCanAccess) {
			throw new Error("Unauthorized to branch this conversation");
		}

		// Get all messages from the original conversation
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", conversationId),
			)
			.collect();

		const now = Date.now();
		const conversationTitle = title || `${originalConversation.title} (Branch)`;

		// Create new conversation
		const newConversationId = await ctx.db.insert("conversations", {
			userId,
			title: conversationTitle,
			createdAt: now,
			updatedAt: now,
			branchParent: conversationId,
		});

		// Copy all messages to the new conversation
		for (const message of messages) {
			await ctx.db.insert("messages", {
				userId,
				conversationId: newConversationId,
				prompt: message.prompt,
				response: message.response,
				model: message.model,
				files: message.files,
			});
		}

		return newConversationId;
	},
});
