import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
