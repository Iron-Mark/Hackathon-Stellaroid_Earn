// frontend/src/components/actions/next-action-card.tsx
"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { i18n } from "@/lib/i18n";
import type { CertificateStatus } from "@/lib/types";

export type Role = "issuer" | "employer";

export interface Milestones {
  registered: boolean;
  verified: boolean;
  paid: boolean;
  credentialStatus?: CertificateStatus;
  lastHash?: string;
  lastStudent?: string;
}

export interface NextActionCardProps {
  role: Role;
  setRole: (r: Role) => void;
  milestones: Milestones;
  walletConnected: boolean;
}

function IssuerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <circle cx="12" cy="15" r="2" />
      <path d="M12 13v-1M9 15h-1M15 15h1" opacity="0.4" />
    </svg>
  );
}

function EmployerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M2 13h20" opacity="0.5" />
      <path d="M11 13h2" />
    </svg>
  );
}

function getContent(
  role: Role,
  milestones: Milestones,
  walletConnected: boolean,
  t: typeof i18n.en.app,
): { title: string; subtitle: string } {
  if (!walletConnected) {
    return { title: t.connectTitle, subtitle: t.connectSubtitle };
  }
  if (role === "issuer") {
    if (!milestones.registered) {
      return {
        title: t.issuerRegisterTitle,
        subtitle: t.issuerRegisterSubtitle,
      };
    }
    if (milestones.credentialStatus !== "verified") {
      return { title: t.verifyTitle, subtitle: t.verifySubtitle };
    }
    return { title: t.issuerDoneTitle, subtitle: t.issuerDoneSubtitle };
  }
  if (milestones.credentialStatus !== "verified") {
    return { title: t.employerWaitTitle, subtitle: t.employerWaitSubtitle };
  }
  if (!milestones.paid) {
    return { title: t.payTitle, subtitle: t.paySubtitle };
  }
  return { title: t.doneTitle, subtitle: t.doneSubtitle };
}

export function NextActionCard({
  role,
  setRole,
  milestones,
  walletConnected,
}: NextActionCardProps) {
  const locale = useLocale();
  const t = i18n[locale].app;
  const { title, subtitle } = getContent(role, milestones, walletConnected, t);
  const indicatorPosition = role === "issuer" ? "0%" : "100%";

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-border">
        <div
          className="relative grid grid-cols-2"
          role="radiogroup"
          aria-label="Select persona"
          data-active={role}
        >
          {/* Sliding underline indicator */}
          <span
            className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-primary rounded-t shadow-[0_0_10px_rgba(245,158,11,0.45)] transition-transform duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] z-1 pointer-events-none motion-reduce:transition-none"
            style={{ transform: `translateX(${indicatorPosition})` }}
            aria-hidden="true"
          />
          <button
            type="button"
            className={cn(
              "relative inline-flex items-center gap-2.5 px-5 py-3.5 min-h-13",
              "bg-transparent border-none cursor-pointer font-[inherit] text-left",
              "transition-[color,background] duration-160 ease-[ease] motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2",
              "[&_svg]:opacity-65 [&_svg]:shrink-0 [&_svg]:transition-opacity [&_svg]:duration-160",
              role === "issuer"
                ? "text-primary [&_svg]:opacity-100"
                : "text-text-muted hover:text-text hover:bg-white/3",
            )}
            onClick={() => setRole("issuer")}
            role="radio"
            aria-checked={role === "issuer"}
          >
            <IssuerIcon />
            <span className="flex flex-col leading-normal min-w-0">
              <span className="text-sm font-semibold tracking-[-0.01em]">
                {t.issuerLabel}
              </span>
              <span className="text-[11px] font-normal opacity-[0.72] mt-0.5 max-[420px]:hidden">
                {t.issuerDesc}
              </span>
            </span>
          </button>
          <button
            type="button"
            className={cn(
              "relative inline-flex items-center gap-2.5 px-5 py-3.5 min-h-13",
              "bg-transparent border-none cursor-pointer font-[inherit] text-left",
              "transition-[color,background] duration-160 ease-[ease] motion-reduce:transition-none",
              "focus-visible:outline focus-visible:outline-primary focus-visible:-outline-offset-2",
              "[&_svg]:opacity-65 [&_svg]:shrink-0 [&_svg]:transition-opacity [&_svg]:duration-160",
              role === "employer"
                ? "text-primary [&_svg]:opacity-100"
                : "text-text-muted hover:text-text hover:bg-white/3",
            )}
            onClick={() => setRole("employer")}
            role="radio"
            aria-checked={role === "employer"}
          >
            <EmployerIcon />
            <span className="flex flex-col leading-normal min-w-0">
              <span className="text-sm font-semibold tracking-[-0.01em]">
                {t.employerLabel}
              </span>
              <span className="text-[11px] font-normal opacity-[0.72] mt-0.5 max-[420px]:hidden">
                {t.employerDesc}
              </span>
            </span>
          </button>
        </div>
      </div>
      {/* Role chooser guidance — visible only in the fresh state. Shows what
          BOTH roles do, not just the selected one, so a freshly-connected user
          can tell which to pick (pilot feedback: "not clear which role to
          pick after connecting wallet"). */}
      {walletConnected && !milestones.registered && !milestones.paid && (
        <div className="flex flex-col gap-1.5 px-4 py-2.5 m-0 border-t border-border/50 text-xs text-text-muted">
          <p className="m-0">
            <span className="font-semibold text-text">{t.issuerLabel}</span>:{" "}
            {t.roleHintIssuer}
          </p>
          <p className="m-0">
            <span className="font-semibold text-text">{t.employerLabel}</span>:{" "}
            {t.roleHintEmployer}
          </p>
        </div>
      )}
      {/* Body */}
      <div className="flex items-center gap-3 p-4 max-[420px]:px-4 max-[420px]:pt-4 max-[420px]:pb-5">
        {!walletConnected && (
          <img
            src="/illust/illust-wallet-setup.svg"
            alt=""
            className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
            aria-hidden="true"
          />
        )}
        {role === "issuer" && !milestones.registered && walletConnected && (
          <img
            src="/illust/illust-register.svg"
            alt=""
            className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
            aria-hidden="true"
          />
        )}
        {role === "issuer" &&
          walletConnected &&
          milestones.registered &&
          milestones.credentialStatus !== "verified" && (
            <img
              src="/illust/illust-verify.svg"
              alt=""
              className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
              aria-hidden="true"
            />
          )}
        {role === "issuer" &&
          walletConnected &&
          milestones.registered &&
          milestones.credentialStatus === "verified" && (
            <img
              src="/illust/illust-approved.svg"
              alt=""
              className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
              aria-hidden="true"
            />
          )}
        {role === "employer" &&
          walletConnected &&
          milestones.credentialStatus !== "verified" && (
            <img
              src="/illust/illust-employer-wait.svg"
              alt=""
              className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
              aria-hidden="true"
            />
          )}
        {role === "employer" &&
          walletConnected &&
          milestones.credentialStatus === "verified" &&
          !milestones.paid && (
            <img
              src="/illust/illust-pay.svg"
              alt=""
              className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
              aria-hidden="true"
            />
          )}
        {role === "employer" &&
          walletConnected &&
          milestones.credentialStatus === "verified" &&
          milestones.paid && (
            <img
              src="/illust/illust-approved.svg"
              alt=""
              className="w-12 h-auto shrink-0 opacity-90 lg:h-13 lg:w-auto"
              aria-hidden="true"
            />
          )}
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-xl font-semibold text-text m-0 leading-[1.3]">
            {title}
          </p>
          <p className="text-sm text-text-muted m-0 leading-normal">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NextActionCard;
