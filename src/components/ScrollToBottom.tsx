import { Button } from "./ui/button";

export function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 transform">
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
