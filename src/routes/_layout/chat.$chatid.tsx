import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
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
import { FileDisplay } from "@/components/FileDisplay";
import { getModelDisplayName } from "@/lib/models";
import { GitFork } from "lucide-react";

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
  const hasTriggeredInitialMessage = useRef(false);
  
  // Track the current message being processed for response saving
  const currentMessageRef = useRef<Id<"messages"> | null>(null);

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
    sendExtraMessageFields: true,
    onFinish: async (message) => {
      // Use the tracked message ID to save the response
      if (currentMessageRef.current) {
        await saveResponse({
          messageId: currentMessageRef.current,
          response: message.content,
        });

        // Clear the tracked message ID
        currentMessageRef.current = null;

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

  // Helper to get file URLs from Convex
  const getFileUrls = useCallback(async (
    files: { filename: string; fileType: string; storageId: Id<"_storage"> }[],
    messageId: Id<"messages">
  ) => {
    return Promise.all(
      files.map(async (file) => {
        const url = await queryClient.fetchQuery(
          convexQuery(api.files.getFileUrl, {
            storageId: file.storageId,
            messageId: messageId,
          })
        );
        return {
          name: file.filename,
          contentType: file.fileType,
          url: url || "",
        };
      })
    );
  }, [queryClient]);

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
      .then(async () => {
        // Track this message ID for response saving
        currentMessageRef.current = firstMessage._id;

        // Get file URLs if the message has files
        let attachments: { name: string; contentType: string; url: string }[] | undefined;
        if (firstMessage.files && firstMessage.files.length > 0) {
          attachments = await getFileUrls(firstMessage.files, firstMessage._id);
        }

        // Trigger the AI response
        append(
          {
            role: "user",
            content: firstMessage.prompt,
          },
          {
            body: { model: firstMessage.model },
            experimental_attachments: attachments,
          },
        );
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
    queryClient,
    getFileUrls,
  ]);

  const handleSendMessage = useCallback(
    async (data: {
      body: string;
      model?: Infer<typeof modelId>;
      files?: FileList | { name: string; contentType: string; url: string }[];
      fileData?: {
        filename: string;
        fileType: string;
        storageId: Id<"_storage">;
      }[];
    }) => {
      try {
        const { body, model, files, fileData } = data;
        if (!body.trim() && (!files || files.length === 0)) return;

        // Save the user's message to the database with file data
        const messageId = await sendMessage({
          prompt: body,
          conversationId: chatid as Id<"conversations">,
          model,
          files: fileData,
        });

        // Track this message ID for response saving
        currentMessageRef.current = messageId;

        // Get proper URLs from Convex for the files
        let attachmentsWithUrls = files;
        if (fileData && fileData.length > 0) {
          attachmentsWithUrls = await getFileUrls(fileData, messageId);
        }

        append(
          { role: "user", content: body },
          { body: { model }, experimental_attachments: attachmentsWithUrls },
        );

        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to send message",
        );
      }
    },
    [append, sendMessage, chatid, getFileUrls],
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

            {messages.map((message, messageIndex) => {
              // Find the corresponding database message to get file information and model info
              const dbMessage = message.role === "user" 
                ? dbMessages?.find(m => m.prompt === message.content)
                : dbMessages?.find(m => m.response === message.content);
              
              return (
                <React.Fragment key={message.id}>
                  {message.role === "user" ? (
                    <div className="flex justify-end gap-3">
                      <div className="flex max-w-md flex-col items-end gap-1">
                        <Card className="border-border bg-secondary text-secondary-foreground break-words">
                          <CardContent className="p-3">
                            {/* Show files from database message if available */}
                            {dbMessage?.files && dbMessage.files.length > 0 ? (
                              <div className="mb-2 space-y-2">
                                {dbMessage.files.map((file, index) => (
                                  <FileDisplay
                                    key={`${dbMessage._id}-file-${index}`}
                                    file={file}
                                    messageId={dbMessage._id}
                                  />
                                ))}
                              </div>
                            ) : (
                              /* Otherwise show files from streaming message attachments */
                              message.experimental_attachments?.map(
                                (attachment, index) =>
                                  attachment.contentType?.startsWith("image/") && (
                                    <img
                                      key={`${message.id}-${index}`}
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="mb-2 max-w-full h-auto rounded border"
                                      style={{ maxHeight: "200px" }}
                                    />
                                  ),
                              )
                            )}
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
                        {/* Model footnote and fork icon - only show for completed AI responses */}
                        {dbMessage?.model && (
                          <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
                            <span>{getModelDisplayName(dbMessage.model) || dbMessage.model}</span>
                            <button 
                              className="opacity-50 hover:opacity-100 transition-opacity"
                              title="Fork conversation"
                            >
                              <GitFork size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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

      <PromptArea
        conversationId={chatid}
        onSendMessage={handleSendMessage}
        isStreaming={isLoading}
        onStopStream={stop}
        className="flex-shrink-0"
      />
    </div>
  );
}
