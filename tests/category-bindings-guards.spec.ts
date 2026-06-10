// tests/category-bindings-guards.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Category bindings role gating", () => {
  test("MODERATOR sees the edit form but no delete button", async ({
    page,
  }) => {
    // Read-only render assert on the seeded category-1 cuisine binding —
    // never save or delete it (the list spec asserts on it).
    await loginAsMockAdmin(page, "/categories/1/attributes/cuisine", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("binding-form")).toBeVisible();
    await expect(page.getByTestId("binding-delete")).toHaveCount(0);
  });

  test("MODERATOR sees the Add attribute button", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("binding-new")).toBeVisible();
  });

  test("ADMIN sees the delete button on a binding", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes/cuisine", {
      email: "ops@example.com",
    });
    await expect(page.getByTestId("binding-delete")).toBeVisible();
  });

  test("SUPERADMIN sees the delete button on a binding", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes/cuisine", {
      email: "admin@example.com",
    });
    await expect(page.getByTestId("binding-delete")).toBeVisible();
  });
});
