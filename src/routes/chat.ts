import { createServerFileRoute } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAuth } from "../server/get-auth";

export const ServerRoute = createServerFileRoute("/chat").methods({
  POST: async ({ request }) => {
    try {
      const { userId } = await getAuth();

      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { messages, model } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response("Messages must be an array", { status: 400 });
      }

      const openrouter = createOpenRouter({
        apiKey: process.env.OPEN_ROUTER_API_KEY!,
      });

      const result = streamText({
        model: openrouter.chat(model),
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. The user is asking a question, and you should provide a clear and concise response. The year is ${new Date().getFullYear()}. Do not mention your knowledge cutoff date.`,
          },
          ...messages,
        ],
      });

      const response = result.toDataStreamResponse();
      return response;
    } catch (error) {
      console.error("Chat streaming error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
