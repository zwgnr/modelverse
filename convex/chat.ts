import type { StreamId } from "@convex-dev/persistent-text-streaming";

import OpenAI from "openai";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { streamingComponent } from "./streaming";

const cors = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Max-Age": "86400",
};

function buildSystemMessage(
	personalityTraits?: string[],
	customInstructions?: string,
): string {
	const currentYear = new Date().getFullYear();
	let systemMessage = `You are a helpful assistant. The year is ${currentYear}. Do not mention your knowledge cutoff date. Respond in markdown.`;

	if (personalityTraits && personalityTraits.length > 0) {
		const traitsText = personalityTraits
			.map((trait) => `"${trait}"`)
			.join(", ");
		systemMessage += `\n\nTake on a ${traitsText} personality.`;
	}

	if (customInstructions?.trim()) {
		systemMessage += `\n\nPlease also follow these instructions: ${customInstructions.trim()}`;
	}

	return systemMessage;
}

export const chat = httpAction(async (ctx, request) => {
	try {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return new Response("Unauthorized", { status: 401, headers: cors });
		}

		const body = (await request.json()) as {
			streamId: string;
		};

		// Find the message with this streamId
		const message = await ctx.runQuery(internal.messages.getMessageByStreamId, {
			streamId: body.streamId as StreamId,
		});

		if (!message) {
			throw new Error("Message not found for streamId");
		}

		if (identity.subject !== message.userId) {
			return new Response("Forbidden", { status: 403, headers: cors });
		}

		// // Find the full user document from our database
		const user = await ctx.runQuery(internal.users.getUserById, {
			id: message.userId,
		});

		if (!user) {
			return new Response("User not found in database", {
				status: 404,
				headers: cors,
			});
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

					// Find the associated user message to get the model
					const userMessages = await ctx.runQuery(
						internal.messages.getInternal,
						{
							conversationId: message.conversationId,
						},
					);
					const userMessagesFiltered = userMessages.filter(
						(m: Doc<"messages">) =>
							m.role === "user" && m.messageOrder < message.messageOrder,
					);
					const associatedUserMessage =
						userMessagesFiltered[userMessagesFiltered.length - 1];
					const modelToUse =
						associatedUserMessage?.model || "openai/gpt-4o-mini";
					let apiKey = process.env.OPEN_ROUTER_API_KEY;
					if (user.useBYOK) {
						const byokKey = await ctx.runAction(
							internal.users.getOpenRouterKey,
							{},
						);
						apiKey = byokKey ?? "";
					}

					// Initialize OpenAI client for OpenRouter
					const openai = new OpenAI({
						apiKey,
						baseURL: "https://openrouter.ai/api/v1",
					});

					// Start the stream request to OpenRouter
					const stream = await openai.chat.completions.create(
						{
							model: modelToUse,
							messages: [
								{
									role: "system",
									content: buildSystemMessage(
										user.personalityTraits,
										user.customInstructions,
									),
								},
								...history,
							],
							stream: true,
							stream_options: {
								include_usage: true,
							},
						},
						{
							signal: abortController.signal,
						},
					);

					// Usage data
					let usage: OpenAI.Completions.CompletionUsage | null = null;

					// Append each chunk to the persistent stream as they come in from OpenRouter
					let chunkCount = 0;
					for await (const chunk of stream) {
						chunkCount++;
						try {
							// Check for usage data in the chunk
							if (chunk.usage) {
								usage = chunk.usage;
							}

							// Get the content from the first choice
							const content = chunk.choices[0]?.delta?.content;
							if (content) {
								await append(content);
							}
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

					// Track usage data when the stream finishes
					if (usage && "cost" in usage) {
						try {
							await ctx.runMutation(internal.usage.trackUsage, {
								userId: message.userId,
								messageId: message._id,
								model: modelToUse,
								promptTokens: usage.prompt_tokens,
								completionTokens: usage.completion_tokens,
								totalTokens: usage.total_tokens,
								cost: usage.cost as number,
							});
						} catch (error) {
							console.error("Error tracking usage:", error);
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
