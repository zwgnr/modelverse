import { useEffect } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";

import { conversationCreation } from "@/lib/utils";

import { Onboarding } from "@/components/chat/onboarding";
import { PromptArea } from "@/components/chat/PromptArea";

import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_layout/")({
	component: IndexComponent,
});

function IndexComponent() {
	const router = useRouter();

	const { data: currentUser } = useSuspenseQuery(
		convexQuery(api.auth.getCurrentUser, {}),
	);

	const { data: customization } = useSuspenseQuery(
		convexQuery(api.users.getCustomization, {}),
	);

	// Set page title for new chat/home page
	useEffect(() => {
		document.title = "modelverse";
	}, []);

	// Clean up any stale conversation creation state when on the home page
	useEffect(() => {
		conversationCreation.clearNewConversationState();
	}, []);

	const handleNavigateToChat = (conversationId: string) => {
		router.navigate({
			to: "/chat/$chatid",
			params: { chatid: conversationId },
			replace: true, // Replace current history entry to avoid back/forward issues
		});
	};

	const hasApiKey = currentUser?.hasOpenRouterKey;
	
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-4xl space-y-8 text-center">
				{hasApiKey === null ? (
					<div className="flex flex-col items-center justify-center">
						<div className="h-10 w-10 animate-spin rounded-full border-gray-900 border-t-2 border-b-2 dark:border-white" />
						<p className="text-gray-500 text-sm">Loading...</p>
					</div>
				) : hasApiKey ? (
					<>
						<div className="space-y-4">
							<p className="text-3xl text-foreground">
								What can I help you with?
							</p>
						</div>
						<PromptArea
							createNewConversation={true}
							onNavigateToChat={handleNavigateToChat}
							className="relative"
							userDefaultModel={customization?.defaultModel}
						/>
					</>
				) : (
					<Onboarding />
				)}
			</div>
		</div>
	);
}
