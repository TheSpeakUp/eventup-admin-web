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

test("a second gated action while the modal is opening does not dead-end", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");

  // Arm two *different* gated actions (distinct permissions, distinct onVerified).
  await page.getByTestId("force-offer-dispatch-open").click();
  await page.getByTestId("force-provider-dispatch-open").click();

  // Fire both submits back-to-back, before the native modal mounts (once it
  // does, showModal() makes the page inert — this in-flight window is the only
  // way a second gated action can land, and it's what the bug was about).
  await page.getByTestId("force-offer-dispatch-confirm").click();
  await page.getByTestId("force-provider-dispatch-confirm").click();

  // Exactly one challenge is shown; completing it must drive the action that
  // owns the challenge to success — not silently retry the other one.
  await completeStepUp(page);

  // Pre-fix symptom: the un-owned action retried with the wrong grant and
  // surfaced "Session changed — try again." It must not appear.
  await expect(page.getByText("Session changed")).toHaveCount(0);

  // The owning action completed cleanly (ordering of the two in-flight requests
  // is not guaranteed, so accept whichever won the challenge).
  await expect(
    page
      .getByTestId("force-offer-dispatch-result")
      .or(page.getByTestId("force-provider-dispatch-result")),
  ).toBeVisible();

  // And the modal is gone — no leftover open challenge bound to the other action.
  await expect(page.getByTestId("step-up-modal")).toBeHidden();
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
