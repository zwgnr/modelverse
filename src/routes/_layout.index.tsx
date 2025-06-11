import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PromptArea } from "@/components/PromptArea";
import { useState } from "react";

export const Route = createFileRoute("/_layout/")({
  component: IndexComponent,
});

function IndexComponent() {
  const router = useRouter();
  const [isStreaming, setIsStreaming] = useState(false);

  const handleNavigateToChat = (conversationId: string) => {
    router.navigate({
      to: "/chat/$chatid",
      params: { chatid: conversationId },
    });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          {/* <h1 className="text-6xl font-bold tracking-tight">
            Ask<span className="text-primary">hole</span>
          </h1> */}
          <p className="text-muted-foreground text-xl">
            Ready to answer your dumbest questions.
          </p>
        </div>

        <PromptArea
          createNewConversation={true}
          isStreaming={isStreaming}
          onNavigateToChat={handleNavigateToChat}
          onStartStream={() => {
            setIsStreaming(true);
          }}
          onStopStream={() => {
            setIsStreaming(false);
          }}
          className="relative"
        />
      </div>
    </div>
  );
}
