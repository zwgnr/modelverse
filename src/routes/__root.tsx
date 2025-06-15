import { type ReactNode, useEffect } from "react";

import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	redirect,
	Scripts,
	useLoaderData,
	useRouteContext,
} from "@tanstack/react-router";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { ConvexReactClient } from "convex/react";

import { authClient } from "@/lib/auth-client";

import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";

import appCss from "../index.css?url";
import { getAuth } from "@/server/get-auth";
import { getThemeServerFn } from "@/server/theme";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	head: () => ({
		title: "askhole",
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "icon",
				href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💬</text></svg>",
			},
		],
	}),
	loader: async () => {
		return {
			theme: await getThemeServerFn(),
		};
	},
	beforeLoad: async (ctx) => {
		const auth = await getAuth();
		const { userId, token } = auth;

		// If the user is signed in and tries to access the sign-in page,
		// redirect them to the home page.
		if (userId && ctx.location.pathname === "/signin") {
			throw redirect({
				to: "/",
			});
		}

		// If the user is not signed in and is not on the sign-in page,
		// redirect them to the sign-in page.
		if (!userId && ctx.location.pathname !== "/signin") {
			throw redirect({
				to: "/signin",
				search: {
					// Keep track of the page the user was trying to access so we can
					// redirect them back after they sign in.
					redirect: ctx.location.href,
				},
			});
		}

		// During SSR only (the only time serverHttpClient exists),
		// set the auth token for Convex to make HTTP queries with.
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return { userId, token };
	},
	errorComponent: (props) => {
		const { theme } = useLoaderData({ from: Route.id });
		return (
			<ThemeProvider theme={theme}>
				<RootDocument>
					<DefaultCatchBoundary {...props} />
				</RootDocument>
			</ThemeProvider>
		);
	},
	notFoundComponent: NotFound,
	component: RootComponent,
});

function RootComponent() {
	const context = useRouteContext({ from: Route.id });
	const { token } = useRouteContext({ from: Route.id });
	const { theme } = useLoaderData({ from: Route.id });

	useEffect(() => {
		if (token) {
			// Set the auth token on the Convex client to ensure queries have auth
			context.convexClient.setAuth(async () => token);
		}
	}, [token, context.convexClient]);

	return (
		<ConvexBetterAuthProvider
			client={context.convexClient}
			authClient={authClient}
		>
			<ThemeProvider theme={theme}>
				<RootDocument>
					<Outlet />
				</RootDocument>
			</ThemeProvider>
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	const { theme } = useTheme();
	return (
		<html lang="en" className={theme} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				{/* <TanStackRouterDevtools position="bottom-right" /> */}
				<Scripts />
			</body>
		</html>
	);
}
