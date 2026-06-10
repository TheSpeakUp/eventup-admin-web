// tests/attribute-definitions-guards.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions role gating", () => {
  test("MODERATOR sees the edit form but no delete button", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/seats", {
      email: "mod@example.com",
    });
    await expect(
      page.getByTestId("attribute-definition-form"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-delete"),
    ).toHaveCount(0);
  });

  test("ADMIN can delete a freshly created definition", async ({ page }) => {
    // Create a throwaway def, then delete THAT one — never the seeded rows the
    // alphabetically-later list spec asserts on.
    await loginAsMockAdmin(page, "/attribute-definitions/new", {
      email: "ops@example.com",
    });
    await page.getByTestId("attribute-definition-key").fill("throwaway_attr");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("throwaway_attr");

    page.on("dialog", (d) => d.accept());
    await expect(
      page.getByTestId("attribute-definition-delete"),
    ).toBeVisible();
    await page.getByTestId("attribute-definition-delete").click();
    await page.waitForURL("**/attribute-definitions");
    await expect(
      page.getByTestId("attribute-definition-row-throwaway_attr"),
    ).toHaveCount(0);
  });
});
