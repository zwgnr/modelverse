import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useRouter,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Search } from "lucide-react";
import { MessageCirclePlus } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { DEFAULT_MODEL } from "@/lib/models";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL);

  const conversations = useQuery(api.conversations.list);
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
  };

  const handleConversationDelete = (
    deletedConversationId: Id<"conversations">,
  ) => {
    // If the deleted conversation is the current one, navigate to new chat
    const { chatid } =
      routerState.matches.find((m) => m.routeId === "/_layout/chat/$chatid")
        ?.params ?? {};
    if (chatid === deletedConversationId) {
      router.navigate({ to: "/" });
    }
  };

  const { signOut } = useAuthActions();
  const handleSignOut = () => {
    signOut();
  };

  const handleModelSelect = (modelName: string) => {
    setCurrentModel(modelName);
  };

  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onModelSelect={handleModelSelect}
        conversations={conversations}
        currentModel={currentModel}
      />

      {/* Sidebar */}
      {sidebarVisible && (
        <Sidebar
          routerState={routerState}
          currentConversationId={chatid as Id<"conversations">}
          onConversationDelete={handleConversationDelete}
          onToggleSidebar={toggleSidebar}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onSignOut={handleSignOut}
        />
      )}
      <div className="my-2 mr-4 ml-2 flex flex-1 flex-col rounded-xl bg-card">
        <div className="sticky top-0 z-10 w-full rounded-xl bg-transparent px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleSidebar}
                variant="ghost"
                size="sm"
                className="mr-2"
                title="Show sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>

              {/* Collapsed Sidebar Actions */}
              {!sidebarVisible && (
                <>
                  {/* Search Icon Button */}
                  <Button
                    onClick={() => setCommandPaletteOpen(true)}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    title="Search (⌘K)"
                  >
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* New Chat Button */}
                  <Button asChild variant="outline" size="icon" className="h-9 w-9" title="New Chat (⌘N)">
                    <Link to="/">
                      <MessageCirclePlus className="h-4 w-4 text-primary" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
