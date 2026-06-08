import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test("offers list shows counters and table renders", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers");
  await page.waitForURL("**/offers**");
  await expect(page.getByTestId("counters-card")).toBeVisible();
  await expect(page.getByTestId("offers-table")).toBeVisible();
});

test("approve flow: on_review offer -> active", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/5");
  await page.waitForURL("**/offers/5");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");
  await page.getByTestId("moderation-open-approve").click();
  await page.getByTestId("moderation-submit-approve").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
});

test("reject flow: requires 10+ char reason", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/10");
  await page.waitForURL("**/offers/10");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");
  await page.getByTestId("moderation-open-reject").click();
  await page.getByTestId("moderation-reason-reject").fill("nope");
  await page.getByTestId("moderation-submit-reject").click();
  await expect(page.getByTestId("moderation-dialog")).toBeVisible();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");

  await page.getByTestId("moderation-reason-reject").fill("Reason long enough to pass");
  await page.getByTestId("moderation-submit-reject").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
});

test("disable flow from active", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/1");
  await page.waitForURL("**/offers/1");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
  await page.getByTestId("moderation-open-disable").click();
  await page.getByTestId("moderation-submit-disable").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "disabled");
});

test("enable flow from disabled", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/2");
  await page.waitForURL("**/offers/2");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "disabled");
  await page.getByTestId("moderation-open-enable").click();
  await page.getByTestId("moderation-submit-enable").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
});

test("archive flow from rejected", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/3");
  await page.waitForURL("**/offers/3");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
  await page.getByTestId("moderation-open-archive").click();
  await page.getByTestId("moderation-submit-archive").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "archived");
});
