import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, Paperclip, Globe } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { models, DEFAULT_MODEL, getModelDisplayName } from "@/lib/models";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatComponent,
});

function ChatComponent() {
  const { chatid } = Route.useParams();
  const conversationId = chatid;

  const [newMessageText, setNewMessageText] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip",
  );
  const streamingMessage = useQuery(
    api.messages.getStreamingMessage,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip",
  );
  const sendMessage = useMutation(api.messages.send);
  const cancelStream = useMutation(api.messages.cancelStream);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !conversationId || isStreaming) return;

    // Modify model string if web search is enabled
    const modelToUse = webSearchEnabled ? `${selectedModel}:online` : selectedModel;

    await sendMessage({
      body: newMessageText,
      author: "User",
      conversationId: conversationId as Id<"conversations">,
      model: modelToUse,
    });
    setNewMessageText("");
  };

  const handleStopStream = async () => {
    if (streamingMessage) {
      await cancelStream({ messageId: streamingMessage._id });
    }
  };

  const isStreaming = Boolean(streamingMessage);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (conversationId) {
      // Use setTimeout to ensure messages have loaded
      setTimeout(scrollToBottom, 100);
    }
  }, [conversationId]);

  return (
    <>
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-6">
            <div className="container mx-auto max-w-4xl space-y-4">
              {messages?.map((message: any) => {
                const isUser = message.author === "User";

                return (
                  <div
                    key={message._id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex flex-col gap-1 ${
                        isUser ? "max-w-md items-end" : "max-w-3xl items-start"
                      }`}
                    >
                      <Card
                        className={`${
                          isUser
                            ? "border-border bg-secondary text-secondary-foreground"
                            : "border-transparent bg-transparent shadow-none"
                        } break-words`}
                      >
                        <CardContent className="p-3">
                          {isUser ? (
                            <p className="overflow-hidden text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {message.body}
                            </p>
                          ) : (
                            <div>
                              <MarkdownMessage
                                content={message.body}
                                className="text-sm"
                              />
                              {message.isCancelled && (
                                <div className="mt-2 text-xs text-gray-500 italic border-t pt-2">
                                  Response cancelled by user
                                </div>
                              )}
                              {/* Web Search Citations */}
                              {message.annotations && message.annotations.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    Sources
                                  </div>
                                  <div className="space-y-2">
                                    {message.annotations
                                      .filter((annotation: any) => annotation.type === "url_citation")
                                      .map((citation: any, index: number) => (
                                        <a
                                          key={index}
                                          href={citation.url_citation.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                                            {citation.url_citation.title}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                            {citation.url_citation.url}
                                          </div>
                                          {citation.url_citation.content && (
                                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                              {citation.url_citation.content}
                                            </div>
                                          )}
                                        </a>
                                      ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Model Footer - Only for completed AI messages */}
                              {!isUser && message.model && !message.isStreaming && (
                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
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
            </div>
          </ScrollArea>
        </div>

        {/* Input Form */}
        <div className="sticky bottom-0 w-full px-4 py-6">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-2xl border p-3 shadow-xl shadow-black/5 backdrop-blur-lg">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Row 1: Text Input Only */}
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Input
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={isStreaming ? "AI is responding..." : "Type your message..."}
                      className="h-11 border-0 bg-transparent! shadow-none text-base focus:ring-0 focus-visible:ring-0 focus-visible:border-0"
                      autoComplete="off"
                      disabled={!conversationId || isStreaming}
                    />
                  </div>
                </div>

                {/* Row 2: Actions with Send Button on Right */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                  {/* File Upload Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Upload file (coming soon)"
                    disabled
                  >
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <span className="sr-only">Upload file</span>
                  </Button>

                  {/* Web Search Toggle */}
                  <Button
                    type="button"
                    variant={webSearchEnabled ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`h-8 w-8 rounded-lg transition-colors ${
                      webSearchEnabled
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "hover:bg-secondary hover:text-secondary-foreground"
                    }`}
                    title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
                  >
                    <Globe className={`h-4 w-4 ${webSearchEnabled ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <span className="sr-only">Toggle web search</span>
                  </Button>

                    {/* Model Picker */}
                    <Combobox
                      options={models.map((model) => ({
                        value: model.id,
                        label: model.name,
                      }))}
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      placeholder="Select model..."
                      searchPlaceholder="Search models..."
                      className="w-48"
                    />
                    
                    {/* Web Search Indicator */}
                    {webSearchEnabled && (
                      <div className="text-xs text-primary dark:text-primary font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Web search enabled
                      </div>
                    )}
                  </div>

                  {/* Send/Stop Button */}
                  {isStreaming ? (
                    <Button
                      type="button"
                      onClick={handleStopStream}
                      size="icon"
                      className="h-9 w-9 rounded-lg bg-red-500 transition-colors hover:bg-red-600 flex-shrink-0"
                    >
                      <Square className="h-4 w-4" />
                      <span className="sr-only">Stop generation</span>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!newMessageText.trim() || !conversationId || isStreaming}
                      size="icon"
                      className="h-9 w-9 rounded-lg bg-primary transition-colors hover:bg-primary/90 disabled:bg-muted dark:disabled:bg-muted flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
    </>
  );
}
