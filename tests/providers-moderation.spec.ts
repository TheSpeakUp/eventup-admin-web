import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

async function openDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/providers/${id}`);
  await expect(page.getByTestId("provider-detail-title")).toBeVisible();
}

test.describe("providers moderation actions", () => {
  test("approve flips status to approved", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/prv_001`);
    await openDetail(page, "prv_001");
    await page.getByTestId("moderation-open-approve").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "approved");
  });

  test("suspend requires reason 10+ chars; restore returns to approved", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/prv_002`);
    await openDetail(page, "prv_002");
    await page.getByTestId("moderation-open-suspend").click();
    await page
      .getByTestId("moderation-reason-suspend")
      .fill("Insurance certificate missing; pause listings.");
    await page.getByTestId("moderation-submit-suspend").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "suspended");

    await page.getByTestId("moderation-open-restore").click();
    await page.getByTestId("moderation-submit-restore").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "approved");
  });

  test("reject requires reason 10+ chars and flips status", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/prv_005`);
    await openDetail(page, "prv_005");
    await page.getByTestId("moderation-open-reject").click();
    await page
      .getByTestId("moderation-reason-reject")
      .fill("Identity verification documents incomplete.");
    await page.getByTestId("moderation-submit-reject").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
  });

  test("409 surfaces inline error and leaves status untouched", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/prv_conflict`);
    await openDetail(page, "prv_conflict");
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      "pending_review",
    );
    await page.getByTestId("moderation-open-approve").click();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("moderation-error-approve")).toContainText(/cannot be approved/i);
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      "pending_review",
    );
  });
});
