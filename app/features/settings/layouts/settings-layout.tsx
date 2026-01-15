import { Outlet } from "react-router";
import { User, CreditCard, Sun, Bell, Plug } from "lucide-react";
import { Separator } from "~/common/components/ui/separator";
import { SettingsSidebar } from "../components/settings-sidebar";

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
  return (
    <div className="container mx-auto hidden space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 items-start">
        <aside className="lg:w-1/5 sticky top-24">
          <SettingsSidebar items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
