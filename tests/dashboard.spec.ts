import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("operator dashboard (F11)", () => {
  test("overview summarizes every zone; tabs open the detail views", async ({
    page,
  }) => {
    // Mock admin (admin@example.com) is SUPERADMIN, so all zones are visible.
    await loginAsMockAdmin(page, "/");

    // Overview is the default tab: a calm summary grid of per-zone panels.
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-section")).toBeVisible();
    // Top-performers summary on the overview shows mocked provider data.
    await expect(page.getByText("Acme").first()).toBeVisible();

    // All four zone tabs are present for SUPERADMIN.
    await expect(page.getByTestId("dashboard-tab-overview")).toBeVisible();
    await expect(page.getByTestId("dashboard-tab-revenue")).toBeVisible();
    await expect(page.getByTestId("dashboard-tab-growth")).toBeVisible();
    await expect(page.getByTestId("dashboard-tab-operations")).toBeVisible();

    // Revenue tab → revenue detail + chart.
    await page.getByTestId("dashboard-tab-revenue").click();
    await expect(page.getByTestId("dashboard-revenue-section")).toBeVisible();
    await expect(page.getByTestId("revenue-chart")).toBeVisible();

    // Growth tab → content-growth detail.
    await page.getByTestId("dashboard-tab-growth").click();
    await expect(page.getByTestId("dashboard-growth-section")).toBeVisible();

    // Operations tab → funnel + tops detail.
    await page.getByTestId("dashboard-tab-operations").click();
    await expect(page.getByTestId("dashboard-funnel-section")).toBeVisible();
    await expect(page.getByTestId("dashboard-tops-section")).toBeVisible();
  });

  test("MODERATOR sees only the growth zone (no payment zones)", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/", { email: "mod@example.com" });

    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-section")).toBeVisible();

    // MODERATOR can see the growth tab (content-growth is MODERATOR+).
    await expect(page.getByTestId("dashboard-tab-growth")).toBeVisible();

    // Payment zones (revenue / operations) are not offered to MODERATOR.
    await expect(page.getByTestId("dashboard-tab-revenue")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-tab-operations")).toHaveCount(0);

    // Growth tab opens its detail view.
    await page.getByTestId("dashboard-tab-growth").click();
    await expect(page.getByTestId("dashboard-growth-section")).toBeVisible();
  });
});
