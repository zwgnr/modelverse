import {
	type StreamId,
	StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
	internalQuery,
	mutation,
	type QueryCtx,
	query,
} from "./_generated/server";
import { getAuthenticatedUserId } from "./lib/auth";
import { modelId } from "./schema";
import { streamingComponent } from "./streaming";

export const get = query({
	args: { conversationId: v.id("conversations") },
	handler: async (ctx, { conversationId }): Promise<Doc<"messages">[]> => {
		try {
			const userId = await getAuthenticatedUserId(ctx);
			const conversation = await ctx.db.get(conversationId);
			if (!conversation || conversation.userId !== userId) {
				// This conversation doesn't belong to the user, so return no messages
				return [];
			}

			return await ctx.db
				.query("messages")
				.withIndex("by_conversation_order", (q) =>
					q.eq("conversationId", conversationId),
				)
				.order("asc")
				.collect();
		} catch (e) {
			console.error(e);
			return [];
		}
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
		const userId = await getAuthenticatedUserId(ctx);

		const conversation = await ctx.db.get(conversationId);
		if (!conversation) throw new Error("Conversation not found");
		if (conversation.userId !== userId) throw new Error("Unauthorized");

		// Get the current message count to determine order
		const existingMessages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", conversationId),
			)
			.collect();

		const isFirstMessage = existingMessages.length === 0;
		const nextMessageOrder = existingMessages.length;

		// Insert the user message
		const userMessageId = await ctx.db.insert("messages", {
			userId,
			conversationId,
			role: "user",
			content: prompt,
			model,
			files,
			messageOrder: nextMessageOrder,
		});

		// Create a stream for the assistant response
		const responseStreamId = await streamingComponent.createStream(ctx);

		// Insert the assistant message with streaming
		const assistantMessageId = await ctx.db.insert("messages", {
			userId,
			conversationId,
			role: "assistant",
			content: "", // Will be filled by streaming
			responseStreamId,
			messageOrder: nextMessageOrder + 1,
		});

		await ctx.db.patch(conversationId, {
			updatedAt: Date.now(),
		});

		if (isFirstMessage) {
			ctx.scheduler.runAfter(0, internal.conversations.generateTitle, {
				conversationId,
				firstMessage: prompt,
				userId,
			});
		}

		return {
			userMessageId,
			assistantMessageId,
			streamId: responseStreamId,
		};
	},
});

export const saveResponse = mutation({
	args: { messageId: v.id("messages"), response: v.string() },
	handler: async (ctx, { messageId, response }) => {
		const userId = await getAuthenticatedUserId(ctx);

		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");
		if (message.role !== "assistant")
			throw new Error("Can only save response to assistant messages");

		await ctx.db.patch(messageId, { content: response });
	},
});

export const getMessageByStreamId = internalQuery({
	args: {
		streamId: StreamIdValidator,
	},
	handler: async (ctx, args) => {
		// Find the message with the matching responseStreamId
		const message = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("responseStreamId"), args.streamId))
			.first();

		return message;
	},
});

export const getInternal = internalQuery({
	args: { conversationId: v.id("conversations") },
	handler: async (ctx, { conversationId }) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_conversation_order", (q) =>
				q.eq("conversationId", conversationId),
			)
			.order("asc")
			.collect();
	},
});

export const finalizeStreamedResponse = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, { messageId }) => {
		const userId = await getAuthenticatedUserId(ctx);

		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");
		if (message.role !== "assistant")
			throw new Error("Can only finalize assistant messages");

		// Only finalize if we have a stream ID and no content yet
		if (!message.responseStreamId || message.content) {
			return;
		}

		// Get the final text from the stream
		const streamBody = await streamingComponent.getStreamBody(
			ctx,
			message.responseStreamId as StreamId,
		);

		if (streamBody.status === "done" && streamBody.text) {
			// Save the final text to the content field but keep the stream ID linked
			await ctx.db.patch(messageId, {
				content: streamBody.text,
				// Keep responseStreamId linked for now
			});
		}
	},
});

export const getConversationHistory = internalQuery({
	args: {
		conversationId: v.id("conversations"),
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Get all messages for this conversation up to the specified message
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation_order", (q) =>
				q.eq("conversationId", args.conversationId),
			)
			.order("asc")
			.collect();

		// Find the target message to determine cutoff point
		const targetMessageIndex = messages.findIndex(
			(m) => m._id === args.messageId,
		);

		// Build conversation history, excluding the current message being processed
		const history = [];
		const messagesToInclude =
			targetMessageIndex >= 0
				? messages.slice(0, targetMessageIndex)
				: messages;

		for (const message of messagesToInclude) {
			if (message.role === "user") {
				const userContent = await buildUserMessageContent(ctx, message);
				history.push({
					role: "user" as const,
					content: userContent,
				});
			} else if (message.role === "assistant") {
				// Get content from stream or content field
				let content = message.content;
				if (message.responseStreamId && !content) {
					const streamBody = await streamingComponent.getStreamBody(
						ctx,
						message.responseStreamId as StreamId,
					);
					content = streamBody.text || "";
				}

				if (content) {
					history.push({
						role: "assistant" as const,
						content,
					});
				}
			} else if (message.role === "system") {
				history.push({
					role: "system" as const,
					content: message.content,
				});
			}
		}

		return history;
	},
});

// Helper function to build user message content including files
async function buildUserMessageContent(
	ctx: QueryCtx,
	message: Doc<"messages">,
) {
	if (!message.files || message.files.length === 0) {
		// No files, just return the text
		return message.content;
	}

	// Build content array with text and images
	const contentParts: Array<
		| { type: "text"; text: string }
		| {
				type: "image_url";
				image_url: { url: string; detail: "high" | "low" | "auto" };
		  }
	> = [];

	// Add text content first
	if (message.content?.trim()) {
		contentParts.push({
			type: "text",
			text: message.content,
		});
	}

	// Add image content
	for (const file of message.files) {
		if (file.fileType.startsWith("image/")) {
			try {
				// Get the file URL from Convex storage
				const fileUrl = await ctx.storage.getUrl(file.storageId);
				if (fileUrl) {
					contentParts.push({
						type: "image_url",
						image_url: {
							url: fileUrl,
							detail: "high",
						},
					});
				}
			} catch (error) {
				console.error(`Failed to get URL for file ${file.storageId}:`, error);
			}
		}
	}

	return contentParts;
}

export const cancelStream = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, { messageId }) => {
		const userId = await getAuthenticatedUserId(ctx);

		// Fetch the message and verify ownership
		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");
		if (message.role !== "assistant")
			throw new Error("Can only cancel assistant message streams");

		// Nothing to cancel if there's no streaming response in progress
		if (!message.responseStreamId) {
			return;
		}

		// Fetch the text that has been streamed so far and persist it to the
		// message's `content` field so that the partial answer is preserved.
		const streamBody = await streamingComponent.getStreamBody(
			ctx,
			message.responseStreamId as StreamId,
		);

		if (streamBody.text) {
			await ctx.db.patch(messageId, { content: streamBody.text });
		}
	},
});

export const retry = mutation({
	args: {
		messageId: v.id("messages"),
		model: modelId,
	},
	handler: async (ctx, { messageId, model }) => {
		const userId = await getAuthenticatedUserId(ctx);

		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");
		if (message.role !== "assistant")
			throw new Error("Can only retry assistant messages");

		// Create a new stream for the retry
		const responseStreamId = await streamingComponent.createStream(ctx);

		// Update the message with the new stream
		await ctx.db.patch(messageId, {
			responseStreamId,
			content: "", // Clear previous content
		});

		// Update the associated user message's model
		const userMessage = await ctx.db
			.query("messages")
			.withIndex("by_conversation_order", (q) =>
				q.eq("conversationId", message.conversationId),
			)
			.filter((q) =>
				q.and(
					q.eq(q.field("role"), "user"),
					q.lt(q.field("messageOrder"), message.messageOrder),
				),
			)
			.order("desc")
			.first();

		if (userMessage) {
			await ctx.db.patch(userMessage._id, { model });
		}

		// Update conversation timestamp
		await ctx.db.patch(message.conversationId, {
			updatedAt: Date.now(),
		});

		return { messageId, streamId: responseStreamId };
	},
});
