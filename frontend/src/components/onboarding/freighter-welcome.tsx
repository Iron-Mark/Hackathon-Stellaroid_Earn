"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const STORAGE_KEY = "stellaroid:freighter-welcome-dismissed";

export function FreighterWelcome() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-[8px] z-[9000] flex items-center justify-center p-4 overflow-y-auto [animation:modalFade_180ms_ease-out] motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="freighter-welcome-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="max-w-[480px] w-full max-h-[calc(100dvh-32px)] overflow-y-auto bg-surface border border-border rounded-[20px] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)] [animation:modalRise_220ms_ease-out] motion-reduce:animate-none max-sm:p-5 max-sm:rounded-2xl">
        <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-accent mb-2">
          New to Stellar?
        </p>
        <h2
          id="freighter-welcome-title"
          className="mb-4 text-[22px] font-bold text-text tracking-[-0.01em] max-sm:text-[19px]"
        >
          You&rsquo;ll need a wallet to sign. Here&rsquo;s the 90-second version.
        </h2>
        <p className="mb-5 text-text-muted text-[15px] leading-[1.55] max-sm:text-[14px]">
          Stellaroid Earn runs on Stellar testnet. Every action is signed by your
          own wallet, no email, no password, no KYC.
        </p>

        <ul className="mb-6 p-0 list-none flex flex-col gap-3.5">
          <li className="flex gap-3 items-start">
            <img src="/illust/illust-step-install.svg" alt="" className="shrink-0 w-[26px] h-[26px]" aria-hidden="true" style={{ imageRendering: "pixelated" }} />
            <span className="text-[14px] leading-normal text-text [&_strong]:text-text [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:[text-underline-offset:2px]">
              Install{" "}
              <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
                Freighter
              </a>{" "}
              , the Stellar wallet browser extension. <strong>Switch it to
              testnet</strong> after install.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <img src="/illust/illust-step-fund.svg" alt="" className="shrink-0 w-[26px] h-[26px]" aria-hidden="true" style={{ imageRendering: "pixelated" }} />
            <span className="text-[14px] leading-normal text-text [&_strong]:text-text [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:[text-underline-offset:2px]">
              Fund your testnet account with free XLM via{" "}
              <a href="https://friendbot.stellar.org/" target="_blank" rel="noreferrer">
                friendbot
              </a>{" "}
              , no signup.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <img src="/illust/illust-step-connect.svg" alt="" className="shrink-0 w-[26px] h-[26px]" aria-hidden="true" style={{ imageRendering: "pixelated" }} />
            <span className="text-[14px] leading-normal text-text [&_strong]:text-text [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:[text-underline-offset:2px]">
              Click <strong>Connect wallet</strong> above. Sign register / verify / pay
              with one tap each. Every transaction costs a fraction of a cent and
              settles in ~5 seconds.
            </span>
          </li>
        </ul>

        <div className="flex gap-3 justify-end flex-wrap max-sm:justify-stretch max-sm:[&>*]:flex-1 max-sm:[&>*]:min-w-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open("https://www.freighter.app/", "_blank", "noopener,noreferrer");
            }}
          >
            Get Freighter
          </Button>
          <Button variant="primary" size="sm" onClick={dismiss}>
            Let&rsquo;s go
          </Button>
        </div>

        <p className="mt-4 mb-0 text-center text-[13px] text-text-muted">
          Just exploring?{" "}
          <a
            href="/demo"
            className="font-semibold text-primary underline [text-underline-offset:2px]"
          >
            Take the guided demo
          </a>{" "}
          — no wallet needed.
        </p>
      </div>
    </div>
  );
}

export default FreighterWelcome;
