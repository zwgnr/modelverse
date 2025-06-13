import { Button } from "@/components/ui/button";
import { Search, MessageCirclePlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface SidebarActionsProps {
  onOpenCommandPalette?: () => void;
}

export function SidebarActions({ onOpenCommandPalette }: SidebarActionsProps) {
  return (
    <div className="flex-shrink-0 space-y-2 p-2">
      <div className="flex gap-2">
        {/* Full width search command palette */}
        <Button
          onClick={onOpenCommandPalette}
          variant="outline"
          className="hover:bg-secondary hover:text-secondary-foreground h-9 flex-1 justify-start border-dashed text-left text-sm transition-all duration-200"
          title="Command Palette (⌘K)"
        >
          <Search className="mr-3 h-4 w-4" />
          <span>Search</span>
          <div className="ml-auto flex items-center">
            <kbd className="bg-muted text-muted-foreground inline-flex h-4 items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-medium opacity-100 select-none">
              <span className="text-xs">
                {typeof navigator !== "undefined" &&
                navigator.platform.includes("Mac")
                  ? "⌘"
                  : "Ctrl"}
              </span>
              K
            </kbd>
          </div>
        </Button>

        {/* New Chat Button */}
        <Button
          asChild
          variant="outline"
          size="icon"
          title="New Chat (⌘N)"
          className="transition-all duration-200 hover:scale-105"
        >
          <Link to="/">
            <MessageCirclePlus className="text-primary h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
} 