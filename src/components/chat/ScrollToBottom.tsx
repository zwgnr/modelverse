import { Button } from "@/components/ui/button";

export function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
	return (
			<Button
				onClick={onClick}
				variant="secondary"
				size="sm"
				className="rounded-full shadow-lg"
			>
			↓ Scroll to bottom
		</Button>
	);
}
