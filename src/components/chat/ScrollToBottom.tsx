import { Button } from "@/components/ui/button";

export function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
	return (
		<div className="-translate-x-1/2 absolute bottom-8 left-1/2 z-40 transform">
			<Button
				onClick={onClick}
				variant="secondary"
				size="sm"
				className="rounded-full shadow-lg"
			>
				↓ Scroll to bottom
			</Button>
		</div>
	);
}
