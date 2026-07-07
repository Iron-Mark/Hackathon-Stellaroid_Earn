import { expect, test } from "@playwright/test";

const SAMPLE_PROOF_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const SAMPLE_WALLET =
  "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";

test("employer page normalizes repeated proof handoff query params", async ({ page }) => {
  await page.goto("/employer?hash=abc&hash=def&candidate=first&candidate=second");

  await expect(page.getByRole("heading", { name: "Fund a paid trial" })).toBeVisible();
  await expect(page.getByText("Use a 64-character hex certificate hash.")).toBeVisible();

  const handoff = page.getByRole("region", { name: "Proof handoff" });
  await expect(handoff.getByText("abc", { exact: true })).toBeVisible();
  await expect(handoff.getByText("first", { exact: true })).toBeVisible();
  await expect(handoff.getByText("def", { exact: true })).toHaveCount(0);
  await expect(handoff.getByText("second", { exact: true })).toHaveCount(0);
});

test("employer page repeats issuer trust dossier before escrow creation", async ({ page }) => {
  await page.addInitScript(
    ({ hash, wallet }) => {
      const analyticsWindow = window as typeof window & {
        va?: (...params: unknown[]) => void;
        __vaEvents?: unknown[];
      };
      analyticsWindow.va = (...params: unknown[]) => {
        analyticsWindow.__vaEvents = [
          ...(analyticsWindow.__vaEvents ?? []),
          params,
        ];
      };
      window.sessionStorage.setItem(
        "stellaroid:e2e:certificates",
        JSON.stringify([
          [
            hash,
            {
              owner: wallet,
              issuer: wallet,
              title: "Stellar Smart Contract Bootcamp Completion",
              cohort: "Stellar PH Bootcamp 2026",
              metadata_uri: "",
              status: "Verified",
              issued_at: 0,
              verified_at: Date.now(),
              expires_at: 0,
            },
          ],
        ]),
      );
    },
    { hash: SAMPLE_PROOF_HASH, wallet: SAMPLE_WALLET },
  );

  await page.goto(`/employer?hash=${SAMPLE_PROOF_HASH}&candidate=${SAMPLE_WALLET}`);

  await expect(page.getByRole("heading", { name: "Fund a paid trial" })).toBeVisible();
  await expect(page.getByText("Employer-ready issuer evidence")).toBeVisible();
  await expect(page.getByText("90/100 evidence")).toBeVisible();
  await expect(
    page.getByText("Issuer is approved in the contract registry."),
  ).toBeVisible();

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __vaEvents?: unknown[];
        }
      ).__vaEvents ?? [],
  );
  const serialized = JSON.stringify(events);

  expect(serialized).toContain("employer_handoff_loaded");
  expect(serialized).toContain("candidate_supplied");
  expect(serialized).not.toContain(SAMPLE_PROOF_HASH);
  expect(serialized).not.toContain(SAMPLE_WALLET);
});

test("employer page renders locally saved candidate shortlist", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "stellaroid.employerShortlist.v1",
      JSON.stringify([
        {
          hash: "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3",
          owner: "GAQZJQPZI7YZBUN6YVAFACVKAH6ODNBO3DVELP34VW4MLLUBCL5DMMNS",
          title: "Stellar PH Bootcamp 2026",
          status: "verified",
          issuerStatus: "approved",
          savedAt: "2026-07-04T01:00:00.000Z",
        },
      ]),
    );
  });

  await page.goto("/employer");

  const shortlist = page.getByRole("region", {
    name: "Employer candidate shortlist",
  });
  await expect(shortlist.getByText("Saved proof candidates")).toBeVisible();
  await expect(shortlist.getByText("Stellar PH Bootcamp 2026")).toBeVisible();
  await expect(shortlist.getByText("approved")).toBeVisible();
  await expect(shortlist.getByRole("link", { name: "Proof" })).toHaveAttribute(
    "href",
    "/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3",
  );
});
