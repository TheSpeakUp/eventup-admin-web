// tests/promotions-catalog.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Promotions catalog (M3a)", () => {
  test("nav link opens /promotions and lands on the Products tab", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByRole("link", { name: "Promotions" }).click();
    await page.waitForURL("**/promotions");
    await expect(
      page.getByRole("heading", { name: "Promotions" }),
    ).toBeVisible();
    await expect(page.getByTestId("products-table")).toBeVisible();
    await expect(page.getByTestId("product-row-1")).toBeVisible();
  });

  test("each tab renders its own table", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions");
    await expect(page.getByTestId("products-table")).toBeVisible();

    await page.getByTestId("promotions-tab-tariffs").click();
    await page.waitForURL("**/promotions?tab=tariffs");
    await expect(page.getByTestId("tariffs-table")).toBeVisible();

    await page.getByTestId("promotions-tab-discount-rules").click();
    await page.waitForURL("**/promotions?tab=discount-rules");
    await expect(page.getByTestId("discount-rules-table")).toBeVisible();

    await page.getByTestId("promotions-tab-monthly-discounts").click();
    await page.waitForURL("**/promotions?tab=monthly-discounts");
    await expect(page.getByTestId("monthly-discounts-table")).toBeVisible();

    await page.getByTestId("promotions-tab-zones").click();
    await page.waitForURL("**/promotions?tab=zones");
    await expect(page.getByTestId("zones-table")).toBeVisible();
    await expect(page.getByTestId("zone-row-1")).toBeVisible();
  });

  test("create a product appears in the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions");
    await page.getByTestId("product-new-toggle").click();
    await page.getByTestId("product-code").fill("e2e_spotlight");
    await page
      .getByTestId("product-name-translations")
      .fill('{"en":"E2E Spotlight"}');
    await page.getByTestId("product-billing-unit").fill("week");
    await page.getByTestId("product-submit").click();

    // revalidatePath re-renders the products list with the new row.
    await expect(
      page.getByText("E2E Spotlight", { exact: true }),
    ).toBeVisible();
  });

  test("deactivate flips a product's status to Inactive", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions");
    // Create a dedicated active product so we never mutate a shared seed row
    // (single in-memory store across the whole e2e run).
    await page.getByTestId("product-new-toggle").click();
    await page.getByTestId("product-code").fill("e2e_deact");
    await page
      .getByTestId("product-name-translations")
      .fill('{"en":"E2E Deactivate Me"}');
    await page.getByTestId("product-billing-unit").fill("day");
    await page.getByTestId("product-submit").click();

    const row = page
      .locator('[data-testid^="product-row-"]')
      .filter({ hasText: "E2E Deactivate Me" });
    await expect(row).toBeVisible();
    await expect(row.getByTestId("active-badge")).toHaveAttribute(
      "data-active",
      "true",
    );

    // The deactivate button has a confirm() dialog — auto-accept it.
    page.on("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Deactivate" }).click();

    await expect(row.getByTestId("active-badge")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  test("create a zone appears in the list", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions?tab=zones");
    await page.getByTestId("zone-new-toggle").click();
    await page.getByTestId("zone-code").fill("e2e_zone");
    await page.getByTestId("zone-time-granularity").fill("day");
    await page.getByTestId("zone-max-slots").fill("3");
    await page.getByTestId("zone-submit").click();

    await expect(page.getByText("e2e_zone", { exact: true })).toBeVisible();
  });

  test("an unknown product detail id shows a not-found state", async ({
    page,
  }) => {
    // The products entity has a GET /{id} detail endpoint (wired via the
    // product detail route). A missing id renders the not-found error panel.
    await loginAsMockAdmin(page, "/promotions/products/999999");
    await expect(page.getByTestId("promotion-detail-error")).toBeVisible();
    await expect(page.getByTestId("promotion-detail-error")).toContainText(
      "No promotion product",
    );
  });

  test("a known product detail id renders the product", async ({ page }) => {
    await loginAsMockAdmin(page, "/promotions/products/1");
    await expect(page.getByTestId("promotion-detail-code")).toHaveText(
      "featured_listing",
    );
  });
});
