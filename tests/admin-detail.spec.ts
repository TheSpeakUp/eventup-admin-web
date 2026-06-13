import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";
import { resetMockStores } from "./helpers/reset";

// Shared mock store is mutated by these specs; reset before each test so the
// seeded state stays deterministic across order / reruns / retries.
test.beforeEach(async ({ request }) => {
  await resetMockStores(request);
});

// Seeded admins from src/mocks/admins-store.ts. The mock SUPERADMIN login
// (admin@example.com) carries sub === SUPER_ID, so SUPER_ID is the operator's
// own row — used to exercise the self-guard.
const MOD_ID = "33333333-3333-4333-8333-333333333333";
const SUPER_ID = "11111111-1111-4111-8111-111111111111";

test.describe("Admin detail management", () => {
  test("updates role and active state", async ({ page }) => {
    await loginAsMockAdmin(page, `/admins/${MOD_ID}`);
    await expect(page.getByTestId("admin-detail-email")).toHaveText(
      "mod@example.com",
    );

    await page.getByTestId("admin-role-select").selectOption("ADMIN");
    await page.getByTestId("admin-active-select").selectOption("false");
    await page.getByTestId("admin-update-submit").click();

    await expect(page.getByTestId("admin-update-error")).toHaveCount(0);
    // After a successful save the revalidated server value must drive the
    // selects — they reflect the new persisted role/status without a reload.
    await expect(page.getByTestId("admin-role-select")).toHaveValue("ADMIN");
    await expect(page.getByTestId("admin-active-select")).toHaveValue("false");
  });

  test("grants then revokes a reviewer scope", async ({ page }) => {
    await loginAsMockAdmin(page, `/admins/${MOD_ID}`);

    await page
      .getByTestId("grant-scope-select")
      .selectOption("admin.marketplace.offers.dispatch");
    await page.getByTestId("grant-scope-submit").click();

    await expect(page.getByTestId("scopes-list")).toContainText(
      "admin.marketplace.offers.dispatch",
    );

    await page
      .getByTestId("scope-revoke-admin.marketplace.offers.dispatch")
      .click();
    await expect(page.getByTestId("scopes-list")).not.toContainText(
      "admin.marketplace.offers.dispatch",
    );
  });

  test("shows a specific message when deactivating your own account", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, `/admins/${SUPER_ID}`);
    await expect(page.getByTestId("admin-detail-email")).toHaveText(
      "admin@example.com",
    );

    await page.getByTestId("admin-active-select").selectOption("false");
    await page.getByTestId("admin-update-submit").click();

    await expect(page.getByTestId("admin-update-error")).toHaveText(
      "You cannot deactivate your own account.",
    );
  });

  test("shows a specific message when changing your own role", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, `/admins/${SUPER_ID}`);

    await page.getByTestId("admin-role-select").selectOption("ADMIN");
    await page.getByTestId("admin-update-submit").click();

    await expect(page.getByTestId("admin-update-error")).toHaveText(
      "You cannot change your own role.",
    );
  });

  // Backend-only guard the FE never pre-empted: a different operator (mod)
  // deactivating the sole active superadmin. Proves the generic error path now
  // surfaces error.meta.original_detail for reasons the client cannot compute.
  test("surfaces the last-active-superadmin reason from the backend", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, `/admins/${SUPER_ID}`, {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("admin-detail-email")).toHaveText(
      "admin@example.com",
    );

    await page.getByTestId("admin-active-select").selectOption("false");
    await page.getByTestId("admin-update-submit").click();

    await expect(page.getByTestId("admin-update-error")).toHaveText(
      "Cannot deactivate the last active superadmin.",
    );
  });
});
