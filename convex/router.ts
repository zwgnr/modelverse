import { internalAction } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAssistantName } from "./utils/get_assistent_name";

type ChatParams = {
  messages: Doc<"messages">[];
  messageId: Id<"messages">;
  model?: string;
};

export const chat = internalAction({
  args: {
    messages: v.array(v.any()),
    messageId: v.id("messages"),
    model: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { messages, messageId, model = "openai/gpt-4o-mini" }: ChatParams,
  ) => {
    const apiKey = process.env.OPEN_ROUTER_API_KEY!;

    // Check if web search is enabled (model ends with :online)
    const isWebSearchEnabled = model.endsWith(":online");
    const baseModel = isWebSearchEnabled ? model.replace(":online", "") : model;

    // Get assistant name from the model ID
    const assistantName = getAssistantName(baseModel);

    // Add :online suffix to the model ID if web search is enabled
    const modelId = isWebSearchEnabled ? `${baseModel}:online` : baseModel;

    // Create abort controller for this stream
    const abortController = new AbortController();

    try {
      // Format messages for OpenRouter API
      const openRouterMessages = await Promise.all(
        messages.map(async ({ body, author, files }) => {
          const role = author === assistantName ? "assistant" : "user";

          // Handle files for user messages
          if (role === "user" && files && files.length > 0) {

            const content = [];

            // Add text content if present
            if (body.trim()) {
              content.push({
                type: "text",
                text: body,
              });
            }

            // Add files - fetch them from storage and convert to base64
            for (const file of files) {
              try {
                const blob = await ctx.storage.get(file.storageId);
                if (blob) {
                  const buffer = await blob.arrayBuffer();

                  // Convert ArrayBuffer to base64 without using Buffer (not available in Convex)
                  const bytes = new Uint8Array(buffer);
                  let binary = "";
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  const base64String = btoa(binary);
                  const base64Data = `data:${file.fileType};base64,${base64String}`;

                  console.log(
                    "File converted to base64, length:",
                    base64Data.length,
                    "type:",
                    file.fileType,
                  );

                  if (file.fileType.startsWith("image/")) {
                    content.push({
                      type: "image_url",
                      image_url: {
                        url: base64Data,
                      },
                    });
                    console.log("Added image to content");
                  } else if (file.fileType === "application/pdf") {
                    content.push({
                      type: "file",
                      file: {
                        filename: file.filename,
                        file_data: base64Data,
                      },
                    });
                    console.log("Added PDF to content");
                  }
                } else {
                  console.error(
                    "Blob not found for storage ID:",
                    file.storageId,
                  );
                }
              } catch (error) {
                console.error("Error fetching file from storage:", error);
              }
            }

            return {
              role,
              content,
            };
          }

          // Regular text message
          return {
            role,
            content: body,
          };
        }),
      );

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: openRouterMessages,
            stream: true,
          }),
          signal: abortController.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let body = "";
      let chunkCount = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;

                if (content) {
                  body += content;

                  // Check if message was cancelled every few chunks to reduce db load
                  chunkCount++;
                  if (chunkCount % 3 === 0) {
                    const currentMessage = await ctx.runQuery(
                      internal.messages.getMessage,
                      { messageId },
                    );
                    if (currentMessage?.isCancelled) {
                      abortController.abort();
                      break;
                    }
                  }

                  // Send an update on every stream chunk
                  await ctx.runMutation(internal.messages.update, {
                    messageId,
                    body,
                  });
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      }

      // Mark as no longer streaming when complete (only if not cancelled)
      const finalMessage = await ctx.runQuery(internal.messages.getMessage, {
        messageId,
      });
      if (!finalMessage?.isCancelled) {
        await ctx.runMutation(internal.messages.updateStreamingStatus, {
          messageId,
          isStreaming: false,
        });
      }
    } catch (e) {
      console.error("OpenRouter API call failed:", e);

      // Check if it was cancelled or a real error
      const currentMessage = await ctx.runQuery(internal.messages.getMessage, {
        messageId,
      });
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
          body:
            "AI call failed: " +
            (e instanceof Error ? e.message : "Unknown error"),
        });
        await ctx.runMutation(internal.messages.updateStreamingStatus, {
          messageId,
          isStreaming: false,
        });
      }
    }
  },
});