import { cn } from "~/lib/utils";
import { type ReactNode } from "react";

interface StoryboardGridProps {
  children: ReactNode;
  className?: string;
}

export function StoryboardGrid({ children, className }: StoryboardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}
