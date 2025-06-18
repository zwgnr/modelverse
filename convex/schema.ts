import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define all valid model IDs as a const array for reuse
export const MODEL_IDS = [
	"openai/gpt-4o-mini",
	"openai/chatgpt-4o-latest",
	"openai/gpt-4.1",
	"anthropic/claude-sonnet-4",
	"anthropic/claude-opus-4",
	"google/gemini-2.0-flash-001",
	"google/gemini-2.5-flash-preview-05-20",
	"google/gemini-2.5-pro-preview",
	"deepseek/deepseek-r1-0528",
	"x-ai/grok-3-beta",
] as const;

// Generate web search variants programmatically
export const WEB_SEARCH_MODEL_IDS = MODEL_IDS.map(
	(id) => `${id}:online` as const,
);

// Combine all model IDs
export const ALL_MODEL_IDS = [...MODEL_IDS, ...WEB_SEARCH_MODEL_IDS] as const;

// Create the union type from the constant
export const modelId = v.union(...ALL_MODEL_IDS.map((id) => v.literal(id)));

export default defineSchema({
	users: defineTable({
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		openRouterKey: v.optional(v.string()),
		openRouterKeyId: v.optional(v.string()),
		useBYOK: v.optional(v.boolean()),
		// Customization settings
		defaultModel: v.optional(modelId),
		personalityTraits: v.optional(v.array(v.string())),
		customInstructions: v.optional(v.string()),
	}).index("by_email", ["email"]),

	usage: defineTable({
		userId: v.id("users"),
		messageId: v.id("messages"),
		model: modelId,
		promptTokens: v.optional(v.number()),
		completionTokens: v.optional(v.number()),
		totalTokens: v.optional(v.number()),
		reasoningTokens: v.optional(v.number()),
		cachedTokens: v.optional(v.number()),
		cost: v.optional(v.number()), // Cost in credits
		timestamp: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_timestamp", ["userId", "timestamp"])
		.index("by_message", ["messageId"]),

	conversations: defineTable({
		userId: v.id("users"),
		title: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		isPinned: v.optional(v.boolean()),
		branchParent: v.optional(v.id("conversations")),
		model: v.optional(modelId), // active convo model
	})
		.index("by_user", ["userId"])
		.index("by_user_updated", ["userId", "updatedAt"])
		.index("by_user_pinned_updated", ["userId", "isPinned", "updatedAt"]),

	messages: defineTable({
		userId: v.id("users"),
		conversationId: v.id("conversations"),
		role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
		content: v.string(),
		// For assistant messages, track streaming state
		responseStreamId: v.optional(StreamIdValidator),
		// For user messages, track model and files
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
		// Order messages within conversation
		messageOrder: v.number(),
	})
		.index("by_conversation", ["conversationId"])
		.index("by_conversation_order", ["conversationId", "messageOrder"])
		.index("by_stream", ["responseStreamId"])
		.index("by_role", ["role"]),
});
