import assert from "node:assert/strict";
import test from "node:test";
import { askAiLinks, askAiPrompt, ASK_AI_LABEL } from "./ask-ai.ts";
import { seoCanonicalUrl } from "./seo.ts";

const PROVIDER_ORIGINS = [
  "https://chatgpt.com/",
  "https://claude.ai/new",
  "https://gemini.google.com/app",
  "https://www.perplexity.ai/search",
  "https://grok.com/",
];

test("ask ai row is present on docs and about", () => {
  const cases = [
    {
      path: "/docs?utm=newsletter#install",
      title: "Developer documentation & quickstart | Stellaroid Earn",
      canonicalPath: "/docs",
    },
    {
      path: "/about",
      title: "About | Stellaroid Earn",
      canonicalPath: "/about",
    },
    {
      path: "/guides",
      title: "Stellar Credential Verification Guides | Stellaroid Earn",
      canonicalPath: "/guides",
    },
    {
      path: "/glossary",
      title: "Verifiable Credentials Glossary | Stellaroid Earn",
      canonicalPath: "/glossary",
    },
  ] as const;

  for (const { path, title, canonicalPath } of cases) {
    const row = askAiLinks(path, title);
    const canonical = seoCanonicalUrl(canonicalPath);
    const prompt = `As a bootcamp lead or employer, I want to understand how Stellaroid Earn can help me show that a training certificate is real and check that credential on a public page. I want to see how a bootcamp can stand behind a certificate and how an employer can look it up before trusting it. Summarize the highlights from "${title}": ${canonical} Don't ask me for a wallet or private keys.`;

    assert.ok(row);
    assert.equal(row.label, ASK_AI_LABEL);
    assert.equal(row.links.length, 5);
    assert.equal(askAiPrompt(title, path), prompt);
    assert.equal(prompt.includes("#"), false);
    assert.equal(prompt.includes("utm"), false);
    assert.equal(prompt.includes("install"), false);

    row.links.forEach((link, index) => {
      const href = new URL(link.href);
      const origin = new URL(PROVIDER_ORIGINS[index] ?? "");
      assert.equal(`${href.origin}${href.pathname}`, `${origin.origin}${origin.pathname}`);
      assert.deepEqual([...href.searchParams.keys()], ["q"]);
      assert.equal(href.searchParams.get("q"), prompt);
      assert.equal(href.hash, "");
      assert.equal(link.accessibleName, `${link.name}, ${title}, opens in a new tab`);
      assert.match(link.iconSrc, /-dark\.png$/);
    });
  }
});

test("ask ai row is absent on app, wallet, issuer, and proof routes", () => {
  for (const path of [
    "/app",
    "/app?wallet=GABCDEF123",
    "/wallet",
    "/issuer",
    "/issuer/register",
    "/proof",
    "/proof/abc",
  ]) {
    assert.equal(askAiLinks(path, "Stellaroid Earn"), null);
  }
});
