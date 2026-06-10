// tests/attribute-definitions-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions CRUD", () => {
  test("create a definition and land on its detail", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("color");
    await page
      .getByTestId("descriptor-input")
      .fill('{"type":"string","searchable":true}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("color");
  });

  test("invalid descriptor JSON surfaces an error", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("bad_descriptor");
    await page.getByTestId("descriptor-input").fill("{not valid json");
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toContainText("invalid JSON");
  });

  test("missing descriptor on create is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("no_descriptor");
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toContainText("descriptor is required");
  });

  // Creates its OWN definition and edits THAT one — never the seeded fixtures
  // (cuisine/seats/legacy_flag), which the list spec asserts on (shared store).
  // Verifies the edit actually PERSISTS through the write+read path: a partial
  // update (group_name) plus the is_active toggle must survive a reload.
  test("edit persists a field + is_active toggle on a created definition", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("editable_attr");
    await page.getByTestId("descriptor-input").fill('{"type":"boolean"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("editable_attr");

    // Key is read-only on edit.
    await expect(
      page.getByTestId("attribute-definition-key"),
    ).toHaveAttribute("readonly", "");
    // Created active by default.
    await expect(
      page.getByTestId("attribute-definition-active"),
    ).toBeChecked();

    // Edit: set group_name and toggle Active off, then save.
    await page.getByTestId("attribute-definition-group").fill("misc");
    await page.getByTestId("attribute-definition-active").uncheck();
    await page.getByTestId("attribute-definition-submit").click();
    // Barrier: the in-place update has no redirect, so wait for the submit
    // button to leave its "Saving…" pending state before asserting/reloading.
    await expect(
      page.getByTestId("attribute-definition-submit"),
    ).toHaveText("Save");
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toHaveCount(0);

    // Reload the detail page — persisted server values must reflect the edit.
    await page.goto("/attribute-definitions/editable_attr");
    await expect(
      page.getByTestId("attribute-definition-group"),
    ).toHaveValue("misc");
    await expect(
      page.getByTestId("attribute-definition-active"),
    ).not.toBeChecked();
  });
});
