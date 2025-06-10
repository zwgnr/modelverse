import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Square, Paperclip, Globe, X, FileImage, FileText } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { FileDisplay } from "@/components/FileDisplay";
import { models, DEFAULT_MODEL, getModelDisplayName } from "@/lib/models";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ScrollToBottomButton } from "@/components/ScrollToBottom";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  component: ChatComponent,
});

function ChatComponent() {
  const { chatid } = Route.useParams();
  const conversationId = chatid;

  const [newMessageText, setNewMessageText] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(
    api.messages.list,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip",
  );
  const streamingMessage = useQuery(
    api.messages.getStreamingMessage,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip",
  );
  const sendMessage = useMutation(api.messages.send);
  const cancelStream = useMutation(api.messages.cancelStream);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const supportedFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/') && 
                     ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
      const isPDF = file.type === 'application/pdf';
      return isImage || isPDF;
    });
    
    if (supportedFiles.length !== files.length) {
      alert('Only PNG, JPEG, WebP images and PDF files are supported.');
    }
    
    setUploadedFiles(prev => [...prev, ...supportedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();
    
    // Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error(`Upload failed: ${result.statusText}`);
    }

    const { storageId } = await result.json();
    return storageId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessageText.trim() && uploadedFiles.length === 0) || !conversationId || isStreaming) return;

    try {
      // Upload files to Convex storage
      const fileData = await Promise.all(
        uploadedFiles.map(async (file) => ({
          filename: file.name,
          fileType: file.type,
          storageId: (await uploadFileToStorage(file)) as Id<"_storage">
        }))
      );

      // Modify model string if web search is enabled
      const modelToUse = webSearchEnabled
        ? `${selectedModel}:online`
        : selectedModel;

      await sendMessage({
        body: newMessageText,
        author: "User",
        conversationId: conversationId as Id<"conversations">,
        model: modelToUse,
        files: fileData.length > 0 ? fileData : undefined,
      });
      
      setNewMessageText("");
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    }
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
          key={chatid} // Force re-initialization when chat changes
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

      {/* Input Form */}
      <div className="sticky bottom-0 w-full px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl border p-3 shadow-xl shadow-black/5 backdrop-blur-lg">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-gray-100 dark:border-gray-800">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm"
                    >
                      {file.type.startsWith('image/') ? (
                        <FileImage className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="truncate max-w-32">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 1: Text Input Only */}
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Input
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={
                      isStreaming
                        ? "AI is responding..."
                        : uploadedFiles.length > 0
                        ? "Ask about your files..."
                        : "Type your message..."
                    }
                    className="h-11 border-0 bg-transparent! text-base shadow-none focus:ring-0 focus-visible:border-0 focus-visible:ring-0"
                    autoComplete="off"
                    disabled={!conversationId || isStreaming}
                  />
                </div>
              </div>

              {/* Row 2: Actions with Send Button on Right */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  {/* File Upload Button */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Upload images or PDFs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Upload file</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Web Search Toggle */}
                  <Button
                    type="button"
                    variant={webSearchEnabled ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      webSearchEnabled
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "hover:bg-secondary hover:text-secondary-foreground"
                    )}
                    title={
                      webSearchEnabled
                        ? "Web search enabled"
                        : "Enable web search"
                    }
                  >
                    <Globe
                      className={cn(
                        "h-4 w-4",
                        webSearchEnabled ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
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
                    <div className="text-primary dark:text-primary flex items-center gap-1 text-xs font-medium">
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
                    className="h-9 w-9 flex-shrink-0 rounded-lg bg-red-500 transition-colors hover:bg-red-600"
                  >
                    <Square className="h-4 w-4" />
                    <span className="sr-only">Stop generation</span>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      (!newMessageText.trim() && uploadedFiles.length === 0) || !conversationId || isStreaming
                    }
                    size="icon"
                    className="bg-primary hover:bg-primary/90 disabled:bg-muted dark:disabled:bg-muted h-9 w-9 flex-shrink-0 rounded-lg transition-colors"
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

