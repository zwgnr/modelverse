import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Send,
  Square,
  Paperclip,
  Globe,
  X,
  FileImage,
  FileText,
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { models, selectedModelAtom } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";

interface PromptAreaProps {
  conversationId?: string;
  isStreaming?: boolean;
  onSendMessage?: (data: {
    body: string;
    author: "User";
    conversationId: Id<"conversations">;
    model: string;
    files?: Array<{
      filename: string;
      fileType: string;
      storageId: Id<"_storage">;
    }>;
  }) => Promise<void>;
  onStopStream?: () => void;
  onStartStream?: () => void;
  onMessageSent?: (messageId: string) => void;
  className?: string;
  placeholder?: {
    default?: string;
    streaming?: string;
    withFiles?: string;
  };
  // For index page - creates new conversation and navigates
  createNewConversation?: boolean;
  onNavigateToChat?: (conversationId: string) => void;
}

export function PromptArea({
  conversationId,
  isStreaming = false,
  onSendMessage,
  onStopStream,
  onStartStream,
  onMessageSent,
  className,
  placeholder = {
    default: "Type your message...",
    streaming: "AI is responding...",
    withFiles: "Ask about your files...",
  },
  createNewConversation = false,
  onNavigateToChat,
}: PromptAreaProps) {
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createConversation = useMutation(api.conversations.create);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const supportedFiles = files.filter((file) => {
      const isImage =
        file.type.startsWith("image/") &&
        ["image/png", "image/jpeg", "image/webp"].includes(file.type);
      const isPDF = file.type === "application/pdf";
      return isImage || isPDF;
    });

    if (supportedFiles.length !== files.length) {
      alert("Only PNG, JPEG, WebP images and PDF files are supported.");
    }

    setUploadedFiles((prev) => [...prev, ...supportedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async () => {
    if ((!newMessageText.trim() && uploadedFiles.length === 0) || isStreaming)
      return;

    // For index page, we don't need a conversationId initially
    if (!createNewConversation && !conversationId) return;

    try {
      // Upload files to Convex storage
      const fileData = await Promise.all(
        uploadedFiles.map(async (file) => ({
          filename: file.name,
          fileType: file.type,
          storageId: (await uploadFileToStorage(file)) as Id<"_storage">,
        })),
      );

      // Modify model string if web search is enabled
      const modelToUse = webSearchEnabled
        ? `${selectedModel}:online`
        : selectedModel;

      let targetConversationId = conversationId;

      // Create new conversation if needed (index page)
      if (createNewConversation) {
        targetConversationId = await createConversation({});
      }

      const messageData = {
        body: newMessageText,
        author: "User" as const,
        conversationId: targetConversationId as Id<"conversations">,
        model: modelToUse,
        files: fileData.length > 0 ? fileData : undefined,
      };

      if (onSendMessage) {
        await onSendMessage(messageData);
      } else {
        // Signal that streaming should start
        if (onStartStream) {
          onStartStream();
        }

        // Fallback to direct mutation if no callback provided
        const messageId = await sendMessage({
          prompt: messageData.body,
          conversationId: messageData.conversationId,
          model: messageData.model,
          files: messageData.files,
        });

        // Signal that message was sent and provide the messageId
        if (onMessageSent) {
          onMessageSent(messageId);
        }
      }

      setNewMessageText("");
      setUploadedFiles([]);

      // Navigate to chat if this is from index page
      if (createNewConversation && onNavigateToChat && targetConversationId) {
        onNavigateToChat(targetConversationId);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  const handleStopStream = () => {
    if (onStopStream) {
      onStopStream();
    }
  };

  const getPlaceholder = () => {
    if (isStreaming) return placeholder.streaming;
    if (uploadedFiles.length > 0) return placeholder.withFiles;
    return placeholder.default;
  };

  return (
    <div
      className={cn(
        createNewConversation ? "w-full" : "sticky bottom-0 w-full px-4 py-6",
        className,
      )}
    >
      <div
        className={cn(
          "container mx-auto max-w-4xl",
          createNewConversation ? "px-0" : "",
        )}
      >
        <PromptInput
          value={newMessageText}
          onValueChange={setNewMessageText}
          onSubmit={handleSubmit}
          isLoading={isStreaming}
          className="p-4 shadow-xl shadow-black/5 backdrop-blur-lg"
        >
          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-gray-100 p-2 dark:border-gray-800">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  {file.type.startsWith("image/") ? (
                    <FileImage className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="max-w-32 truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive hover:text-destructive-foreground h-4 w-4 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input */}
          <PromptInputTextarea
            placeholder={getPlaceholder()}
            autoComplete="off"
            disabled={
              (!createNewConversation && !conversationId) || isStreaming
            }
            className="text-foreground text-base"
          />

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-1">
            <PromptInputActions>
              {/* File Upload Button */}
              <PromptInputAction tooltip="Upload images or PDFs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg transition-colors hover:bg-accent!"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="text-muted-foreground h-4 w-4" />
                  <span className="sr-only">Upload file</span>
                </Button>
              </PromptInputAction>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {/* Web Search Toggle */}
              <PromptInputAction
                tooltip={
                  webSearchEnabled ? "Web search enabled" : "Enable web search"
                }
              >
                <Button
                  type="button"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-colors",
                    webSearchEnabled
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "hover:bg-accent! hover:text-secondary-foreground",
                  )}
                >
                  <Globe
                    className={cn(
                      "h-4 w-4",
                      webSearchEnabled
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                  <span className="sr-only">Toggle web search</span>
                </Button>
              </PromptInputAction>

              {/* Model Picker */}
              <Combobox
                groupedOptions={models.map((model) => ({
                  value: model.id,
                  label: model.name,
                  group: model.company,
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
            </PromptInputActions>

            {/* Send/Stop Button */}
            {isStreaming ? (
              <Button
                type="button"
                onClick={handleStopStream}
                size="icon"
                className="h-9 w-9 flex-shrink-0 rounded-lg bg-foreground transition-colors hover:bg-foreground/80"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">Stop generation</span>
              </Button>
            ) : ( 
                <Button
                  aria-label="Send message"
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    (!newMessageText.trim() && uploadedFiles.length === 0) ||
                    (!createNewConversation && !conversationId) ||
                    isStreaming
                  }
                  size="icon"
                  className="bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:text-primary-foreground/50 h-9 w-9 flex-shrink-0 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
            )}
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
