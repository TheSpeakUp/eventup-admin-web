import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

test.describe("registry rollback gating", () => {
  test("MODERATOR does not see the rollback button", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry/snapshots/1001", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("snapshot-detail-id")).toBeVisible();
    await expect(page.getByTestId("snapshot-rollback")).toHaveCount(0);
  });

  test("ADMIN rolls back → a new rollback snapshot appears", async ({ page }) => {
    // ops@example.com → ADMIN
    await loginAsMockAdmin(page, "/registry", { email: "ops@example.com" });
    const before = await page.getByTestId("registry-row").count();

    await page.goto("/registry/snapshots/1001");
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("snapshot-rollback").click();

    // action redirects back to /registry
    await expect(page).toHaveURL(/\/registry$/);
    const after = await page.getByTestId("registry-row").count();
    expect(after).toBeGreaterThan(before);
    // newest row (id DESC) is the rollback we just wrote
    const newest = page.getByTestId("registry-row").first();
    await expect(newest).toContainText("rollback");
  });
});
