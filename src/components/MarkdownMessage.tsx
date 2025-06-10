// MarkdownMessage.tsx
import { useEffect, useState } from "react";
import MarkdownItAsync from "markdown-it-async";
import { fromAsyncCodeToHtml } from "@shikijs/markdown-it/async";
import { codeToHtml } from "shiki";
import { Token } from "markdown-it/index.js";

const md = (() => {
  const md = MarkdownItAsync({
    html: true,
    linkify: true,
    typographer: true,
    highlight: () => "",
  }).use(
    fromAsyncCodeToHtml(codeToHtml, {
      themes: { light: "catppuccin-latte", dark: "catppuccin-frappe" },
    }),
  );

  /* ---- Tailwind classes for non-code elements -------------------------- */
  const cls: Record<string, string> = {
    code_inline: "rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800",
    h1: "text-foreground mt-6 mb-4 text-2xl font-bold",
    h2: "text-foreground mt-5 mb-3 text-xl font-bold",
    h3: "text-foreground mt-4 mb-2 text-lg font-bold",
    h4: "text-foreground mt-3 mb-2 text-base font-bold",
    p: "text-foreground mb-3 leading-relaxed",
    ul: "text-foreground mb-3 ml-6 list-disc space-y-2",
    ol: "text-foreground mb-3 ml-6 list-decimal space-y-2",
    li: "pl-2 leading-relaxed",
    blockquote:
      "my-4 border-l-4 border-slate-300 pl-4 text-slate-600 italic dark:border-slate-600 dark:text-slate-400",
    strong: "text-foreground font-bold",
    em: "text-foreground italic",
    a: "text-blue-500 underline hover:text-blue-600",
    hr: "my-6 border-slate-200 dark:border-slate-700",
    table:
      "min-w-full border-collapse border border-slate-300 dark:border-slate-600",
    th: "border border-slate-300 bg-slate-100 px-4 py-2 text-left font-semibold dark:border-slate-600 dark:bg-slate-800",
    td: "border border-slate-300 px-4 py-2 dark:border-slate-600",
  };

  /** Helper to add a class to the opening token */
  const addClass =
    (rule: string, tag: string = rule) =>
    (
      tokens: Token[],
      idx: number,
      _opts: unknown,
      _env: unknown,
      self: any,
    ) => {
      tokens[idx].attrPush(["class", cls[tag]]);
      return self.renderToken(tokens, idx, _opts);
    };

  // Standard block/inline rules
  const rules = {
    paragraph_open: "p",
    bullet_list_open: "ul",
    ordered_list_open: "ol",
    list_item_open: "li",
    blockquote_open: "blockquote",
    strong_open: "strong",
    em_open: "em",
    hr: "hr",
    table_open: "table",
    th_open: "th",
    td_open: "td",
  };

  Object.entries(rules).forEach(([rule, tag]) => {
    md.renderer.rules[rule] = addClass(rule, tag);
  });

  // Headings (h1–h4)
  md.renderer.rules.heading_open = (tokens, idx, opts, _env, self) => {
    const tag = tokens[idx].tag;
    tokens[idx].attrPush(["class", cls[tag]]);
    return self.renderToken(tokens, idx, opts);
  };

  // Inline code
  md.renderer.rules.code_inline = (tokens, idx) => {
    const t = tokens[idx];
    t.attrPush(["class", cls.code_inline]);
    return `<code${md.renderer.renderAttrs(t)}>${md.utils.escapeHtml(
      t.content,
    )}</code>`;
  };

  // Links
  md.renderer.rules.link_open = (tokens, idx, opts, _env, self) => {
    const t = tokens[idx];
    t.attrPush(["class", cls.a]);
    t.attrPush(["target", "_blank"]);
    t.attrPush(["rel", "noopener noreferrer"]);
    return self.renderToken(tokens, idx, opts);
  };

  return md;
})();

const renderMarkdown = (markdown: string) => md.renderAsync(markdown);

export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(content).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className={`${className} [&_.shiki]:my-3 [&_.shiki]:overflow-x-auto [&_.shiki]:rounded-lg [&_.shiki]:bg-slate-50 [&_.shiki]:p-4 [&_.shiki]:dark:bg-slate-900`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
