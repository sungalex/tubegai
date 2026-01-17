"use client";

import { useState } from "react";
import { Outlet } from "react-router";
import { User, CreditCard, Sun, Bell, Plug, Menu } from "lucide-react";
import { Separator } from "~/common/components/ui/separator";
import { SettingsSidebar } from "../components/settings-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "~/common/components/ui/sheet";
import { Button } from "~/common/components/ui/button";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: CreditCard,
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Sun,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Integrations",
    href: "/settings/integrations",
    icon: Plug,
  },
];

export default function SettingsLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 md:p-10 md:pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden mb-6">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Menu className="mr-2 h-4 w-4" />
              Settings Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <div className="px-1 py-6">
              <h3 className="font-semibold text-lg mb-4 px-4">Settings</h3>
              <SettingsSidebar
                items={sidebarNavItems}
                className="flex-col space-x-0 space-y-1"
                onClick={() => setIsMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-1/5 sticky top-24">
          <SettingsSidebar items={sidebarNavItems} />
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:max-w-2xl w-full min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
