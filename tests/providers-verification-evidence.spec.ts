import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

const EVIDENCE_MISSING_PROVIDER_ID = 9998;

async function openProviderDetail(page: Page, id: number): Promise<void> {
  await page.goto(`/providers/${id}`);
  await expect(page.getByTestId("provider-detail-title")).toBeVisible();
}

test.describe("provider verification evidence (T4)", () => {
  test("renders submitted evidence docs with view links", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/1`);
    await openProviderDetail(page, 1);
    await expect(page.getByTestId("provider-evidence")).toBeVisible();
    const items = page.getByTestId("provider-evidence-item");
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText("Organization document");
    await expect(items.first()).toContainText("Company registration certificate");
    const firstLink = page.getByTestId("provider-evidence-link").first();
    await expect(firstLink).toHaveAttribute("href", /org-cert\.pdf$/);
    await expect(firstLink).toHaveAttribute("target", "_blank");
  });

  test("shows empty state when no evidence submitted", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/${EVIDENCE_MISSING_PROVIDER_ID}`);
    await openProviderDetail(page, EVIDENCE_MISSING_PROVIDER_ID);
    await expect(page.getByTestId("provider-evidence-empty")).toBeVisible();
  });

  test("verify without evidence is rejected; override succeeds", async ({ page }) => {
    await loginAsMockAdmin(page, `/providers/${EVIDENCE_MISSING_PROVIDER_ID}`);
    await openProviderDetail(page, EVIDENCE_MISSING_PROVIDER_ID);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");

    // Verify with no override → 400 evidence-missing surfaces in a toast,
    // status stays pending.
    await page.getByTestId("moderation-open-verify").click();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("error-toast")).toContainText(/missing required verification evidence/i);
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "pending");

    // Tick the override checkbox → verify succeeds.
    await page.getByTestId("moderation-open-verify").click();
    await page.getByTestId("moderation-override-verify").check();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "verified");
  });
});
