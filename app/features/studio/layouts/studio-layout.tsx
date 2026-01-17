"use client";

import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { cn } from "~/lib/utils";
import { StudioSidebar } from "../components/studio-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "~/common/components/ui/sheet";
import { Button } from "~/common/components/ui/button";
import { Menu } from "lucide-react";
import { useMediaQuery } from "~/hooks/use-media-query";

export default function StudioLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Responsive check: XL screen = expanded sidebar by default
  // Tablet and Small Desktop (up to 1280px) = collapsed
  const isXlScreen = useMediaQuery("(min-width: 1280px)");

  // Auto-collapse logic
  useEffect(() => {
    setIsCollapsed(!isXlScreen);
  }, [isXlScreen]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col lg:flex-row">
      {/* Search/Mobile Header for Sidebar (optional, but good for UX) */}
      <div className="lg:hidden border-b bg-background p-4 flex items-center gap-4 sticky top-16 z-20">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            {/* Reusing StudioSidebar inside Sheet. 
                 Note: We might need to handle closing on navigation. 
                 StudioSidebar likely just contains links. 
                 If we click a link, the url changes. 
                 Ideally we wrap it or pass a callback if supported. 
                 For now, just render it. */}
            <StudioSidebar
              isCollapsed={false}
              toggleSidebar={() => { }}
              className="border-none w-full"
            />
          </SheetContent>
        </Sheet>
        <div className="font-semibold">Studio Menu</div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "border-r bg-background transition-all duration-300 ease-in-out sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block z-40",
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
        "flex-1 transition-all duration-300 ease-in-out min-w-0",
        "p-4 lg:p-6"
      )}>
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
