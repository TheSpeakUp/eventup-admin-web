import type { Page } from "@playwright/test";

type LoginOptions = {
  email?: string;
  password?: string;
};

export async function loginAsMockAdmin(
  page: Page,
  next = "/services",
  opts: LoginOptions = {},
): Promise<void> {
  const { email = "admin@example.com", password = "password" } = opts;
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(`**${next.split("?")[0]}**`);
}
