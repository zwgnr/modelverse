import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";
import { betterAuthComponent, createAuth } from "./auth";
import { chat } from "./chat";

const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);

http.route({
	path: "/chat",
	method: "POST",
	handler: chat,
});

http.route({
	path: "/chat",
	method: "OPTIONS",
	handler: httpAction(async (_ctx, request: Request) => {
		const headers = request.headers;
		if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
		) {
			return new Response(null, {
				headers: new Headers({
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST",
					"Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
					"Access-Control-Max-Age": "86400",
				}),
			});
		} else {
			return new Response();
		}
	}),
});

export default http;
