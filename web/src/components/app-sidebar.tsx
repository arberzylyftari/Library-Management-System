import {
  BarChart3,
  BookMarked,
  ChevronDown,
  Library,
  Loader2,
  LogOut,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAskChat } from "@/context/ask-chat";
import { useAuth } from "@/context/auth";
import type { ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/books", label: "My Books", icon: BookMarked, adminOnly: false },
  { to: "/ask", label: "Ask AI", icon: Sparkles, adminOnly: false },
  { to: "/recommendations", label: "Recommendations", icon: Wand2, adminOnly: false },
  { to: "/insights", label: "Insights", icon: BarChart3, adminOnly: false },
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

// Shared with AppLayout, which owns the collapsed state so it can resize the
// main content column to match.
export const SIDEBAR_COLLAPSED_KEY = "library-sidebar-collapsed";

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const onAskPage = location.pathname === "/ask";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r bg-card transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <Library className="size-5 shrink-0" />
            <span className="truncate font-semibold tracking-tight">Library</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map(({ to, label, icon: Icon }) => (
            <div key={to} className="flex flex-col gap-1">
              <NavLink
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>

              {to === "/ask" && onAskPage && !collapsed && <AskChatList />}
            </div>
          ))}
      </nav>

      <div className="border-t p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={logout} title="Log out">
              <LogOut className="size-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ModeToggle />
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}

// Past a point, an always-growing inline list would make the sidebar itself
// grow without bound. Show only the most recent ones inline; the rest are
// reachable through the "View all chats" popover below.
const SIDEBAR_VISIBLE_LIMIT = 15;

// The Ask AI chat list, nested inline under its nav item — only rendered
// while on /ask (and while the sidebar isn't collapsed to an icon rail).
function AskChatList() {
  const { conversations, conversationsLoading, activeId, busy, startNewChat, openConversation, requestDelete } =
    useAskChat();
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const visible = conversations.slice(0, SIDEBAR_VISIBLE_LIMIT);
  const hasMore = conversations.length > SIDEBAR_VISIBLE_LIMIT;

  const openFromList = (id: string) => {
    void openConversation(id);
    setViewAllOpen(false);
  };

  return (
    <div className="ml-3.5 flex flex-col gap-0.5 border-l py-1 pl-2.5">
      <button
        type="button"
        onClick={startNewChat}
        disabled={busy}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageSquarePlus className="size-3.5 shrink-0" />
        New chat
      </button>

      {conversationsLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-2 py-2 text-xs text-muted-foreground">No past chats yet.</p>
      ) : (
        <>
          {visible.map((c) => (
            <ChatRow
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              busy={busy}
              onOpen={() => void openConversation(c.id)}
              onDelete={() => requestDelete(c.id)}
            />
          ))}

          {hasMore && (
            <Popover open={viewAllOpen} onOpenChange={setViewAllOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  <ChevronDown className="size-3.5 shrink-0" />
                  View all chats ({conversations.length})
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="max-h-96 overflow-y-auto">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  All chats ({conversations.length})
                </p>
                <div className="flex flex-col gap-0.5">
                  {conversations.map((c) => (
                    <ChatRow
                      key={c.id}
                      conversation={c}
                      active={c.id === activeId}
                      busy={busy}
                      onOpen={() => openFromList(c.id)}
                      onDelete={() => requestDelete(c.id)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
    </div>
  );
}

function ChatRow({
  conversation,
  active,
  busy,
  onOpen,
  onDelete,
}: {
  conversation: ConversationSummary;
  active: boolean;
  busy: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 pl-2 text-xs",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={busy}
        className="min-w-0 flex-1 truncate py-1.5 text-left disabled:cursor-not-allowed"
        title={conversation.title}
      >
        {conversation.title}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="size-3" />
        <span className="sr-only">Delete chat</span>
      </Button>
    </div>
  );
}
