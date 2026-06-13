import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("operator dashboard (F11)", () => {
  test("dashboard home renders KPI cards, charts, and sections", async ({
    page,
  }) => {
    // Mock admin (admin@example.com) is SUPERADMIN, so all sections render
    await loginAsMockAdmin(page, "/");

    // Verify dashboard page loads
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // Verify KPI cards section is present
    await expect(page.getByTestId("dashboard-kpi-section")).toBeVisible();

    // Verify revenue chart section renders (SUPERADMIN only)
    await expect(page.getByTestId("dashboard-revenue-section")).toBeVisible();
    await expect(page.getByTestId("revenue-chart")).toBeVisible();

    // Verify content growth chart section renders (SUPERADMIN and MODERATOR)
    await expect(page.getByTestId("dashboard-growth-section")).toBeVisible();

    // Verify funnel section renders (SUPERADMIN only)
    await expect(page.getByTestId("dashboard-funnel-section")).toBeVisible();

    // Verify tops section renders (SUPERADMIN and MODERATOR)
    await expect(page.getByTestId("dashboard-tops-section")).toBeVisible();

    // Verify mock data appears: provider name from mocked tops response
    await expect(page.getByText("Acme").first()).toBeVisible();
  });

  test("revenue and funnel sections hidden for MODERATOR role", async ({
    page,
  }) => {
    // Log in as moderator (mod@example.com)
    await loginAsMockAdmin(page, "/", { email: "mod@example.com" });

    // Verify dashboard page loads
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // MODERATOR can see growth (content-growth is MODERATOR+)
    await expect(page.getByTestId("dashboard-growth-section")).toBeVisible();
    // MODERATOR must NOT see tops (revenue data — ADMIN+ only)
    await expect(page.getByTestId("dashboard-tops-section")).not.toBeVisible();

    // MODERATOR cannot see revenue and funnel (payment sections)
    await expect(page.getByTestId("dashboard-revenue-section")).not.toBeVisible();
    await expect(page.getByTestId("dashboard-funnel-section")).not.toBeVisible();
  });
});
