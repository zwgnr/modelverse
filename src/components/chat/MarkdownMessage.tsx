import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { rehypeInlineCodeProperty, useShikiHighlighter } from "react-shiki";

import { cn } from "@/lib/utils";

export interface MarkdownMessageProps {
	content: string;
	className?: string;
}

interface CodeHighlightProps {
	className?: string;
	children?: ReactNode;
	inline?: boolean;
}

const CodeHighlight = ({
	className,
	children,
	inline,
	...props
}: CodeHighlightProps) => {
	const match = className?.match(/language-(\w+)/);
	const language = match ? match[1] : undefined;

	const code = String(children);
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy code:", err);
		}
	}, [code]);

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
		<div className="shiki not-prose group relative my-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:px-6 [&_pre]:py-5">
			{language && (
				<span className="absolute top-2 right-12 text-muted-foreground/85 text-xs tracking-tighter">
					{language}
				</span>
			)}
			<button
				type="button"
				onClick={handleCopy}
				className={cn(
					"absolute top-2 right-3 z-10 rounded-md p-1.5 transition-all duration-200",
					"border bg-background/80 shadow-sm backdrop-blur-sm",
					"opacity-60 hover:opacity-100 group-hover:opacity-100",
					"hover:bg-muted-foreground/10 focus:bg-muted-foreground/10",
					"focus:ring-offset-background",
					copied && "opacity-100",
				)}
				title={copied ? "Copied!" : "Copy code"}
			>
				{copied ? (
					<Check className="h-4 w-4 text-green-500" />
				) : (
					<Copy className="h-4 w-4 text-muted-foreground/85" />
				)}
			</button>
			<div className="min-h-[2.5rem]">
				{highlightedCode || (
					<pre className="overflow-x-auto rounded-lg bg-muted p-4">
						<code>{code}</code>
					</pre>
				)}
			</div>
		</div>
	) : (
		<code
			className={cn("rounded-sm bg-muted px-1.5 py-0.5", className)}
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
						<h1 className="mt-6 mb-4 font-bold text-2xl text-foreground">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="mt-5 mb-3 font-bold text-foreground text-xl">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="mt-4 mb-2 font-bold text-foreground text-lg">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="mt-3 mb-2 font-bold text-base text-foreground">
							{children}
						</h4>
					),
					p: ({ children }) => (
						<p className="mb-3 text-foreground leading-relaxed">{children}</p>
					),
					ul: ({ children }) => (
						<ul className="mb-3 ml-6 list-disc space-y-2 text-foreground">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="mb-3 ml-6 list-decimal space-y-2 text-foreground">
							{children}
						</ol>
					),
					li: ({ children }) => (
						<li className="pl-2 leading-relaxed">{children}</li>
					),
					blockquote: ({ children }) => (
						<blockquote className="my-4 border-slate-300 border-l-4 pl-4 text-slate-600 italic dark:border-slate-600 dark:text-slate-400">
							{children}
						</blockquote>
					),
					strong: ({ children }) => (
						<strong className="font-bold text-foreground">{children}</strong>
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
