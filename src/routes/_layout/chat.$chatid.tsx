import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Infer } from "convex/values";
import { modelId } from "../../../convex/schema";
import { Card, CardContent } from "@/components/ui/card";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomButton } from "@/components/ScrollToBottom";
import { convexQuery } from "@convex-dev/react-query";
import React, {
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { PromptArea } from "@/components/PromptArea";
import { TypingLoader } from "@/components/ui/loader";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatConversation,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {
        conversationId: params.chatid as Id<"conversations">,
      }),
    );
  },
});

function ChatConversation() {
  const { chatid } = useParams({ from: "/_layout/chat/$chatid" });
  const queryClient = useQueryClient();
  const lastMessageIdRef = useRef<Id<"messages"> | null>(null);
  const hasTriggeredInitialMessage = useRef(false);

  const sendMessage = useMutation(api.messages.send);
  const saveResponse = useMutation(api.messages.saveResponse);
  const clearPendingInitialMessage = useMutation(
    api.conversations.clearPendingInitialMessage,
  );

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.list, {}),
  );
  const currentConversation = conversations?.find(
    (conv) => conv._id === chatid,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update page title dynamically
  useLayoutEffect(() => {
    if (currentConversation?.title) {
      document.title = currentConversation.title;
    } else {
      document.title = "askhole";
    }
  }, [currentConversation?.title]);

  const { data: dbMessages } = useSuspenseQuery(
    convexQuery(api.messages.list, {
      conversationId: chatid as Id<"conversations">,
    }),
  );

  const initialMessages = React.useMemo(() => {
    if (!dbMessages) return [];
    return dbMessages
      .filter((msg) => msg.response) // Only include messages that have responses
      .flatMap((msg) => [
        { id: msg._id, role: "user" as const, content: msg.prompt },
        {
          id: `${msg._id}-ai`,
          role: "assistant" as const,
          content: msg.response!,
        },
      ]);
  }, [dbMessages]);

  const { messages, isLoading, stop, append } = useChat({
    api: "/chat",
    initialMessages,
    id: chatid,
    onFinish: async (message) => {
      if (lastMessageIdRef.current) {
        await saveResponse({
          messageId: lastMessageIdRef.current,
          response: message.content,
        });
        lastMessageIdRef.current = null;

        queryClient.invalidateQueries({
          queryKey: convexQuery(api.messages.list, {
            conversationId: chatid as Id<"conversations">,
          }).queryKey,
        });
      }
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    },
  });

  // Effect to handle pending initial message from new chat page
  useEffect(() => {
    if (
      !currentConversation?.hasPendingInitialMessage ||
      hasTriggeredInitialMessage.current
    ) {
      return;
    }

    // Find the first message (should be the one just created)
    const firstMessage = dbMessages?.[0];
    if (!firstMessage || firstMessage.response) {
      return;
    }

    hasTriggeredInitialMessage.current = true;

    // Clear the pending flag immediately
    clearPendingInitialMessage({
      conversationId: chatid as Id<"conversations">,
    })
      .then(() => {
        // Trigger the AI response
        append(
          {
            role: "user",
            content: firstMessage.prompt,
          },
          {
            body: { model: firstMessage.model },
          },
        );
        lastMessageIdRef.current = firstMessage._id;
      })
      .catch((error) => {
        console.error("Failed to clear pending flag:", error);
        setErrorMessage("Failed to start AI response");
      });
  }, [
    currentConversation?.hasPendingInitialMessage,
    dbMessages,
    append,
    clearPendingInitialMessage,
    chatid,
  ]);

  const handleSendMessage = useCallback(
    async (data: {
      body: string;
      model?: Infer<typeof modelId>;
      files?: Array<{
        filename: string;
        fileType: string;
        storageId: Id<"_storage">;
      }>;
    }) => {
      try {
        const { body, model, files } = data;
        if (!body.trim() && (!files || files.length === 0)) return;

        append({ role: "user", content: body }, { body: { model } });

        const messageId = await sendMessage({
          prompt: body,
          conversationId: chatid as Id<"conversations">,
          model,
          files,
        });
        lastMessageIdRef.current = messageId;

        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to send message",
        );
      }
    },
    [append, sendMessage, chatid],
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <StickToBottom
          className="absolute inset-0 px-4 py-6"
          resize="instant"
          initial="instant"
        >
          <StickToBottom.Content className="container mx-auto max-w-4xl space-y-4">
            {/* Error banner */}
            {errorMessage && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            {messages.map((message) => (
              <React.Fragment key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end gap-3">
                    <div className="flex max-w-md flex-col items-end gap-1">
                      <Card className="border-border bg-secondary text-secondary-foreground break-words">
                        <CardContent className="p-3">
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start gap-3">
                    <div className="flex max-w-3xl min-w-full flex-col items-start gap-1">
                      <Card className="w-full border-transparent bg-transparent break-words shadow-none">
                        <CardContent className="p-3">
                          <MarkdownMessage content={message.content} />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {/* Typing indicator when AI is responding but stream hasn't started yet */}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start gap-3">
                  <div className="flex max-w-3xl min-w-full flex-col items-start gap-1">
                    <Card className="w-full border-transparent bg-transparent break-words shadow-none">
                      <CardContent className="p-3">
                        <TypingLoader
                          size="md"
                          className="text-muted-foreground"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </StickToBottom.Content>
          <ScrollToBottomButton />
        </StickToBottom>
      </div>
      <div className="flex-shrink-0">
        <PromptArea
          conversationId={chatid}
          onSendMessage={handleSendMessage}
          isStreaming={isLoading}
          onStopStream={stop}
        />
      </div>
    </div>
  );
}
