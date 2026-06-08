import { test, expect } from "@playwright/test";

const HOSTILE_NEXTS = [
  { label: "protocol-relative", value: "//evil.example.com/path" },
  { label: "absolute https", value: "https://evil.example.com/" },
  { label: "javascript scheme", value: "javascript:alert(1)" },
  { label: "back to /login", value: "/login?next=/services" },
];

test.describe("login next-param sanitization", () => {
  for (const { label, value } of HOSTILE_NEXTS) {
    test(`hostile next (${label}) is replaced with "/"`, async ({ page }) => {
      await page.goto(`/login?next=${encodeURIComponent(value)}`);
      // The page render-side resolveNext should already neutralize the value;
      // the hidden input drives the post-submit redirect.
      const hiddenNext = await page.locator('input[name="next"]').inputValue();
      expect(hiddenNext).toBe("/");

      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("password");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Must land on the same-origin root, not on the hostile target.
      await page.waitForURL((url) => url.pathname === "/" && url.host === new URL(page.url()).host);
      expect(new URL(page.url()).pathname).toBe("/");
    });
  }

  test("safe next survives sanitization and routes there", async ({ page }) => {
    await page.goto(`/login?next=${encodeURIComponent("/providers")}`);
    const hiddenNext = await page.locator('input[name="next"]').inputValue();
    expect(hiddenNext).toBe("/providers");

    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/providers");
  });
});
