import assert from "node:assert/strict";
import test from "node:test";
import { formatPilotLeadEmail, validatePilotLead } from "./pilot-lead.ts";

const validBody = {
  name: "Maria Santos",
  email: "maria@example.org",
  role: "issuer",
  org: "Stellaroid Academy",
  message: "We issue ~30 certificates per cohort.",
  website: "",
};

test("accepts a valid lead and normalizes whitespace", () => {
  const result = validatePilotLead({
    ...validBody,
    name: "  Maria Santos ",
    role: " Issuer ",
  });
  assert.equal(result.ok, true);
  if (result.ok && !result.honeypot) {
    assert.equal(result.lead.name, "Maria Santos");
    assert.equal(result.lead.role, "issuer");
  } else {
    assert.fail("expected a validated lead");
  }
});

test("rejects non-object bodies with 400", () => {
  for (const body of [null, "hi", 42, ["a"]]) {
    const result = validatePilotLead(body);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 400);
  }
});

test("requires name, valid email, and a known role", () => {
  for (const body of [
    { ...validBody, name: "" },
    { ...validBody, email: "not-an-email" },
    { ...validBody, email: "a@b" },
    { ...validBody, role: "investor" },
  ]) {
    const result = validatePilotLead(body);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 422);
  }
});

test("enforces length caps", () => {
  for (const body of [
    { ...validBody, name: "x".repeat(101) },
    { ...validBody, org: "x".repeat(121) },
    { ...validBody, message: "x".repeat(2001) },
  ]) {
    const result = validatePilotLead(body);
    assert.equal(result.ok, false);
  }
});

test("filled honeypot short-circuits as a silent success", () => {
  const result = validatePilotLead({ ...validBody, website: "https://spam.example" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.honeypot, true);
    assert.equal(result.lead, null);
  }
});

test("email formatting strips CR/LF injection attempts from headers", () => {
  const result = validatePilotLead({
    ...validBody,
    name: "Maria\r\nBcc: attacker@example.org",
  });
  assert.equal(result.ok, true);
  if (result.ok && !result.honeypot) {
    const { subject, text } = formatPilotLeadEmail(result.lead);
    assert.ok(!subject.includes("\n"));
    assert.ok(!subject.includes("\r"));
    assert.ok(subject.includes("Maria Bcc: attacker@example.org"));
    assert.ok(text.includes("Role: issuer"));
  }
});
