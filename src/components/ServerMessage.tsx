import { StreamId } from "@convex-dev/persistent-text-streaming";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { useMemo, useEffect, useRef } from "react";
import { MarkdownMessage } from "./MarkdownMessage";
import { getModelDisplayName } from "@/lib/models";
import { useMutation } from "convex/react";
import { Loader } from "@/components/ui/loader";
import { useAuthToken } from "@convex-dev/auth/react";

export function ServerMessage({
  message,
  isDriven,
  stopStreaming,
  scrollToBottom,
}: {
  message: Doc<"messages">;
  isDriven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
}) {
  const saveResponse = useMutation(api.messages.saveResponse);
  const hasResponseBeenSaved = useRef(false);
  const token = useAuthToken();

  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${import.meta.env.VITE_CONVEX_SITE_URL}/chat-stream`),
    isDriven,
    message.responseStreamId as StreamId,
    { authToken: token },
  );

  const isCurrentlyStreaming = useMemo(() => {
    if (!isDriven) return false;
    return status === "pending" || status === "streaming";
  }, [isDriven, status]);

  useEffect(() => {
    if (!isDriven) return;
    if (isCurrentlyStreaming) return;

    // Only call stopStreaming if we actually had some streaming content
    // This prevents calling stopStreaming immediately when a message is first created
    if (status === "done" || status === "error") {
      stopStreaming();
    }

    // Save the response when streaming completes
    if (text && !hasResponseBeenSaved.current && !message.response) {
      hasResponseBeenSaved.current = true;
      saveResponse({ messageId: message._id, response: text });
    }
  }, [
    isDriven,
    isCurrentlyStreaming,
    status,
    stopStreaming,
    text,
    message._id,
    message.response,
    saveResponse,
  ]);

  useEffect(() => {
    if (!text && !message.response) return;
    scrollToBottom();
  }, [text, message.response, scrollToBottom]);

  // Check if message was cancelled
  if (message.cancelled) {
    return (
      <div>
        {/* Show partial response if any */}
        {(message.response || text) && (
          <div className="mt-2 opacity-75">
            <MarkdownMessage
              content={message.response || text || ""}
              className="text-sm"
            />
          </div>
        )}

        {/* Model Footer */}
        {message.model && (
          <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getModelDisplayName(message.model)}
              </span>
              <span className="text-xs text-red-500">• cancelled by user</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show saved response if available, otherwise show streaming text
  const displayText = message.response || text;

  return (
    <div>
      {displayText ? (
        <MarkdownMessage content={displayText} className="text-sm" />
      ) : (
        <div className="flex items-center py-2">
          <Loader variant="typing" size="sm" />
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 text-xs text-red-500">Error loading response</div>
      )}

      {/* Model Footer */}
      {message.model && (
        <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getModelDisplayName(message.model)}
            </span>
            {isCurrentlyStreaming && (
              <span className="text-xs text-blue-500">• {status}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
