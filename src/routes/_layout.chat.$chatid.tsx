import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { FileDisplay } from "@/components/FileDisplay";
import { getModelDisplayName } from "@/lib/models";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomButton } from "@/components/ScrollToBottom";
import { cn } from "@/lib/utils";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { PromptArea } from "@/components/PromptArea";
import { useLRUCache } from "@/hooks/useLRUCache";
import React, { useRef, useEffect, useState, useLayoutEffect } from "react";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatStageWrapper,
});

const MAX_MOUNTED = 4; // last 4 visited threads

// Main wrapper that manages the cross-fade between chat panes
function ChatStageWrapper() {
  const { chatid } = Route.useParams();
  const cache = useLRUCache<boolean>(MAX_MOUNTED);
  const panesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Add current chat to cache (promotes it to MRU)
  cache.set(chatid, true);

  // Handle cross-fade when switching chats
  useEffect(() => {
    const currentPane = panesRef.current.get(chatid);
    if (!currentPane) return;

    // Wait one frame for DOM to be fully rendered
    requestAnimationFrame(() => {
      // Scroll to bottom before making visible
      currentPane.scrollTop = currentPane.scrollHeight;
    });
  }, [chatid]);

  // Get active chat data for prompt area
  const conversationId = chatid;
  const { data: streamingMessage } = useQuery(
    convexQuery(
      api.messages.getStreamingMessage,
      conversationId
        ? { conversationId: conversationId as Id<"conversations"> }
        : "skip",
    ),
  );
  const sendMessage = useMutation(api.messages.send);
  const cancelStream = useMutation(api.messages.cancelStream);

  const handleSendMessage = async (messageData: {
    body: string;
    author: "User";
    conversationId: Id<"conversations">;
    model: string;
    files?: Array<{
      filename: string;
      fileType: string;
      storageId: Id<"_storage">;
    }>;
  }) => {
    await sendMessage(messageData);
  };

  const handleStopStream = async () => {
    if (streamingMessage) {
      await cancelStream({ messageId: streamingMessage._id });
    }
  };

  const isStreaming = Boolean(streamingMessage);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area - stacked panes with cross-fade */}
      <div className="relative flex-1 overflow-hidden">
        {cache.keys().map((mountedChatId) => (
          <ChatMessagesPane
            key={mountedChatId}
            chatid={mountedChatId}
            isActive={mountedChatId === chatid}
            ref={(node: HTMLDivElement) => {
              if (node) {
                panesRef.current.set(mountedChatId, node);
              } else {
                panesRef.current.delete(mountedChatId);
              }
            }}
          />
        ))}
      </div>

      {/* Prompt Area - stationary, always visible */}
      <PromptArea
        conversationId={conversationId}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStream={handleStopStream}
      />
    </div>
  );
}

// Individual chat messages pane component
const ChatMessagesPane = React.forwardRef<
  HTMLDivElement,
  {
    chatid: string;
    isActive: boolean;
  }
>(({ chatid, isActive }, ref) => {
  const conversationId = chatid;
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery(
    convexQuery(api.messages.list, {
      conversationId: conversationId as Id<"conversations">,
    }),
  );

  // Layout-settled detection using ResizeObserver + idle callback
  useLayoutEffect(() => {
    if (!isActive || !messages) {
      setIsReady(false);
      return;
    }

    const node = internalRef.current;
    if (!node) return;

    // always start at the bottom
    node.scrollTop = node.scrollHeight;

    let rafId: number;
    let idleId: number;
    let resizeCount = 0;

    const ro = new ResizeObserver(() => {
      node.scrollTop = node.scrollHeight; // glue
      resizeCount++;

      // Cancel previous attempts
      cancelAnimationFrame(rafId);
      if (idleId) cancelIdleCallback(idleId);

      // For long threads (many messages), be more patient
      const isLongThread = messages.length > 20;
      const framesToWait = isLongThread ? 3 : 2;

      let frameCount = 0;
      function waitForQuietFrames() {
        rafId = requestAnimationFrame(() => {
          frameCount++;
          if (frameCount < framesToWait) {
            waitForQuietFrames();
          } else {
            // After quiet frames, wait for browser idle
            idleId = requestIdleCallback(
              () => {
                setIsReady(true);
              },
              { timeout: 100 },
            ); // max 100ms timeout
          }
        });
      }

      waitForQuietFrames();
    });

    ro.observe(node);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      if (idleId) cancelIdleCallback(idleId);
    };
  }, [isActive, messages, chatid]);

  return (
    <div
      ref={(node) => {
        // Set both refs
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity: isActive && isReady ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        transition: "opacity 150ms ease-in-out",
      }}
    >
      <StickToBottom
        className="h-full px-4 py-6"
        resize="instant"
        initial="instant"
      >
        <StickToBottom.Content className="container mx-auto max-w-4xl space-y-4">
          {messages?.map((message: any) => {
            const isUser = message.author === "User";

            return (
              <div
                key={message._id}
                className={cn(
                  "flex gap-3",
                  isUser ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-1",
                    isUser
                      ? "max-w-md items-end"
                      : "max-w-3xl min-w-full items-start",
                  )}
                >
                  <Card
                    className={cn(
                      isUser
                        ? "border-border bg-secondary text-secondary-foreground"
                        : "w-full border-transparent bg-transparent shadow-none",
                      "break-words",
                    )}
                  >
                    <CardContent className="p-3">
                      {isUser ? (
                        <div className="space-y-2">
                          {/* Display attached files */}
                          {message.files && message.files.length > 0 && (
                            <div className="space-y-2">
                              {message.files.map((file: any, index: number) => (
                                <div
                                  key={index}
                                  className="rounded-lg border p-2"
                                >
                                  <FileDisplay file={file} />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Display text content */}
                          {message.body.trim() && (
                            <p className="overflow-hidden text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {message.body}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <MarkdownMessage
                            content={message.body}
                            className="text-sm"
                          />
                          {message.isCancelled && (
                            <div className="mt-2 border-t pt-2 text-xs text-gray-500 italic">
                              Response cancelled by user
                            </div>
                          )}

                          {/* Model Footer - Only for completed AI messages */}
                          {!isUser && message.model && !message.isStreaming && (
                            <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {getModelDisplayName(message.model)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </StickToBottom.Content>

        {/* Scroll to bottom button - shows when not at bottom */}
        <ScrollToBottomButton />
      </StickToBottom>
    </div>
  );
});

ChatMessagesPane.displayName = "ChatMessagesPane";
