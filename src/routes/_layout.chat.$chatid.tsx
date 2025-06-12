import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { FileDisplay } from "@/components/FileDisplay";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomButton } from "@/components/ScrollToBottom";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { PromptArea } from "@/components/PromptArea";
import { useLRUCache } from "@/hooks/useLRUCache";
import { useLayoutSettledDetection } from "@/hooks/useLayoutSettledDetection";
import { ServerMessage } from "@/components/ServerMessage";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  drivenIdsAtom,
  isStreamingAtom,
  currentStreamingMessageIdAtom,
  startStreamingAtom,
  stopStreamingAtom,
  autoDetectStreamingAtom,
} from "@/atoms/streaming";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatStageWrapper,
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {
        conversationId: params.chatid as Id<"conversations">,
      }),
    );
  },
});

const MAX_MOUNTED = 4; // last 4 visited threads

// Main wrapper that manages the cross-fade between chat panes
function ChatStageWrapper() {
  const { chatid } = Route.useParams();
  const cache = useLRUCache<boolean>(MAX_MOUNTED);
  const panesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Jotai atoms
  const isStreaming = useAtomValue(isStreamingAtom);
  const startStreaming = useSetAtom(startStreamingAtom);
  const stopStreaming = useSetAtom(stopStreamingAtom);
  const autoDetectStreaming = useSetAtom(autoDetectStreamingAtom);

  // Add current chat to cache (promotes it to MRU)
  cache.set(chatid, true);

  // Handle cross-fade when switching chats
  useEffect(() => {
    const currentPane = panesRef.current.get(chatid);
    if (!currentPane) return;
  }, [chatid]);

  // Get active chat data for prompt area
  const conversationId = chatid;
  const sendMessage = useMutation(api.messages.send);

  // Get messages for auto-detection of recent streaming messages
  const { data: messages } = useSuspenseQuery(
    convexQuery(api.messages.list, {
      conversationId: conversationId as Id<"conversations">,
    }),
  );

  // Auto-detect recent messages that should be streaming when chat page loads
  useEffect(() => {
    if (!messages || hasInitialized) return;

    autoDetectStreaming(messages);
    setHasInitialized(true);
  }, [messages, hasInitialized, autoDetectStreaming]);

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
    try {
      // Transform the messageData to match new schema
      const messageId = await sendMessage({
        prompt: messageData.body,
        conversationId: messageData.conversationId,
        model: messageData.model,
        files: messageData.files,
      });

      // Start streaming using Jotai action
      startStreaming(messageId);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const cancelStream = useMutation(api.messages.cancelStream);

  const handleStopStream = useCallback(() => {
    stopStreaming(cancelStream);
  }, [stopStreaming, cancelStream]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area - stacked panes with cross-fade */}
      <div className="relative flex-1 overflow-hidden">
        {cache.keys().map((mountedChatId) => (
          <ChatMessagesPane
            key={mountedChatId}
            chatid={mountedChatId}
            isActive={mountedChatId === chatid}
            messages={mountedChatId === chatid ? messages : undefined}
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
        onMessageSent={(messageId) => {
          startStreaming(messageId);
        }}
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
    messages?: any[] | undefined;
  }
>(({ chatid, isActive, messages: propMessages }, ref) => {
  const conversationId = chatid;
  const internalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Jotai atoms
  const drivenIds = useAtomValue(drivenIdsAtom);
  const currentStreamingMessageId = useAtomValue(currentStreamingMessageIdAtom);
  const stopStreaming = useSetAtom(stopStreamingAtom);

  // Only query if messages not provided via props (for inactive panes)
  const { data: queryMessages } = useQuery({
    ...convexQuery(api.messages.list, {
      conversationId: conversationId as Id<"conversations">,
    }),
    enabled: !propMessages, // Only query if messages not provided
  });

  const messages = propMessages || queryMessages;

  // Use custom hook for layout-settled detection
  const isReady = useLayoutSettledDetection({
    isActive,
    messages,
    nodeRef: internalRef,
    chatId: chatid,
  });

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    },
    [messagesEndRef],
  );

  // For empty conversations (like newly created ones), show immediately without waiting for layout
  const shouldShowImmediately = isActive && (!messages || messages.length === 0);
  const shouldShow = shouldShowImmediately || (isActive && isReady);

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
        opacity: shouldShow ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        transition: shouldShowImmediately ? "none" : "opacity 150ms ease-in-out",
      }}
    >
      <StickToBottom
        className="h-full px-4 py-6"
        resize="instant"
        initial="instant"
      >
        <StickToBottom.Content className="container mx-auto max-w-4xl space-y-4">
          {messages?.length === 0 && (
            <div className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          )}
          {messages?.map((message: any) => (
            <React.Fragment key={message._id}>
              {/* User Message */}
              <div className="flex justify-end gap-3">
                <div className="flex max-w-md flex-col items-end gap-1">
                  <Card className="border-border bg-secondary text-secondary-foreground break-words">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Display attached files */}
                        {message.files && message.files.length > 0 && (
                          <div className="space-y-2">
                            {message.files.map((file: any, index: number) => (
                              <div
                                key={index}
                                className="rounded-lg border p-2"
                              >
                                <FileDisplay
                                  file={file}
                                  messageId={message._id}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Display text content */}
                        {message.prompt.trim() && (
                          <p className="overflow-hidden text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {message.prompt}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start gap-3">
                <div className="flex max-w-3xl min-w-full flex-col items-start gap-1">
                  <Card className="w-full border-transparent bg-transparent break-words shadow-none">
                    <CardContent className="p-3">
                      <ServerMessage
                        message={message}
                        isDriven={drivenIds.has(message._id)}
                        stopStreaming={() => {
                          // Only clear streaming state if this is the current streaming message
                          if (currentStreamingMessageId === message._id) {
                            stopStreaming();
                          }
                        }}
                        scrollToBottom={scrollToBottom}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </StickToBottom.Content>

        {/* Scroll to bottom button - shows when not at bottom */}
        <ScrollToBottomButton />
      </StickToBottom>
    </div>
  );
});

ChatMessagesPane.displayName = "ChatMessagesPane";
