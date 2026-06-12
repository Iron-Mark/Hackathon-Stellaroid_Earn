"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 15_000;

/**
 * Re-renders the server-derived payout checklist while a payment is still
 * pending. State lives on-chain; this only asks the server to look again.
 */
export function PaymentPoller({ done }: { done: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [done, router]);

  return null;
}
