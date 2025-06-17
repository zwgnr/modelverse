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

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
	throw new Error(
		"Please set the SITE_URL environment variable.",
	);
}

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your TanStack Start server
		baseURL: siteUrl,
		database: convexAdapter(ctx, betterAuthComponent),
		socialProviders: {
			github: {
				clientId: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			},
		},
		plugins: [convex()],
		user: {
			deleteUser: {
				enabled: true,
			},
		},
	});

export const { createUser, updateUser, deleteUser, createSession } =
	betterAuthComponent.createAuthFunctions<DataModel>({
		// Must create a user and return the user id
		onCreateUser: async (ctx, user) => {
			return ctx.db.insert("users", {
				email: user.email,
				useBYOK: true,
			});
		},

		// Delete the user when they are deleted from Better Auth
		onDeleteUser: async (ctx, userId) => {
			const userIdTyped = userId as Id<"users">;
			
			// Delete all user's conversations and their messages
			const conversations = await ctx.db
				.query("conversations")
				.withIndex("by_user", (q) => q.eq("userId", userIdTyped))
				.collect();

			for (const conversation of conversations) {
				// Delete all messages in each conversation
				const messages = await ctx.db
					.query("messages")
					.withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
					.collect();

				// Collect all file storage IDs to delete
				const storageIdsToDelete = [];
				for (const message of messages) {
					if (message.files) {
						for (const file of message.files) {
							storageIdsToDelete.push(file.storageId);
						}
					}
				}

				// Delete all messages
				for (const message of messages) {
					await ctx.db.delete(message._id);
				}

				// Delete associated files from storage
				for (const storageId of storageIdsToDelete) {
					try {
						await ctx.storage.delete(storageId);
					} catch (error) {
						console.error(`Failed to delete file ${storageId}:`, error);
					}
				}

				// Delete the conversation
				await ctx.db.delete(conversation._id);
			}

			// Finally delete the user
			await ctx.db.delete(userIdTyped);
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
		
		return {
			...user,
			...userMetadata,
		};
	},
});
