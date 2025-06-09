import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Globe, MessageCirclePlus } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { models, DEFAULT_MODEL } from "@/lib/models";

export const Route = createFileRoute("/_layout/")({
  component: IndexComponent,
});

function IndexComponent() {
  const router = useRouter();
  const createConversation = useMutation(api.conversations.create);
  const sendMessage = useMutation(api.messages.send);

  const [newMessageText, setNewMessageText] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    try {
      const newConversationId = await createConversation({});
      const modelToUse = webSearchEnabled
        ? `${selectedModel}:online`
        : selectedModel;

      await sendMessage({
        body: newMessageText,
        author: "User",
        conversationId: newConversationId,
        model: modelToUse,
      });

      setNewMessageText("");

      router.navigate({
        to: "/chat/$chatid",
        params: { chatid: newConversationId },
      });
    } catch (error) {
      console.error(
        "Failed to create new conversation and send message:",
        error,
      );
    }
  };

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col items-center justify-center pb-24">
          <div className="text-center">
            <h1 className="mt-6 text-3xl font-bold text-gray-800 dark:text-gray-200">
              How can I help you today?
            </h1>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="sticky bottom-0 w-full px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/20 bg-white/90 p-3 shadow-xl shadow-black/5 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-black/20">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Row 1: Text Input Only */}
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Input
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="h-11 border-0 bg-transparent! text-base shadow-none focus:ring-0 focus-visible:border-0 focus-visible:ring-0"
                    autoComplete="off"
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
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    title={
                      webSearchEnabled
                        ? "Web search enabled"
                        : "Enable web search"
                    }
                  >
                    <Globe
                      className={`h-4 w-4 ${webSearchEnabled ? "text-white" : "text-slate-500"}`}
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
                    <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <Globe className="h-3 w-3" />
                      Web search enabled
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 rounded-lg bg-blue-500 transition-colors hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
