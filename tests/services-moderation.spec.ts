import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

async function openDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/services/${id}`);
  await expect(page.getByTestId("service-detail-title")).toBeVisible();
}

test.describe("services moderation actions", () => {
  test("approve flips status to published", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/svc_001`);
    await openDetail(page, "svc_001");
    await page.getByTestId("moderation-open-approve").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "published");
  });

  test("hide flips status to hidden, then restore puts it back to published", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/svc_002`);
    await openDetail(page, "svc_002");
    await page.getByTestId("moderation-open-hide").click();
    await page.getByTestId("moderation-submit-hide").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "hidden");

    await page.getByTestId("moderation-open-restore").click();
    await page.getByTestId("moderation-submit-restore").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "published");
  });

  test("reject requires reason 10+ chars and flips status", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/svc_003`);
    await openDetail(page, "svc_003");
    await page.getByTestId("moderation-open-reject").click();
    await page.getByTestId("moderation-reason-reject").fill("Pricing missing from listing.");
    await page.getByTestId("moderation-submit-reject").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
  });

  test("request-changes requires reason 10+ chars and flips status", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/svc_004`);
    await openDetail(page, "svc_004");
    await page.getByTestId("moderation-open-request_changes").click();
    await page
      .getByTestId("moderation-reason-request_changes")
      .fill("Attach a clearer cover photo, please.");
    await page.getByTestId("moderation-submit-request_changes").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "needs_changes");
  });

  test("409 surfaces inline error and leaves status untouched", async ({ page }) => {
    // Mock backend treats svc_conflict as always-409 on every action.
    await loginAsMockAdmin(page, `/services/svc_conflict`);
    await openDetail(page, "svc_conflict");
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
