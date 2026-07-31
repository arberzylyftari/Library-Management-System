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
          {/* Fills most of the width on large screens (a tight centered
              column left big empty margins on wide monitors) while staying
              padded and readable on smaller ones. Collapsing the sidebar
              widens it a little further into the reclaimed space. */}
          <div
            className={cn(
              "mx-auto w-full px-6 py-8 md:px-10",
              collapsed ? "max-w-[2200px]" : "max-w-[2000px]",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </AskChatProvider>
  );
}
