export type Theme = "light" | "dark";

import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const storageKey = "ui-theme";

export const getThemeServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return (getCookie(storageKey) || "light") as Theme;
  },
);

export const setThemeServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "string" || (data !== "dark" && data !== "light")) {
      throw new Error("Invalid theme provided");
    }
    return data as Theme;
  })
  .handler(async ({ data }) => {
    setCookie(storageKey, data);
    return {
      success: true,
    };
  }); 