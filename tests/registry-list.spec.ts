import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry snapshots list", () => {
  test("renders seeded snapshots", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await expect(page.getByTestId("registry-table")).toBeVisible();
    await expect(page.getByTestId("registry-row").first()).toBeVisible();
  });

  test("attribute_key filter narrows rows", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("registry-filter-attribute-key").fill("cuisine");
    await page.getByTestId("registry-filter-apply").click();
    await expect(page).toHaveURL(/attribute_key=cuisine/);
    const rows = page.getByTestId("registry-row");
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText("cuisine");
    }
  });
});
