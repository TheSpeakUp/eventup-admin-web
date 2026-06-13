import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("services list", () => {
  test("page renders cursor envelope, paginates forward, filters by status, searches", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");

    await expect(page.getByRole("heading", { name: "Services moderation" })).toBeVisible();
    await expect(page.getByTestId("services-table")).toBeVisible();
    // Admin polish: provider column renders the resolved name, not "#id".
    await expect(
      page.getByTestId("services-table").getByText(/Provider \d+ Studio/).first(),
    ).toBeVisible();

    // Page-1 shows LIMIT=10 rows out of 26 total fixtures.
    await expect(page.getByTestId("services-count")).toHaveText("10 services on this page");
    const initialRows = await page.locator("tr[data-testid^=services-row-]").count();
    expect(initialRows).toBe(10);

    // Forward-only cursor pagination — Next exists, First is disabled on page 1.
    await expect(page.getByTestId("services-next")).toBeVisible();
    await page.getByTestId("services-next").click();
    await page.waitForURL(/last_id=/);
    const page2Rows = await page.locator("tr[data-testid^=services-row-]").count();
    expect(page2Rows).toBeGreaterThan(0);
    expect(page2Rows).toBeLessThanOrEqual(10);
    // First link active on subsequent pages.
    await page.getByTestId("services-first").click();
    await page.waitForURL((url) => !url.search.includes("last_id"));
    await expect(page.getByTestId("services-count")).toHaveText("10 services on this page");

    // Status filter narrows the row set — a visible segmented control, not a
    // hidden dropdown.
    await page.getByTestId("services-status-published").click();
    await page.waitForURL(/status=published/);
    const publishedRows = await page.locator("tr[data-testid^=services-row-]").count();
    expect(publishedRows).toBeGreaterThan(0);
    const badges = await page.getByTestId("status-badge").all();
    for (const b of badges) {
      await expect(b).toHaveAttribute("data-status", "published");
    }

    // Clear filter via the "All" segment, then search by title.
    await page.getByTestId("services-status-all").click();
    await page.getByTestId("services-search").fill("Catering");
    await page.waitForURL(/search=Catering/);
    const matched = await page.locator("tr[data-testid^=services-row-]").count();
    expect(matched).toBeGreaterThan(0);

    // Empty state for a query with no matches.
    await page.getByTestId("services-search").fill("zzz-nomatch-xyz");
    await expect(page.getByTestId("services-empty")).toBeVisible();
  });
});
