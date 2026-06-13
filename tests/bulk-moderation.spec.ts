import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

// Layer-4 bulk moderation. MUTATION NOTE: the mock stores persist for the
// server's lifetime and this file runs first alphabetically, so it only
// touches rows no other spec depends on: service #22 (the one on_review id
// the moderation specs don't use) + the conflict fixture #9999 (immutable —
// always 409), and offers #25/#30 (visible under the default overdue+warning queue filter; offer specs use 1/2/3/5/10).
test.describe("bulk moderation (Layer 4)", () => {
  test("services: select-all on_review limited, partial failure surfaced", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services?status=on_review");
    await expect(page.getByTestId("services-table")).toBeVisible();

    // Checkboxes exist ONLY on on_review rows (status filter shows them all).
    await expect(page.getByTestId("services-select-22")).toBeVisible();
    await expect(page.getByTestId("services-select-9999")).toBeVisible();

    // Published rows carry no checkbox.
    await page.goto("/services?status=published");
    await expect(page.getByTestId("services-table")).toBeVisible();
    const checkboxes = await page
      .locator("[data-testid^=services-select-]")
      .count();
    expect(checkboxes).toBe(1); // header select-all only, disabled
    await expect(page.getByTestId("services-select-all")).toBeDisabled();

    // Bulk approve #22 (succeeds) + #9999 (conflict fixture → 409).
    await page.goto("/services?status=on_review");
    await page.getByTestId("services-select-22").check();
    await page.getByTestId("services-select-9999").check();
    await expect(page.getByTestId("bulk-count")).toHaveText("2 selected");
    await page.getByTestId("bulk-approve").click();

    await expect(page.getByTestId("bulk-result")).toContainText("1 done");
    await expect(page.getByTestId("bulk-result")).toContainText("#9999");

    // #22 left the on_review filter (now published); #9999 stayed.
    await expect(page.getByTestId("services-select-22")).toHaveCount(0);
    await expect(page.getByTestId("services-row-9999")).toBeVisible();
  });

  test("offers: bulk reject with shared reason clears rows from the queue", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/offers");
    await expect(page.getByTestId("offers-table")).toBeVisible();
    await expect(page.getByTestId("offers-row-25")).toBeVisible();

    await page.getByTestId("offers-select-25").check();
    await page.getByTestId("offers-select-30").check();
    await expect(page.getByTestId("bulk-count")).toHaveText("2 selected");

    await page.getByTestId("bulk-reject-open").click();
    // Confirm disabled until the shared reason reaches 10 chars.
    await page.getByTestId("bulk-reject-reason").fill("short");
    await expect(page.getByTestId("bulk-reject-confirm")).toBeDisabled();
    await page.getByTestId("bulk-reject-reason").fill("Duplicate promotional content");
    await page.getByTestId("bulk-reject-confirm").click();

    await expect(page.getByTestId("bulk-result")).toContainText("2 done");
    // Rejected offers leave the on_review SLA queue.
    await expect(page.getByTestId("offers-row-25")).toHaveCount(0);
    await expect(page.getByTestId("offers-row-30")).toHaveCount(0);
  });

  test("clear selection hides the bar", async ({ page }) => {
    await loginAsMockAdmin(page, "/offers");
    await page.getByTestId("offers-select-5").check();
    await expect(page.getByTestId("bulk-count")).toHaveText("1 selected");
    await page.getByTestId("bulk-clear").click();
    await expect(page.getByTestId("bulk-bar")).toHaveCount(0);
  });
});
