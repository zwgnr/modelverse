// routes/_layout/chat/$chatid.tsx
import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Infer } from "convex/values";
import { modelId } from "../../../convex/schema";
import { StickToBottom } from "use-stick-to-bottom";
import { PromptArea } from "@/components/PromptArea";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { StreamingMessage } from "@/components/StreamingMessage";
import { FileDisplay } from "@/components/FileDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { GitFork } from "lucide-react";
import { getModelDisplayName } from "@/lib/models";
import { cn } from "@/lib/utils";
import React from "react";

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

  /* ───── Conversations list (for title) ───── */
  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.get, {}),
  );
  const title = useMemo(
    () => conversations?.find((c) => c._id === chatid)?.title ?? "askhole",
    [conversations, chatid],
  );
  useEffect(() => void (document.title = title), [title]);

  /* ───── Messages (with “keep previous data”) ───── */
  const msgRef = convexQuery(api.messages.get, {
    conversationId: chatid as Id<"conversations">,
  });

  const { data: messages = [], isFetching } = useSuspenseQuery(msgRef);

  // leave previous data in cache so UI never goes blank
  qc.setQueryDefaults(msgRef.queryKey, {
    placeholderData: (prev) => prev,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });

  /* ───── Streaming bookkeeping ───── */
  const [driven, setDriven] = useState(new Set<string>());
  useEffect(() => {
    const m = messages.at(-1);
    if (m?.responseStreamId && !m.response) {
      setDriven((prev) => new Set(prev).add(m._id));
    }
  }, [messages]);

  /* ───── Mutations ───── */
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1">
        <StickToBottom
          className="absolute inset-0 overflow-x-hidden px-4 py-6"
          initial="instant"
          resize={"instant"}
        >
          <StickToBottom.Content>
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
          </StickToBottom.Content>
        </StickToBottom>
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

const Row = React.memo(
  function Row({ m, driven, onStart, onDone, onFork }: RowProps) {
    const hasAiReply = m.responseStreamId || m.response;

    return (
      <div className="flex w-full max-w-4xl flex-col space-y-2">
        {/* ─── User bubble (prompt) ─── */}
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

        {/* ─── AI bubble ── */}
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

            {/* footer */}
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
  },
  (a, b) =>
    a.m._id === b.m._id &&
    a.m.response === b.m.response &&
    a.driven === b.driven,
);

function Bubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("w-full break-words whitespace-pre-wrap", className)}>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}
