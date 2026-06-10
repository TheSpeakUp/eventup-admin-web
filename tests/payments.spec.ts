import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("payments (read-only)", () => {
  test("nav opens /payments and the list renders with offset paging", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");

    // Reach payments via the sidebar nav link.
    await page.getByRole("link", { name: "Payments" }).click();
    await page.waitForURL("**/payments");
    await expect(
      page.getByRole("heading", { name: "Payments" }),
    ).toBeVisible();
    await expect(page.getByTestId("payments-table")).toBeVisible();

    // 13 fixtures (12 list seeds + 1 full-reference detail row), LIMIT=10.
    await expect(page.getByTestId("payments-total")).toHaveText(
      "13 payments total",
    );
    const page1Rows = await page
      .locator("tr[data-testid^=payments-row-]")
      .count();
    expect(page1Rows).toBe(10);
    await expect(page.getByTestId("payments-range")).toHaveText("1–10 of 13");

    // Forward offset pagination.
    await page.getByTestId("payments-next").click();
    await page.waitForURL(/offset=10/);
    const page2Rows = await page
      .locator("tr[data-testid^=payments-row-]")
      .count();
    expect(page2Rows).toBe(3);
    await expect(page.getByTestId("payments-range")).toHaveText("11–13 of 13");

    // Back to page 1.
    await page.getByTestId("payments-prev").click();
    await page.waitForURL((url) => !url.search.includes("offset"));
    await expect(page.getByTestId("payments-range")).toHaveText("1–10 of 13");
  });

  test("status filter narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/payments");

    await page
      .getByTestId("payments-status-filter")
      .selectOption("succeeded");
    await page.waitForURL(/status=succeeded/);

    const rows = await page
      .locator("tr[data-testid^=payments-row-]")
      .count();
    expect(rows).toBeGreaterThan(0);
    // Every visible badge must be the filtered status.
    const badges = page.getByTestId("payment-status-badge");
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveAttribute("data-status", "succeeded");
    }

    // Currency filter composes with status and resets the offset. The only
    // AED charge in the fixtures is `failed`, so succeeded+AED is empty.
    await page.getByTestId("payments-currency-filter").selectOption("AED");
    await page.waitForURL(/currency=AED/);
    await expect(page.getByTestId("payments-empty")).toBeVisible();
  });

  test("free-text search narrows the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/payments");
    await page.getByTestId("payments-search").fill("Aurora");
    await page.waitForURL(/q=Aurora/);
    const matched = await page
      .locator("tr[data-testid^=payments-row-]")
      .count();
    expect(matched).toBeGreaterThan(0);

    await page.getByTestId("payments-search").fill("zzz-nomatch-xyz");
    await expect(page.getByTestId("payments-empty")).toBeVisible();
  });

  test("row opens detail with all fields + formatted money, no action controls", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/payments");

    // Rows are ordered id DESC, so the full-reference fixture (id 9001,
    // succeeded USD, every Stripe field populated) is first on page 1.
    await page.getByTestId("payments-row-link-9001").click();
    await page.waitForURL("**/payments/9001");
    await expect(
      page.getByTestId("payment-detail-title"),
    ).toHaveText("Payment #9001");

    // Money rendered as a localized currency string (not raw minor units):
    // 250000 minor USD → $2,500.00.
    await expect(page.getByTestId("payment-field-amount")).toContainText("$");
    await expect(page.getByTestId("payment-field-amount")).toContainText(
      "2,500.00",
    );

    // Schema fields are present.
    await expect(page.getByTestId("payment-field-currency")).toHaveText("USD");
    await expect(page.getByTestId("payment-field-provider")).toHaveText(
      "stripe",
    );
    await expect(
      page.getByTestId("payment-field-checkout-session"),
    ).toBeVisible();
    await expect(page.getByTestId("payment-field-created")).toBeVisible();
    await expect(page.getByTestId("payment-field-updated")).toBeVisible();

    // SCOPE GUARD: no refund / write / action control on the detail surface.
    // (The only chrome buttons are the shared shell header's logout — scope
    // the no-button assertion to the detail card.)
    await expect(
      page.getByRole("button", { name: /refund/i }),
    ).toHaveCount(0);
    await expect(page.getByText(/refund/i)).toHaveCount(0);
    const detailCard = page
      .getByTestId("payment-detail-title")
      .locator("xpath=ancestor::div[contains(@class,'rounded-md')][1]");
    await expect(detailCard.getByRole("button")).toHaveCount(0);
  });

  test("zero-decimal currency (JPY) renders without fractional units", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/payments");
    // Row #8 is the JPY charge (50000 minor == ¥50,000, no decimals).
    await page.getByTestId("payments-row-link-8").click();
    await page.waitForURL("**/payments/8");
    await expect(page.getByTestId("payment-field-currency")).toHaveText("JPY");
    await expect(page.getByTestId("payment-field-amount")).toContainText(
      "50,000",
    );
    await expect(page.getByTestId("payment-field-amount")).not.toContainText(
      ".00",
    );
  });

  test("unknown payment id renders the not-found panel", async ({ page }) => {
    await loginAsMockAdmin(page, "/payments");
    const res = await page.goto("/payments/99999");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByText("This page could not be found."),
    ).toBeVisible();
  });
});
