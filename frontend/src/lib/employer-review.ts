export const EMPLOYER_REVIEW_STEPS = [
  {
    id: "confirm-proof",
    title: "Confirm proof",
    detail:
      "Open the public proof and confirm the credential is verified on-chain.",
  },
  {
    id: "match-wallet",
    title: "Match wallet",
    detail:
      "Use the credential owner as the paid-trial candidate wallet.",
  },
  {
    id: "fund-escrow",
    title: "Fund escrow",
    detail:
      "Create the opportunity, then fund escrow after amount and milestones are clear.",
  },
] as const;

export const EMPLOYER_REVIEW_CHECKLIST = [
  "Open proofUrl and confirm the public proof page shows a verified on-chain status.",
  "Open contract.eventsUrl and confirm recent certificate lifecycle events when needed.",
  "Confirm credential.owner matches the candidate wallet used for the paid-trial offer.",
  "Check issuer.status before relying on issuer branding or issuer claims.",
  "Download or attach this proof pack before creating escrow.",
  "Read standardsAlignment.warning before treating this export as a standards credential.",
  "Use credential.hash as the immutable lookup key in applicant tracking notes.",
] as const;
