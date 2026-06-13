import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

async function openProviderDetail(page: Page, id: number): Promise<void> {
  await page.goto(`/providers/${id}`);
  await expect(page.getByTestId("provider-detail-title")).toBeVisible();
}

test.describe("providers moderation actions (A6.2 contract)", () => {
  test("verify transitions pending → verified", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/1`);
    await openProviderDetail(page, 1);
    await page.getByTestId("moderation-open-verify").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    // Verification message is optional.
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "verified");
  });

  test("block requires reason 10+ chars; unblock returns to verified", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/2`);
    await openProviderDetail(page, 2);
    await page.getByTestId("moderation-open-block").click();
    await page
      .getByTestId("moderation-reason-block")
      .fill("Insurance certificate expired — block listings.");
    await page.getByTestId("moderation-submit-block").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "blocked");

    await page.getByTestId("moderation-open-unblock").click();
    await page.getByTestId("moderation-submit-unblock").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "verified");
  });

  test("delete transitions any state → canceled", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/5`);
    await openProviderDetail(page, 5);
    await page.getByTestId("moderation-open-delete").click();
    await page.getByTestId("moderation-submit-delete").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "canceled");
  });

  test("409 surfaces a toast and leaves status untouched", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/9999`);
    await openProviderDetail(page, 9999);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");
    await page.getByTestId("moderation-open-verify").click();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("error-toast")).toContainText(/cannot be verified/i);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");
  });
});

test.describe("provider verification evidence (T4)", () => {
  test("detail renders uploaded evidence with a doc link", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/1`);
    await openProviderDetail(page, 1);
    const item = page.getByTestId("provider-evidence-item").first();
    await expect(item).toBeVisible();
    await expect(page.getByTestId("provider-evidence-link").first()).toHaveAttribute(
      "href",
      /evidence\.example\.com/,
    );
  });

  test("detail shows empty-state when no evidence is on file", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/9998`);
    await openProviderDetail(page, 9998);
    await expect(page.getByTestId("provider-evidence-empty")).toBeVisible();
  });

  test("evidence with a javascript: file_url is not rendered as a link (XSS guard)", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/9997`);
    await openProviderDetail(page, 9997);
    // The hostile URL must NOT become a clickable anchor…
    await expect(page.getByTestId("provider-evidence-item")).toBeVisible();
    await expect(page.getByTestId("provider-evidence-link")).toHaveCount(0);
    // …it degrades to an inert "Invalid link" marker instead.
    await expect(page.getByTestId("provider-evidence-link-invalid")).toBeVisible();
  });

  test("verify without evidence is gated (400); override path verifies", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/9998`);
    await openProviderDetail(page, 9998);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");

    // First attempt without override trips the evidence-missing gate and keeps
    // the dialog open with an inline hint.
    await page.getByTestId("moderation-open-verify").click();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("moderation-evidence-hint")).toBeVisible();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");

    // Tick override and resubmit — verification goes through.
    await page.getByTestId("moderation-override-verify").check();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "verified");
  });
});
