import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Cta } from "@/lib/content/types";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold no-underline transition-[transform,background,box-shadow,border-color] duration-150 motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2";

const VARIANTS = {
  primary:
    "bg-primary text-on-primary border border-primary shadow-[0_4px_14px_rgba(245,158,11,0.15)] hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(245,158,11,0.25)]",
  secondary:
    "text-text border border-border bg-transparent hover:bg-surface hover:-translate-y-px",
};

export function CtaButton({
  cta,
  variant = "primary",
  className,
}: {
  cta: Cta;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const cls = cn(BASE, VARIANTS[variant], className);
  if (/^https?:\/\//.test(cta.href)) {
    return (
      <a href={cta.href} target="_blank" rel="noreferrer" className={cls}>
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href} prefetch={false} className={cls}>
      {cta.label}
    </Link>
  );
}
