import { Outlet } from "react-router";
import { Separator } from "~/common/components/ui/separator";
import { StudioSidebar } from "../components/studio-sidebar";

export default function StudioLayout() {
  return (
    <div className="container mx-auto space-y-6 pt-10 pb-16 px-4 md:px-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Creator Studio</h2>
        <p className="text-muted-foreground">
          Manage your video production pipeline from script to export.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 items-start">
        <aside className="lg:w-1/5 sticky top-24 self-start">
          <StudioSidebar />
        </aside>
        <div className="flex-1 lg:max-w-4xl w-full">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 min-h-[500px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
