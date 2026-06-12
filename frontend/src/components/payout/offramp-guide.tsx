import { appConfig } from "@/lib/config";

/**
 * PH-localized off-ramp guide for cashing out XLM to pesos on the
 * graduate's OWN exchange account. Stellaroid is the GPS, never the taxi:
 * we explain the route, the user drives their own money.
 */

const STEPS: { title: string; body: string }[] = [
  {
    title: "Open your own PDAX account",
    body: "Sign up at pdax.ph with your own details. You will need one valid government ID (e.g., PhilSys, passport, driver's license) and a selfie check. KYC approval is usually same-day, occasionally up to 2 banking days.",
  },
  {
    title: "Get your personal XLM deposit address",
    body: "In the PDAX app, choose Deposit → Crypto → XLM (Stellar). PDAX shows a deposit address plus a memo. Both matter: a deposit sent without the memo can take days to recover, so copy them exactly.",
  },
  {
    title: "Send the XLM from your wallet",
    body: "From Freighter (or any Stellar wallet you control), send your XLM to that deposit address with the memo. Stellar settles in about 5 seconds; PDAX typically credits after a short confirmation sweep, usually within a few minutes.",
  },
  {
    title: "Sell XLM for pesos",
    body: "Trade your XLM into PHP at the market price. Check the current trading pair in-app before selling — XLM pairings have historically shifted between PHP and PHPT (a peso-pegged token), and the pairing on the day determines one extra conversion step or none.",
  },
  {
    title: "Withdraw to your bank or e-wallet",
    body: "Cash out PHP via InstaPay or PESONet to your own bank account or e-wallet. InstaPay is near-instant for amounts up to ₱50,000; PESONet handles larger amounts and settles the same banking day. PDAX charges a flat withdrawal fee shown before you confirm.",
  },
];

export function OfframpGuide() {
  const isTestnet = appConfig.network !== "PUBLIC" && appConfig.network !== "PUBNET";

  return (
    <div className="mt-2 flex flex-col gap-4 rounded-lg border border-border bg-surface-2 p-4">
      <p className="m-0 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium leading-relaxed text-text">
        Stellaroid never holds your funds — this guide walks you through YOUR
        exchange account, from your wallet to your bank.
      </p>

      {isTestnet && (
        <p className="m-0 rounded-md border border-warning/30 bg-warning/12 px-3 py-2 text-sm leading-relaxed text-warning">
          Demo mode — testnet XLM has no cash value. The steps below describe
          the real flow you would follow on mainnet.
        </p>
      )}

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-semibold text-[#C4B5FD]"
            >
              {index + 1}
            </span>
            <div>
              <p className="m-0 text-sm font-medium text-text">{step.title}</p>
              <p className="m-0 mt-0.5 text-sm leading-relaxed text-text-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="m-0 text-xs leading-relaxed text-text-muted">
        Realistic end-to-end timeline once your account is verified: minutes,
        not days. First-time setup (KYC) is the long pole. Fees to expect: the
        Stellar network fee (fractions of a centavo), the PDAX trading spread,
        and the flat PHP withdrawal fee.
      </p>
    </div>
  );
}
