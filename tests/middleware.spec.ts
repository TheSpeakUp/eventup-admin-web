import { test, expect } from "@playwright/test";

test.describe("auth middleware", () => {
  test("unauth /services redirects to /login with next param", async ({ page }) => {
    const res = await page.goto("/services");
    await expect(page).toHaveURL(/\/login\?next=%2Fservices/);
    expect(res?.status()).toBeLessThan(400);
  });

  test("unauth root redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("expired cookie redirects and is cleared", async ({ context, page }) => {
    // exp far in the past: token is "<header>.<payload>.<sig>" base64url
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "x", email: "x@example.com", exp: 1 }),
    ).toString("base64url");
    const expired = `${header}.${payload}.`;
    await context.addCookies([
      {
        name: "eventup_admin_access",
        value: expired,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/providers");
    await expect(page).toHaveURL(/\/login\?next=%2Fproviders/);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "eventup_admin_access")).toBeUndefined();
  });

  test("login page itself is reachable without auth", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId("login-form")).toBeVisible();
  });
});
