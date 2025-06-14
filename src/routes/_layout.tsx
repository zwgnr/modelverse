import { Sidebar } from "@/features/sidebar/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import {
  createFileRoute,
  Outlet,
  useRouter,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Search } from "lucide-react";
import { MessageCirclePlus } from "lucide-react";
import { selectedModelAtom } from "@/lib/models";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import { convexQuery } from "@convex-dev/react-query";
import { authClient } from "@/lib/auth-client";
import { modelId } from "convex/schema";
import { Infer } from "convex/values";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(convexQuery(api.conversations.get, {}));
    context.queryClient.ensureQueryData(
      convexQuery(api.auth.getCurrentUser, {}),
    );
  },
});

function RouteComponent() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarToggled, setSidebarToggled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentModel, setCurrentModel] = useAtom(selectedModelAtom);

  const { data: currentUser } = useSuspenseQuery(
    convexQuery(api.auth.getCurrentUser, {}),
  );

  const router = useRouter();

  // Memoize chatid extraction to prevent unnecessary re-renders
  const currentChatId = useRouterState({
    select: (s) => {
      const seg = s.location.pathname.split("/");
      return seg[1] === "chat" ? seg[seg.length - 1] : undefined;
    },
  });

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((v) => !v);
    setSidebarToggled(true);
  }, []);

  const handleConversationDelete = useCallback(
    (deletedConversationId: Id<"conversations">) => {
      // Navigate away if we're deleting the current conversation
      if (currentChatId === deletedConversationId) {
        router.navigate({ to: "/" });
      }
    },
    [currentChatId, router],
  );

  const handleSignOut = useCallback(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.navigate({ to: "/signin" });
        },
      },
    });
  }, [router]);

  const handleModelSelect = useCallback(
    (modelName: Infer<typeof modelId>) => {
      setCurrentModel(modelName);
    },
    [setCurrentModel],
  );

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  return (
    <div className="bg-background relative flex h-screen w-screen overflow-hidden">
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onModelSelect={handleModelSelect}
        currentModel={currentModel}
      />

      {/* Backdrop for mobile */}
      {sidebarVisible && (
        <button
          className={cn(
            "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden",
            sidebarToggled && "animate-in fade-in duration-300",
          )}
          onClick={() => {
            setSidebarVisible(false);
            setSidebarToggled(true);
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "relative z-50 flex-shrink-0 overflow-hidden transition-all duration-300 ease-out",
          sidebarVisible ? "w-64" : "w-0",
        )}
      >
        <div
          className={cn(
            "h-full w-64",
            !sidebarVisible && "pointer-events-none",
          )}
        >
          <Sidebar
            currentConversationId={currentChatId as Id<"conversations">}
            currentUser={currentUser}
            onConversationDelete={handleConversationDelete}
            onOpenCommandPalette={handleOpenCommandPalette}
            onSignOut={handleSignOut}
            isVisible={sidebarVisible}
            hasBeenToggled={sidebarToggled}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col p-2">
        <div className="bg-card flex h-full flex-col overflow-hidden rounded-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex-shrink-0 rounded-t-xl bg-transparent px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleSidebar}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent/50 mr-2 transition-all duration-200 hover:scale-105"
                  title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                >
                  <PanelLeft
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-out",
                      !sidebarVisible && "scale-x-[-1]",
                    )}
                  />
                </Button>

                {/* Collapsed Sidebar Actions */}
                <div
                  className={cn(
                    "flex items-center gap-2 transition-all duration-300",
                    sidebarVisible
                      ? "pointer-events-none scale-95 opacity-0"
                      : "scale-100 opacity-100",
                  )}
                >
                  {/* Search Icon Button */}
                  <Button
                    onClick={handleOpenCommandPalette}
                    variant="outline"
                    size="icon"
                    className="animate-in fade-in slide-in-from-left-3 h-9 w-9 duration-300 hover:scale-105"
                    title="Search (⌘K)"
                  >
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* New Chat Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="animate-in fade-in slide-in-from-left-3 h-9 w-9 delay-75 duration-300 hover:scale-105"
                    title="New Chat (⌘N)"
                  >
                    <Link to="/">
                      <MessageCirclePlus className="text-primary h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
