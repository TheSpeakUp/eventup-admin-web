import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry revalidation panel", () => {
  test("running with defaults renders result counts", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("revalidation-run").click();
    await expect(page.getByTestId("revalidation-result")).toBeVisible();
    await expect(page.getByTestId("revalidation-processed")).toContainText(/\d+/);
  });

  test("invalid category id shows a field error, no result", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("revalidation-category-ids").fill("abc");
    await page.getByTestId("revalidation-run").click();
    await expect(page.getByTestId("revalidation-error")).toContainText("Invalid id");
    await expect(page.getByTestId("revalidation-result")).toHaveCount(0);
  });
});
