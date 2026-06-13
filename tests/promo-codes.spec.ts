// tests/promo-codes.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// These specs create their own data in the shared mock store; reset before each
// test so re-runs / retries do not accumulate stale rows across the e2e session.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

// NOTE: the e2e run shares ONE in-memory MSW store across every spec file
// (single `next start`, workers:1, no per-test reset). These tests therefore
// create their OWN promo codes and never mutate the seeded fixtures
// (WELCOME10 / FLAT500 / EXPIRED20) by code, so sibling specs stay stable.

test.describe("Promo codes CRUD + targeting", () => {
  test("nav link opens /promo-codes and the list renders", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByRole("link", { name: "Promo codes" }).click();
    await page.waitForURL("**/promo-codes");
    await expect(
      page.getByRole("heading", { name: "Promo codes" }),
    ).toBeVisible();
    await expect(page.getByTestId("promo-codes-table")).toBeVisible();
    // Seeded row WELCOME10 shows its targeting summary.
    const welcomeRow = page
      .locator('[data-testid^="promo-row-"]')
      .filter({ hasText: "WELCOME10" });
    await expect(welcomeRow).toBeVisible();
    await expect(welcomeRow).toContainText("3 providers / 2 categories");
  });

  test("status filter narrows the list to inactive codes", async ({ page }) => {
    await loginAsMockAdmin(page, "/promo-codes");
    await page.getByTestId("promo-status-filter").selectOption("inactive");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL("**/promo-codes?**status=inactive");
    // EXPIRED20 is the seeded inactive code; WELCOME10 (active) must be gone.
    await expect(
      page.locator('[data-testid^="promo-row-"]').filter({ hasText: "EXPIRED20" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid^="promo-row-"]').filter({ hasText: "WELCOME10" }),
    ).toHaveCount(0);
  });

  test("create a promo code with targeting → appears with its summary", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/promo-codes/new");
    await page.getByTestId("promo-code").fill("E2ETARGET");
    await page.getByTestId("promo-discount-type").selectOption("percent");
    await page.getByTestId("promo-discount-value").fill("15");
    await page.getByTestId("promo-target-providers").fill("1, 2, 3");
    await page.getByTestId("promo-target-categories").fill("7, 8");
    await page.getByTestId("promo-target-locations").fill("9");
    await page.getByTestId("promo-submit").click();

    // Lands on the new code's detail page.
    await expect(page.getByTestId("promo-detail-code")).toHaveText("E2ETARGET");
    await expect(page.getByTestId("promo-detail-targeting")).toContainText(
      "3 providers / 2 categories / 1 location",
    );

    // And shows up in the list with the same summary.
    await page.goto("/promo-codes");
    const row = page
      .locator('[data-testid^="promo-row-"]')
      .filter({ hasText: "E2ETARGET" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("3 providers / 2 categories / 1 location");
  });

  test("an untargeted code summarizes as Everyone", async ({ page }) => {
    await loginAsMockAdmin(page, "/promo-codes/new");
    await page.getByTestId("promo-code").fill("E2EALL");
    await page.getByTestId("promo-discount-type").selectOption("fixed_amount");
    await page.getByTestId("promo-discount-value").fill("250");
    await page.getByTestId("promo-currency").fill("USD");
    await page.getByTestId("promo-submit").click();

    await expect(page.getByTestId("promo-detail-code")).toHaveText("E2EALL");
    await expect(page.getByTestId("promo-detail-targeting")).toHaveText(
      "Everyone",
    );
  });

  test("fixed-amount discount without currency is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/promo-codes/new");
    await page.getByTestId("promo-code").fill("E2ENOCUR");
    await page.getByTestId("promo-discount-type").selectOption("fixed_amount");
    await page.getByTestId("promo-discount-value").fill("100");
    await page.getByTestId("promo-submit").click();
    await expect(page.getByTestId("promo-error")).toContainText(
      "Currency is required",
    );
  });

  test("deactivate flips a freshly created code to Inactive", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/promo-codes/new");
    await page.getByTestId("promo-code").fill("E2EDEACT");
    await page.getByTestId("promo-discount-type").selectOption("percent");
    await page.getByTestId("promo-discount-value").fill("5");
    await page.getByTestId("promo-submit").click();

    await expect(page.getByTestId("promo-detail-code")).toHaveText("E2EDEACT");
    await expect(page.getByTestId("promo-status-badge")).toHaveAttribute(
      "data-active",
      "true",
    );

    page.on("dialog", (d) => d.accept());
    await page.getByTestId("promo-deactivate").click();

    await expect(page.getByTestId("promo-status-badge")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  test("edit updates targeting on a freshly created code", async ({ page }) => {
    await loginAsMockAdmin(page, "/promo-codes/new");
    await page.getByTestId("promo-code").fill("E2EEDIT");
    await page.getByTestId("promo-discount-type").selectOption("percent");
    await page.getByTestId("promo-discount-value").fill("12");
    await page.getByTestId("promo-target-providers").fill("100");
    await page.getByTestId("promo-submit").click();

    await expect(page.getByTestId("promo-detail-code")).toHaveText("E2EEDIT");
    await expect(page.getByTestId("promo-detail-targeting")).toContainText(
      "1 providers",
    );

    // Edit: add two categories via the mutable form.
    await page.getByTestId("promo-target-categories").fill("3, 4");
    await page.getByTestId("promo-submit").click();
    await expect(page.getByTestId("promo-detail-targeting")).toContainText(
      "2 categories",
    );
  });

  test("an unknown promo code id shows a not-found page", async ({ page }) => {
    await loginAsMockAdmin(page, "/promo-codes");
    // notFound() renders the framework 404 (HTTP 404 + standard copy),
    // matching the audit / payments not-found convention.
    const res = await page.goto("/promo-codes/999999");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByText("This page could not be found."),
    ).toBeVisible();
    await expect(page.getByTestId("promo-detail-code")).toHaveCount(0);
  });

  test("detail of a seeded code shows its full targeting breakdown", async ({
    page,
  }) => {
    // Seeded id 1 = WELCOME10 (3 providers + 2 categories).
    await loginAsMockAdmin(page, "/promo-codes/1");
    await expect(page.getByTestId("promo-detail-code")).toHaveText("WELCOME10");
    await expect(
      page.getByTestId("promo-detail-target-providers"),
    ).toContainText("Providers: 3");
    await expect(
      page.getByTestId("promo-detail-target-categories"),
    ).toContainText("Categories: 2");
  });
});
