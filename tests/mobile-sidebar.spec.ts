import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// Below the md breakpoint the sidebar must collapse to an off-canvas drawer
// toggled by the header hamburger — the fixed 224px aside used to eat half a
// phone screen.
test.describe("mobile sidebar drawer", () => {
  test.use({ viewport: { width: 390, height: 820 } });

  test("collapses to a hamburger drawer that opens, navigates and closes", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/services");

    const toggle = page.getByTestId("sidebar-toggle");
    const providersLink = page.getByRole("link", { name: "Providers" });

    // Hamburger is shown on mobile; the drawer starts off-canvas.
    await expect(toggle).toBeVisible();
    await expect(providersLink).not.toBeInViewport();

    // Opening the drawer slides the nav into view.
    await toggle.click();
    await expect(providersLink).toBeInViewport();

    // Tapping a nav link navigates and auto-closes the drawer.
    await providersLink.click();
    await page.waitForURL("**/providers**");
    await expect(providersLink).not.toBeInViewport();
  });

  test("desktop keeps the sidebar static with no hamburger", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByTestId("sidebar-toggle")).toBeHidden();
    await expect(page.getByRole("link", { name: "Providers" })).toBeInViewport();
  });
});
