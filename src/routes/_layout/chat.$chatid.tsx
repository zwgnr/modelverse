import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import React, {
  useLayoutEffect,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { PromptArea } from "@/components/PromptArea";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { FileDisplay } from "@/components/FileDisplay";

import { GitFork } from "lucide-react";
import { getModelDisplayName } from "@/lib/models";
import { Infer } from "convex/values";
import { modelId } from "../../../convex/schema";
import { StreamingMessage } from "@/components/StreamingMessage";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomButton } from "@/components/ScrollToBottom";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatConversation,
  loader: async ({ context, params }) => {
    // context.queryClient.ensureQueryData(
    //   convexQuery(api.messages.get, {
    //     conversationId: params.chatid as Id<"conversations">,
    //   }),
    // );
  },
});

function ChatConversation() {
  const { chatid } = useParams({ from: "/_layout/chat/$chatid" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStreamStarted, setHasStreamStarted] = useState(false);
  const [drivenIds, setDrivenIds] = useState<Set<string>>(new Set());
  const [isContentVisible, setIsContentVisible] = useState(false);

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.get, {}),
  );
  const currentConversation = conversations?.find(
    (conv) => conv._id === chatid,
  );

  // const { data: dbMessages } = useSuspenseQuery(
  //   convexQuery(api.messages.get, {
  //     conversationId: chatid as Id<"conversations">,
  //   }),
  // );
const dbMessages = useQuery(api.messages.get, {
  conversationId: chatid as Id<"conversations">,
});
  const sendMessage = useMutation(api.messages.send);
  const cancelStream = useMutation(api.messages.cancelStream);

  // Update page title dynamically
  useLayoutEffect(() => {
    if (currentConversation?.title) {
      document.title = currentConversation.title;
    } else {
      document.title = "askhole";
    }
  }, [currentConversation?.title]);

  // Hide content initially and show after scroll positioning
  useEffect(() => {
    setIsContentVisible(false);
    const timer = setTimeout(() => {
      setIsContentVisible(true);
    }, 100); // Brief delay to allow scroll positioning
    
    return () => clearTimeout(timer);
  }, [chatid]);

  // Check for messages that need streaming when component mounts or messages change
  useEffect(() => {
    if (!dbMessages || dbMessages.length === 0) return;

    // Find the most recent message that has a responseStreamId but no response
    const lastMessage = dbMessages[dbMessages.length - 1];
    if (lastMessage && lastMessage.responseStreamId && !lastMessage.response) {
      // Check if we've already added this message to drivenIds
      if (!drivenIds.has(lastMessage._id)) {
        setDrivenIds((prevDriven) => {
          const newDriven = new Set(prevDriven);
          newDriven.add(lastMessage._id);
          return newDriven;
        });
        setHasStreamStarted(false);
      }
    }
  }, [dbMessages, chatid]);

  const handleSendMessage = useCallback(
    async (data: {
      body: string;
      author: "User";
      conversationId: Id<"conversations">;
      model: Infer<typeof modelId>;
      files?: FileList | { name: string; contentType: string; url: string }[];
      fileData?: {
        filename: string;
        fileType: string;
        storageId: Id<"_storage">;
      }[];
    }) => {
      try {
        const { body, model, fileData } = data;
        if (!body.trim() && (!fileData || fileData.length === 0)) return;

        // Send the message and get both message ID and stream ID
        const result = await sendMessage({
          prompt: body,
          conversationId: chatid as Id<"conversations">,
          model,
          files: fileData,
        });

        setDrivenIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(result.messageId);
          return newSet;
        });

        setHasStreamStarted(false);

        // useStream hook will automatically handle the streaming

        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to send message:", error);
        setHasStreamStarted(false);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to send message",
        );
      }
    },
    [sendMessage, chatid],
  );

  const stopStreaming = useCallback(async () => {
    if (!dbMessages || dbMessages.length === 0) {
      setHasStreamStarted(false);
      return;
    }

    // Attempt to cancel the most recent streaming message (the one in drivenIds)
    const lastMsg = [...drivenIds]
      .map((id) => dbMessages.find((m) => m._id === id))
      .filter(Boolean)
      .at(-1);

    if (lastMsg) {
      try {
        await cancelStream({ messageId: lastMsg._id as Id<"messages"> });
      } catch (err) {
        console.error("Failed to cancel stream", err);
      }
    }

    setHasStreamStarted(false);

    // Clear driven ids so we no longer drive the stream from this client
    setDrivenIds(new Set());
  }, [dbMessages, drivenIds, cancelStream]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <StickToBottom
          className="absolute inset-0 px-4 py-6"
          resize="instant"
          initial="instant"
        >
          <StickToBottom.Content>
            <div
              ref={scrollContainerRef}
              className={cn(
                "container mx-auto max-w-4xl space-y-4 transition-opacity duration-200",
                isContentVisible ? "opacity-100" : "opacity-0"
              )}
            >
              {/* Error banner */}
              {errorMessage && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  {errorMessage}
                </div>
              )}

              {dbMessages?.map((message) => {
                return (
                  <React.Fragment key={message._id}>
                    {/* User Message */}
                    <div className="flex justify-end gap-3">
                      <div className="flex max-w-md flex-col items-end gap-1">
                        <Card className="border-border bg-secondary text-secondary-foreground break-words">
                          <CardContent className="p-3">
                            {/* Show files if available */}
                            {message.files && message.files.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {message.files.map((file, index) => (
                                  <FileDisplay
                                    key={`${message._id}-file-${index}`}
                                    file={file}
                                    messageId={message._id}
                                  />
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">
                              {message.prompt}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* AI Response */}
                    {(message.responseStreamId || message.response) && (
                      <div className="flex justify-start gap-3">
                        <div className="flex max-w-3xl min-w-full flex-col items-start gap-1">
                          <Card className="w-full border-transparent bg-transparent break-words shadow-none">
                            <CardContent className="p-3">
                              {message.response ? (
                                <MarkdownMessage content={message.response} />
                              ) : message.responseStreamId ? (
                                <StreamingMessage
                                  streamId={message.responseStreamId}
                                  convexSiteUrl="https://mild-crocodile-62.convex.site"
                                  driven={drivenIds.has(message._id)}
                                  messageId={message._id}
                                  onStreamComplete={() => {
                                    setHasStreamStarted(false);
                                    setDrivenIds((prev) => {
                                      const newSet = new Set(prev);
                                      newSet.delete(message._id);
                                      return newSet;
                                    });
                                  }}
                                  onStreamStart={() => {
                                    setHasStreamStarted(true);
                                  }}
                                />
                              ) : (
                                <Loader variant="dots" size="md" />
                              )}
                            </CardContent>
                          </Card>
                          {/* Model footnote and fork icon - show for all messages with model info */}
                          {message.model &&
                            (message.response ||
                              !drivenIds.has(message._id)) && (
                              <div className="text-muted-foreground flex items-center gap-2 px-3 text-xs">
                                <span>
                                  {getModelDisplayName(message.model) ||
                                    message.model}
                                </span>
                                <button
                                  className="opacity-50 transition-opacity hover:opacity-100"
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

              <div ref={messagesEndRef} />
            </div>
          </StickToBottom.Content>
          <ScrollToBottomButton />
        </StickToBottom>
      </div>

      <PromptArea
        conversationId={chatid as Id<"conversations">}
        onSendMessage={handleSendMessage}
        isStreaming={hasStreamStarted}
        onStopStream={stopStreaming}
        className="flex-shrink-0"
      />
    </div>
  );
}
