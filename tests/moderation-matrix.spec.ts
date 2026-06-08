import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

type ServiceKind = "approve" | "reject" | "unpublish" | "republish" | "archive";
type ProviderKind = "verify" | "block" | "unblock" | "delete";

async function expectButtonState(
  page: Page,
  kind: ServiceKind | ProviderKind,
  enabled: boolean,
): Promise<void> {
  const btn = page.getByTestId(`moderation-open-${kind}`);
  if (enabled) {
    await expect(btn).toBeEnabled();
  } else {
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute("data-disabled-reason", /applies only when status is/);
  }
}

test.describe("service moderation matrix — buttons enabled only for valid transitions", () => {
  test("draft: all actions disabled (owner submits, no admin transitions)", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/1");
    await page.waitForURL("**/services/1");
    await expect(page.getByTestId("moderation-panel")).toHaveAttribute("data-status", "draft");
    for (const k of ["approve", "reject", "unpublish", "republish", "archive"] as ServiceKind[]) {
      await expectButtonState(page, k, false);
    }
  });

  test("on_review: only Approve and Reject enabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/2");
    await page.waitForURL("**/services/2");
    await expectButtonState(page, "approve", true);
    await expectButtonState(page, "reject", true);
    await expectButtonState(page, "unpublish", false);
    await expectButtonState(page, "republish", false);
    await expectButtonState(page, "archive", false);
  });

  test("published: only Unpublish and Archive enabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/3");
    await page.waitForURL("**/services/3");
    await expectButtonState(page, "approve", false);
    await expectButtonState(page, "reject", false);
    await expectButtonState(page, "unpublish", true);
    await expectButtonState(page, "republish", false);
    await expectButtonState(page, "archive", true);
  });

  test("unpublished: only Republish and Archive enabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/4");
    await page.waitForURL("**/services/4");
    await expectButtonState(page, "approve", false);
    await expectButtonState(page, "reject", false);
    await expectButtonState(page, "unpublish", false);
    await expectButtonState(page, "republish", true);
    await expectButtonState(page, "archive", true);
  });

  test("archived: terminal — all actions disabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/5");
    await page.waitForURL("**/services/5");
    for (const k of ["approve", "reject", "unpublish", "republish", "archive"] as ServiceKind[]) {
      await expectButtonState(page, k, false);
    }
  });
});

test.describe("provider moderation matrix — buttons enabled only for valid transitions", () => {
  test("pending: Verify, Block, Delete enabled; Unblock disabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/1");
    await page.waitForURL("**/providers/1");
    await expect(page.getByTestId("moderation-panel")).toHaveAttribute("data-status", "pending");
    await expectButtonState(page, "verify", true);
    await expectButtonState(page, "block", true);
    await expectButtonState(page, "unblock", false);
    await expectButtonState(page, "delete", true);
  });

  test("verified: Block and Delete enabled; Verify and Unblock disabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/2");
    await page.waitForURL("**/providers/2");
    await expectButtonState(page, "verify", false);
    await expectButtonState(page, "block", true);
    await expectButtonState(page, "unblock", false);
    await expectButtonState(page, "delete", true);
  });

  test("blocked: Unblock and Delete enabled; Verify and Block disabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/3");
    await page.waitForURL("**/providers/3");
    await expectButtonState(page, "verify", false);
    await expectButtonState(page, "block", false);
    await expectButtonState(page, "unblock", true);
    await expectButtonState(page, "delete", true);
  });

  test("canceled: terminal — all actions disabled", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/4");
    await page.waitForURL("**/providers/4");
    for (const k of ["verify", "block", "unblock", "delete"] as ProviderKind[]) {
      await expectButtonState(page, k, false);
    }
  });
});

test.describe("error toast on backend mutation failure", () => {
  test("service 409 raises a dismissable toast and closes the dialog", async ({ page }) => {
    await loginAsMockAdmin(page, "/services/9999");
    await page.waitForURL("**/services/9999");
    await page.getByTestId("moderation-open-approve").click();
    await page.getByTestId("moderation-submit-approve").click();
    await expect(page.getByTestId("error-toast")).toContainText(/cannot be approved/i);
    await expect(page.getByTestId("moderation-dialog")).not.toBeVisible();
    await page.getByTestId("error-toast-dismiss").click();
    await expect(page.getByTestId("error-toast")).toHaveCount(0);
  });

  test("provider 409 raises a dismissable toast", async ({ page }) => {
    await loginAsMockAdmin(page, "/providers/9999");
    await page.waitForURL("**/providers/9999");
    await page.getByTestId("moderation-open-verify").click();
    await page.getByTestId("moderation-submit-verify").click();
    await expect(page.getByTestId("error-toast")).toContainText(/cannot be verified/i);
    await page.getByTestId("error-toast-dismiss").click();
    await expect(page.getByTestId("error-toast")).toHaveCount(0);
  });
});
