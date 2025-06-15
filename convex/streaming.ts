import {
	PersistentTextStreaming,
	type StreamId,
	StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";

import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import { getAuthenticatedUserId } from "./lib/auth";

export const streamingComponent = new PersistentTextStreaming(
	components.persistentTextStreaming,
);

export const getStreamBody = query({
	args: {
		streamId: StreamIdValidator,
	},

	handler: async (ctx, args) => {
		const userId = await getAuthenticatedUserId(ctx);
		// Find the message with the matching responseStreamId
		const message = await ctx.runQuery(internal.messages.getMessageByStreamId, {
			streamId: args.streamId as StreamId,
		});

		if (!message) {
			throw new Error("Message not found");
		}

		if (message.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return await streamingComponent.getStreamBody(
			ctx,
			args.streamId as StreamId,
		);
	},
});
