// Validation for the /api/pilot-lead intake. Pure module (no imports) so the
// API route and unit tests share the exact same rules.

export const PILOT_LEAD_ROLES = ["issuer", "employer", "other"] as const;
export type PilotLeadRole = (typeof PILOT_LEAD_ROLES)[number];

export type PilotLead = {
  name: string;
  email: string;
  role: PilotLeadRole;
  org: string;
  message: string;
};

export type PilotLeadValidation =
  | { ok: true; lead: PilotLead; honeypot: false }
  | { ok: true; lead: null; honeypot: true }
  | { ok: false; status: 400 | 422; error: string };

export const MAX_PILOT_LEAD_BODY_BYTES = 8_192;

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_ORG = 120;
const MAX_MESSAGE = 2_000;

// Deliberately permissive: the goal is catching typos and junk, not RFC 5322.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Strip CR/LF so user text can never inject headers or extra lines into the
// notification email's subject.
function sanitizeLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function fieldString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validatePilotLead(body: unknown): PilotLeadValidation {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }

  const record = body as Record<string, unknown>;

  // Honeypot: real users never see this field; bots that fill it get a
  // success response and a silent drop.
  if (fieldString(record.website).trim()) {
    return { ok: true, lead: null, honeypot: true };
  }

  const name = sanitizeLine(fieldString(record.name));
  const email = sanitizeLine(fieldString(record.email));
  const roleRaw = fieldString(record.role).trim().toLowerCase();
  const org = sanitizeLine(fieldString(record.org));
  const message = fieldString(record.message).trim();

  if (!name) {
    return { ok: false, status: 422, error: "Name is required." };
  }
  if (name.length > MAX_NAME) {
    return { ok: false, status: 422, error: `Name must be at most ${MAX_NAME} characters.` };
  }
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { ok: false, status: 422, error: "Enter a valid email address." };
  }
  if (!(PILOT_LEAD_ROLES as readonly string[]).includes(roleRaw)) {
    return { ok: false, status: 422, error: "Pick a role: issuer, employer, or other." };
  }
  if (org.length > MAX_ORG) {
    return { ok: false, status: 422, error: `Organization must be at most ${MAX_ORG} characters.` };
  }
  if (message.length > MAX_MESSAGE) {
    return {
      ok: false,
      status: 422,
      error: `Message must be at most ${MAX_MESSAGE} characters.`,
    };
  }

  return {
    ok: true,
    honeypot: false,
    lead: { name, email, role: roleRaw as PilotLeadRole, org, message },
  };
}

export function formatPilotLeadEmail(lead: PilotLead): {
  subject: string;
  text: string;
} {
  return {
    subject: `[Stellaroid pilot] ${lead.role} — ${lead.name}`,
    text: [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `Role: ${lead.role}`,
      `Organization: ${lead.org || "(not provided)"}`,
      "",
      "Message:",
      lead.message || "(none)",
    ].join("\n"),
  };
}
