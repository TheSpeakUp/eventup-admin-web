// tests/category-bindings-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Category bindings list", () => {
  test("renders seeded bindings with flag columns", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes");
    await expect(page.getByTestId("bindings-table")).toBeVisible();
    await expect(page.getByTestId("binding-row-cuisine")).toBeVisible();
    const seats = page.getByTestId("binding-row-seats");
    await expect(seats).toBeVisible();
    // seats is seeded is_visible_in_card=false → its card cell reads "no".
    await expect(seats).toContainText("no");
  });

  test("empty state on a category with no bindings", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/3/attributes");
    await expect(page.getByTestId("bindings-empty")).toBeVisible();
  });

  test("unknown category renders 404", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/99999/attributes");
    await expect(
      page.getByRole("heading", { name: /This page could not be found/ }),
    ).toBeVisible();
  });

  test("category detail links to the bindings page", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1");
    await page.getByTestId("category-attributes-link").click();
    await page.waitForURL("**/categories/1/attributes");
    await expect(page.getByTestId("bindings-table")).toBeVisible();
  });
});
