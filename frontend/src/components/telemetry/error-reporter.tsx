"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/error-report";

/**
 * Global listeners for errors that never reach a React error boundary
 * (event handlers, async wallet/RPC failures, unhandled rejections).
 * Renders nothing.
 */
export function ErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError({ error: event.error ?? event.message, source: "window-error" });
    }
    function onRejection(event: PromiseRejectionEvent) {
      reportClientError({ error: event.reason, source: "unhandled-rejection" });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

export default ErrorReporter;
