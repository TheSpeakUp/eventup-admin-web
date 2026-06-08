import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("moderation dialog guards", () => {
  test("services: cancel button closes dialog without changing status", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/svc_010");
    await page.waitForURL("**/services/svc_010");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-reject").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-cancel").click();
    await expect(page.getByTestId("moderation-dialog")).not.toBeVisible();

    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });

  test("providers: cancel button closes dialog without changing status", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/prv_010");
    await page.waitForURL("**/providers/prv_010");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-suspend").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-cancel").click();
    await expect(page.getByTestId("moderation-dialog")).not.toBeVisible();

    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });

  test("services reject: reason shorter than 10 chars blocks the submit", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/svc_011");
    await page.waitForURL("**/services/svc_011");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-reject").click();
    await page.getByTestId("moderation-reason-reject").fill("too short");
    await page.getByTestId("moderation-submit-reject").click();

    // Browser-native minLength=10 must block the submit; dialog stays open, status unchanged.
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });

  test("providers suspend: reason shorter than 10 chars blocks the submit", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/prv_011");
    await page.waitForURL("**/providers/prv_011");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-suspend").click();
    await page.getByTestId("moderation-reason-suspend").fill("nope");
    await page.getByTestId("moderation-submit-suspend").click();

    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });
});
