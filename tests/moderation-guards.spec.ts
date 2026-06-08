import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("moderation dialog guards", () => {
  test("services: cancel button closes dialog without changing status", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/11");
    await page.waitForURL("**/services/11");
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
    await loginAsMockAdmin(page, "/providers/11");
    await page.waitForURL("**/providers/11");
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
    await loginAsMockAdmin(page, "/providers/12");
    await page.waitForURL("**/providers/12");
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
