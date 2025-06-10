import { Button } from "./ui/button";
import { useStickToBottomContext } from "use-stick-to-bottom";

export function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transform">
      <Button
        onClick={() => scrollToBottom()}
        variant="secondary"
        size="sm"
        className="rounded-full shadow-lg"
      >
        ↓ Scroll to bottom
      </Button>
    </div>
  );
}
