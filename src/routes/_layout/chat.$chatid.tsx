import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import type { Infer } from "convex/values";

import { GitFork } from "lucide-react";

import { useAtBottom } from "@/hooks/useAtBottom";

import { getModelDisplayName } from "@/lib/models";

import { AutoScroll } from "@/components/chat/AutoScroll";
import { Bubble } from "@/components/chat/Bubble";
import { FileDisplay } from "@/components/chat/FileDisplay";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { PromptArea } from "@/components/chat/PromptArea";
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottom";
import { StreamingMessage } from "@/components/chat/StreamingMessage";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { modelId } from "../../../convex/schema";

export const Route = createFileRoute("/_layout/chat/$chatid")({
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.messages.get, {
				conversationId: params.chatid as Id<"conversations">,
			}),
		);
	},
	component: ChatConversation,
});

interface RowProps {
	m: Doc<"messages">;
	driven: boolean;
	onStart: () => void;
	onDone: () => void;
	onFork: () => void;
}

const Row = memo(function Row({
	m,
	driven,
	onStart,
	onDone,
	onFork,
}: RowProps) {
	const hasAiReply = m.responseStreamId || m.response;
	return (
		<div className="flex w-full max-w-4xl flex-col space-y-2">
			{/* user bubble */}
			<div className="flex justify-end">
				<Bubble className="flex w-fit max-w-2xs items-center bg-accent text-secondary-foreground">
					{m.prompt}
					{m.files?.length && (
						<div className="mt-3 space-y-2">
							{m.files.map((f) => (
								<FileDisplay key={f.filename} file={f} messageId={m._id} />
							))}
						</div>
					)}
				</Bubble>
			</div>

			{/* ai bubble */}
			{hasAiReply && (
				<div className="flex flex-col items-start">
					<Bubble className="w-full border-none bg-transparent shadow-none">
						{m.response ? (
							<MarkdownMessage content={m.response} />
						) : (
							<div className="streaming-code">
								<StreamingMessage
									streamId={m.responseStreamId ?? ""}
									convexSiteUrl="https://mild-crocodile-62.convex.site"
									driven={driven}
									messageId={m._id}
									onStreamStart={onStart}
									onStreamComplete={onDone}
								/>
							</div>
						)}
					</Bubble>

					{m.model && (!driven || m.response) && (
						<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
							{getModelDisplayName(m.model) ?? m.model}
							<button type="button" onClick={onFork} title="Fork">
								<GitFork size={12} />
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
});

function ChatConversation() {
	const { chatid } = useParams({ from: "/_layout/chat/$chatid" });
	const navigate = useNavigate();
	const qc = useQueryClient();

	/* title */
	const { data: conversations } = useSuspenseQuery(
		convexQuery(api.conversations.get, {}),
	);
	const title = useMemo(
		() => conversations?.find((c) => c._id === chatid)?.title ?? "hmmm",
		[conversations, chatid],
	);
	useEffect(() => {
		document.title = title;
	}, [title]);

	/* messages */
	const msgRef = convexQuery(api.messages.get, {
		conversationId: chatid as Id<"conversations">,
	});
	const { data: messages = [] } = useSuspenseQuery(msgRef);
	qc.setQueryDefaults(msgRef.queryKey, {
		placeholderData: (prev) => {
			// @ts-expect-error
			const prevId = prev?.[0]?._id && msgRef.args.conversationId;
			return prevId === chatid ? prev : undefined;
		},
		staleTime: Infinity,
		gcTime: 30 * 60_000,
	});

	/* streaming bookkeeping */
	const [driven, setDriven] = useState(new Set<string>());
	useEffect(() => {
		const m = messages.at(-1);
		if (m?.responseStreamId && !m.response) {
			// Only mark as driven if this is a new message (not when navigating back)
			// We can detect this by checking if the conversation has hasPendingInitialMessage
			const conversation = conversations?.find((c) => c._id === chatid);
			if (conversation?.hasPendingInitialMessage) {
				setDriven((s) => new Set(s).add(m._id));
			}
		}
	}, [messages, conversations, chatid]);

	/* mutations */
	const sendMessage = useMutation(api.messages.send);
	const cancelStream = useMutation(api.messages.cancelStream);
	const branchConversation = useMutation(
		api.conversations.createBranchedConversation,
	);

	const onSendMessage = useCallback(
		async (p: {
			body: string;
			author: "User";
			conversationId: Id<"conversations">;
			model: Infer<typeof modelId>;
			fileData?: {
				filename: string;
				fileType: string;
				storageId: Id<"_storage">;
			}[];
		}) => {
			if (!p.body.trim() && !p.fileData?.length) return;
			const res = await sendMessage({
				prompt: p.body,
				conversationId: chatid as Id<"conversations">,
				model: p.model,
				files: p.fileData,
			});
			setDriven((d) => new Set(d).add(res.messageId));
		},
		[chatid, sendMessage],
	);

	const stopStream = useCallback(async () => {
		const id = [...driven].at(-1);
		if (id) await cancelStream({ messageId: id as Id<"messages"> });
		setDriven(new Set());
	}, [driven, cancelStream]);

	const fork = useCallback(async () => {
		const newId = await branchConversation({
			conversationId: chatid as Id<"conversations">,
		});
		navigate({ to: "/chat/$chatid", params: { chatid: newId } });
	}, [chatid, branchConversation, navigate]);

	/* scroll management */
	const ref = useRef<HTMLDivElement>(null);
	const atBottom = useAtBottom(ref);

	/*  permanent ResizeObserver – handles code-highlight, images, etc. */
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			const d = el.scrollHeight - el.scrollTop - el.clientHeight;
			if (d < 40) el.scrollTop = el.scrollHeight;
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	/* rAF loop – active only while streaming *and* user at bottom */
	useEffect(() => {
		const el = ref.current;
		if (!el || !(driven.size > 0 && atBottom)) return;
		let id: number;
		const loop = () => {
			el.scrollTop = el.scrollHeight;
			id = requestAnimationFrame(loop);
		};
		id = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(id);
	}, [driven.size, atBottom]);

	const scrollToBottom = () => {
		const el = ref.current;
		if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="relative flex-1">
				<AutoScroll ref={ref} deps={[chatid]}>
					<div className="container mx-auto max-w-4xl space-y-4">
						{messages.map((m) => (
							<Row
								key={m._id}
								m={m}
								driven={driven.has(m._id)}
								onStart={() => {}}
								onDone={() =>
									setDriven((d) => {
										const s = new Set(d);
										s.delete(m._id);
										return s;
									})
								}
								onFork={fork}
							/>
						))}
					</div>
				</AutoScroll>

				{!atBottom && <ScrollToBottomButton onClick={scrollToBottom} />}
			</div>

			<PromptArea
				conversationId={chatid as Id<"conversations">}
				onSendMessage={onSendMessage}
				onStopStream={stopStream}
				isStreaming={driven.size > 0}
				className="flex-shrink-0"
			/>
		</div>
	);
}
