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

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatComponent,
});

function ChatComponent() {
  const { chatid } = Route.useParams();
  const conversationId = chatid;

  const { data: messages } = useQuery(
    convexQuery(api.messages.list, {
      conversationId: conversationId as Id<"conversations">,
    }),
  );
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
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
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
                  className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-1",
                      isUser ? "max-w-md items-end" : "max-w-3xl min-w-full items-start"
                    )}
                  >
                    <Card
                      className={cn(
                        isUser
                          ? "border-border bg-secondary text-secondary-foreground"
                          : "w-full border-transparent bg-transparent shadow-none",
                        "break-words"
                      )}
                    >
                      <CardContent className="p-3">
                        {isUser ? (
                          <div className="space-y-2">
                            {/* Display attached files */}
                            {message.files && message.files.length > 0 && (
                              <div className="space-y-2">
                                {message.files.map((file: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-2">
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
                            {!isUser &&
                              message.model &&
                              !message.isStreaming && (
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

      {/* Prompt Area */}
      <PromptArea
        conversationId={conversationId}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStream={handleStopStream}
      />
    </>
  );
}

