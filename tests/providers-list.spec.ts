import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("providers list", () => {
  test("page renders mock fixtures, paginates, filters by status, searches", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers");

    await expect(page.getByRole("heading", { name: "Providers moderation" })).toBeVisible();
    await expect(page.getByTestId("providers-table")).toBeVisible();
    await expect(page.getByTestId("providers-total")).toHaveText("16 providers");

    // Default page shows first 10 rows.
    const initialRows = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(initialRows).toBe(10);

    // Pagination — next/prev work.
    await page.getByTestId("providers-next").click();
    await expect(page.getByTestId("providers-page-indicator")).toHaveText("Page 2 of 2");
    await page.getByTestId("providers-prev").click();
    await expect(page.getByTestId("providers-page-indicator")).toHaveText("Page 1 of 2");

    // Status filter narrows the row count.
    await page.getByTestId("providers-status-filter").selectOption("approved");
    await expect(page.getByTestId("providers-total")).not.toHaveText("16 providers");
    const approvedRows = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(approvedRows).toBeGreaterThan(0);
    // All visible badges must be Approved.
    const badges = await page.getByTestId("status-badge").all();
    for (const b of badges) {
      await expect(b).toHaveAttribute("data-status", "approved");
    }

    // Clear filter, search.
    await page.getByTestId("providers-status-filter").selectOption("");
    await page.getByTestId("providers-search").fill("Blackbird");
    await expect(page.getByTestId("providers-total")).toContainText(/provider/);
    const matched = await page.locator("tr[data-testid^=providers-row-]").count();
    expect(matched).toBeGreaterThan(0);

    // Empty state for a query with no matches.
    await page.getByTestId("providers-search").fill("zzz-nomatch-xyz");
    await expect(page.getByTestId("providers-empty")).toBeVisible();
  });
});
