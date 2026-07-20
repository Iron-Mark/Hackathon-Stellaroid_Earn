"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production. Kept out of dev and e2e (both run
 * `next dev`) so caching never masks fresh code while developing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      // The ?v= build stamp changes per deploy, forcing a re-install that
      // refreshes the precache and drops the previous deploy's caches.
      const version = process.env.NEXT_PUBLIC_SW_BUILD ?? "dev";
      navigator.serviceWorker.register(`/sw.js?v=${version}`).catch(() => {
        // Registration failing (private mode, unsupported) never breaks the app.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
