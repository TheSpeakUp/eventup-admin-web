import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// Mock admin session is SUPERADMIN, so the nav link + page are visible.
test.describe("broadcast (Layer 4)", () => {
  test("compose → preview counts update per audience → confirm → sent", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");
    await page.getByRole("link", { name: "Broadcast" }).click();
    await page.waitForURL("**/broadcast");

    await expect(page.getByTestId("broadcast-preview")).toContainText(
      "9 recipients across 5 providers",
    );
    await page.getByTestId("broadcast-audience").selectOption("verified");
    await expect(page.getByTestId("broadcast-preview")).toContainText(
      "6 recipients across 3 providers",
    );

    await page.getByTestId("broadcast-title").fill("Maintenance window");
    await page
      .getByTestId("broadcast-body")
      .fill("The marketplace pauses on Saturday 02:00–03:00 UTC.");

    // Two-step send: review first, destructive confirm second.
    await page.getByTestId("broadcast-review").click();
    await expect(page.getByTestId("broadcast-confirm-copy")).toContainText(
      "Send to 6 recipients",
    );
    await page.getByTestId("broadcast-send").click();

    await expect(page.getByTestId("broadcast-sent")).toContainText(
      "queued for 6 recipients",
    );
    await expect(page.getByTestId("broadcast-sent")).toContainText("bc_mock_1");
  });
});
