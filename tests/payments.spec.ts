import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("payments", () => {
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

  test("row opens detail with all fields + formatted money + refund panel", async ({
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

    // Refund panel (M5 refund-write) renders with the full gross refundable
    // (237500 minor USD) and no history yet. No mutation here — later refund
    // tests use other fixture ids so this read stays pristine.
    await expect(page.getByTestId("refund-panel")).toBeVisible();
    await expect(page.getByTestId("refundable-total")).toContainText(
      "2,375.00",
    );
    await expect(page.getByTestId("refunds-empty")).toBeVisible();
    await expect(page.getByTestId("refund-open")).toBeEnabled();
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

  // ---- M5 refund-write -----------------------------------------------
  // Mutating tests run LAST and use fixture ids the read tests above never
  // assert on (store mutations persist for the server's lifetime).

  test("full refund flips status to refunded and disables the action", async ({
    page,
  }) => {
    // id 11: succeeded EUR 21000 + 5% tax → gross 22050 refundable.
    await loginAsMockAdmin(page, "/payments/11");
    await expect(page.getByTestId("refund-open")).toBeEnabled();

    await page.getByTestId("refund-open").click();
    // Empty amount ⇒ full refund; dialog states the revoke consequence.
    await expect(page.getByTestId("refund-form")).toContainText(
      "Full refund",
    );
    await page.getByTestId("refund-reason").fill("duplicate charge");
    await page.getByTestId("refund-submit").click();

    await expect(page.getByTestId("payment-status-badge")).toHaveAttribute(
      "data-status",
      "refunded",
    );
    await expect(page.getByTestId("refunded-total")).toContainText("220.50");
    await expect(page.getByTestId("refund-open")).toBeDisabled();
    await expect(page.getByTestId("refunds-table")).toContainText(
      "duplicate charge",
    );
  });

  test("partial refund keeps payment refundable", async ({ page }) => {
    // id 2: succeeded EUR 8000 + 400 tax → gross 8400 refundable.
    await loginAsMockAdmin(page, "/payments/2");
    await page.getByTestId("refund-open").click();

    // 10.00 EUR → 1000 minor; dialog flags it as partial.
    await page.getByTestId("refund-amount").fill("10");
    await expect(page.getByTestId("refund-form")).toContainText(
      "Partial refund",
    );
    await page.getByTestId("refund-submit").click();

    await expect(page.getByTestId("payment-status-badge")).toHaveAttribute(
      "data-status",
      "partially_refunded",
    );
    await expect(page.getByTestId("refunded-total")).toContainText("10.00");
    await expect(page.getByTestId("refundable-total")).toContainText("74.00");
    // Still refundable — the action stays armed for the remainder.
    await expect(page.getByTestId("refund-open")).toBeEnabled();
    await expect(page.getByTestId("refunds-table")).toBeVisible();
  });

  test("over-amount is blocked client-side", async ({ page }) => {
    // id 9: succeeded USD 9900 + 495 tax → gross 10395 refundable.
    await loginAsMockAdmin(page, "/payments/9");
    await page.getByTestId("refund-open").click();
    await page.getByTestId("refund-amount").fill("99999");
    await expect(page.getByTestId("refund-amount-error")).toBeVisible();
    await expect(page.getByTestId("refund-submit")).toBeDisabled();
  });

  test("non-refundable payment has the action disabled", async ({ page }) => {
    // id 5: failed AED payment — backend reports refundable 0.
    await loginAsMockAdmin(page, "/payments/5");
    await expect(page.getByTestId("refund-panel")).toBeVisible();
    await expect(page.getByTestId("refund-open")).toBeDisabled();
  });
});
