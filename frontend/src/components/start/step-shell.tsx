"use client";
import { useEffect, useRef } from "react";

export function StepShell({
  stepIndex,
  total,
  title,
  children,
}: {
  stepIndex: number;
  total: number;
  title: string;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6">
      <p className="font-pixel text-[10px] uppercase tracking-[0.16em] text-text-muted">
        Step {stepIndex} of {total}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-2xl font-semibold text-text outline-none"
      >
        {title}
      </h1>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}
