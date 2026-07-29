import {
  BarChart3,
  BookMarked,
  Library,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
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
            <NavLink
              key={to}
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
