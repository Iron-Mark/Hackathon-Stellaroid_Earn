"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 max-lg:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-[max(1.5rem,env(safe-area-inset-right))] z-30 w-10 h-10 rounded-full",
        "bg-surface-2 border border-border text-text-muted",
        "shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]",
        "hover:text-primary hover:border-primary/40 hover:shadow-[0_4px_20px_rgba(245,158,11,0.2)]",
        "transition-all duration-200 cursor-pointer",
        "flex items-center justify-center",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4.5 h-4.5"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
