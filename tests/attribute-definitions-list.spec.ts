// tests/attribute-definitions-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions list", () => {
  test("renders seeded definitions", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions");
    await expect(
      page.getByTestId("attribute-definitions-table"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-seats"),
    ).toBeVisible();
  });

  test("search filters rows by key", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions");
    await page.getByPlaceholder("Search key or group").fill("cuisine");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-seats"),
    ).toHaveCount(0);
  });

  test("is_active filter hides inactive definitions", async ({ page }) => {
    // legacy_flag is seeded is_active=false.
    await loginAsMockAdmin(page, "/attribute-definitions?is_active=true");
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-legacy_flag"),
    ).toHaveCount(0);
  });

  test("nav link is present", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(
      page.getByRole("link", { name: "Attribute Definitions" }),
    ).toBeVisible();
  });
});
