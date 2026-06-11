import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { completeStepUp } from "./helpers/step-up";

test("ops page renders all four sections + force-dispatch buttons", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await expect(page.getByTestId("force-dispatch")).toBeVisible();
  await expect(page.getByTestId("service-health")).toBeVisible();
  await expect(page.getByTestId("service-health-row-100")).toBeVisible();
  await expect(page.getByTestId("provider-health")).toBeVisible();
  await expect(page.getByTestId("dispatch-runs")).toBeVisible();
  await expect(page.getByTestId("dlq")).toBeVisible();
});

test("force offer dispatch shows confirm step and reports counts", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("force-offer-dispatch-open").click();
  await expect(page.getByTestId("force-offer-dispatch-confirm")).toBeVisible();
  await page.getByTestId("force-offer-dispatch-confirm").click();
  await completeStepUp(page);
  await expect(page.getByTestId("force-offer-dispatch-result")).toContainText(/Checked 10/);
});

test("DLQ replay dry run reports counts but does not send", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("dlq-replay-dry-open").click();
  await page.getByTestId("dlq-replay-dry-confirm").click();
  await expect(page.getByTestId("dlq-replay-dry-result")).toContainText(/dry_run/);
  await expect(page.getByTestId("dlq-replay-dry-result")).toContainText(/sent 0/);
});

test("DLQ replay apply sends and reports counts", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("dlq-replay-apply-open").click();
  await page.getByTestId("dlq-replay-apply-confirm").click();
  await expect(page.getByTestId("dlq-replay-apply-result")).toContainText(/apply/);
  await expect(page.getByTestId("dlq-replay-apply-result")).toContainText(/sent 2/);
});
