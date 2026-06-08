import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("providers list", () => {
  test("page renders cursor envelope, paginates forward, searches", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers");

    await expect(page.getByRole("heading", { name: "Providers moderation" })).toBeVisible();
    await expect(page.getByTestId("providers-table")).toBeVisible();

    // Page-1 shows LIMIT=10 of 16 fixtures (15 + conflict).
    await expect(page.getByTestId("providers-count")).toHaveText("10 providers on this page");
    const initialRows = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(initialRows).toBe(10);

    // Forward cursor pagination.
    await page.getByTestId("providers-next").click();
    await page.waitForURL(/last_id=/);
    const page2Rows = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(page2Rows).toBeGreaterThan(0);
    expect(page2Rows).toBeLessThanOrEqual(10);
    await page.getByTestId("providers-first").click();
    await page.waitForURL((url) => !url.search.includes("last_id"));
    await expect(page.getByTestId("providers-count")).toHaveText("10 providers on this page");

    // Search by name.
    await page.getByTestId("providers-search").fill("Blackbird");
    await page.waitForURL(/search=Blackbird/);
    const matched = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(matched).toBeGreaterThan(0);

    // Empty state.
    await page.getByTestId("providers-search").fill("zzz-nomatch-xyz");
    await expect(page.getByTestId("providers-empty")).toBeVisible();
  });

  test("providers list has no status filter (A6.2 backend doesn't expose one)", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers");
    await expect(page.getByTestId("providers-status-filter")).toHaveCount(0);
  });
});
