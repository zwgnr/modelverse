import {
  PersistentTextStreaming,
  StreamId,
  StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const streamingComponent = new PersistentTextStreaming(
  components.persistentTextStreaming,
);

export const getStreamBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // 1. Find the message associated with this stream.
    const message = await ctx.db
      .query("messages")
      .withIndex("by_stream", (q) => q.eq("responseStreamId", args.streamId))
      .first();

    if (!message) {
      // This is a race condition that the client-side hook is designed
      // to handle by retrying, so we throw an error to trigger that.
      throw new Error("Message not found");
    }

    // 2. Verify the user owns this message.
    if (message.userId !== userId) {
      throw new Error("Not authorized to view this stream");
    }

    // 3. If all checks pass, return the stream body.
    return await streamingComponent.getStreamBody(
      ctx,
      args.streamId as StreamId,
    );
  },
});
