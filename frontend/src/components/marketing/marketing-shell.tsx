import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

/** Standard shell for content/marketing pages: nav + centered main + footer. */
export function MarketingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-dvh">
      <SiteNav />
      <main
        id="main"
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 py-16 max-sm:gap-10 max-sm:py-10",
          className,
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
