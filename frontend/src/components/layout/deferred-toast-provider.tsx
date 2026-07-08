"use client";

import { useEffect, useState } from "react";

type ToasterComponent = typeof import("sonner").Toaster;

const toastClassNames = {
  toast:
    "!bg-surface-glass !border-border-glass !backdrop-blur-md !rounded-xl !shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]",
  title: "!text-text !font-semibold !text-[13px]",
  description: "!text-text-muted !text-[12px] !leading-relaxed",
  actionButton: "!bg-primary !text-bg !text-[12px] !font-semibold !rounded-md hover:!bg-primary-hover",
  closeButton: "!bg-surface-2 !border-border !text-text-muted hover:!text-text",
};

/* Clear the fixed mobile bottom nav (64px) plus breathing room */
const BOTTOM_NAV_CLEARANCE = "calc(env(safe-area-inset-bottom) + 5.5rem)";

export function DeferredToastProvider() {
  const [Toaster, setToaster] = useState<ToasterComponent | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let mounted = true;

    void import("sonner").then((module) => {
      if (mounted) {
        setToaster(() => module.Toaster);
      }
    });

    // rem-based to stay in sync with the bottom nav's lg:hidden (lg = 64rem);
    // resize listener doubles as a fallback where matchMedia change is flaky
    const mq = window.matchMedia("(width < 64rem)");
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange, { passive: true });

    return () => {
      mounted = false;
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  if (!Toaster) return null;

  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      offset={compact ? { bottom: BOTTOM_NAV_CLEARANCE } : undefined}
      mobileOffset={{ bottom: BOTTOM_NAV_CLEARANCE }}
      toastOptions={{
        classNames: toastClassNames,
      }}
    />
  );
}
