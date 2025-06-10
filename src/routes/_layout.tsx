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
import { selectedModelAtom } from "@/lib/models";
import { useAtom } from "jotai";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentModel, setCurrentModel] = useAtom(selectedModelAtom);

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
    <div className="flex h-screen bg-background overflow-hidden relative">
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`relative z-50 transition-all duration-300 ease-out overflow-hidden ${sidebarVisible ? 'w-64' : 'w-0'}`}>
        <div className={`w-64 ${sidebarVisible ? '' : 'pointer-events-none'}`}>
          <Sidebar
            routerState={routerState}
            currentConversationId={chatid as Id<"conversations">}
            onConversationDelete={handleConversationDelete}
            onToggleSidebar={toggleSidebar}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onSignOut={handleSignOut}
            isVisible={sidebarVisible}
          />
        </div>
      </div>
      
      <div className={`my-2 mr-4 flex flex-1 flex-col rounded-xl bg-card transition-all duration-300 ease-out ${sidebarVisible ? 'ml-2' : 'ml-2'}`}>
        <div className="sticky top-0 z-10 w-full rounded-xl bg-transparent px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleSidebar}
                variant="ghost"
                size="sm"
                className="mr-2 transition-all duration-200 hover:scale-105 hover:bg-accent/50"
                title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
              >
                <PanelLeft className={`h-4 w-4 transition-transform duration-300 ease-out ${sidebarVisible ? '' : 'scale-x-[-1]'}`} />
              </Button>

              {/* Collapsed Sidebar Actions */}
              <div className={`flex items-center gap-2 transition-all duration-300 ${sidebarVisible ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                {/* Search Icon Button */}
                <Button
                  onClick={() => setCommandPaletteOpen(true)}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 animate-in fade-in slide-in-from-left-3 duration-300 hover:scale-105"
                  title="Search (⌘K)"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* New Chat Button */}
                <Button asChild variant="outline" size="icon" className="h-9 w-9 animate-in fade-in slide-in-from-left-3 duration-300 delay-75 hover:scale-105" title="New Chat (⌘N)">
                  <Link to="/">
                    <MessageCirclePlus className="h-4 w-4 text-primary" />
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
