import ReactMarkdown from "react-markdown";
import { useShikiHighlighter, rehypeInlineCodeProperty } from "react-shiki";
import { cn } from "@/lib/utils";


export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

interface CodeHighlightProps {
  className?: string | undefined;
  children?: React.ReactNode | undefined;
  inline?: boolean;
}

const CodeHighlight = ({
  className,
  children,
  inline,
  ...props
}: CodeHighlightProps): React.JSX.Element => {
  const match = className?.match(/language-(\w+)/);
  const language = match ? match[1] : undefined;

  const code = String(children);

  // Use theme object with both light and dark variants
  const theme = {
    light: "catppuccin-latte",
    dark: "catppuccin-mocha",
  };

  const highlightedCode = useShikiHighlighter(code, language, theme, {
    delay: 0,
  });

  const isCodeBlock = !inline;

  return isCodeBlock ? (
    <div className="shiki not-prose relative my-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:px-6 [&_pre]:py-5">
      {language && (
        <span className="text-muted-foreground/85 absolute top-2 right-3 text-xs tracking-tighter">
          {language}
        </span>
      )}
      <div className="min-h-[2.5rem]">
        {highlightedCode || (
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  ) : (
    <code
      className={cn("bg-muted rounded-sm px-1.5 py-0.5", className)}
      {...props}
    >
      {children}
    </code>
  );
};

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        className,
      )}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeInlineCodeProperty]}
        components={{
          code: CodeHighlight,
          // Custom styling for other elements
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
          a: ({ children, href }) => (
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
            <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
              {children}
            </table>
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
