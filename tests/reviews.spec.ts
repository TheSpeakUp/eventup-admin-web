// tests/reviews.spec.ts
//
// Reviews moderation surface (Layer 4). The mock store is a single in-memory
// instance across the whole e2e run, so mutating tests are ordered. admin@example.com
// = SUPERADMIN (write controls visible); mod@example.com = MODERATOR (non-super,
// write controls hidden). Fixtures include 13 reviews across statuses
// (published/hidden/removed), ratings (1-5), with some having provider replies.
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Reviews moderation (Layer 4)", () => {
  test("reviews list renders with filters as SUPERADMIN", async ({ page }) => {
    await loginAsMockAdmin(page, "/reviews");
    await expect(page.getByTestId("reviews-table")).toBeVisible();
    // #1 is seeded published with a reply; should be first in DESC id order.
    await expect(page.getByTestId("reviews-row-13")).toBeVisible();
    await expect(page.getByTestId("reviews-filter")).toBeVisible();
    await expect(page.getByTestId("reviews-filter-status")).toBeVisible();
    await expect(page.getByTestId("reviews-filter-rating")).toBeVisible();
  });

  test("status filter narrows the reviews list", async ({ page }) => {
    await loginAsMockAdmin(page, "/reviews?status=published");
    // Only published reviews should show (fixtures: 1, 2, 3, 4, 5, 9, 10, 11, 12)
    await expect(page.getByTestId("reviews-row-1")).toBeVisible();
    await expect(page.getByTestId("reviews-row-6")).toHaveCount(0); // 6 is hidden

    await page.getByTestId("reviews-filter-status").selectOption("hidden");
    await page.waitForURL("**/reviews?status=hidden");
    // Hidden reviews should show (fixtures: 6, 7, 13)
    await expect(page.getByTestId("reviews-row-6")).toBeVisible();
    await expect(page.getByTestId("reviews-row-1")).toHaveCount(0); // 1 is published
  });

  test("rating filter narrows the reviews list", async ({ page }) => {
    await loginAsMockAdmin(page, "/reviews?rating=5");
    // 5-star reviews (fixtures: 1, 3, 7, 11)
    await expect(page.getByTestId("reviews-row-1")).toBeVisible();
    await expect(page.getByTestId("reviews-row-3")).toBeVisible();
    // 4-star reviews should not show
    await expect(page.getByTestId("reviews-row-2")).toHaveCount(0);

    await page.getByTestId("reviews-filter-rating").selectOption("1");
    await page.waitForURL("**/reviews?rating=1");
    // 1-star reviews (fixtures: 6, 13)
    await expect(page.getByTestId("reviews-row-6")).toBeVisible();
    await expect(page.getByTestId("reviews-row-13")).toBeVisible();
  });

  test("search filter finds reviews by body", async ({ page }) => {
    await loginAsMockAdmin(page, "/reviews");
    const searchInput = page.getByTestId("reviews-filter-search");
    await searchInput.fill("Exceptional");
    await page.waitForURL("**/reviews?q=Exceptional");
    // Only review #1 contains "Exceptional"
    await expect(page.getByTestId("reviews-row-1")).toBeVisible();
    await expect(page.getByTestId("reviews-row-2")).toHaveCount(0);
  });

  test("hide a published review (SUPERADMIN)", async ({ page }) => {
    // Mutates shared store: review #1 (published) → hidden. This test assumes
    // it runs and mutates the store exactly once per test session.
    await loginAsMockAdmin(page, "/reviews?status=published");
    const row = page.getByTestId("reviews-row-1");
    await expect(row).toBeVisible();

    // Select "Hide" action and submit the form
    const form = row.getByTestId("review-moderate-1-form");
    await form.getByTestId("review-moderate-1-action").selectOption("hide");
    await form.getByTestId("review-moderate-1").click();

    // After the action completes (revalidatePath), the row should disappear
    // from the published filter.
    await expect(page.getByTestId("reviews-row-1")).toHaveCount(0);

    // Switch to hidden filter and confirm it now shows as Hidden.
    await page.goto("/reviews?status=hidden");
    await expect(page.getByTestId("reviews-row-1")).toBeVisible();
  });

  test("restore a hidden review (SUPERADMIN)", async ({ page }) => {
    // Mutates shared store: review #2 (published) → hidden, then back to published.
    // Uses a different review than the hide test to avoid store state conflicts.
    await loginAsMockAdmin(page, "/reviews?status=published");
    await expect(page.getByTestId("reviews-row-2")).toBeVisible();

    // Hide it
    const row = page.getByTestId("reviews-row-2");
    const form = row.getByTestId("review-moderate-2-form");
    await form.getByTestId("review-moderate-2-action").selectOption("hide");
    await form.getByTestId("review-moderate-2").click();
    await expect(page.getByTestId("reviews-row-2")).toHaveCount(0);

    // Navigate to hidden filter and restore it
    await page.goto("/reviews?status=hidden");
    await expect(page.getByTestId("reviews-row-2")).toBeVisible();
    const hiddenRow = page.getByTestId("reviews-row-2");
    const hiddenForm = hiddenRow.getByTestId("review-moderate-2-form");
    await hiddenForm.getByTestId("review-moderate-2-action").selectOption("restore");
    await hiddenForm.getByTestId("review-moderate-2").click();
    await expect(page.getByTestId("reviews-row-2")).toHaveCount(0);

    // Switch back to published to confirm
    await page.goto("/reviews?status=published");
    await expect(page.getByTestId("reviews-row-2")).toBeVisible();
  });

  test("hide a provider reply (SUPERADMIN)", async ({ page }) => {
    // Review #3 is seeded with a published reply. Hide it.
    await loginAsMockAdmin(page, "/reviews");
    const row = page.getByTestId("reviews-row-3");
    await expect(row.getByTestId("reply-moderate-3-form")).toBeVisible();

    await row.getByTestId("reply-moderate-3").click();

    // After revalidatePath, the form should disappear (or be disabled) because
    // the reply is now hidden.
    // For now, we verify via going to the same URL (a simple refresh).
    await page.goto("/reviews");
    const refreshedRow = page.getByTestId("reviews-row-3");
    // The reply button should now say "Restore reply" instead of "Hide reply"
    // (status changed to hidden).
    await expect(
      refreshedRow.getByTestId("reply-moderate-3"),
    ).toContainText("Restore reply");
  });

  test("restore a hidden provider reply (SUPERADMIN)", async ({ page }) => {
    // Review #9 is seeded with a published reply. Hide it, then restore it.
    await loginAsMockAdmin(page, "/reviews");
    const row = page.getByTestId("reviews-row-9");
    await expect(row.getByTestId("reply-moderate-9-form")).toBeVisible();

    // Hide the reply
    await row.getByTestId("reply-moderate-9").click();

    // Refresh and confirm it's now in "Restore" mode
    await page.goto("/reviews");
    let currentRow = page.getByTestId("reviews-row-9");
    await expect(currentRow.getByTestId("reply-moderate-9")).toContainText("Restore reply");

    // Restore it
    await currentRow.getByTestId("reply-moderate-9").click();

    // Refresh and confirm it's back to "Hide reply"
    await page.goto("/reviews");
    currentRow = page.getByTestId("reviews-row-9");
    await expect(currentRow.getByTestId("reply-moderate-9")).toContainText("Hide reply");
  });

  test("non-SUPERADMIN sees no write controls", async ({ page }) => {
    // mod@example.com is a MODERATOR — reads work, but moderation controls
    // are not rendered.
    await loginAsMockAdmin(page, "/reviews", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("reviews-table")).toBeVisible();
    await expect(page.getByTestId("reviews-row-1")).toBeVisible();
    // No moderation buttons should render
    await expect(page.getByTestId("review-moderate-1")).toHaveCount(0);
    await expect(page.getByTestId("reply-moderate-1")).toHaveCount(0);
  });
});
