import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// Layer-4 CSV export. The /api/export proxy attaches the admin token
// server-side; MSW mocks the backend csv branch for payments, the remaining
// surfaces assert the button + href wiring (same proxy, same allowlist).
test.describe("CSV export (Layer 4)", () => {
  test("payments export downloads csv honouring current filters", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/payments?status=succeeded");
    const link = page.getByTestId("export-csv-payments");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      "/api/export?surface=payments&status=succeeded",
    );

    // Fetch from the BROWSER (same-origin → the secure auth cookie rides
    // along; Playwright's request context drops secure cookies on 127.0.0.1).
    const resp = await page.evaluate(async () => {
      const r = await fetch("/api/export?surface=payments&status=succeeded");
      return {
        status: r.status,
        contentType: r.headers.get("content-type") ?? "",
        disposition: r.headers.get("content-disposition") ?? "",
        body: await r.text(),
      };
    });
    expect(resp.status).toBe(200);
    expect(resp.contentType).toContain("text/csv");
    expect(resp.disposition).toContain("payments.csv");
    const lines = resp.body.trim().split("\n");
    expect(lines[0]).toBe("id,status,currency,amount_minor");
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines.slice(1)) {
      expect(line).toContain("succeeded");
    }
  });

  test("unknown surface is rejected by the allowlist", async ({ page }) => {
    await loginAsMockAdmin(page, "/payments");
    const status = await page.evaluate(async () => {
      const r = await fetch(
        "/api/export?surface=" + encodeURIComponent("../../etc/passwd"),
      );
      return r.status;
    });
    expect(status).toBe(400);
  });

  test("export buttons render on every list surface", async ({ page }) => {
    await loginAsMockAdmin(page, "/services?status=on_review");
    await expect(page.getByTestId("export-csv-services")).toHaveAttribute(
      "href",
      "/api/export?surface=services&status=on_review",
    );

    await page.goto("/providers");
    await expect(page.getByTestId("export-csv-providers")).toBeVisible();

    await page.goto("/audit");
    await expect(page.getByTestId("export-csv-audit")).toBeVisible();

    await page.goto("/offers");
    await expect(page.getByTestId("export-csv-offers-queue")).toBeVisible();

    await page.goto("/quality");
    await expect(
      page.getByTestId("export-csv-quality-services"),
    ).toBeVisible();
    await page.goto("/quality?tab=anomalies");
    await expect(
      page.getByTestId("export-csv-quality-services"),
    ).toHaveCount(0);

    await page.goto("/promotions?tab=orders");
    await expect(
      page.getByTestId("export-csv-promotion-orders"),
    ).toBeVisible();
    await page.goto("/promotions?tab=campaigns");
    await expect(
      page.getByTestId("export-csv-promotion-campaigns"),
    ).toBeVisible();
  });
});
