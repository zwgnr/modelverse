/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as conversations from "../conversations.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as streaming from "../streaming.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  conversations: typeof conversations;
  files: typeof files;
  http: typeof http;
  messages: typeof messages;
  streaming: typeof streaming;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: {
    lib: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                createdAt: number;
                email: string;
                emailVerified: boolean;
                image?: string;
                name: string;
                table: string;
                twoFactorEnabled?: boolean;
                updatedAt: number;
                userId: string;
              }
            | {
                createdAt: number;
                expiresAt: number;
                ipAddress?: string;
                table: string;
                token: string;
                updatedAt: number;
                userAgent?: string;
                userId: string;
              }
            | {
                accessToken?: string;
                accessTokenExpiresAt?: number;
                accountId: string;
                createdAt: number;
                idToken?: string;
                password?: string;
                providerId: string;
                refreshToken?: string;
                refreshTokenExpiresAt?: number;
                scope?: string;
                table: string;
                updatedAt: number;
                userId: string;
              }
            | {
                backupCodes: string;
                secret: string;
                table: string;
                userId: string;
              }
            | {
                createdAt?: number;
                expiresAt: number;
                identifier: string;
                table: string;
                updatedAt?: number;
                value: string;
              }
            | {
                createdAt: number;
                id?: string;
                privateKey: string;
                publicKey: string;
                table: string;
              };
        },
        any
      >;
      deleteAllForUser: FunctionReference<
        "action",
        "internal",
        { table: string; userId: string },
        any
      >;
      deleteAllForUserPage: FunctionReference<
        "mutation",
        "internal",
        {
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          table: string;
          userId: string;
        },
        any
      >;
      deleteBy: FunctionReference<
        "mutation",
        "internal",
        {
          field: string;
          table: string;
          unique?: boolean;
          value:
            | string
            | number
            | boolean
            | Array<string>
            | Array<number>
            | null;
        },
        any
      >;
      deleteOldVerifications: FunctionReference<
        "action",
        "internal",
        { currentTimestamp: number },
        any
      >;
      deleteOldVerificationsPage: FunctionReference<
        "mutation",
        "internal",
        {
          currentTimestamp: number;
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      getAccountByAccountIdAndProviderId: FunctionReference<
        "query",
        "internal",
        { accountId: string; providerId: string },
        any
      >;
      getAccountsByUserId: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        any
      >;
      getBy: FunctionReference<
        "query",
        "internal",
        {
          field: string;
          table: string;
          unique?: boolean;
          value:
            | string
            | number
            | boolean
            | Array<string>
            | Array<number>
            | null;
        },
        any
      >;
      getByQuery: FunctionReference<
        "query",
        "internal",
        {
          field: string;
          table: string;
          unique?: boolean;
          value:
            | string
            | number
            | boolean
            | Array<string>
            | Array<number>
            | null;
        },
        any
      >;
      getCurrentSession: FunctionReference<"query", "internal", {}, any>;
      getJwks: FunctionReference<"query", "internal", { limit?: number }, any>;
      listVerificationsByIdentifier: FunctionReference<
        "query",
        "internal",
        {
          identifier: string;
          limit?: number;
          sortBy?: { direction: "asc" | "desc"; field: string };
        },
        any
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                table: "account";
                value: Record<string, any>;
                where: {
                  field: string;
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                };
              }
            | {
                table: "session";
                value: Record<string, any>;
                where: {
                  field: string;
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                };
              }
            | {
                table: "verification";
                value: Record<string, any>;
                where: {
                  field: string;
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                };
              }
            | {
                table: "user";
                value: Record<string, any>;
                where: {
                  field: string;
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                };
              };
        },
        any
      >;
      updateTwoFactor: FunctionReference<
        "mutation",
        "internal",
        {
          update: { backupCodes?: string; secret?: string; userId?: string };
          userId: string;
        },
        any
      >;
      updateUserProviderAccounts: FunctionReference<
        "mutation",
        "internal",
        {
          providerId: string;
          update: {
            accessToken?: string;
            accessTokenExpiresAt?: number;
            accountId?: string;
            createdAt?: number;
            idToken?: string;
            password?: string;
            providerId?: string;
            refreshToken?: string;
            refreshTokenExpiresAt?: number;
            scope?: string;
            updatedAt?: number;
            userId?: string;
          };
          userId: string;
        },
        any
      >;
    };
  };
  persistentTextStreaming: {
    lib: {
      addChunk: FunctionReference<
        "mutation",
        "internal",
        { final: boolean; streamId: string; text: string },
        any
      >;
      createStream: FunctionReference<"mutation", "internal", {}, any>;
      getStreamStatus: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        "pending" | "streaming" | "done" | "error" | "timeout"
      >;
      getStreamText: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          text: string;
        }
      >;
      setStreamStatus: FunctionReference<
        "mutation",
        "internal",
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          streamId: string;
        },
        any
      >;
    };
  };
};
