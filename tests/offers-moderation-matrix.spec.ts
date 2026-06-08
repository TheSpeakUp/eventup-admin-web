import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

type Kind = "approve" | "reject" | "archive" | "disable" | "enable";

async function expectButton(page: Page, kind: Kind, enabled: boolean) {
  const btn = page.getByTestId(`moderation-open-${kind}`);
  if (enabled) await expect(btn).toBeEnabled();
  else {
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute("data-disabled-reason", /applies only when status is/);
  }
}

// Fixture status cycle ["on_review", "active", "disabled", "rejected", "archived"]
// → pick(cycle, i) = cycle[i % 5]. IDs chosen to hit each status once.
const CASES: { id: number; status: string; allowed: Kind[] }[] = [
  { id: 5, status: "on_review", allowed: ["approve", "reject"] },
  { id: 1, status: "active", allowed: ["archive", "disable"] },
  { id: 2, status: "disabled", allowed: ["archive", "enable"] },
  { id: 3, status: "rejected", allowed: ["archive"] },
  { id: 4, status: "archived", allowed: [] },
];

const ALL_KINDS: Kind[] = ["approve", "reject", "archive", "disable", "enable"];

for (const c of CASES) {
  test(`offer ${c.id} (${c.status}): allowed=${c.allowed.join("|") || "none"}`, async ({ page }) => {
    await loginAsMockAdmin(page, `/offers/${c.id}`);
    await page.waitForURL(`**/offers/${c.id}`);
    await expect(page.getByTestId("moderation-panel")).toHaveAttribute("data-status", c.status);
    for (const k of ALL_KINDS) {
      await expectButton(page, k, c.allowed.includes(k));
    }
  });
}
