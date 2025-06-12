import { createAuth } from "convex/auth";
import { fetchSession, getCookieName } from "@convex-dev/better-auth/react-start";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";

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