import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// The rich full-reference fixture id (every field + nested metadata). Newest
// occurred_at (2026-05-29) so it sorts first on page 1.
const RICH_EVENT_ID = "aaaaaaaa-0000-4000-8000-000000000099";

test.describe("audit log (read-only)", () => {
  test("nav opens /audit and the list renders with offset paging", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");

    await page.getByRole("link", { name: "Audit log" }).click();
    await page.waitForURL("**/audit");
    await expect(
      page.getByRole("heading", { name: "Audit log" }),
    ).toBeVisible();
    await expect(page.getByTestId("audit-table")).toBeVisible();

    // 13 fixtures (12 seeds + 1 rich-reference), LIMIT=10.
    await expect(page.getByTestId("audit-total")).toHaveText("13 events total");
    const page1Rows = await page
      .locator("tr[data-testid^=audit-row-]")
      .count();
    expect(page1Rows).toBe(10);
    await expect(page.getByTestId("audit-range")).toHaveText("1–10 of 13");

    // Forward offset pagination.
    await page.getByTestId("audit-next").click();
    await page.waitForURL(/offset=10/);
    const page2Rows = await page
      .locator("tr[data-testid^=audit-row-]")
      .count();
    expect(page2Rows).toBe(3);
    await expect(page.getByTestId("audit-range")).toHaveText("11–13 of 13");

    // Back to page 1.
    await page.getByTestId("audit-prev").click();
    await page.waitForURL((url) => !url.search.includes("offset"));
    await expect(page.getByTestId("audit-range")).toHaveText("1–10 of 13");
  });

  test("success/failure filter narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/audit");

    // Only failure / denied events have success=false (2 fixtures).
    await page.getByTestId("audit-success-filter").selectOption("false");
    await page.waitForURL(/success=false/);

    const rows = await page
      .locator("tr[data-testid^=audit-row-]")
      .count();
    expect(rows).toBeGreaterThan(0);
    // Every visible badge must carry a non-success outcome.
    const badges = page.getByTestId("audit-outcome-badge");
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      const outcome = await badges.nth(i).getAttribute("data-outcome");
      expect(outcome).not.toBe("success");
    }
  });

  test("actor filter narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/audit");

    await page.getByTestId("audit-actor-filter").fill("ops@example.com");
    await page.waitForURL(/actor_email=ops/);
    const matched = await page
      .locator("tr[data-testid^=audit-row-]")
      .count();
    expect(matched).toBeGreaterThan(0);

    await page.getByTestId("audit-actor-filter").fill("zzz-nobody@example.com");
    await expect(page.getByTestId("audit-empty")).toBeVisible();
  });

  test("action filter narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/audit");
    await page.getByTestId("audit-action-filter").fill("login");
    await page.waitForURL(/action=login/);
    const rows = page.locator("tr[data-testid^=audit-row-]");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("row opens detail showing fields + the metadata JSON, no action controls", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/audit");

    // The rich fixture sorts first (newest). Deep-link it by id.
    await page.getByTestId(`audit-row-link-${RICH_EVENT_ID}`).click();
    await page.waitForURL(`**/audit/${RICH_EVENT_ID}`);

    await expect(page.getByTestId("audit-detail-title")).toHaveText(
      "service.field.update",
    );

    // Top-level schema fields render.
    await expect(page.getByTestId("audit-field-id")).toContainText(
      RICH_EVENT_ID,
    );
    await expect(page.getByTestId("audit-field-realm")).toHaveText("admin");
    await expect(page.getByTestId("audit-field-actor-email")).toHaveText(
      "admin@example.com",
    );
    await expect(page.getByTestId("audit-field-entity-type")).toHaveText(
      "service",
    );
    await expect(page.getByTestId("audit-field-method")).toHaveText("PATCH");
    await expect(page.getByTestId("audit-field-occurred")).toBeVisible();

    // The metadata + details JSON payloads render readably.
    const metadata = page.getByTestId("audit-metadata");
    await expect(metadata).toBeVisible();
    await expect(metadata).toContainText("changed_fields");
    await expect(metadata).toContainText("base_price_minor");
    await expect(page.getByTestId("audit-details")).toContainText(
      "approved_by",
    );

    // SCOPE GUARD: this surface is read-only — no mutating control anywhere on
    // the detail card.
    const detailCard = page
      .getByTestId("audit-detail-title")
      .locator("xpath=ancestor::div[contains(@class,'rounded-md')][1]");
    await expect(detailCard.getByRole("button")).toHaveCount(0);
    await expect(detailCard.locator("form")).toHaveCount(0);
    await expect(detailCard.locator("input")).toHaveCount(0);
  });

  test("unknown event id renders the not-found panel", async ({ page }) => {
    await loginAsMockAdmin(page, "/audit");
    const res = await page.goto("/audit/ffffffff-0000-4000-8000-000000000000");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByText("This page could not be found."),
    ).toBeVisible();
  });
});
