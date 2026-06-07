import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("services list", () => {
  test("page renders mock fixtures, paginates, filters by status, searches", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");

    await expect(page.getByRole("heading", { name: "Services moderation" })).toBeVisible();
    await expect(page.getByTestId("services-table")).toBeVisible();
    await expect(page.getByTestId("services-total")).toHaveText("26 services");

    // Default page shows first 10 rows.
    const initialRows = await page.locator("tr[data-testid^=services-row-]").count();
    expect(initialRows).toBe(10);

    // Pagination — next/prev work.
    await page.getByTestId("services-next").click();
    await expect(page.getByTestId("services-page-indicator")).toHaveText("Page 2 of 3");
    await page.getByTestId("services-prev").click();
    await expect(page.getByTestId("services-page-indicator")).toHaveText("Page 1 of 3");

    // Status filter narrows the row count.
    await page.getByTestId("services-status-filter").selectOption("published");
    await expect(page.getByTestId("services-total")).not.toHaveText("26 services");
    const publishedRows = await page.locator("tr[data-testid^=services-row-]").count();
    expect(publishedRows).toBeGreaterThan(0);
    // All visible badges must be Published.
    const badges = await page.getByTestId("status-badge").all();
    for (const b of badges) {
      await expect(b).toHaveAttribute("data-status", "published");
    }

    // Clear filter, search.
    await page.getByTestId("services-status-filter").selectOption("");
    await page.getByTestId("services-search").fill("Catering");
    await expect(page.getByTestId("services-total")).toContainText(/service/);
    const matched = await page.locator("tr[data-testid^=services-row-]").count();
    expect(matched).toBeGreaterThan(0);

    // Empty state for a query with no matches.
    await page.getByTestId("services-search").fill("zzz-nomatch-xyz");
    await expect(page.getByTestId("services-empty")).toBeVisible();
  });
});
