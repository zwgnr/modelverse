import {
	forwardRef,
	type ReactNode,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import { cn } from "@/lib/utils";

interface AutoScrollProps {
	children: ReactNode;
	deps?: unknown[];
}

export const AutoScroll = forwardRef<HTMLDivElement, AutoScrollProps>(
	function AutoScroll({ children, deps = [] }, ext) {
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: </>
		}, deps);
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
	},
);
