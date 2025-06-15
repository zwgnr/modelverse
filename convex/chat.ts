import type { StreamId } from "@convex-dev/persistent-text-streaming";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { betterAuthComponent } from "./auth";
import { streamingComponent } from "./streaming";

const cors = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Max-Age": "86400",
};

export const chat = httpAction(async (ctx, request) => {
	try {
		const user = await betterAuthComponent.getAuthUser(ctx);

		const body = (await request.json()) as {
			streamId: string;
		};

		if (!user) {
			await ctx.runMutation(streamingComponent.component.lib.setStreamStatus, {
				streamId: body.streamId as StreamId,
				status: "error",
			});
			return new Response("Unauthorized", { status: 401, headers: cors });
		}

		// Find the message with this streamId
		const message = await ctx.runQuery(internal.messages.getMessageByStreamId, {
			streamId: body.streamId as StreamId,
		});

		if (!message) {
			throw new Error("Message not found for streamId");
		}

		if (message.userId !== user.userId) {
			await ctx.runMutation(streamingComponent.component.lib.setStreamStatus, {
				streamId: body.streamId as StreamId,
				status: "error",
			});
			return new Response("Unauthorized", { status: 403, headers: cors });
		}

		// Check if stream is already completed or in progress
		const existingStream = await streamingComponent.getStreamBody(
			ctx,
			body.streamId as StreamId,
		);
		if (existingStream.status === "done") {
			return new Response("Stream already completed", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "text/plain",
				},
			});
		}

		if (existingStream.status === "streaming") {
			return new Response("Stream already in progress", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "text/plain",
				},
			});
		}

		// Start streaming and persisting at the same time while
		// we immediately return a streaming response to the client
		const response = await streamingComponent.stream(
			ctx,
			request,
			body.streamId as StreamId,
			async (ctx, _request, _streamId, append) => {
				const abortController = new AbortController();
				try {
					// Grab the conversation history so that the AI has context
					const history = await ctx.runQuery(
						internal.messages.getConversationHistory,
						{
							conversationId: message.conversationId,
							messageId: message._id,
						},
					);

					// Initialize OpenRouter
					const openrouter = createOpenRouter({
						apiKey: process.env.OPEN_ROUTER_API_KEY,
					});

					// Start the stream request to OpenRouter
					const result = streamText({
						model: openrouter.chat(message.model || "openai/gpt-4o-mini"),
						messages: [
							{
								role: "system",
								content: `You are a helpful assistant. The user is asking a question, and you should provide a clear and concise response. The year is ${new Date().getFullYear()}. Do not mention your knowledge cutoff date.`,
							},
							...history,
						],
						abortSignal: abortController.signal,
					});

					// Append each chunk to the persistent stream as they come in from OpenRouter
					let chunkCount = 0;
					for await (const textPart of result.textStream) {
						chunkCount++;
						try {
							await append(textPart || "");
						} catch (appendError) {
							console.error(
								`Error appending chunk ${chunkCount}:`,
								appendError,
							);
							// If we can't append, the stream might be closed, so abort and break.
							abortController.abort();
							break;
						}
					}
				} catch (error) {
					if ((error as Error).name === "AbortError") {
					} else {
						console.error("Error in stream callback:", error);
						throw error;
					}
				}
			},
		);

		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set("Vary", "Origin");

		return response;
	} catch (error) {
		console.error("Error in streamChat:", error);

		// Don't treat aborts as errors
		if ((error as Error).name === "AbortError") {
			return new Response("Stream aborted", { status: 200 });
		}

		// Return a proper error response
		return new Response(
			`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			{
				status: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "text/plain",
				},
			},
		);
	}
});
