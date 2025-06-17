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
		<div className="shiki not-prose group relative [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:px-6 [&_pre]:py-5">
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
					// set bg color to init correctly
					<pre className="overflow-x-auto rounded-lg bg-[#eff1f5] p-4 text-foreground dark:bg-[#1e1e2e]">
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
				"prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0",
				className,
			)}
		>
			<ReactMarkdown
				rehypePlugins={[rehypeInlineCodeProperty]}
				components={{
					code: CodeHighlight,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
