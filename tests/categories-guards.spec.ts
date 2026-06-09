import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Categories role gating", () => {
  test("MODERATOR sees the edit form but no delete button", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/categories/3", { email: "mod@example.com" });
    await expect(page.getByTestId("category-form")).toBeVisible();
    await expect(page.getByTestId("category-delete")).toHaveCount(0);
  });

  test("ADMIN can delete a leaf category", async ({ page }) => {
    // Create a throwaway category, then delete THAT one — never the seeded
    // Venues(id3), because the alphabetically-later categories-list spec shares
    // this in-memory store and asserts the seeded rows still exist.
    await loginAsMockAdmin(page, "/categories/new", { email: "ops@example.com" });
    await page.getByTestId("category-name").fill("Throwaway");
    await page.getByTestId("category-slug").fill("throwaway");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Throwaway",
    );

    page.on("dialog", (d) => d.accept());
    await expect(page.getByTestId("category-delete")).toBeVisible();
    await page.getByTestId("category-delete").click();
    await page.waitForURL("**/categories");
    await expect(page.getByText("Throwaway")).toHaveCount(0);
  });

  test("deleting a parent with children is rejected", async ({ page }) => {
    // Catering(id1) has child Buffet Catering(id2) → 409, no actual deletion,
    // so the seeded store is left intact for the later list spec.
    await loginAsMockAdmin(page, "/categories/1", { email: "ops@example.com" });
    page.on("dialog", (d) => d.accept());
    await expect(page.getByTestId("category-delete")).toBeVisible();
    await page.getByTestId("category-delete").click();
    await expect(page.getByTestId("category-delete-error")).toContainText(
      "child categories",
    );
  });
});
