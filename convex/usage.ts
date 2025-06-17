import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";
import { getAuthenticatedUserId } from "./lib/auth";
import { modelId } from "./schema";

// Track usage data for a message
export const trackUsage = internalMutation({
	args: {
		userId: v.id("users"),
		messageId: v.id("messages"),
		model: modelId,
		promptTokens: v.optional(v.number()),
		completionTokens: v.optional(v.number()),
		totalTokens: v.optional(v.number()),
		reasoningTokens: v.optional(v.number()),
		cachedTokens: v.optional(v.number()),
		cost: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("usage", {
			...args,
			timestamp: Date.now(),
		});
	},
});

// Get usage statistics for a user
export const getUserUsageStats = query({
	args: {},
	handler: async (ctx) => {
		try {
			const userId = await getAuthenticatedUserId(ctx);

			// Get all usage records for the user
			const usageRecords = await ctx.db
				.query("usage")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();

			// Get total conversations count
			const totalConversations = await ctx.db
				.query("conversations")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect()
				.then((conversations) => conversations.length);

			// Calculate model usage counts (for backwards compatibility)
			const modelUsage = usageRecords.reduce(
				(acc, record) => {
					const existingIndex = acc.findIndex(
						(item) => item.model === record.model,
					);
					if (existingIndex >= 0) {
						acc[existingIndex].count++;
					} else {
						acc.push({ model: record.model, count: 1 });
					}
					return acc;
				},
				[] as Array<{ model: string; count: number }>,
			);

			// Calculate total metrics
			const totalMessages = usageRecords.length;
			const totalTokens = usageRecords.reduce(
				(sum, record) => sum + (record.totalTokens || 0),
				0,
			);
			const totalCost = usageRecords.reduce(
				(sum, record) => sum + (record.cost || 0),
				0,
			);
			const totalPromptTokens = usageRecords.reduce(
				(sum, record) => sum + (record.promptTokens || 0),
				0,
			);
			const totalCompletionTokens = usageRecords.reduce(
				(sum, record) => sum + (record.completionTokens || 0),
				0,
			);
			const totalReasoningTokens = usageRecords.reduce(
				(sum, record) => sum + (record.reasoningTokens || 0),
				0,
			);
			const totalCachedTokens = usageRecords.reduce(
				(sum, record) => sum + (record.cachedTokens || 0),
				0,
			);

			return {
				modelUsage,
				totalMessages,
				totalConversations,
				totalTokens,
				totalCost,
				totalPromptTokens,
				totalCompletionTokens,
				totalReasoningTokens,
				totalCachedTokens,
				usageRecords,
			};
		} catch (error) {
			console.error(error);
			// Return empty data if not authenticated
			return {
				modelUsage: [],
				totalMessages: 0,
				totalConversations: 0,
				totalTokens: 0,
				totalCost: 0,
				totalPromptTokens: 0,
				totalCompletionTokens: 0,
				totalReasoningTokens: 0,
				totalCachedTokens: 0,
				usageRecords: [],
			};
		}
	},
});

// Get detailed usage data for the usage page
export const getDetailedUsage = query({
	args: {},
	handler: async (ctx) => {
		try {
			const userId = await getAuthenticatedUserId(ctx);

			const usageRecords = await ctx.db
				.query("usage")
				.withIndex("by_user_timestamp", (q) => q.eq("userId", userId))
				.order("desc")
				.collect();

			return usageRecords;
		} catch (error) {
			console.error(error);
			// Return empty array if not authenticated
			return [];
		}
	},
});
