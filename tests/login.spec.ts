import { test, expect } from "@playwright/test";

test.describe("login flow (mock auth)", () => {
  test("invalid credentials surface a form error and no cookies set", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("nope");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("login-error")).toHaveText(/invalid email or password/i);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "eventup_admin_access")).toBeUndefined();
  });

  test("valid credentials set httpOnly cookies and reach a protected route", async ({
    page,
    context,
  }) => {
    await page.goto("/login?next=/services");
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/services");
    await expect(page.getByTestId("admin-email")).toHaveText("admin@example.com");
    const cookies = await context.cookies();
    const access = cookies.find((c) => c.name === "eventup_admin_access");
    const refresh = cookies.find((c) => c.name === "eventup_admin_refresh");
    expect(access?.httpOnly).toBe(true);
    expect(access?.sameSite).toBe("Lax");
    expect(refresh?.httpOnly).toBe(true);
  });

  test("logout clears cookies and bounces back to /login", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
    await page.getByTestId("logout-button").click();
    await page.waitForURL(/\/login/);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "eventup_admin_access")).toBeUndefined();
    expect(cookies.find((c) => c.name === "eventup_admin_refresh")).toBeUndefined();
  });
});
