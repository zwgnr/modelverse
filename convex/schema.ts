import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_email", ["email"]),
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  messages: defineTable({
    userId: v.string(),
    conversationId: v.id("conversations"),
    prompt: v.string(),
    response: v.optional(v.string()),
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
  })
    .index("by_conversation", ["conversationId"]),
});
