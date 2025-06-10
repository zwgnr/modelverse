import { Button } from "./ui/button";
import { useStickToBottomContext } from "use-stick-to-bottom";

export function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 z-40">
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