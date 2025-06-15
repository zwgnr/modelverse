import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define all valid model IDs as a const array for reuse
export const MODEL_IDS = [
	"openai/gpt-4o-mini",
	"openai/chatgpt-4o-latest",
	"openai/gpt-4.1",
	"anthropic/claude-sonnet-4",
	"google/gemini-2.5-flash-preview-05-20",
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
		modelUsage: v.array(v.object({ model: modelId, count: v.number() })),
	}).index("by_email", ["email"]),
	conversations: defineTable({
		userId: v.id("users"),
		title: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		hasPendingInitialMessage: v.optional(v.boolean()),
		isPinned: v.optional(v.boolean()),
		branchParent: v.optional(v.id("conversations")), // Reference to original conversation if this is a branched copy
	})
		.index("by_user", ["userId"])
		.index("by_user_updated", ["userId", "updatedAt"])
		.index("by_user_pinned_updated", ["userId", "isPinned", "updatedAt"]),

	messages: defineTable({
		userId: v.id("users"),
		conversationId: v.id("conversations"),
		prompt: v.string(),
		response: v.optional(v.string()),
		responseStreamId: v.optional(StreamIdValidator),
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
	})
		.index("by_conversation", ["conversationId"])
		.index("by_stream", ["responseStreamId"]),
});
