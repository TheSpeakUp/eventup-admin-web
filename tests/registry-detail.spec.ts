import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry snapshot detail", () => {
  test("shows before/after JSON", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry/snapshots/1002", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("snapshot-detail-id")).toContainText("1002");
    await expect(page.getByTestId("snapshot-before")).toContainText("sort_order");
    await expect(page.getByTestId("snapshot-after")).toContainText("sort_order");
  });

  test("unknown id 404s", async ({ page }) => {
    // Log in first (any role) via a known-good route, then probe the 404.
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    const res = await page.goto("/registry/snapshots/99999");
    expect(res?.status()).toBe(404);
  });
});
