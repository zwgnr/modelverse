import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { StreamId } from "@convex-dev/persistent-text-streaming";
import { streamingComponent } from "./streaming";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

export const streamChat = httpAction(async (ctx, request) => {
  try {
    // Get user from Clerk authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { 
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Vary": "Origin",
        },
      });
    }
    const userId = identity.subject;

  const body = (await request.json()) as {
    streamId: string;
  };

  // verify that the user owns the message/conversation before we start streaming.
  const message = await ctx.runQuery(internal.messages.getMessageByStreamId, {
    streamId: body.streamId,
  });

  if (!message) {
    // We don't throw an error here, because the client might just be
    // racing to connect. The stream writer below will handle the
    // "not found" case gracefully.
    console.warn(`Message not found for streamId: ${body.streamId}`);
  } else if (message.userId !== userId) {
    // If the message exists but the user doesn't own it
    return new Response("Forbidden", { status: 403 });
  }

  // Start streaming and persisting at the same time while
  // we immediately return a streaming response to the client
  const response = await streamingComponent.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (ctx, request, streamId, append) => {
      // Find the message by streamId (again, to get latest state like `cancelled`)
      const message = await ctx.runQuery(
        internal.messages.getMessageByStreamId,
        {
          streamId: body.streamId,
        },
      );

      if (!message) {
        // This can happen if the client connects before the message DB row
        // is created. The streaming component will retry.
        throw new Error("Message not found for streamId");
      }

      // Check if already cancelled
      if (message.cancelled) {
        return; // Exit early if cancelled
      }

      // Get conversation history for context
      const history = await ctx.runQuery(internal.messages.getHistory, {
        conversationId: message.conversationId,
      });

      const model = message.model || "openai/gpt-4o-mini";
      const apiKey = process.env.OPEN_ROUTER_API_KEY!;
      const isWebSearchEnabled = model.endsWith(":online");

      // Create OpenRouter provider
      const openrouter = createOpenRouter({
        apiKey: apiKey,
      });

      // Create AbortController for cancellation
      const controller = new AbortController();

      try {
        const result = streamText({
          model: openrouter.chat(model),
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that can answer questions and help with tasks. Provide your response in markdown format. The year is ${new Date().getFullYear()} and today is ${new Date().toLocaleDateString()} Answer clearly and concisely. Keep answers under 300 words unless the user asks for more detail.`,
            },
            ...history,
          ],
          abortSignal: controller.signal,
        });

        // Stream the response
        for await (const chunk of result.textStream) {
          // Check for cancellation before each append
          const currentMessage = await ctx.runQuery(
            internal.messages.getMessageByStreamId,
            {
              streamId: body.streamId,
            },
          );

          if (currentMessage?.cancelled) {
            controller.abort();
            break;
          }

          // Append each chunk to the persistent stream as they come in
          await append(chunk);
        }
      } catch (error) {
        // Handle abort errors gracefully
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    },
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Vary", "Origin");

  return response;
  } catch (error) {
    console.error("Error in streamChat:", error);
    return new Response("Internal Server Error", { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
      },
    });
  }
});
