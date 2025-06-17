
import { useCallback, useState } from "react";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyButton({ response }: { response?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy response:", err);
    }
  }, [response]);

  if (!response) return null;

  return (
    <Button
      aria-label="Copy"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </Button>
  );
}