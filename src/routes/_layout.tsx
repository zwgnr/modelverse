import { Sidebar } from "@/components/Sidebar";
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Search } from "lucide-react";
import { MessageCirclePlus } from "lucide-react";
import { selectedModelAtom } from "@/lib/models";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/tanstack-react-start";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.conversations.list, {}),
    );
  },
});

function RouteComponent() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarToggled, setSidebarToggled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentModel, setCurrentModel] = useAtom(selectedModelAtom);

  const { data: conversations } = useSuspenseQuery(
    convexQuery(api.conversations.list, {}),
  );

  const router = useRouter();
  const routerState = useRouterState();

  const chatMatch = routerState.matches.find(
    (match) => match.routeId === "/_layout/chat/$chatid",
  );
  const chatid = chatMatch
    ? (chatMatch.params as { chatid: string }).chatid
    : undefined;

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    setSidebarToggled(true); // Mark that sidebar has been explicitly toggled
  };

  const handleConversationDelete = (
    deletedConversationId: Id<"conversations">,
  ) => {
    // Navigate away if we're deleting the current conversation
    const { chatid } =
      routerState.matches.find((m) => m.routeId === "/_layout/chat/$chatid")
        ?.params ?? {};
    if (chatid === deletedConversationId) {
      router.navigate({ to: "/" });
    }
  };

  const { signOut } = useClerk();
  const handleSignOut = () => {
    signOut();
    router.navigate({ to: "/signin" });
  };

  const handleModelSelect = (modelName: string) => {
    setCurrentModel(modelName);
  };

  return (
    <div className="bg-background relative flex h-screen overflow-hidden">
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onModelSelect={handleModelSelect}
        conversations={conversations}
        currentModel={currentModel}
      />

      {/* Backdrop for mobile */}
      {sidebarVisible && (
        <div
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
        className={`relative z-50 overflow-hidden transition-all duration-300 ease-out ${sidebarVisible ? "w-64" : "w-0"}`}
      >
        <div className={`w-64 ${sidebarVisible ? "" : "pointer-events-none"}`}>
          <Sidebar
            routerState={routerState}
            currentConversationId={chatid as Id<"conversations">}
            conversations={conversations}
            onConversationDelete={handleConversationDelete}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onSignOut={handleSignOut}
            isVisible={sidebarVisible}
            hasBeenToggled={sidebarToggled}
          />
        </div>
      </div>

      <div
        className={`bg-card my-2 mr-4 flex flex-1 flex-col rounded-xl transition-all duration-300 ease-out ${sidebarVisible ? "ml-2" : "ml-2"}`}
      >
        <div className="sticky top-0 z-10 w-full rounded-xl bg-transparent px-4 py-3 backdrop-blur-sm">
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
                  className={`h-4 w-4 transition-transform duration-300 ease-out ${sidebarVisible ? "" : "scale-x-[-1]"}`}
                />
              </Button>

              {/* Collapsed Sidebar Actions */}
              <div
                className={`flex items-center gap-2 transition-all duration-300 ${sidebarVisible ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"}`}
              >
                {/* Search Icon Button */}
                <Button
                  onClick={() => setCommandPaletteOpen(true)}
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
        <Outlet />
      </div>
    </div>
  );
}
