import { useLayoutEffect, useState, type RefObject } from "react";

interface UseLayoutSettledDetectionOptions {
  isActive: boolean;
  messages: any[] | undefined;
  nodeRef: RefObject<HTMLDivElement | null>;
  chatId: string;
}

/**
 * Custom hook for detecting when a chat layout has settled after messages are rendered.
 * Uses ResizeObserver and idle callbacks to ensure smooth auto-scrolling behavior.
 */
export function useLayoutSettledDetection({
  isActive,
  messages,
  nodeRef,
  chatId,
}: UseLayoutSettledDetectionOptions) {
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!isActive || !messages) {
      setIsReady(false);
      return;
    }

    const node = nodeRef.current;
    if (!node) return;

    // always start at the bottom
    node.scrollTop = node.scrollHeight;

    let rafId: number;
    let idleId: number;
    let resizeCount = 0;

    const ro = new ResizeObserver(() => {
      node.scrollTop = node.scrollHeight; // glue
      resizeCount++;

      // Cancel previous attempts
      cancelAnimationFrame(rafId);
      if (idleId) cancelIdleCallback(idleId);

      // For long threads (many messages), be more patient
      const isLongThread = messages.length > 20;
      const framesToWait = isLongThread ? 3 : 2;

      let frameCount = 0;
      function waitForQuietFrames() {
        rafId = requestAnimationFrame(() => {
          frameCount++;
          if (frameCount < framesToWait) {
            waitForQuietFrames();
          } else {
            // After quiet frames, wait for browser idle
            idleId = requestIdleCallback(
              () => {
                setIsReady(true);
              },
              { timeout: 100 },
            ); // max 100ms timeout
          }
        });
      }

      waitForQuietFrames();
    });

    ro.observe(node);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      if (idleId) cancelIdleCallback(idleId);
    };
  }, [isActive, messages, chatId]);

  return isReady;
}
