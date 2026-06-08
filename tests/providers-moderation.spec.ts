import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

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
