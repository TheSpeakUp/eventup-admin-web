// tests/attribute-definitions-translations.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definition translations", () => {
  test("detail page links to translations; seeded set renders", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/cuisine");
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/cuisine/translations");
    await expect(page.getByTestId("translations-heading")).toContainText(
      "cuisine",
    );
    // Seeded: 2 field rows (en, ru) + 1 enum row.
    await expect(page.getByTestId("field-locale-0")).toHaveValue("en");
    await expect(page.getByTestId("field-locale-1")).toHaveValue("ru");
    await expect(page.getByTestId("enum-value-0")).toHaveValue("italian");
  });

  test("add + persist field and enum translations on a fresh definition", async ({
    page,
  }) => {
    // Create an OWN definition (never touch the seeded cuisine set).
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_target");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(page.getByTestId("attribute-definition-detail-key")).toHaveText(
      "tr_target",
    );

    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_target/translations");

    // No rows yet → add one field + one enum.
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("Target");
    await page.getByTestId("enum-add").click();
    await page.getByTestId("enum-locale-0").fill("en");
    await page.getByTestId("enum-value-0").fill("opt_a");
    await page.getByTestId("enum-label-0").fill("Option A");
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();

    // Reload → persisted.
    await page.goto("/attribute-definitions/tr_target/translations");
    await expect(page.getByTestId("field-locale-0")).toHaveValue("en");
    await expect(page.getByTestId("field-label-0")).toHaveValue("Target");
    await expect(page.getByTestId("enum-value-0")).toHaveValue("opt_a");
  });

  test("remove a field row and persist", async ({ page }) => {
    // Fresh definition seeded with one field translation via the UI.
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_remove");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_remove/translations");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("Removable");
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();

    // Remove it, save, reload → gone.
    await page.getByTestId("field-remove-0").click();
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();
    await page.goto("/attribute-definitions/tr_remove/translations");
    await expect(page.getByTestId("field-row-0")).toHaveCount(0);
  });

  test("duplicate field locale blocks submit", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_dup");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_dup/translations");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("One");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-1").fill("en");
    await page.getByTestId("field-label-1").fill("Two");
    await expect(page.getByTestId("field-dup-error")).toBeVisible();
    await expect(page.getByTestId("translations-submit")).toBeDisabled();
  });
});
