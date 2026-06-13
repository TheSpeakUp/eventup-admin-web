// tests/category-bindings-crud.spec.ts
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// These specs create their own data in the shared mock store; reset before each
// test so re-runs / retries do not accumulate stale rows across the e2e session.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

// Create an OWN attribute definition (never bind seeded defs — the picker
// exclusion + list fixtures belong to other specs). Shared-store rule: all
// binding mutations happen on category 2 only.
async function createDefinition(
  page: Page,
  key: string,
  descriptor: string,
): Promise<void> {
  await page.goto("/attribute-definitions/new");
  await page.getByTestId("attribute-definition-key").fill(key);
  await page.getByTestId("descriptor-input").fill(descriptor);
  await page.getByTestId("attribute-definition-submit").click();
  await expect(
    page.getByTestId("attribute-definition-detail-key"),
  ).toHaveText(key);
}

test.describe("Category bindings CRUD", () => {
  test("picker excludes already-bound keys", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes/new");
    await expect(page.getByTestId("binding-key-select")).toBeVisible();
    // cuisine + seats are seeded as bound to category 1.
    await expect(
      page.locator('[data-testid="binding-key-select"] option[value="cuisine"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="binding-key-select"] option[value="seats"]'),
    ).toHaveCount(0);
  });

  test("add binding: picker → prefilled form → row appears", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(
      page,
      "f14_crud_attr",
      '{"type":"string","searchable":true}',
    );

    await page.goto("/categories/2/attributes/new");
    await page
      .getByTestId("binding-key-select")
      .selectOption("f14_crud_attr");
    await page.getByTestId("binding-picker-continue").click();

    // Form is prefilled from the definition's descriptor.
    await expect(page.getByTestId("descriptor-input")).toHaveValue(
      /searchable/,
    );
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");
    await expect(
      page.getByTestId("binding-row-f14_crud_attr"),
    ).toBeVisible();
  });

  test("edit persists sort_order and card flag across navigation", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_edit_attr", '{"type":"integer"}');

    // Bind it to category 2 first.
    await page.goto("/categories/2/attributes/new?key=f14_edit_attr");
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    // Edit: sort 100→7, uncheck "Visible in card", save.
    await page.getByTestId("binding-edit-f14_edit_attr").click();
    await page.getByTestId("binding-sort").fill("7");
    await page.getByTestId("binding-visible-card").uncheck();
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    // Re-open the edit page — values must have persisted (full upsert).
    await page.getByTestId("binding-edit-f14_edit_attr").click();
    await expect(page.getByTestId("binding-sort")).toHaveValue("7");
    await expect(page.getByTestId("binding-visible-card")).not.toBeChecked();
    await expect(page.getByTestId("binding-visible-filters")).toBeChecked();
  });

  test("invalid descriptor JSON surfaces an action error", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_bad_json_attr", '{"type":"string"}');

    await page.goto("/categories/2/attributes/new?key=f14_bad_json_attr");
    await page.getByTestId("descriptor-input").fill("{not valid json");
    await page.getByTestId("binding-submit").click();
    await expect(page.getByTestId("binding-error")).toContainText(
      "invalid JSON",
    );
  });

  test("delete unbinds with confirm", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_del_attr", '{"type":"boolean"}');

    await page.goto("/categories/2/attributes/new?key=f14_del_attr");
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    await page.getByTestId("binding-edit-f14_del_attr").click();
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("binding-delete").click();
    await page.waitForURL("**/categories/2/attributes");
    await expect(page.getByTestId("binding-row-f14_del_attr")).toHaveCount(0);
  });
});
