// tests/promotions-orders-campaigns.spec.ts
//
// M3b — Orders (read-only) + Campaigns (read + cancel) tabs on /promotions.
// Mock store is a single in-memory instance across the whole e2e run, so the
// cancel-flow test targets seeded campaign #1 (active → cancelable) exactly
// once, and the already-canceled error path targets seeded campaign #2.
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

test.describe("Promotions orders + campaigns (M3b)", () => {
  test("orders tab lists seeded orders", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions?tab=orders");
    await expect(page.getByTestId("orders-table")).toBeVisible();
    await expect(page.getByTestId("order-row-1")).toBeVisible();
    await expect(page.getByTestId("order-status-1")).toContainText("paid");
  });

  test("orders status filter narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions?tab=orders");
    await page.getByTestId("orders-filter-status").selectOption("paid");
    await page.getByTestId("orders-filter-apply").click();
    await page.waitForURL("**/promotions?tab=orders&status=paid**");
    await expect(page.getByTestId("order-row-1")).toBeVisible();
    // The pending order (#2) is filtered out.
    await expect(page.getByTestId("order-row-2")).toHaveCount(0);
  });

  test("order detail opens with line items", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions?tab=orders");
    await page.getByTestId("order-view-1").click();
    await page.waitForURL("**/promotions/orders/1");
    await expect(page.getByTestId("order-detail-id")).toHaveText("Order #1");
    await expect(page.getByTestId("order-items-table")).toBeVisible();
    await expect(page.getByTestId("order-item-row-1")).toBeVisible();
  });

  test("an unknown order id shows a not-found state", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions/orders/999999");
    await expect(page.getByTestId("order-detail-error")).toBeVisible();
    await expect(page.getByTestId("order-detail-error")).toContainText(
      "No promotion order",
    );
  });

  test("campaigns tab lists + detail opens", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions?tab=campaigns");
    await expect(page.getByTestId("campaigns-table")).toBeVisible();
    await expect(page.getByTestId("campaign-row-1")).toBeVisible();

    await page.getByTestId("campaign-view-1").click();
    await page.waitForURL("**/promotions/campaigns/1");
    await expect(page.getByTestId("campaign-detail-id")).toHaveText(
      "Campaign #1",
    );
    // Admin polish: resolved labels render instead of raw FK ids.
    await expect(page.getByTestId("campaign-service-label")).toContainText(
      "Wedding photography premium",
    );
    await expect(page.getByTestId("campaign-product-label")).toContainText(
      "FEATURED_WEEK",
    );
    await expect(page.getByTestId("campaign-zone-label")).toHaveText(
      "home_top",
    );
  });

  test("an unknown campaign id shows a not-found state", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions/campaigns/999999");
    await expect(page.getByTestId("campaign-detail-error")).toBeVisible();
    await expect(page.getByTestId("campaign-detail-error")).toContainText(
      "No promotion campaign",
    );
  });

  test("an already-canceled campaign is status-gated (no Cancel button)", async ({
    page,
  }) => {
    // Seeded campaign #2 is already canceled → the table hides its Cancel
    // button (client-side gate). Backend cancel would also 4xx, but the UI
    // shouldn't even offer the impossible action.
    await loginAsMockAdmin(page, "/promotions?tab=campaigns");
    const row = page.getByTestId("campaign-row-2");
    await expect(row.getByTestId("campaign-status-2")).toContainText(
      "canceled",
    );
    await expect(row.getByTestId("campaign-cancel-2")).toHaveCount(0);
  });

  test("cancel rejected by the backend surfaces the error inline", async ({
    page,
  }) => {
    // Campaign #3 looks cancelable (active → Cancel button shown) but the
    // backend rejects the cancel with a 4xx; the structured reason renders
    // inline and the status stays active.
    await loginAsMockAdmin(page, "/promotions?tab=campaigns");
    const row = page.getByTestId("campaign-row-3");
    await expect(row.getByTestId("campaign-status-3")).toContainText("active");

    page.on("dialog", (d) => d.accept());
    await row.getByTestId("campaign-cancel-3").click();

    await expect(row.getByTestId("campaign-cancel-3-error")).toBeVisible();
    await expect(row.getByTestId("campaign-cancel-3-error")).toContainText(
      "settled",
    );
    // Cancel failed → still active.
    await expect(row.getByTestId("campaign-status-3")).toContainText("active");
  });

  test("cancel a cancelable campaign flips its status to canceled", async ({
    page,
  }) => {
    // Run last: this mutates the shared store (campaign #1 → canceled).
    await loginAsMockAdmin(page, "/promotions?tab=campaigns");
    const row = page.getByTestId("campaign-row-1");
    await expect(row.getByTestId("campaign-status-1")).toContainText("active");

    page.on("dialog", (d) => d.accept());
    await row.getByTestId("campaign-cancel-1").click();

    await expect(row.getByTestId("campaign-status-1")).toContainText(
      "canceled",
    );
  });
});
