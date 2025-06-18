import { useCallback, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";

import { MessageCirclePlus, PanelLeft, Search } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { AccountPopover } from "@/components/account-popover";
import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Button } from "@/components/ui/button";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/_layout")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.conversations.get, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.auth.getCurrentUser, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.users.getCustomization, {}),
			),
		]);
	},
});

function RouteComponent() {
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [sidebarToggled, setSidebarToggled] = useState(false);
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const { data: currentUser } = useSuspenseQuery(
		convexQuery(api.auth.getCurrentUser, {}),
	);

	const router = useRouter();

	// Memoize chatid extraction to prevent unnecessary re-renders
	const currentChatId = useRouterState({
		select: (s) => {
			const seg = s.location.pathname.split("/");
			return seg[1] === "chat" ? seg[seg.length - 1] : undefined;
		},
	});

	const toggleSidebar = useCallback(() => {
		setSidebarVisible((v) => !v);
		setSidebarToggled(true);
	}, []);

	const handleConversationDelete = useCallback(
		(deletedConversationId: Id<"conversations">) => {
			// Navigate away if we're deleting the current conversation
			if (currentChatId === deletedConversationId) {
				router.navigate({ to: "/" });
			}
		},
		[currentChatId, router],
	);

	const handleSignOut = useCallback(() => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.navigate({ to: "/signin" });
				},
			},
		});
	}, [router]);

	const handleOpenCommandPalette = useCallback(() => {
		setCommandPaletteOpen(true);
	}, []);

	return (
		<div className="relative flex h-screen w-screen overflow-hidden bg-background">
			{/* Command Palette */}
			<CommandPalette
				open={commandPaletteOpen}
				onOpenChange={setCommandPaletteOpen}
			/>
			{/* Sidebar */}
			<div
				className={cn(
					"relative z-50 hidden flex-shrink-0 overflow-hidden transition-all duration-300 ease-out sm:block",
					sidebarVisible ? "w-64" : "w-0",
				)}
			>
				<div
					className={cn(
						"h-full w-64",
						!sidebarVisible && "pointer-events-none",
					)}
				>
					<Sidebar
						currentConversationId={currentChatId as Id<"conversations">}
						onConversationDelete={handleConversationDelete}
						onOpenCommandPalette={handleOpenCommandPalette}
						onSignOut={handleSignOut}
						isVisible={sidebarVisible}
						hasBeenToggled={sidebarToggled}
					/>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex min-w-0 flex-1 flex-col p-0 transition-all duration-300 ease-out">
				<div className="flex h-full flex-col overflow-hidden bg-card">
					{/* Header */}
					<div className="sticky top-0 z-10 flex-shrink-0 rounded-t-xl bg-transparent px-6 py-3 backdrop-blur-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									onClick={toggleSidebar}
									variant="ghost"
									size="icon"
									title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
									aria-label="Toggle sidebar"
								>
									<PanelLeft
										className={cn(
											"h-4 w-4 transition-transform duration-300 ease-out",
											!sidebarVisible && "scale-x-[-1]",
										)}
									/>
								</Button>

								{/* Collapsed Sidebar Actions */}
								<div
									className={cn(
										"flex items-center gap-2",
										sidebarVisible
											? "pointer-events-none scale-95 opacity-0"
											: "scale-100 opacity-100",
									)}
								>
									{/* Search Icon Button */}
									<Button
										onClick={handleOpenCommandPalette}
										variant="outline"
										size="icon"
										title="Search (⌘K)"
										aria-label="Search"
									>
										<Search className="h-4 w-4 opacity-70" />
									</Button>

									{/* New Chat Button */}
									<Button
										aria-label="New Chat"
										asChild
										variant="outline"
										size="icon"
										title="New Chat (⌘N)"
									>
										<Link to="/">
											<MessageCirclePlus className="h-4 w-4 opacity-80" />
										</Link>
									</Button>
								</div>
							</div>
							<AccountPopover
								currentUser={
									currentUser
										? {
												_creationTime: currentUser._creationTime ?? null,
												email: currentUser.email ?? null,
												image: currentUser.image ?? null,
												name: currentUser.name ?? null,
												hasOpenRouterKey: currentUser.hasOpenRouterKey ?? null,
												useBYOK: currentUser.useBYOK ?? null,
												defaultModel: currentUser.defaultModel ?? null,
											}
										: null
								}
								onSignOut={handleSignOut}
							/>
						</div>
					</div>
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	);
}
