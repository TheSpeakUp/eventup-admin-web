import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

async function openProviderDetail(page: Page, id: number): Promise<void> {
  await page.goto(`/providers/${id}`);
  await expect(page.getByTestId("provider-detail-title")).toBeVisible();
  await expect(page.getByTestId("provider-field-edit-form")).toBeVisible();
}

async function openServiceDetail(page: Page, id: number): Promise<void> {
  await page.goto(`/services/${id}`);
  await expect(page.getByTestId("service-detail-title")).toBeVisible();
  await expect(page.getByTestId("service-field-edit-form")).toBeVisible();
}

test.describe("provider field-edit (M7)", () => {
  test("edit description persists on reload; a sibling field is not clobbered", async ({
    page,
  }) => {
    // Provider 1 (Aurora Events Co.): seeded name + description + account_currency.
    await loginAsMockAdmin(page, "/providers/1");
    await openProviderDetail(page, 1);

    const originalName = await page
      .getByTestId("provider-field-name")
      .inputValue();
    expect(originalName).not.toEqual("");

    const newDescription = "Edited description — corporate events specialist.";
    await page.getByTestId("provider-field-description").fill(newDescription);
    await page.getByTestId("provider-field-edit-submit").click();
    await expect(page.getByTestId("provider-field-edit-success")).toBeVisible();

    // Reload → the new description is the persisted value.
    await page.reload();
    await expect(page.getByTestId("provider-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("provider-field-description")).toHaveValue(
      newDescription,
    );
    // The untouched sibling (name) kept its original value — an OMITTED field
    // was not clobbered by the partial PATCH.
    await expect(page.getByTestId("provider-field-name")).toHaveValue(
      originalName,
    );
  });

  test("clearing a nullable field (website) empties it (sends explicit null)", async ({
    page,
  }) => {
    // Provider 1 has a seeded website (i=0 → i%3===0).
    await loginAsMockAdmin(page, "/providers/1");
    await openProviderDetail(page, 1);

    await expect(page.getByTestId("provider-field-website")).not.toHaveValue("");
    await page.getByTestId("provider-field-website").fill("");
    await page.getByTestId("provider-field-edit-submit").click();
    await expect(page.getByTestId("provider-field-edit-success")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("provider-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("provider-field-website")).toHaveValue("");
  });

  test("blanking a required field (name) shows inline error, value unchanged", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/providers/2");
    await openProviderDetail(page, 2);

    const originalName = await page
      .getByTestId("provider-field-name")
      .inputValue();
    // Bypass the browser `required` attribute by clearing then forcing submit
    // via the action — the Server Action validation is what we assert.
    await page.getByTestId("provider-field-name").fill("");
    await page
      .getByTestId("provider-field-name")
      .evaluate((el) => el.removeAttribute("required"));
    await page.getByTestId("provider-field-edit-submit").click();
    await expect(page.getByTestId("provider-field-edit-error")).toContainText(
      /name is required/i,
    );

    // Value on the server is unchanged — reload shows the original name.
    await page.reload();
    await expect(page.getByTestId("provider-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("provider-field-name")).toHaveValue(
      originalName,
    );
  });
});

test.describe("service field-edit (M7)", () => {
  test("edit title persists on reload; pricing_type sibling is not clobbered", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services/1");
    await openServiceDetail(page, 1);

    const originalPricingType = await page
      .getByTestId("service-field-pricing_type")
      .inputValue();
    expect(originalPricingType).not.toEqual("");

    const newTitle = "Edited service title — premium package";
    await page.getByTestId("service-field-title").fill(newTitle);
    await page.getByTestId("service-field-edit-submit").click();
    await expect(page.getByTestId("service-field-edit-success")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("service-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("service-field-title")).toHaveValue(newTitle);
    // OMITTED sibling kept its value.
    await expect(page.getByTestId("service-field-pricing_type")).toHaveValue(
      originalPricingType,
    );
  });

  test("clearing a nullable field (address) empties it", async ({ page }) => {
    // Service 1 has a seeded address (i=0 → i%2===0).
    await loginAsMockAdmin(page, "/services/1");
    await openServiceDetail(page, 1);

    await expect(page.getByTestId("service-field-address")).not.toHaveValue("");
    await page.getByTestId("service-field-address").fill("");
    await page.getByTestId("service-field-edit-submit").click();
    await expect(page.getByTestId("service-field-edit-success")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("service-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("service-field-address")).toHaveValue("");
  });

  test("blanking a required field (title) shows inline error, value unchanged", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services/2");
    await openServiceDetail(page, 2);

    const originalTitle = await page
      .getByTestId("service-field-title")
      .inputValue();
    await page.getByTestId("service-field-title").fill("");
    await page
      .getByTestId("service-field-title")
      .evaluate((el) => el.removeAttribute("required"));
    await page.getByTestId("service-field-edit-submit").click();
    await expect(page.getByTestId("service-field-edit-error")).toContainText(
      /title is required/i,
    );

    await page.reload();
    await expect(page.getByTestId("service-field-edit-form")).toBeVisible();
    await expect(page.getByTestId("service-field-title")).toHaveValue(
      originalTitle,
    );
  });
});
