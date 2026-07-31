"use client";

import { useState, useCallback, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Metadata is exported from a separate file since this is "use client" */
/* ------------------------------------------------------------------ */

const TOTAL = 10;

/* ------------------------------------------------------------------ */
/*  SVG icon helpers                                                   */
/* ------------------------------------------------------------------ */
function Icon({
  children,
  variant = "amber",
}: {
  children: React.ReactNode;
  variant?: "amber" | "purple" | "green" | "red";
}) {
  const bgMap = {
    amber: "bg-primary/15",
    purple: "bg-accent/15",
    green: "bg-verified/15",
    red: "bg-danger/15",
  };
  return (
    <div
      className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg mb-2.5 ${bgMap[variant]}`}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  variant = "amber",
}: {
  children: React.ReactNode;
  variant?: "amber" | "purple" | "green";
}) {
  const styles = {
    amber:
      "bg-primary/15 text-primary border-primary/30",
    purple:
      "bg-accent/15 text-accent border-accent/30",
    green:
      "bg-verified/15 text-verified border-verified/30",
  };
  return (
    <span
      className={`inline-block px-5 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated child wrapper - staggers entry of each direct child       */
/* ------------------------------------------------------------------ */
function AnimatedChild({
  active,
  index,
  children,
}: {
  active: boolean;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: active ? `${index * 80}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide wrapper with staggered child animations                      */
/* ------------------------------------------------------------------ */
function Slide({
  active,
  children,
  direction = 0,
}: {
  active: boolean;
  children: React.ReactNode;
  direction?: number;
}) {
  const translateX = active ? "0" : direction >= 0 ? "60px" : "-60px";
  return (
    <div
      className="absolute inset-0 flex flex-col justify-center items-start text-left px-[4vw] py-[4vh] sm:px-[5vw] sm:py-[5vh] overflow-hidden transition-all duration-500 ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: `translateX(${active ? "0" : translateX})`,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <AnimatedChild key={i} active={active} index={i}>
              {child}
            </AnimatedChild>
          ))
        : <AnimatedChild active={active} index={0}>{children}</AnimatedChild>
      }
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screenshot component                                               */
/* ------------------------------------------------------------------ */
function Screenshot({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-lg border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] object-cover object-top ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */
export default function SlidesPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const navigate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((c) => Math.max(0, Math.min(TOTAL - 1, c + dir)));
    },
    []
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        navigate(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <>
      {/* Override page title via document.title since this is a client component */}

      <div className="h-screen w-screen relative overflow-hidden">
        {/* ============================================================ */}
        {/* SLIDE 1 -- Title                                             */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 0}>
          {/* Decorative rings */}
          <svg
            className="absolute right-[5vw] bottom-[5vh] opacity-[0.04] hidden md:block"
            width="300"
            height="300"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="45" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
            <circle cx="50" cy="50" r="15" stroke="#f59e0b" strokeWidth="1" fill="none" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#f59e0b" strokeWidth="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#f59e0b" strokeWidth="0.5" />
          </svg>

          <Badge>Top 5 / 105 - Stellar PH Bootcamp 2026</Badge>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
            <span className="text-primary">Stellaroid</span> Earn
          </h1>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-text-muted mb-6">
            On-chain credential trust for Stellar testnet
          </h3>
          <p className="text-sm sm:text-base text-text-muted/80 leading-relaxed">
            Issue, verify, and pay graduates - Soroban + multi-wallet, proof to payment end-to-end.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mt-6 items-start">
            <Screenshot
              src="/images/landing-hero.png"
              alt="Landing page"
              className="max-w-[280px] max-h-[25vh]"
            />
            <Screenshot
              src="/images/proof-verified.png"
              alt="Verified proof"
              className="max-w-[280px] max-h-[25vh]"
            />
            <Screenshot
              src="/images/app-dashboard.png"
              alt="App dashboard"
              className="max-w-[280px] max-h-[25vh] hidden sm:block"
            />
          </div>

          <p className="text-xs sm:text-sm text-text-muted/60 mt-4">
            Mark Siazon - Hybrid Product Designer &amp; Full-Stack Developer
          </p>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 2 -- Problem                                           */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 1}>
          {/* Decorative alert icon */}
          <svg
            className="absolute right-[5vw] bottom-[5vh] opacity-[0.04] hidden md:block"
            width="250"
            height="250"
            viewBox="0 0 24 24"
            stroke="#ef4444"
            fill="none"
            strokeWidth="1"
          >
            <path d="M12 9v4m0 4h.01M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
          </svg>

          <Badge variant="purple">The Problem</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            Certificates are <span className="text-primary">easy to fake</span>, hard to verify
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full mt-5">
            {/* Bullet points */}
            <ul className="space-y-3 text-sm sm:text-base text-text-muted/80 leading-relaxed">
              {[
                "Bootcamp certificates are PDFs anyone can duplicate",
                "Employers skip verification or pay for background checks",
                "No standard way to prove completion on-chain",
                "Payment to graduates is disconnected from verification",
              ].map((text) => (
                <li key={text} className="flex gap-3 items-start">
                  <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-primary" />
                  {text}
                </li>
              ))}
            </ul>

            {/* Warning cards */}
            <div className="flex flex-col gap-4 pt-0 md:pt-2">
              <div className="bg-surface-glass border border-danger/30 rounded-lg p-4 md:p-5 backdrop-blur-sm">
                <Icon variant="red">
                  <svg className="w-5 h-5" stroke="#f87171" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Icon>
                <h4 className="text-sm sm:text-base font-bold text-[#f87171] mb-1">No Trust</h4>
                <p className="text-xs sm:text-sm text-text-muted">Anyone can forge a PDF certificate</p>
              </div>
              <div className="bg-surface-glass border border-danger/30 rounded-lg p-4 md:p-5 backdrop-blur-sm">
                <Icon variant="red">
                  <svg className="w-5 h-5" stroke="#f87171" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                </Icon>
                <h4 className="text-sm sm:text-base font-bold text-[#f87171] mb-1">Slow &amp; Costly</h4>
                <p className="text-xs sm:text-sm text-text-muted">Email threads and background check fees</p>
              </div>
            </div>
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 3 -- Solution                                          */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 2}>
          <Badge>The Solution</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            Anchor credentials <span className="text-primary">on Stellar</span>
          </h2>

          {/* Flow diagram */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 my-5">
            {[
              {
                label: "Register",
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" stroke="#f59e0b" fill="none" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                ),
              },
              {
                label: "Verify",
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" stroke="#f59e0b" fill="none" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ),
              },
              {
                label: "Pay",
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" stroke="#f59e0b" fill="none" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.label} className="contents">
                {i > 0 && (
                  <span className="text-border text-sm sm:text-base">&rarr;</span>
                )}
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 font-semibold text-primary text-sm sm:text-base">
                  {step.icon}
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full mt-4">
            <ul className="space-y-3 text-sm sm:text-base text-text-muted/80 leading-relaxed">
              {[
                "Issuers register certificate hashes on Soroban",
                "Anyone verifies with a URL - no wallet needed",
                "Employers pay graduates in XLM on-chain",
                "Sub-cent fees + 5s finality",
              ].map((text) => (
                <li key={text} className="flex gap-3 items-start">
                  <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-primary" />
                  {text}
                </li>
              ))}
            </ul>
            <Screenshot
              src="/images/proof-verified.png"
              alt="Verified badge"
              className="max-h-[260px] max-w-full"
            />
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 4 -- Product Screens                                   */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 3}>
          <Badge variant="green">Product</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            The <span className="text-primary">app</span> in action
          </h2>

          {/* Row 1 */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-5 justify-start mt-5">
            <div className="text-left">
              <Screenshot
                src="/images/landing-hero.png"
                alt="Landing"
                className="max-w-[340px] max-h-[240px]"
              />
              <p className="text-xs text-text-muted/60 mt-2">Landing page</p>
            </div>
            <div className="text-left">
              <Screenshot
                src="/images/app-dashboard.png"
                alt="Dashboard"
                className="max-w-[340px] max-h-[240px]"
              />
              <p className="text-xs text-text-muted/60 mt-2">Issuer / Employer dashboard</p>
            </div>
            <div className="text-left">
              <Screenshot
                src="/images/mobile-proof-card.png"
                alt="Mobile proof"
                className="max-w-[150px] max-h-[240px]"
              />
              <p className="text-xs text-text-muted/60 mt-2">Mobile proof card</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-5 justify-start mt-4">
            <div className="text-left">
              <Screenshot
                src="/images/stellar-expert.png"
                alt="Stellar Expert"
                className="max-w-full sm:max-w-[440px] max-h-[180px]"
              />
              <p className="text-xs text-text-muted/60 mt-2">On-chain evidence (Stellar Expert)</p>
            </div>
            <div className="text-left">
              <Screenshot
                src="/images/issuer-page.png"
                alt="Issuer page"
                className="max-w-full sm:max-w-[440px] max-h-[180px]"
              />
              <p className="text-xs text-text-muted/60 mt-2">Issuer console</p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 5 -- Architecture                                      */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 4}>
          <Badge variant="purple">Architecture</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            How it&apos;s <span className="text-primary">built</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
            {[
              {
                variant: "amber" as const,
                stroke: "#f59e0b",
                title: "Smart Contract",
                desc: "Rust + Soroban, 19 public functions, credential trust layer + milestone escrow, 12 tests",
                icon: (
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                ),
              },
              {
                variant: "purple" as const,
                stroke: "#a78bfa",
                title: "Frontend",
                desc: "Next.js 16, React 19, installable PWA, lazy-loaded SDK (~260 KB first load), 8 wallets: Freighter + Albedo native, WalletConnect for mobile, 6 more via Stellar Wallets Kit",
                icon: (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </>
                ),
              },
              {
                variant: "green" as const,
                stroke: "#34d399",
                title: "Security",
                desc: "CSP, HSTS, 31-item checklist, error normalization",
                icon: (
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                ),
              },
              {
                variant: "amber" as const,
                stroke: "#f59e0b",
                title: "Fee Sponsorship",
                desc: "CAP-0015 fee bump support restricted to trusted server callers",
                icon: (
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                ),
              },
              {
                variant: "purple" as const,
                stroke: "#a78bfa",
                title: "Monitoring",
                desc: "/status#metrics, credential + escrow event feeds, first-party error telemetry",
                icon: (
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                ),
              },
              {
                variant: "green" as const,
                stroke: "#34d399",
                title: "Deployment",
                desc: "Vercel edge, Stellar testnet, developer docs at /docs, auto HTTPS",
                icon: (
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-surface-glass border border-border/60 rounded-lg p-4 md:p-5 backdrop-blur-sm"
              >
                <Icon variant={card.variant}>
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    stroke={card.stroke}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {card.icon}
                  </svg>
                </Icon>
                <h4 className="text-sm sm:text-base font-bold text-primary mb-1">
                  {card.title}
                </h4>
                <p className="text-xs sm:text-sm text-text-muted leading-snug">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 6 -- Traction                                          */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 5}>
          <Badge variant="green">Top 5 / 105 Participants</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            User <span className="text-primary">validation</span> &amp; <span className="text-verified">results</span>
          </h2>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 sm:gap-10 md:gap-14 my-6 w-full max-w-[85%]">
            {[
              {
                num: "#5",
                label: "Rank / 105",
                icon: (
                  <>
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18" />
                    <path d="M18 9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
                    <path d="M12 7v15" />
                  </>
                ),
              },
              {
                num: "54",
                label: "Testnet Wallets (30 independent)",
                icon: (
                  <>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </>
                ),
              },
              {
                num: "Proof",
                label: "Public URLs",
                icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
              },
              {
                num: "Redacted",
                label: "Feedback Logs",
                icon: (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </>
                ),
              },
              {
                num: "Live",
                label: "Demo Checklist",
                icon: (
                  <>
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </>
                ),
              },
            ].map((stat) => (
              <div key={stat.label} className="text-left">
                <svg
                  className="w-8 h-8 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                >
                  {stat.icon}
                </svg>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary">
                  {stat.num}
                </div>
                <div className="text-xs sm:text-sm text-border mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feedback cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[80%]">
            <div className="bg-surface-glass border border-verified/30 rounded-lg p-4 md:p-5 backdrop-blur-sm">
              <Icon variant="green">
                <svg className="w-5 h-5" stroke="#34d399" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-6 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Icon>
              <h4 className="text-sm sm:text-base font-bold text-verified mb-1">
                What users liked
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-snug">
                Clean proof page (no login), on-chain transparency, fast finality
              </p>
            </div>
            <div className="bg-surface-glass border border-primary/30 rounded-lg p-4 md:p-5 backdrop-blur-sm">
              <Icon variant="amber">
                <svg className="w-5 h-5" stroke="#f59e0b" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </Icon>
              <h4 className="text-sm sm:text-base font-bold text-primary mb-1">
                Iteration shipped
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-snug">
                Added role guidance hints after &quot;confusing toggle&quot; feedback
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 7 -- Market Opportunity                                */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 6}>
          <Badge variant="purple">Market Opportunity</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            A trust gap <span className="text-primary">worth closing</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
            {[
              {
                title: "Credentials are unverifiable",
                desc: "Bootcamp and course certificates are PDFs. Employers trust them blindly or pay for background checks.",
              },
              {
                title: "Graduates lack portable proof",
                desc: "Millions finish online programs each year with nothing an employer can confirm in seconds.",
              },
              {
                title: "Stellar makes it economic",
                desc: "Sub-cent fees and ~5s finality make anchoring each credential  - and paying graduates directly  - viable where gas-heavy chains can't.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-surface-glass border border-border/60 rounded-lg p-4 md:p-5 backdrop-blur-sm"
              >
                <h4 className="text-sm sm:text-base font-bold text-primary mb-1.5">
                  {c.title}
                </h4>
                <p className="text-xs sm:text-sm text-text-muted leading-snug">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 md:p-5 mt-5 max-w-full">
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              <span className="font-bold text-accent">Our wedge:</span> bootcamps and
              training providers as issuers, employers and recruiters as verifiers
              {" - "}starting where credential trust and cross-border payout friction are
              highest.
            </p>
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 8 -- Growth Strategy                                   */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 7}>
          <Badge>Growth Strategy</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            How it <span className="text-primary">spreads</span>
          </h2>

          {/* Two-sided loop */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 my-5">
            {[
              "Issuers anchor credentials",
              "Graduates share proof links",
              "Employers verify in one click",
              "Trust pulls in more issuers",
            ].map((step, i) => (
              <div key={step} className="contents">
                {i > 0 && <span className="text-border text-sm sm:text-base">&rarr;</span>}
                <span className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 sm:px-4 font-semibold text-primary text-xs sm:text-sm">
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
            {[
              {
                title: "Zero-friction verification",
                desc: "Employers check a credential from a shared link or QR  - no install, no account. Every shared proof is a live demo.",
              },
              {
                title: "Pilot-led onboarding",
                desc: "The /pilot form captures training providers; first rollouts stay small (5-10 credentials) to prove the loop before scaling.",
              },
              {
                title: "Ecosystem distribution",
                desc: "Stellar PH + Rise In community, testnet-first to lower adoption risk, installable PWA for checks on the go.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-surface-glass border border-border/60 rounded-lg p-4 md:p-5 backdrop-blur-sm"
              >
                <h4 className="text-sm sm:text-base font-bold text-primary mb-1.5">
                  {c.title}
                </h4>
                <p className="text-xs sm:text-sm text-text-muted leading-snug">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 9 -- Future Roadmap                                    */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 8}>
          <Badge variant="green">Future Roadmap</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            What&apos;s <span className="text-primary">next</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
            {[
              {
                phase: "01",
                title: "Keep it reliable",
                desc: "Green E2E for register, verify, and pay; testnet clarity; no scope creep.",
              },
              {
                phase: "02",
                title: "Useful after the event",
                desc: "Issuer onboarding, proof-to-employer handoff, /pilot capture, honest talent passports.",
              },
              {
                phase: "03",
                title: "Pilot with real users",
                desc: "One real issuer, 5-10 live credentials, employer feedback on proof clarity and trust.",
              },
              {
                phase: "04",
                title: "Product decisions",
                desc: "Mainnet feasibility, standards signing, indexing  - each gated behind written policy, not rushed.",
              },
            ].map((p) => (
              <div
                key={p.phase}
                className="bg-surface-glass border border-border/60 rounded-lg p-4 md:p-5 backdrop-blur-sm flex gap-3.5 items-start"
              >
                <span className="font-heading text-lg sm:text-xl font-extrabold text-primary/70 shrink-0 leading-none mt-0.5">
                  {p.phase}
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-primary mb-1">
                    {p.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-muted leading-snug">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs sm:text-sm text-text-muted/70 mt-5 max-w-full">
            <span className="font-semibold text-text-muted">Deliberately not now:</span> no
            marketplace, no mainnet from examples, no NFT layer before real issuer demand is
            validated.
          </p>
        </Slide>

        {/* ============================================================ */}
        {/* SLIDE 10 -- Links                                            */}
        {/* ============================================================ */}
        <Slide direction={direction} active={current === 9}>
          {/* Decorative rings */}
          <svg
            className="absolute right-[5vw] bottom-[5vh] opacity-[0.04] hidden md:block"
            width="300"
            height="300"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="45" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
            <circle cx="50" cy="50" r="15" stroke="#f59e0b" strokeWidth="1" fill="none" />
          </svg>

          <Badge>Try It Now</Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-6">
            Live on <span className="text-primary">Stellar testnet</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-full mt-6">
            {[
              {
                variant: "amber" as const,
                stroke: "#f59e0b",
                title: "Live Demo",
                desc: "stellaroid.tech/demo — guided tour, no wallet needed",
                icon: (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </>
                ),
              },
              {
                variant: "purple" as const,
                stroke: "#a78bfa",
                title: "GitHub",
                desc: "Iron-Mark/Hackathon-Stellaroid_Earn",
                icon: (
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                ),
              },
              {
                variant: "green" as const,
                stroke: "#34d399",
                title: "Contract",
                desc: "CAD6C24P...ISZCV — source-verified build",
                icon: (
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                ),
              },
              {
                variant: "amber" as const,
                stroke: "#f59e0b",
                title: "Run a pilot",
                desc: "stellaroid.tech/pilot — on-site intake form",
                icon: (
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-surface-glass border border-border/60 rounded-lg p-4 md:p-5 backdrop-blur-sm text-left"
              >
                <Icon variant={card.variant}>
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    stroke={card.stroke}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {card.icon}
                  </svg>
                </Icon>
                <h4 className="text-sm sm:text-base font-bold text-primary mb-1">
                  {card.title}
                </h4>
                <p className="text-xs sm:text-sm text-text-muted leading-snug">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs sm:text-sm text-text-muted/60 mt-6">
            Built by Mark Siazon for Stellar PH Bootcamp 2026 / Rise In
          </p>
          <p className="text-primary font-bold text-lg sm:text-xl mt-3">
            Thank you!
          </p>
        </Slide>

        {/* ============================================================ */}
        {/* Navigation controls                                          */}
        {/* ============================================================ */}
        <div className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] left-[max(1.25rem,env(safe-area-inset-left))] z-[100] text-xs sm:text-sm text-border">
          {current + 1} / {TOTAL}
        </div>

        <div className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-[max(1.25rem,env(safe-area-inset-right))] z-[100] flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="bg-surface/80 border border-border/60 text-text px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-sans cursor-pointer backdrop-blur-sm transition-colors hover:bg-primary/20 hover:border-primary/40"
          >
            &larr; Prev
          </button>
          <button
            onClick={() => navigate(1)}
            className="bg-surface/80 border border-border/60 text-text px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-sans cursor-pointer backdrop-blur-sm transition-colors hover:bg-primary/20 hover:border-primary/40"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </>
  );
}
