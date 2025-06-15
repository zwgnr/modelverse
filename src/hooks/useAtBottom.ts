import { useEffect, useState } from "react";

export function useAtBottom(
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
