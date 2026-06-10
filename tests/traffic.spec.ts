import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("traffic analytics (M2)", () => {
  test("nav link opens traffic; summary cards + trend render", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByRole("link", { name: "Traffic" }).click();
    await page.waitForURL("**/traffic");

    await expect(page.getByRole("heading", { name: "Traffic" })).toBeVisible();
    await expect(page.getByTestId("card-views")).toBeVisible();
    await expect(page.getByTestId("card-clicks")).toBeVisible();
    await expect(page.getByTestId("card-ctr")).toBeVisible();
    await expect(page.getByTestId("trend-sparkline")).toBeVisible();
  });

  test("top + anti-top tables render and type switch toggles dimension", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/traffic");
    await expect(page.getByTestId("traffic-top-table")).toBeVisible();
    await expect(page.getByTestId("traffic-antitop-table")).toBeVisible();

    // Default dimension is service.
    await expect(page.getByTestId("traffic-type-service")).toHaveAttribute(
      "data-active",
      "true",
    );

    await page.getByTestId("traffic-type-offer").click();
    await page.waitForURL(/type=offer/);
    await expect(page.getByTestId("traffic-type-offer")).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(page.getByTestId("traffic-top-table")).toContainText(
      "Offer listing",
    );
  });

  test("drill from a top row into listing detail", async ({ page }) => {
    await loginAsMockAdmin(page, "/traffic");
    await page
      .getByTestId("traffic-top-table-row-1")
      .getByRole("link")
      .click();
    await page.waitForURL(/\/traffic\/listings\/service\/1/);
    await expect(page.getByTestId("listing-detail-cards")).toBeVisible();
    await expect(page.getByTestId("trend-sparkline")).toBeVisible();
  });

  test("unknown listing surfaces a 404 message", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await page.goto("/traffic/listings/service/999999");
    await expect(page.getByTestId("listing-detail-error")).toBeVisible();
  });

  test("CSV export button is present and enabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/traffic");
    await expect(page.getByTestId("traffic-export-csv")).toBeEnabled();
  });
});
