import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import type { Infer } from "convex/values";

import DOMPurify from "isomorphic-dompurify";
import { Split } from "lucide-react";

import { useAtBottom } from "@/hooks/useAtBottom";

import { getModelDisplayName } from "@/lib/models";

import { AutoScroll } from "@/components/chat/AutoScroll";
import { Bubble } from "@/components/chat/Bubble";
import { FileDisplay } from "@/components/chat/FileDisplay";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { PromptArea } from "@/components/chat/PromptArea";
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottom";
import { StreamingMessage } from "@/components/chat/StreamingMessage";
import { Button } from "@/components/ui/button";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { modelId } from "../../../convex/schema";

export const Route = createFileRoute("/_layout/chat/$chatid")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.messages.get, {
          conversationId: params.chatid as Id<"conversations">,
        }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.conversations.getById, {
          conversationId: params.chatid as Id<"conversations">,
        }),
      ),
    ]);
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
    <div className="flex w-full flex-col space-y-2">
      {/* User bubble */}
      <div className="flex justify-end">
        <Bubble className="flex w-fit max-w-2xs items-center bg-secondary text-secondary-foreground">
          {DOMPurify.sanitize(m.prompt)}
          {!!m.files?.length && (
            <div className="mt-3 space-y-2">
              {m.files.map((f) => (
                <FileDisplay key={f.filename} file={f} messageId={m._id} />
              ))}
            </div>
          )}
        </Bubble>
      </div>

      {/* AI bubble */}
      {hasAiReply && (
        <div className="flex flex-col items-start">
          <Bubble className="w-full border-none bg-transparent shadow-none">
            {m.response ? (
              <MarkdownMessage content={m.response} />
            ) : (
              <div className="streaming-code">
                <StreamingMessage
                  streamId={m.responseStreamId ?? ""}
                  convexSiteUrl={import.meta.env.VITE_CONVEX_SITE_URL ?? ""}
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
              <Button aria-label="Fork" variant="ghost" size="icon" onClick={onFork} title="Fork">
                <Split size={16} />
              </Button>
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

  const { data: conversation } = useSuspenseQuery(
    convexQuery(api.conversations.getById, {
      conversationId: chatid as Id<"conversations">,
    }),
  );

  const { data: customization } = useSuspenseQuery(
    convexQuery(api.users.getCustomization, {}),
  );
  /* Title */
  const title = useMemo(
    () => conversation?.title ?? "modelverse",
    [conversation],
  );
  useEffect(() => {
    document.title = title;
  }, [title]);

  /* Messages */
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

  // Streaming bookkeeping
  const [driven, setDriven] = useState(new Set<string>());
  useEffect(() => {
    const m = messages.at(-1);
    if (m?.responseStreamId && !m.response) {
      if (conversation?.hasPendingInitialMessage) {
        setDriven((s) => new Set(s).add(m._id));
      }
    }
  }, [messages, conversation]);

  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const cancelStream = useMutation(api.messages.cancelStream);
  const branchConversation = useMutation(
    api.conversations.createBranchedConversation,
  );
  const updateConversationModel = useMutation(api.conversations.updateModel);

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

  const onModelChange = useCallback(
    async (model: Infer<typeof modelId>) => {
      await updateConversationModel({
        conversationId: chatid as Id<"conversations">,
        model,
      });
    },
    [chatid, updateConversationModel],
  );

  // Scroll management
  const viewportRef = useRef<HTMLDivElement>(null);       // scroll container
  const contentRef  = useRef<HTMLDivElement>(null);       // inner growing column
  const atBottomRef = useRef(true);                       // pinned flag

  const atBottom = useAtBottom(viewportRef);

  // update atBottomRef on every scroll
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleScroll = () => {
      atBottomRef.current =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    };

    handleScroll(); // initialise immediately
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // ResizeObserver: keep pinned if we were at bottom before grow
  useEffect(() => {
    const viewport = viewportRef.current;
    const content  = contentRef.current;
    if (!viewport || !content) return;

    const ro = new ResizeObserver(() => {
      if (atBottomRef.current) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });

    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  // rAF loop: only while streaming & user currently at bottom
  useEffect(() => {
    const el = viewportRef.current;
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
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <AutoScroll ref={viewportRef} deps={[chatid]}>
          <div
            ref={contentRef}                              
            className="container mx-auto mb-40 flex max-w-3xl flex-col justify-center space-y-4"
          >
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

        {/* Gradient mask */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-40 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />

        {!atBottom && (
          <div className="-translate-x-1/2 absolute bottom-44 left-1/2 z-40 transform">
            <ScrollToBottomButton onClick={scrollToBottom} />
          </div>
        )}
      </div>

      {/* Prompt area */}
      <PromptArea
        conversationId={chatid as Id<"conversations">}
        onSendMessage={onSendMessage}
        onStopStream={stopStream}
        isStreaming={driven.size > 0}
        className="absolute right-0 bottom-0 left-0 z-50"
        conversationModel={conversation?.model}
        onModelChange={onModelChange}
        userDefaultModel={customization?.defaultModel}
      />
    </div>
  );
}
