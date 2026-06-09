import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("admin shell navigation", () => {
  test("sidebar links navigate between Services and Providers; admin email persists", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByRole("heading", { name: "Services moderation" })).toBeVisible();
    await expect(page.getByTestId("admin-email")).toHaveText("admin@example.com");

    await page.getByRole("link", { name: "Providers" }).click();
    await page.waitForURL("**/providers");
    await expect(page.getByRole("heading", { name: "Providers moderation" })).toBeVisible();
    await expect(page.getByTestId("admin-email")).toHaveText("admin@example.com");

    await page.getByRole("link", { name: "Services" }).click();
    await page.waitForURL("**/services");
    await expect(page.getByRole("heading", { name: "Services moderation" })).toBeVisible();
  });

  test("EventUp Admin brand link returns to root", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers");
    await page.getByRole("link", { name: "EventUp Admin" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    // Root is still inside the authed shell, so admin-email stays present.
    await expect(page.getByTestId("admin-email")).toHaveText("admin@example.com");
  });

  test("SUPERADMIN sees the Admin team nav link", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(
      page.getByRole("link", { name: "Admin team" }),
    ).toBeVisible();
  });

  test("non-SUPERADMIN does not see the Admin team nav link", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services", { email: "mod@example.com" });
    await expect(page.getByTestId("admin-email")).toHaveText("mod@example.com");
    // Sibling links still render — only the SUPERADMIN-gated one is hidden.
    await expect(page.getByRole("link", { name: "Services" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Admin team" }),
    ).toHaveCount(0);
  });
});
