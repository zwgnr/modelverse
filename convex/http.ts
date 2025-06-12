import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { streamChat } from "./chat";

const http = httpRouter();

// Handle preflight OPTIONS request for CORS
http.route({
  path: "/chat-stream",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      },
    });
  }),
});

// Handle the actual POST request
http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});

export default http;
