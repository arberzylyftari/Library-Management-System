import { BookMarked, Library, LogOut, Shield, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/books", label: "My Books", icon: BookMarked, adminOnly: false },
  { to: "/ask", label: "Ask AI", icon: Sparkles, adminOnly: false },
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Library className="size-5" />
        <span className="font-semibold tracking-tight">Library</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t p-3">
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
      </div>
    </aside>
  );
}
