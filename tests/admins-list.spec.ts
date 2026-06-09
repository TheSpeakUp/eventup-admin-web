import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Admin team list", () => {
  test("renders admins + invitations, sends an invite", async ({ page }) => {
    await loginAsMockAdmin(page, "/admins");

    await expect(page.getByRole("heading", { name: "Admin team" })).toBeVisible();
    await expect(page.getByTestId("admins-table")).toBeVisible();
    await expect(page.getByTestId("admins-count")).toHaveText("3 admins");

    // Pending invitations seeded with one row.
    await expect(page.getByTestId("invitations-table")).toBeVisible();

    // Invite a new admin.
    await page.getByTestId("invite-email").fill("fresh.admin@example.com");
    await page.getByTestId("invite-role").selectOption("ADMIN");
    await page.getByTestId("invite-submit").click();

    await expect(page.getByTestId("invite-success")).toContainText(
      "fresh.admin@example.com",
    );
  });

  test("navigates to admin detail via Manage", async ({ page }) => {
    await loginAsMockAdmin(page, "/admins");
    await page.getByRole("link", { name: "Manage" }).first().click();
    await page.waitForURL(/\/admins\/[0-9a-f-]+$/);
    await expect(page.getByTestId("admin-detail-email")).toBeVisible();
  });

  test("rejects duplicate-email invite with backend error", async ({ page }) => {
    await loginAsMockAdmin(page, "/admins");
    await page.getByTestId("invite-email").fill("admin@example.com"); // already an admin
    await page.getByTestId("invite-submit").click();
    await expect(page.getByTestId("invite-error")).toContainText(
      "already exists",
    );
  });
});
