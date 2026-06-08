import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("moderation dialog guards", () => {
  test("services: cancel button closes dialog without changing status", async ({ page }) => {
    // /services/17 is on_review (i=16 in the fixture cycle), so Reject is enabled.
    await loginAsMockAdmin(page, "/services/17");
    await page.waitForURL("**/services/17");
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
    // /providers/9 is pending (i=8 in the 4-status fixture cycle), so Block is enabled.
    await loginAsMockAdmin(page, "/providers/9");
    await page.waitForURL("**/providers/9");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-block").click();
    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await page.getByTestId("moderation-cancel").click();
    await expect(page.getByTestId("moderation-dialog")).not.toBeVisible();

    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });

  test("services reject: reason shorter than 10 chars blocks the submit", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/12");
    await page.waitForURL("**/services/12");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-reject").click();
    await page.getByTestId("moderation-reason-reject").fill("too short");
    await page.getByTestId("moderation-submit-reject").click();

    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });

  test("providers block: reason shorter than 10 chars blocks the submit", async ({ page }) => {
    // /providers/10 is verified (i=9 in the 4-status fixture cycle), so Block is enabled.
    await loginAsMockAdmin(page, "/providers/10");
    await page.waitForURL("**/providers/10");
    const statusBefore = await page.getByTestId("status-badge").getAttribute("data-status");

    await page.getByTestId("moderation-open-block").click();
    await page.getByTestId("moderation-reason-block").fill("nope");
    await page.getByTestId("moderation-submit-block").click();

    await expect(page.getByTestId("moderation-dialog")).toBeVisible();
    await expect(page.getByTestId("status-badge")).toHaveAttribute(
      "data-status",
      statusBefore ?? "",
    );
  });
});
