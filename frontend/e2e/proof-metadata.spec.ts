import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const SAMPLE_PROOF_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const SAMPLE_PROOF_URL = `https://stellaroid.tech/proof/${SAMPLE_PROOF_HASH}`;

async function getJsonLd(page: Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => JSON.parse(node.textContent || "{}")),
  );
}

test("proof pages expose a canonical Open Graph URL", async ({ page }) => {
  await page.goto(`/proof/${SAMPLE_PROOF_HASH}`);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SAMPLE_PROOF_URL,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    SAMPLE_PROOF_URL,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/proof\/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3\/opengraph-image/,
  );
});

test("about page exposes product software structured data", async ({ page }) => {
  await page.goto("/about");

  const schemas = await getJsonLd(page);
  const product = schemas.find((schema) => {
    const type = schema["@type"];
    return Array.isArray(type) && type.includes("Product") && type.includes("SoftwareApplication");
  });

  expect(product).toBeTruthy();
  expect(product.url).toBe("https://stellaroid.tech/about");
  expect(product.creator.name).toBe("Mark Siazon");
  expect(product.offers.price).toBe("0");
  expect(product.aggregateRating).toBeUndefined();
  expect(product.review).toBeUndefined();
});

test("sample proof page exposes article structured data linked to the credential document", async ({ page }) => {
  await page.goto(`/proof/${SAMPLE_PROOF_HASH}`);

  await expect(
    page.getByText("Employer-ready issuer evidence", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("90/100 evidence").first()).toBeVisible();
  await expect(page.getByText("Evidence score")).toBeVisible();

  const schemas = await getJsonLd(page);
  const article = schemas.find((schema) => schema["@type"] === "Article");
  const document = schemas.find((schema) => schema["@type"] === "DigitalDocument");

  expect(article).toBeTruthy();
  expect(document).toBeTruthy();
  expect(article.mainEntityOfPage["@id"]).toBe(SAMPLE_PROOF_URL);
  expect(article.image).toBe(`${SAMPLE_PROOF_URL}/opengraph-image`);
  expect(article.author.name).toBe("Mark Siazon");
  expect(article.about.identifier).toBe(SAMPLE_PROOF_HASH);
});

test("proof share event avoids raw proof identifiers", async ({ page }) => {
  await page.addInitScript(() => {
    const analyticsWindow = window as typeof window & {
      va?: (...params: unknown[]) => void;
      __vaEvents?: unknown[];
    };
    window.open = () => null;
    analyticsWindow.va = (...params: unknown[]) => {
      analyticsWindow.__vaEvents = [
        ...(analyticsWindow.__vaEvents ?? []),
        params,
      ];
    };
  });

  await page.goto(`/proof/${SAMPLE_PROOF_HASH}`);
  await page
    .getByRole("button", { name: "Share verified proof on X (Twitter)" })
    .click();

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __vaEvents?: unknown[];
        }
      ).__vaEvents ?? [],
  );
  const serialized = JSON.stringify(events);

  expect(serialized).toContain("proof_share_clicked");
  expect(serialized).toContain("proof_hash_shape");
  expect(serialized).not.toContain(SAMPLE_PROOF_HASH);
});

test("proof Open Graph image renders as png", async ({ page, request }) => {
  await page.goto(`/proof/${SAMPLE_PROOF_HASH}`);

  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");

  expect(imageUrl).toBeTruthy();

  const response = await request.get(imageUrl!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});

test("proof QR route renders as svg", async ({ request }) => {
  const response = await request.get(`/proof/${SAMPLE_PROOF_HASH}/qr`);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toContain("<svg");
});

test("unknown proof hashes do not get verified social claims", async ({ page }) => {
  const unknown =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  await page.goto(`/proof/${unknown}`);

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Proof Lookup/,
  );
  await expect(page.locator('meta[property="og:description"]')).not.toHaveAttribute(
    "content",
    /Payment settled|Verified, on-chain proof/i,
  );
  const schemas = await getJsonLd(page);
  const article = schemas.find((schema) => schema["@type"] === "Article");
  const serializedSchemas = JSON.stringify(schemas);

  expect(article).toBeUndefined();
  expect(serializedSchemas).not.toMatch(/Payment settled|Verified, on-chain proof|Paid atomically/i);
  await expect(page.getByText("No record for this hash yet.")).toBeVisible();
});
