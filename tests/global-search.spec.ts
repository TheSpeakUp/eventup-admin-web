import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("global header search", () => {
  test("search box is present in the shell header on every page", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByTestId("global-search-input")).toBeVisible();
    await page.getByRole("link", { name: "Providers" }).click();
    await page.waitForURL("**/providers");
    await expect(page.getByTestId("global-search-input")).toBeVisible();
  });

  test("submitting fans out to providers + services and links to detail", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");

    // Provider-only term: matches the "Blackbird Studios" provider fixture,
    // no service title contains it.
    await page.getByTestId("global-search-input").fill("Blackbird");
    await page.getByTestId("global-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=Blackbird/);

    const providersGroup = page.getByTestId("search-group-providers");
    await expect(providersGroup).toContainText("Blackbird Studios");
    await expect(page.getByTestId("search-group-services")).toContainText(
      "No matching services",
    );

    // Drill into a provider detail from the result row.
    await providersGroup.getByRole("link").first().click();
    await page.waitForURL(/\/providers\/\d+/);
  });

  test("service term surfaces matching services", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByTestId("global-search-input").fill("Photography");
    await page.getByTestId("global-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=Photography/);
    await expect(page.getByTestId("search-group-services")).toContainText(
      "Photography",
    );
  });

  test("no matches shows an empty state", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByTestId("global-search-input").fill("zzz-nomatch-xyz");
    await page.getByTestId("global-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=zzz/);
    await expect(page.getByTestId("search-empty")).toBeVisible();
  });
});
