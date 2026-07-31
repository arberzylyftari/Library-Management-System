import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, SIDEBAR_COLLAPSED_KEY } from "@/components/app-sidebar";
import { AskChatProvider } from "@/context/ask-chat";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    // Mounted here (not per-page) so the Ask AI thread and chat list survive
    // navigating to another page and back, and so the sidebar can render the
    // chat list itself (see AppSidebar).
    <AskChatProvider>
      <div className="flex h-svh overflow-hidden">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* More width is put to use once the sidebar frees it up, instead
              of leaving a fixed centered column with growing empty margins. */}
          <div
            className={cn(
              "mx-auto w-full px-6 py-8",
              collapsed ? "max-w-7xl px-10" : "max-w-5xl",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </AskChatProvider>
  );
}
