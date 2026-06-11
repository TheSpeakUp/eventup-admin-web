import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { completeStepUp } from "./helpers/step-up";

test("force offer dispatch requires step-up then completes", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");

  await page.getByTestId("force-offer-dispatch-open").click();
  await page.getByTestId("force-offer-dispatch-confirm").click();

  await completeStepUp(page);

  await expect(page.getByTestId("force-offer-dispatch-result")).toBeVisible();
});

test("wrong code shows an error and keeps the modal open", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.getByTestId("force-offer-dispatch-open").click();
  await page.getByTestId("force-offer-dispatch-confirm").click();
  await expect(page.getByTestId("step-up-modal")).toBeVisible();
  await page.getByTestId("step-up-code").fill("000000");
  await page.getByTestId("step-up-submit").click();
  await expect(page.getByTestId("step-up-modal")).toBeVisible();
});
