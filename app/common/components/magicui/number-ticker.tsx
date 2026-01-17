"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

import { cn } from "~/lib/utils";

// Fallback if framer-motion is not available: simple number display
// But since I'm implementing it as "NumberTicker", I'll try to use a simple JS implementation if framer-motion is missing
// Wait, I can't import framer-motion if it's not installed.
// I will rewrite this to use native requestAnimationFrame.

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
}: {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number; // delay in seconds
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startTimestamp: number | null = null;
    const duration = 2000; // 2 seconds
    const startValue = direction === "down" ? value : 0;
    const endValue = direction === "down" ? 0 : value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // East Out Quart easing
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

      // Format number (e.g. 1000 -> 1,000)
      element.textContent = Intl.NumberFormat("en-US").format(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = Intl.NumberFormat("en-US").format(endValue);
      }
    };

    const timeoutId = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeoutId);
  }, [value, direction, delay]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-black dark:text-white tracking-wider",
        className,
      )}
      ref={ref}
    >
      0
    </span>
  );
}
