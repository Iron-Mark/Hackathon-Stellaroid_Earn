import { normalizeSeoPath, seoCanonicalUrl, SITE_NAME } from "./seo.ts";

export const ASK_AI_LABEL = "Ask your AI";

export const ASK_AI_PROVIDERS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    href: "https://chatgpt.com/",
    iconSrc: "/images/platforms/ask-chatgpt-dark.png",
  },
  {
    id: "claude",
    name: "Claude",
    href: "https://claude.ai/new",
    iconSrc: "/images/platforms/ask-claude-dark.png",
  },
  {
    id: "gemini",
    name: "Gemini",
    href: "https://gemini.google.com/app",
    iconSrc: "/images/platforms/ask-google-dark.png",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    href: "https://www.perplexity.ai/search",
    iconSrc: "/images/platforms/ask-perplexity-dark.png",
  },
  {
    id: "grok",
    name: "Grok",
    href: "https://grok.com/",
    iconSrc: "/images/platforms/ask-grok-dark.png",
  },
] as const;

const ASK_AI_PREFIXES = ["/docs", "/guides", "/glossary", "/about"] as const;

export function askAiPathname(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";

  const withoutHash = trimmed.split("#")[0] ?? "";
  try {
    const url = withoutHash.startsWith("/")
      ? new URL(withoutHash, "https://stellaroid.tech")
      : new URL(withoutHash);
    return normalizeSeoPath(url.pathname);
  } catch {
    const withoutSearch = withoutHash.split("?")[0] ?? "/";
    return normalizeSeoPath(withoutSearch || "/");
  }
}

export function isAskAiRoute(input: string): boolean {
  const path = askAiPathname(input);
  return ASK_AI_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function askAiPageTitle(title: string | null | undefined): string {
  const clean = (title ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return clean || SITE_NAME;
}

/** Fixed prompt: published title plus the canonical URL, with search and hash removed. */
export function askAiPrompt(title: string, pageUrl: string): string {
  const cleanTitle = askAiPageTitle(title);
  const canonical = seoCanonicalUrl(askAiPathname(pageUrl));
  return `As a bootcamp lead or employer, I want to understand how Stellaroid Earn can help me show that a training certificate is real and check that credential on a public page. I want to see how a bootcamp can stand behind a certificate and how an employer can look it up before trusting it. Summarize the highlights from "${cleanTitle}": ${canonical} Don't ask me for a wallet or private keys.`;
}

export function askAiHref(providerHref: string, prompt: string): string {
  const url = new URL(providerHref);
  url.hash = "";
  url.search = "";
  const params = new URLSearchParams();
  params.set("q", prompt);
  url.search = params.toString();
  return url.toString();
}

export interface AskAiLink {
  id: string;
  name: string;
  href: string;
  iconSrc: string;
  accessibleName: string;
}

export interface AskAiRowModel {
  label: string;
  links: AskAiLink[];
}

export function askAiLinks(pathname: string, title: string): AskAiRowModel | null {
  if (!isAskAiRoute(pathname)) return null;

  const pageTitle = askAiPageTitle(title);
  const prompt = askAiPrompt(pageTitle, pathname);

  return {
    label: ASK_AI_LABEL,
    links: ASK_AI_PROVIDERS.map((provider) => ({
      id: provider.id,
      name: provider.name,
      href: askAiHref(provider.href, prompt),
      iconSrc: provider.iconSrc,
      accessibleName: `${provider.name}, ${pageTitle}, opens in a new tab`,
    })),
  };
}
