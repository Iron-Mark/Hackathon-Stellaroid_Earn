import { expect, test } from "@playwright/test";

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
