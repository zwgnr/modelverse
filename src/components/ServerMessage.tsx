import { useMemo, useEffect, useRef, useState } from "react";
import * as React from "react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { MarkdownMessage } from "./MarkdownMessage";
import { getModelDisplayName } from "@/lib/models";
import { useMutation } from "convex/react";
import { Loader } from "@/components/ui/loader";
import { useAuthToken } from "@convex-dev/auth/react";
import { useAuth } from "@clerk/tanstack-react-start";

// Separate component that always calls the useStream hook
function StreamingContent({
  message,
  isDriven,
  stopStreaming,
  scrollToBottom,
  token,
  streamModule,
}: {
  message: Doc<"messages">;
  isDriven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
  token: string | null;
  streamModule: any;
}) {
  const saveResponse = useMutation(api.messages.saveResponse);
  const hasResponseBeenSaved = useRef(false);

  // Always call the hook
  // HTTP actions are served from .convex.site, not .convex.cloud
  const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
  const streamResult = streamModule.useStream(
    api.streaming.getStreamBody,
    new URL(`${convexSiteUrl}/chat-stream`),
    isDriven && token !== null,
    message.responseStreamId,
    { authToken: token },
  );

  const { text, status } = streamResult;

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

function ClientOnlyStreamingContent({
  message,
  isDriven,
  stopStreaming,
  scrollToBottom,
  token,
}: {
  message: Doc<"messages">;
  isDriven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
  token: string | null;
}) {
  const [streamModule, setStreamModule] = useState<any>(null);

  useEffect(() => {
    import("@convex-dev/persistent-text-streaming/react").then((module) => {
      setStreamModule(module);
    });
  }, []);

  // If the stream module isn't loaded yet, show loading state
  if (!streamModule?.useStream) {
    const displayText = message.response;
    return (
      <div>
        {displayText ? (
          <MarkdownMessage content={displayText} className="text-sm" />
        ) : (
          <div className="flex items-center py-2">
            <Loader variant="typing" size="sm" />
          </div>
        )}

        {/* Model Footer */}
        {message.model && (
          <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getModelDisplayName(message.model)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Now we can safely render the component that calls the hook
  return (
    <StreamingContent
      message={message}
      isDriven={isDriven}
      stopStreaming={stopStreaming}
      scrollToBottom={scrollToBottom}
      token={token}
      streamModule={streamModule}
    />
  );
}

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
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    getToken({ template: "convex" }).then(setToken);
  }, [getToken]);

  // Check if message was cancelled
  if (message.cancelled) {
    return (
      <div>
        {/* Show partial response if any */}
        {message.response && (
          <div className="mt-2 opacity-75">
            <MarkdownMessage
              content={message.response}
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

  // If we have a saved response, show it immediately
  if (message.response) {
    return (
      <div>
        <MarkdownMessage content={message.response} className="text-sm" />
        {message.model && (
          <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getModelDisplayName(message.model)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Only render streaming content on client
  if (!isClient || !token) {
    return (
      <div>
        <div className="flex items-center py-2">
          <Loader variant="typing" size="sm" />
        </div>
        {message.model && (
          <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getModelDisplayName(message.model)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ClientOnlyStreamingContent
      message={message}
      isDriven={isDriven}
      stopStreaming={stopStreaming}
      scrollToBottom={scrollToBottom}
      token={token}
    />
  );
}
