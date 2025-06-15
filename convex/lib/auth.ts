import type { Id } from "../_generated/dataModel";
import type { GenericCtx } from "../_generated/server";

export async function getAuthenticatedUserId(ctx: GenericCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	return identity.subject as Id<"users">;
}
