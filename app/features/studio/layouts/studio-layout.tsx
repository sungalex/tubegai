import { useState } from "react";
import { Outlet } from "react-router";
import { cn } from "~/lib/utils";
import { StudioSidebar } from "../components/studio-sidebar";

export default function StudioLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r bg-background transition-all duration-300 ease-in-out sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden md:block",
          isCollapsed ? "w-[50px]" : "w-48"
        )}
      >
        <StudioSidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        // The container class usually adds padding/max-width. 
        // User wants full width usage when collapsed, but usually some padding is nice.
        // We'll give it reasonable padding but allow it to grow.
        "p-6"
      )}>
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
