import { expect, type Page } from "@playwright/test";

export async function completeStepUp(page: Page, code = "123456") {
  const modal = page.getByTestId("step-up-modal");
  // Wait a bit to let the modal open (the button might still be in "pending" state)
  await page.waitForTimeout(100);
  await expect(modal).toBeVisible({ timeout: 10000 });
  await page.getByTestId("step-up-code").fill(code);
  await page.getByTestId("step-up-submit").click();
  await expect(modal).toBeHidden();
}
