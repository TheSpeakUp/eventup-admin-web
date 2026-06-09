// tests/categories-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Categories list", () => {
  test("renders seeded categories", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories");
    await expect(page.getByTestId("categories-table")).toBeVisible();
    // Names also appear in the slug column (case-insensitive) and the parent
    // column (a child renders its parent's name), so plain/exact text is
    // non-unique. Scope each assertion to its own row.
    await expect(
      page.getByTestId("category-row-1").getByText("Catering", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId("category-row-3").getByText("Venues", { exact: true }),
    ).toBeVisible();
  });

  test("search filters rows", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories");
    await page.getByPlaceholder("Search name or slug").fill("venue");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(
      page.getByTestId("category-row-3").getByText("Venues", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("category-row-1")).toHaveCount(0);
  });

  test("nav link is present", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByRole("link", { name: "Categories" })).toBeVisible();
  });
});
