import { createFileRoute, useRouter } from "@tanstack/react-router";

import { PromptArea } from "@/components/chat/PromptArea";

export const Route = createFileRoute("/_layout/")({
	component: IndexComponent,
});

function IndexComponent() {
	const router = useRouter();

	const handleNavigateToChat = (conversationId: string) => {
		router.navigate({
			to: "/chat/$chatid",
			params: { chatid: conversationId },
			replace: true, // Replace current history entry to avoid back/forward issues
		});
	};

	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-4xl space-y-8 text-center">
				<div className="space-y-4">
					<p className="text-muted-foreground text-xl">
						Ready to answer your dumbest questions.
					</p>
				</div>

				<PromptArea
					createNewConversation={true}
					onNavigateToChat={handleNavigateToChat}
					className="relative"
				/>
			</div>
		</div>
	);
}
