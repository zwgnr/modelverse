import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Infer } from "convex/values";
import { modelId } from "../../../convex/schema";
import { PromptArea } from "@/components/PromptArea";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { StreamingMessage } from "@/components/StreamingMessage";
import { FileDisplay } from "@/components/FileDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { GitFork } from "lucide-react";
import { getModelDisplayName } from "@/lib/models";
import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ScrollToBottomButton } from "@/components/ScrollToBottom";

function useAtBottom(
  ref: React.RefObject<HTMLElement | null>,
  px = 40,
): boolean {
  const [atBottom, set] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      const d = el.scrollHeight - el.scrollTop - el.clientHeight;
      set(d <= px);
    };
    on();
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [ref, px]);
  return atBottom;
}

const AutoScroll = React.forwardRef<
  HTMLDivElement,
  { children: ReactNode; deps?: unknown[] }
>(function AutoScroll({ children, deps = [] }, ext) {
  const local = useRef<HTMLDivElement>(null);
  const set = (n: HTMLDivElement | null) => {
    local.current = n;
    if (typeof ext === "function") ext(n);
    else if (ext) ext.current = n;
  };
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const el = local.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setReady(true);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      ref={set}
      className={cn(
        "absolute inset-0 overflow-x-hidden px-4 py-6 transition-opacity",
        ready ? "opacity-100" : "opacity-0",
      )}
    >
      {children}
    </div>
  );
});

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

function ChatConversation() {
  const { chatid } = useParams({ from: "/_layout/chat/$chatid" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  /* title */
  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.get, {}),
  );
  const title = useMemo(
    () => conversations?.find((c) => c._id === chatid)?.title ?? "askhole",
    [conversations, chatid],
  );
  useEffect(() => void (document.title = title), [title]);

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
      setDriven((s) => new Set(s).add(m._id));
    }
  }, [messages]);

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

  /* render */
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

interface RowProps {
  m: Doc<"messages">;
  driven: boolean;
  onStart: () => void;
  onDone: () => void;
  onFork: () => void;
}

const Row = React.memo(function Row({
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
        <Bubble className="bg-accent text-secondary-foreground flex w-fit max-w-2xs items-center">
          {m.prompt}
          {m.files?.length && (
            <div className="mt-3 space-y-2">
              {m.files.map((f, i) => (
                <FileDisplay key={i} file={f} messageId={m._id} />
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
                  streamId={m.responseStreamId!}
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
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
              {getModelDisplayName(m.model) ?? m.model}
              <button onClick={onFork} title="Fork">
                <GitFork size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function Bubble({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("w-full break-words whitespace-pre-wrap", className)}>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}
