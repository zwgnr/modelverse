import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from "ai";
import { internalAction } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";

type ChatParams = {
  messages: Doc<"messages">[];
  messageId: Id<"messages">;
  model?: string;
};

// Helper function to extract assistant name from OpenRouter model ID
function getAssistantName(modelId: string): string {
  if (modelId.includes('openai') || modelId.includes('gpt')) {
    return 'ChatGPT';
  }
  if (modelId.includes('anthropic') || modelId.includes('claude')) {
    return 'Claude';
  }
  if (modelId.includes('google') || modelId.includes('gemini')) {
    return 'Gemini';
  }
  // Default fallback
  return 'Assistant';
}

export const chat = internalAction({
  args: {
    messages: v.array(v.any()),
    messageId: v.id("messages"),
    model: v.optional(v.string())
  },
  handler: async (ctx, { messages, messageId, model = "openai/gpt-4o-mini" }: ChatParams) => {
    const apiKey = process.env.OPEN_ROUTER_API_KEY!;
    const openrouter = createOpenRouter({ apiKey });

    // Check if web search is enabled (model ends with :online)
    const isWebSearchEnabled = model.endsWith(':online');
    const baseModel = isWebSearchEnabled ? model.replace(':online', '') : model;

    // Get assistant name from the model ID
    const assistantName = getAssistantName(baseModel);
    
    // Add :online suffix to the model ID if web search is enabled
    const modelId = isWebSearchEnabled ? `${baseModel}:online` : baseModel;
    
    // Create abort controller for this stream
    const abortController = new AbortController();

    try {
      const result = streamText({
        model: openrouter.chat(modelId),
        messages: messages.map(({ body, author }) => ({
          role: author === assistantName ? ("assistant" as const) : ("user" as const),
          content: body,
        })),
        abortSignal: abortController.signal,
      });

      let body = "";
      let chunkCount = 0;
      for await (const textPart of result.textStream) {
        // Check if message was cancelled every few chunks to reduce db load
        chunkCount++;
        if (chunkCount % 3 === 0) {
          const currentMessage = await ctx.runQuery(internal.messages.getMessage, { messageId });
          if (currentMessage?.isCancelled) {
            abortController.abort();
            break;
          }
        }
        
        body += textPart;
        // Send an update on every stream chunk
        await ctx.runMutation(internal.messages.update, {
          messageId,
          body,
        });
      }

      // Mark as no longer streaming when complete (only if not cancelled)
      const finalMessage = await ctx.runQuery(internal.messages.getMessage, { messageId });
      if (!finalMessage?.isCancelled) {
        await ctx.runMutation(internal.messages.updateStreamingStatus, {
          messageId,
          isStreaming: false,
        });
      }
    } catch (e) {
      console.error("OpenRouter API call failed:", e);
      
      // Check if it was cancelled or a real error
      const currentMessage = await ctx.runQuery(internal.messages.getMessage, { messageId });
      if (currentMessage?.isCancelled || abortController.signal.aborted) {
        // Stream was cancelled, keep the current message content
        await ctx.runMutation(internal.messages.updateStreamingStatus, {
          messageId,
          isStreaming: false,
          isCancelled: true,
        });
      } else {
        // Real error occurred
        await ctx.runMutation(internal.messages.update, {
          messageId,
          body: "AI call failed: " + (e instanceof Error ? e.message : "Unknown error"),
        });
        await ctx.runMutation(internal.messages.updateStreamingStatus, {
          messageId,
          isStreaming: false,
        });
      }
    }
  },
});

 