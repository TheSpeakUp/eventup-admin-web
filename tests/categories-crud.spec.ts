// tests/categories-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// These specs create their own data in the shared mock store; reset before each
// test so re-runs / retries do not accumulate stale rows across the e2e session.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

test.describe("Categories CRUD", () => {
  test("create a category and land on its detail", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Photography");
    await page.getByTestId("category-slug").fill("photography");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Photography",
    );
  });

  test("create with translations + attribute schema", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("DJ Services");
    await page.getByTestId("category-slug").fill("dj-services");
    await page.getByTestId("name_translations-add").click();
    await page.getByTestId("name_translations-locale-0").fill("ar");
    await page.getByTestId("name_translations-value-0").fill("دي جي");
    await page
      .getByTestId("attribute-schema-input")
      .fill('{"genre":{"type":"string","searchable":true}}');
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "DJ Services",
    );
  });

  test("invalid attribute schema JSON surfaces an error", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Bad Schema");
    await page.getByTestId("category-slug").fill("bad-schema");
    await page.getByTestId("attribute-schema-input").fill("{not valid json");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-error")).toContainText(
      "invalid JSON",
    );
  });

  test("discounted price above monthly is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Pricey");
    await page.getByTestId("category-slug").fill("pricey");
    await page.getByPlaceholder("USD").fill("USD");
    await page.getByPlaceholder("Monthly").fill("10");
    await page.getByPlaceholder("Discounted").fill("20");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-error")).toContainText(
      "cannot exceed",
    );
  });

  // NOTE: this test creates its OWN category and edits that one. It must NOT
  // touch the seeded fixtures (ids 1,2,3): the e2e run shares one in-memory
  // store across all spec files (single `next start`, workers:1, no per-test
  // reset), and categories-list.spec.ts asserts on the seeded "Catering"/
  // "Venues" rows by name. Renaming a seed here would break that later file.
  test("edit updates a field on a freshly created category", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Workshops");
    await page.getByTestId("category-slug").fill("workshops");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Workshops",
    );

    // Now on the new category's detail page — edit ITS name.
    await page.getByTestId("category-name").fill("Creative Workshops");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Creative Workshops",
    );
  });
});
