import { useEffect, useMemo } from "react";

import { useRouteContext } from "@tanstack/react-router";

import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { useMutation } from "convex/react";

import { useStream } from "@/hooks/useStream";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Loader } from "../ui/loader";
import { MarkdownMessage } from "./MarkdownMessage";

interface StreamingMessageProps {
	streamId: string;
	convexSiteUrl: string;
	driven: boolean;
	messageId?: Id<"messages">;
	onStreamComplete?: () => void;
	onStreamStart?: () => void;
}

export function StreamingMessage({
	streamId,
	convexSiteUrl,
	driven,
	messageId,
	onStreamComplete,
	onStreamStart,
}: StreamingMessageProps) {
	const finalizeStreamedResponse = useMutation(
		api.messages.finalizeStreamedResponse,
	);
	const { token } = useRouteContext({ from: "__root__" });

	const { text, status } = useStream(
		api.streaming.getStreamBody,
		new URL(`/chat`, convexSiteUrl),
		driven,
		streamId as StreamId,
		{ authToken: token },
	);

	const isCurrentlyStreaming = useMemo(() => {
		if (!driven) return false;
		return status === "pending";
	}, [driven, status]);

	// Handle stream start
	useEffect(() => {
		if (!driven) return;
		if (status === "streaming" && text && onStreamStart) {
			onStreamStart();
		}
	}, [driven, status, text, onStreamStart]);

	// Handle stream completion
	useEffect(() => {
		if (!driven) return;
		if (isCurrentlyStreaming) return;
		if (status === "done") {
			// Finalize the streamed response if we have a messageId
			if (messageId) {
				finalizeStreamedResponse({ messageId }).catch(console.error);
			}

			// Call the original completion callback
			if (onStreamComplete) {
				onStreamComplete();
			}
		}
	}, [
		driven,
		isCurrentlyStreaming,
		status,
		onStreamComplete,
		messageId,
		finalizeStreamedResponse,
	]);

	return (
		<div className="server-message streaming-code">
			{/* show streamed text if we have it */}
			{text && <MarkdownMessage content={text} />}

			{/* error or timeout banner */}
			{(status === "error" || status === "timeout") && (
				<div className="mt-2 rounded-md bg-red-100 p-4 text-red-500">
					Error loading response
				</div>
			)}

			{/* loader only while stream is in-flight */}
			{isCurrentlyStreaming && <Loader variant="dots" size="md" />}
		</div>
	);
}
