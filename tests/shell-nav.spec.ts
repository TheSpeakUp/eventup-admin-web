import { test, expect } from "@playwright/test";
import { SignJWT } from "jose";
import { loginAsMockAdmin } from "./helpers/login";

// The app only DECODES the access cookie (no signature verification in the
// layout or middleware), so any well-formed JWT with a future exp is accepted —
// letting us mint a non-superadmin session without a real backend.
async function setRoleSession(
  context: import("@playwright/test").BrowserContext,
  role: string,
): Promise<void> {
  const token = await new SignJWT({ email: "mod@example.com", role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("mod-1")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode("test-only-secret-not-verified-anywhere!!"));
  await context.addCookies([
    { name: "eventup_admin_access", value: token, domain: "127.0.0.1", path: "/" },
  ]);
}

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

  test("superadmin sees the Admin team nav link", async ({ page }) => {
    // Mock dev account is a SUPERADMIN.
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByRole("link", { name: "Admin team" })).toBeVisible();
  });

  test("non-superadmin does not see the Admin team nav link", async ({
    page,
    context,
  }) => {
    await setRoleSession(context, "MODERATOR");
    await page.goto("/services");
    // Shell still renders for a moderator…
    await expect(page.getByRole("link", { name: "Services" })).toBeVisible();
    // …but the SUPERADMIN-only admin-team link is hidden.
    await expect(page.getByRole("link", { name: "Admin team" })).toHaveCount(0);
  });
});
