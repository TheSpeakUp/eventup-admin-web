import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// Mock SUPERADMIN operator (admin@example.com) — see src/lib/auth/mock.ts and
// src/mocks/admins-store.ts. GET /self resolves to this seeded row.
test.describe("Self profile", () => {
  test("shows account details, MFA badge, and a read-only email", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/profile");

    await expect(page.getByTestId("profile-heading")).toHaveText("My profile");
    await expect(page.getByTestId("profile-id")).toHaveText(
      "11111111-1111-4111-8111-111111111111",
    );
    await expect(page.getByTestId("profile-email")).toHaveText(
      "admin@example.com",
    );
    await expect(page.getByTestId("profile-role")).toHaveText("SUPERADMIN");
    await expect(page.getByTestId("mfa-method-badge")).toHaveText("Email OTP");
    await expect(page.getByTestId("mfa-enforced")).toBeVisible();
    // Email is deliberately not self-editable.
    await expect(page.getByText("Read-only")).toBeVisible();
    await expect(
      page.locator('input[name="email"]'),
    ).toHaveCount(0);
  });

  test("updates the display name and re-renders from the response", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("display-name-input").fill("Renamed Operator");
    await page.getByTestId("display-name-submit").click();

    await expect(page.getByTestId("display-name-success")).toBeVisible();
    await expect(page.getByTestId("display-name-input")).toHaveValue(
      "Renamed Operator",
    );
  });

  test("clears the display name when submitted empty", async ({ page }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("display-name-input").fill("");
    await page.getByTestId("display-name-submit").click();

    await expect(page.getByTestId("display-name-success")).toBeVisible();
    await expect(page.getByTestId("display-name-input")).toHaveValue("");
  });

  test("rejects a too-short new password", async ({ page }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("current-password-input").fill("password");
    await page.getByTestId("new-password-input").fill("short");
    await page.getByTestId("password-submit").click();

    await expect(page.getByTestId("password-error")).toContainText(
      "at least 12 characters",
    );
  });

  test("surfaces a wrong current password from the backend", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("current-password-input").fill("definitely-wrong");
    await page.getByTestId("new-password-input").fill("newsecret1234");
    await page.getByTestId("confirm-password-input").fill("newsecret1234");
    await page.getByTestId("password-submit").click();

    await expect(page.getByTestId("password-error")).toHaveText(
      "Current password is incorrect.",
    );
  });

  test("flags a confirmation mismatch before submitting", async ({ page }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("current-password-input").fill("password");
    await page.getByTestId("new-password-input").fill("newsecret1234");
    await page.getByTestId("confirm-password-input").fill("newsecret9999");
    await page.getByTestId("password-submit").click();

    await expect(page.getByTestId("password-error")).toContainText(
      "do not match",
    );
  });

  test("changes the password successfully", async ({ page }) => {
    await loginAsMockAdmin(page, "/profile");

    await page.getByTestId("current-password-input").fill("password");
    await page.getByTestId("new-password-input").fill("newsecret1234");
    await page.getByTestId("confirm-password-input").fill("newsecret1234");
    await page.getByTestId("password-submit").click();

    await expect(page.getByTestId("password-success")).toBeVisible();
    await expect(page.getByTestId("password-error")).toHaveCount(0);
  });

  test("lists recent sign-in history", async ({ page }) => {
    await loginAsMockAdmin(page, "/profile");

    await expect(page.getByTestId("login-history-table")).toBeVisible();
    await expect(page.getByTestId("login-history-table")).toContainText(
      "203.0.113.7",
    );
  });

  test("sidebar account block links to the profile", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");

    const account = page.getByTestId("sidebar-account");
    await expect(account).toBeVisible();
    await expect(page.getByTestId("sidebar-account-mfa")).toContainText(
      "Email OTP",
    );
    await account.click();
    await page.waitForURL("**/profile");
    await expect(page.getByTestId("profile-heading")).toBeVisible();
  });
});
