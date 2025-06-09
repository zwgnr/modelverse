import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({
  content,
  className = "",
}: MarkdownMessageProps) {
  const CopyButton = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    };

    return (
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");

            return !inline && language ? (
              <div className="my-4 w-full relative table table-fixed">
                <CopyButton code={codeString} />
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="pre"
                  className="rounded-md w-full block"
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    border: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-foreground mt-6 mb-4 text-2xl font-bold">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-foreground mt-5 mb-3 text-xl font-bold">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-foreground mt-4 mb-2 text-lg font-bold">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-foreground mt-3 mb-2 text-base font-bold">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-foreground mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="text-foreground mb-3 ml-6 list-disc space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-foreground mb-3 ml-6 list-decimal space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-2 leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-slate-300 pl-4 text-slate-600 italic dark:border-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="text-foreground font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-foreground italic">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-500 underline hover:text-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-6 border-slate-200 dark:border-slate-700" />
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-300 bg-slate-100 px-4 py-2 text-left font-semibold dark:border-slate-600 dark:bg-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-300 px-4 py-2 dark:border-slate-600">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
