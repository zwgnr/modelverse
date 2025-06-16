import {
	type StreamId,
	StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";

import { components, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
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
				.withIndex("by_conversation", (q) =>
					q.eq("conversationId", conversationId),
				)
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

		// track usage
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

		// Create a stream for the response
		const responseStreamId = await streamingComponent.createStream(ctx);

		const messageId = await ctx.db.insert("messages", {
			userId,
			conversationId,
			prompt,
			model,
			files,
			responseStreamId,
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
				userId,
			});
		}

		return { messageId, streamId: responseStreamId };
	},
});

export const saveResponse = mutation({
	args: { messageId: v.id("messages"), response: v.string() },
	handler: async (ctx, { messageId, response }) => {
		const userId = await getAuthenticatedUserId(ctx);

		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");

		await ctx.db.patch(messageId, { response });

		// Clear the pending initial message flag if this conversation has it set
		const conversation = await ctx.db.get(message.conversationId);
		if (conversation?.hasPendingInitialMessage) {
			await ctx.db.patch(message.conversationId, {
				hasPendingInitialMessage: false,
			});
		}
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

export const finalizeStreamedResponse = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, { messageId }) => {
		const userId = await getAuthenticatedUserId(ctx);

		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");
		if (message.userId !== userId) throw new Error("Unauthorized");

		// Only finalize if we have a stream ID and no response yet
		if (!message.responseStreamId || message.response) {
			return;
		}

		// Get the final text from the stream
		const streamBody = await streamingComponent.getStreamBody(
			ctx,
			message.responseStreamId as StreamId,
		);

		if (streamBody.status === "done" && streamBody.text) {
			// Save the final text to the response field but keep the stream ID linked
			await ctx.db.patch(messageId, {
				response: streamBody.text,
				// Keep responseStreamId linked for now
			});

			// Clear the pending initial message flag if this conversation has it set
			const conversation = await ctx.db.get(message.conversationId);
			if (conversation?.hasPendingInitialMessage) {
				await ctx.db.patch(message.conversationId, {
					hasPendingInitialMessage: false,
				});
			}
		}
	},
});

export const getConversationHistory = internalQuery({
	args: {
		conversationId: v.id("conversations"),
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Get all messages for this conversation
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", args.conversationId),
			)
			.collect();

		// Sort by creation time
		messages.sort((a, b) => a._creationTime - b._creationTime);

		// Build conversation history, excluding the current message being processed
		const history = [];
		for (const message of messages) {
			if (message._id === args.messageId) {
				// Add the user message but not the response (since we're generating it)
				const userContent = await buildUserMessageContent(ctx, message);
				history.push({
					role: "user" as const,
					content: userContent,
				});
				break;
			}

			// Add user message
			const userContent = await buildUserMessageContent(ctx, message);
			history.push({
				role: "user" as const,
				content: userContent,
			});

			// Add assistant response if it exists
			if (message.responseStreamId) {
				// Get the response from the stream
				const streamBody = await streamingComponent.getStreamBody(
					ctx,
					message.responseStreamId as StreamId,
				);
				if (streamBody.text) {
					history.push({
						role: "assistant" as const,
						content: streamBody.text,
					});
				}
			} else if (message.response) {
				// Fallback to old response field
				history.push({
					role: "assistant" as const,
					content: message.response,
				});
			}
		}

		return history;
	},
});

// Helper function to build user message content including files
async function buildUserMessageContent(ctx: any, message: any) {
	if (!message.files || message.files.length === 0) {
		// No files, just return the text
		return message.prompt;
	}

	// Build content array with text and images
	const contentParts = [];

	// Add text content first
	if (message.prompt?.trim()) {
		contentParts.push({
			type: "text",
			text: message.prompt,
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
						type: "image",
						image: fileUrl,
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

		// Nothing to cancel if there's no streaming response in progress
		if (!message.responseStreamId) {
			return;
		}

		// Mark the underlying stream as done so that future appends fail and the
		// streaming loop will terminate early.
		await ctx.runMutation(
			components.persistentTextStreaming.lib.setStreamStatus,
			{
				streamId: message.responseStreamId as StreamId,
				status: "done",
			},
		);

		// Fetch the text that has been streamed so far and persist it to the
		// message's `response` field so that the partial answer is preserved.
		const streamBody = await streamingComponent.getStreamBody(
			ctx,
			message.responseStreamId as StreamId,
		);

		if (streamBody.text) {
			await ctx.db.patch(messageId, { response: streamBody.text });
		}

		// Clear the pending initial message flag if this conversation has it set
		const conversation = await ctx.db.get(message.conversationId);
		if (conversation?.hasPendingInitialMessage) {
			await ctx.db.patch(message.conversationId, {
				hasPendingInitialMessage: false,
			});
		}
	},
});
