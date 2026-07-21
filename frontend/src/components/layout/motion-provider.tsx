"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Applies the viewer's OS "reduce motion" preference to every Framer Motion
 * animation (transforms, infinite loops like the hero orbs and glowPulse). The
 * CSS `prefers-reduced-motion` block in globals.css cannot reach JS-driven
 * Motion transforms, so this covers that gap. Children stay server-rendered
 * under this client boundary.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
