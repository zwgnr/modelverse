import { v } from "convex/values";

import { hexToBytes } from "@noble/ciphers/utils";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
	internalAction,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { getAuthenticatedUserId } from "./lib/auth";
import { decrypt, encrypt } from "./lib/encryption";

export const getOpenRouterKey = internalAction({
	args: { userId: v.optional(v.id("users")) },
	handler: async (ctx, { userId }): Promise<string | null> => {
		// Use provided userId or get from auth context
		const targetUserId = userId ?? (await getAuthenticatedUserId(ctx));
		const user = await ctx.runQuery(internal.users.get, { id: targetUserId });

		if (!user || !user.openRouterKey) {
			return null;
		}

		const password = process.env.ENCRYPTION_KEY;
		if (!password) {
			throw new Error("ENCRYPTION_KEY environment variable not set");
		}

		try {
			const keyBytes = hexToBytes(password);
			const decryptedKey = await decrypt(user.openRouterKey, keyBytes);
			if (!decryptedKey) {
				// This can happen if the password is wrong
				throw new Error("Failed to decrypt key: empty result");
			}
			return decryptedKey;
		} catch (_e) {
			console.error("Decryption failed");
			return null;
		}
	},
});

export const get = internalQuery({
	args: { id: v.id("users") },
	handler: async (ctx, args): Promise<Doc<"users"> | null> => {
		return await ctx.db.get(args.id);
	},
});

export const getUserByEmail = internalQuery({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.unique();
	},
});

export const setUseBYOK = mutation({
	args: { useBYOK: v.boolean() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		return await ctx.db.patch(user._id, { useBYOK: args.useBYOK });
	},
});

export const storeOpenRouterKey = mutation({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		if (args.key === "") {
			throw new Error("Key cannot be empty");
		}

		// Encrypt the key on the server before storing it
		const password = process.env.ENCRYPTION_KEY;
		if (!password) {
			throw new Error("ENCRYPTION_KEY environment variable not set");
		}
		const keyId = process.env.ENCRYPTION_KEY_ID;
		const keyBytes = hexToBytes(password);
		const encryptedKey = await encrypt(args.key, keyBytes);

		return await ctx.db.patch(user._id, {
			openRouterKey: encryptedKey,
			openRouterKeyId: keyId,
			useBYOK: true,
		});
	},
});

export const deleteOpenRouterKey = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		return await ctx.db.patch(user._id, {
			openRouterKey: undefined,
			//	useBYOK: false,
		});
	},
});

export const updateCustomization = mutation({
	args: {
		defaultModel: v.optional(v.string()),
		personalityTraits: v.optional(v.array(v.string())),
		customInstructions: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Update user customization settings
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		// Validation for array length, trait length and instructions length
		if (args.personalityTraits) {
			if (args.personalityTraits.length > 50) {
				throw new Error("Maximum 50 personality traits allowed");
			}
			for (const trait of args.personalityTraits) {
				if (trait.length > 100) {
					throw new Error(
						"Each personality trait must be 100 characters or less",
					);
				}
			}
		}

		if (args.customInstructions && args.customInstructions.length > 3000) {
			throw new Error("Custom instructions must be 3000 characters or less");
		}

		const updateData: Record<string, unknown> = {};
		if (args.defaultModel !== undefined) {
			updateData.defaultModel = args.defaultModel;
		}
		if (args.personalityTraits !== undefined) {
			updateData.personalityTraits = args.personalityTraits;
		}
		if (args.customInstructions !== undefined) {
			updateData.customInstructions = args.customInstructions;
		}

		return await ctx.db.patch(user._id, updateData);
	},
});

export const getCustomization = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email))
			.unique();

		if (!user) {
			return null;
		}

		return {
			defaultModel: user.defaultModel,
			personalityTraits: user.personalityTraits,
			customInstructions: user.customInstructions,
		};
	},
});
