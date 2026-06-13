import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

async function openServiceDetail(page: Page, id: number): Promise<void> {
  await page.goto(`/services/${id}`);
  await expect(page.getByTestId("service-detail-title")).toBeVisible();
}

test.describe("services moderation actions (A5.7 contract)", () => {
  test("approve transitions on_review → published", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/2`);
    await openServiceDetail(page, 2);
    await page.getByTestId("moderation-open-approve").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "published");
  });

  test("unpublish flips published → unpublished; republish flips back", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/3`);
    await openServiceDetail(page, 3);
    await page.getByTestId("moderation-open-unpublish").click();
    // Reason is optional for unpublish — submit without filling.
    await page.getByTestId("moderation-submit-unpublish").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "unpublished");

    await page.getByTestId("moderation-open-republish").click();
    await page.getByTestId("moderation-submit-republish").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "published");
  });

  test("reject requires reason 10+ chars; flips to draft", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/7`);
    await openServiceDetail(page, 7);
    await page.getByTestId("moderation-open-reject").click();
    await page.getByTestId("moderation-reason-reject").fill("Pricing missing from listing — needs detail.");
    await page.getByTestId("moderation-submit-reject").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "draft");
  });

  test("archive any state → archived", async ({ page }) => {
    await loginAsMockAdmin(page, `/services/8`);
    await openServiceDetail(page, 8);
    await page.getByTestId("moderation-open-archive").click();
    await page.getByTestId("moderation-submit-archive").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "archived");
  });

  test("409 surfaces a toast and leaves status untouched", async ({ page }) => {
    // Mock backend treats id=9999 (CONFLICT_SERVICE_ID) as always-409 on every mutation.
    await loginAsMockAdmin(page, `/services/9999`);
    await openServiceDetail(page, 9999);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");
    await page.getByTestId("moderation-open-approve").click();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("error-toast")).toContainText(/cannot be approved/i);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");
  });
});
