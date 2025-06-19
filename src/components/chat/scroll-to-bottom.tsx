import { Button } from "@/components/ui/button";

export function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
	return (
			<Button
				onClick={onClick}
				variant="secondary"
				size="sm"
				className="rounded-full bg-muted text-secondary-foreground shadow-lg dark:bg-muted dark:text-secondary-foreground"
			>
			↓ Scroll to bottom
		</Button>
	);
}
