import { test, expect } from "@playwright/test";

test.describe("Invitation accept (public, unauthenticated)", () => {
  test("renders without auth shell", async ({ page }) => {
    await page.goto("/invitations/some-valid-token");
    await expect(
      page.getByRole("heading", { name: "Activate your admin account" }),
    ).toBeVisible();
    await expect(page.getByTestId("accept-form")).toBeVisible();
    // No authenticated shell nav on the public page.
    await expect(page.getByRole("link", { name: "Admin team" })).toHaveCount(0);
  });

  test("rejects mismatched passwords client-side", async ({ page }) => {
    await page.goto("/invitations/some-valid-token");
    await page.getByTestId("accept-password").fill("longenoughpass1");
    await page.getByTestId("accept-confirm").fill("differentpass12");
    await page.getByTestId("accept-submit").click();
    await expect(page.getByTestId("accept-error")).toContainText(
      "do not match",
    );
  });

  test("accepts a valid token and redirects to login", async ({ page }) => {
    await page.goto("/invitations/some-valid-token");
    await page.getByTestId("accept-password").fill("brand-new-pass-1");
    await page.getByTestId("accept-confirm").fill("brand-new-pass-1");
    await page.getByTestId("accept-submit").click();
    await page.waitForURL(/\/login/);
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("surfaces an expired-token error from the backend", async ({ page }) => {
    await page.goto("/invitations/expired-token");
    await page.getByTestId("accept-password").fill("brand-new-pass-1");
    await page.getByTestId("accept-confirm").fill("brand-new-pass-1");
    await page.getByTestId("accept-submit").click();
    await expect(page.getByTestId("accept-error")).toContainText("expired");
  });
});
