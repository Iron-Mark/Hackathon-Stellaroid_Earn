"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Select } from "@/components/ui/select";
import { SITE_AUTHOR_LINKEDIN, SITE_CONTACT_EMAIL } from "@/lib/seo";

const ROLES = [
  { value: "issuer", label: "Issuer (bootcamp / training provider)" },
  { value: "employer", label: "Employer / recruiter" },
  { value: "other", label: "Something else" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

function FallbackLinks() {
  return (
    <p className="m-0 text-sm text-text-muted">
      Reach us directly instead:{" "}
      <a
        href={`mailto:${SITE_CONTACT_EMAIL}`}
        className="font-semibold text-primary underline [text-underline-offset:2px]"
      >
        {SITE_CONTACT_EMAIL}
      </a>{" "}
      or{" "}
      <a
        href={SITE_AUTHOR_LINKEDIN}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-primary underline [text-underline-offset:2px]"
      >
        LinkedIn
      </a>
      .
    </p>
  );
}

export function PilotLeadForm({ defaultRole = "issuer" }: { defaultRole?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false });
  const [state, setState] = useState<SubmitState>({ phase: "idle" });

  const nameError =
    touched.name && !name.trim() ? "Your name is required." : undefined;
  const emailError =
    touched.email && !EMAIL_RE.test(email.trim())
      ? "Enter a valid email address."
      : undefined;

  const canSubmit =
    state.phase !== "submitting" &&
    !!name.trim() &&
    EMAIL_RE.test(email.trim()) &&
    message.length <= 2000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (!canSubmit) return;

    setState({ phase: "submitting" });
    try {
      const response = await fetch("/api/pilot-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          org: org.trim(),
          message: message.trim(),
          website: honeypot,
        }),
      });

      if (response.ok) {
        setState({ phase: "success" });
        return;
      }

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const minutes = Number.isFinite(retryAfter)
          ? Math.max(1, Math.ceil(retryAfter / 60))
          : 10;
        setState({
          phase: "error",
          message: `Too many requests from this connection — try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or email us directly.`,
        });
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setState({
        phase: "error",
        message:
          response.status === 422 && payload?.error
            ? payload.error
            : "The request form is unavailable right now.",
      });
    } catch {
      setState({
        phase: "error",
        message: "Network error — your request was not sent.",
      });
    }
  }

  if (state.phase === "success") {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-success/40 bg-success/10 p-6"
        role="status"
      >
        <h3 className="m-0 text-lg font-semibold text-text">
          Request received — thank you!
        </h3>
        <p className="m-0 text-sm leading-relaxed text-text-muted">
          Expect a reply within a few days. If it&rsquo;s urgent, message us on{" "}
          <a
            href={SITE_AUTHOR_LINKEDIN}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary underline [text-underline-offset:2px]"
          >
            LinkedIn
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((v) => ({ ...v, name: true }))}
          error={nameError}
          placeholder="Maria Santos"
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((v) => ({ ...v, email: true }))}
          error={emailError}
          placeholder="you@school.edu.ph"
          autoComplete="email"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pilot-role"
            className="text-[13px] font-medium text-text-muted"
          >
            I&rsquo;m interested as
          </label>
          <Select id="pilot-role" value={role} onChange={setRole} options={ROLES} />
        </div>
        <Input
          label="Organization (optional)"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          placeholder="Stellaroid Academy"
          autoComplete="organization"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="pilot-message"
          className="text-[13px] font-medium text-text-muted"
        >
          What would you like to pilot? (optional)
        </label>
        <textarea
          id="pilot-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="e.g. We run two cohorts a year, ~30 graduates each, and want verifiable completion certificates."
          className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
        />
      </div>

      {/* Honeypot — hidden from real users, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="pilot-website">Website</label>
        <input
          id="pilot-website"
          name="website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.phase === "error" ? (
        <div
          className="flex flex-col gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3"
          role="alert"
        >
          <p className="m-0 text-sm font-medium text-text">{state.message}</p>
          <FallbackLinks />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          variant="primary"
          loading={state.phase === "submitting"}
          disabled={!canSubmit}
        >
          Request a pilot
        </Button>
        <p className="m-0 text-xs text-text-muted">
          Used only to reply to your request — see our{" "}
          <a
            href="/privacy"
            className="underline [text-underline-offset:2px] hover:text-text"
          >
            privacy note
          </a>
          .
        </p>
      </div>

      <noscript>
        <p className="m-0 text-sm text-text-muted">
          JavaScript is off, so this form won&rsquo;t submit. Email{" "}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a> or
          message{" "}
          <a href={SITE_AUTHOR_LINKEDIN} target="_blank" rel="noreferrer">
            LinkedIn
          </a>{" "}
          instead.
        </p>
      </noscript>
    </form>
  );
}

export default PilotLeadForm;
