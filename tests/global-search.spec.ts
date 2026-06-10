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

  test("submitting queries the search endpoint and links to detail", async ({
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

  test("offer term surfaces matching offers and links to detail", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    // Offers seed 1..40, so "Offer 17" is a unique title match.
    await page.getByTestId("global-search-input").fill("Offer 17");
    await page.getByTestId("global-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=Offer/);

    const offersGroup = page.getByTestId("search-group-offers");
    await expect(offersGroup).toContainText("Offer 17");
    await expect(page.getByTestId("search-group-providers")).toContainText(
      "No matching providers",
    );

    await offersGroup.getByRole("link").first().click();
    await page.waitForURL(/\/offers\/17/);
  });

  test("no matches shows an empty state", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByTestId("global-search-input").fill("zzz-nomatch-xyz");
    await page.getByTestId("global-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=zzz/);
    await expect(page.getByTestId("search-empty")).toBeVisible();
  });
});
