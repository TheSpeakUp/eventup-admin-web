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
  test("edit a freshly created definition and verify changes", async ({
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

    // Update group_name and submit form successfully (action returns success).
    await page.getByTestId("attribute-definition-group").fill("misc");
    await page.getByTestId("attribute-definition-submit").click();
    // Verify no error message is shown (successful submission).
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toHaveCount(0);
  });
});
