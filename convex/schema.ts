import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),
  
  messages: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    body: v.string(),
    author: v.string(),
    isStreaming: v.optional(v.boolean()),
    isCancelled: v.optional(v.boolean()),
    annotations: v.optional(v.array(v.any())),
    model: v.optional(v.string()),
    files: v.optional(v.array(v.object({
      filename: v.string(),
      fileType: v.string(),
      storageId: v.id("_storage"),
    }))),
  })
    .index("by_conversation", ["conversationId"]),
});
