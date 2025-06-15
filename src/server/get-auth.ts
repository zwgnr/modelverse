import { createServerFn } from "@tanstack/react-start";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";

import {
	fetchSession,
	getCookieName,
} from "@convex-dev/better-auth/react-start";
import { createAuth } from "convex/auth";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	const sessionCookieName = await getCookieName(createAuth);
	const token = getCookie(sessionCookieName);
	const request = getWebRequest();
	const { session } = await fetchSession(createAuth, request);
	return {
		userId: session?.user.id,
		token,
	};
});
