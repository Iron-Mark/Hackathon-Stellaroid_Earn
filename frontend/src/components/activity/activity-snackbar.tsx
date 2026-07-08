"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivitySnackbarProps {
  children: ReactNode;
  autoHideMs?: number;
  revealDelayMs?: number;
  scrollOffsetPx?: number;
}

const SPINNER_SIZE = 26;
const SPINNER_STROKE = 2;
const SPINNER_R = (SPINNER_SIZE - SPINNER_STROKE) / 2;
const SPINNER_C = 2 * Math.PI * SPINNER_R;

export function ActivitySnackbar({
  children,
  autoHideMs = 5200,
  revealDelayMs = 700,
  scrollOffsetPx = 320,
}: ActivitySnackbarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const revealTimerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (dismissed || hasShown) return;

    function clearRevealTimer() {
      if (revealTimerRef.current != null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }

    function handleScroll() {
      if (window.scrollY < scrollOffsetPx) {
        clearRevealTimer();
        return;
      }
      if (revealTimerRef.current == null) {
        revealTimerRef.current = window.setTimeout(() => {
          setVisible(true);
          setHasShown(true);
          revealTimerRef.current = null;
        }, revealDelayMs);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearRevealTimer();
    };
  }, [dismissed, hasShown, revealDelayMs, scrollOffsetPx]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Countdown with rAF — pauses on hover
  useEffect(() => {
    if (!visible || dismissed) return;

    startRef.current = performance.now();

    function tick() {
      const now = performance.now();
      const total = elapsedRef.current + (now - startRef.current);
      const pct = Math.min(total / autoHideMs, 1);
      setProgress(pct);
      if (pct >= 1) {
        dismiss();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (!hovered) {
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, dismissed, hovered, autoHideMs, dismiss]);

  // Pause: save elapsed time when hovering
  useEffect(() => {
    if (hovered && visible && !dismissed) {
      elapsedRef.current += performance.now() - startRef.current;
    }
  }, [hovered, visible, dismissed]);

  if (dismissed) return null;

  const dashOffset = SPINNER_C * (1 - progress);

  return (
    <div
      className={cn(
        "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-6 max-lg:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 w-80 max-sm:right-3 max-sm:left-3 max-sm:w-auto",
        "rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md shadow-glow-accent",
        "overflow-hidden",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-hidden={visible ? "false" : "true"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="absolute top-3 right-3 z-10 flex items-center justify-center w-6 h-6 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
        aria-label="Dismiss live activity"
        onClick={dismiss}
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {children}
      {/* Countdown spinner — bottom right */}
      <div className="absolute bottom-3 right-3 flex items-center justify-center" aria-hidden="true">
        <svg
          width={SPINNER_SIZE}
          height={SPINNER_SIZE}
          className={cn("transition-opacity duration-200", hovered ? "opacity-30" : "opacity-60")}
        >
          {/* Track */}
          <circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_R}
            fill="none"
            stroke="currentColor"
            strokeWidth={SPINNER_STROKE}
            className="text-border"
          />
          {/* Progress arc */}
          <circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_R}
            fill="none"
            stroke="currentColor"
            strokeWidth={SPINNER_STROKE}
            strokeLinecap="round"
            strokeDasharray={SPINNER_C}
            strokeDashoffset={dashOffset}
            className="text-primary"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
          {/* Seconds remaining */}
          <text
            x={SPINNER_SIZE / 2}
            y={SPINNER_SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-text-muted"
            style={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}
            fill="currentColor"
          >
            {Math.ceil((1 - progress) * autoHideMs / 1000)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default ActivitySnackbar;
