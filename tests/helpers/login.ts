import type { Page } from "@playwright/test";

export async function loginAsMockAdmin(page: Page, next = "/services"): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(`**${next.split("?")[0]}**`);
}
