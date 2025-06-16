import {
	type AuthFunctions,
	BetterAuth,
	convexAdapter,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";

import { betterAuth } from "better-auth";

import { components, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { type GenericCtx, query } from "./_generated/server";

const authFunctions: AuthFunctions = internal.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
	authFunctions,
});

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your TanStack Start server
		baseURL: "http://localhost:3000",
		database: convexAdapter(ctx, betterAuthComponent),
		socialProviders: {
			github: {
				clientId: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			},
		},
		plugins: [convex()],
	});

// These are required named exports
export const { createUser, updateUser, deleteUser, createSession } =
	betterAuthComponent.createAuthFunctions<DataModel>({
		// Must create a user and return the user id
		onCreateUser: async (ctx, user) => {
			return ctx.db.insert("users", {
				email: user.email,
				modelUsage: [],
				useBYOK: true,
			});
		},

		// Delete the user when they are deleted from Better Auth
		onDeleteUser: async (ctx, userId) => {
			await ctx.db.delete(userId as Id<"users">);
		},
	});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const userMetadata = await betterAuthComponent.getAuthUser(ctx);
		if (!userMetadata) {
			return null;
		}
		const user = await ctx.db.get(userMetadata.userId as Id<"users">);
		const totalMessages =
			user?.modelUsage?.reduce((acc, { count }) => acc + count, 0) ?? 0;
		
		// Get total conversations count
		const totalConversations = await ctx.db
			.query("conversations")
			.withIndex("by_user", (q) => q.eq("userId", userMetadata.userId as Id<"users">))
			.collect()
			.then(conversations => conversations.length);
		
		return {
			...user,
			...userMetadata,
			totalMessages,
			totalConversations,
		};
	},
});
