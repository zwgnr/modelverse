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

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(components.betterAuth, {
	authFunctions,
});

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your TanStack Start server
		baseURL: "http://localhost:3000",
		database: convexAdapter(ctx, betterAuthComponent),

		// Simple non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			// The Convex plugin is required
			convex(),
		],
	});

// These are required named exports
export const { createUser, updateUser, deleteUser, createSession } =
	betterAuthComponent.createAuthFunctions<DataModel>({
		// Must create a user and return the user id
		onCreateUser: async (ctx, user) => {
			return ctx.db.insert("users", {
				email: user.email,
				modelUsage: [],
			});
		},

		// Delete the user when they are deleted from Better Auth
		onDeleteUser: async (ctx, userId) => {
			await ctx.db.delete(userId as Id<"users">);
		},
	});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		// Get user data from Better Auth - email, name, image, etc.
		const userMetadata = await betterAuthComponent.getAuthUser(ctx);
		if (!userMetadata) {
			return null;
		}
		// Get user data from your application's database
		// (skip this if you have no fields in your users table schema)
		const user = await ctx.db.get(userMetadata.userId as Id<"users">);
		const totalMessages =
			user?.modelUsage?.reduce((acc, { count }) => acc + count, 0) ?? 0;
		return {
			...user,
			...userMetadata,
			totalMessages,
		};
	},
});
