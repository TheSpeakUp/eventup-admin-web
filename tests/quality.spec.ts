// tests/quality.spec.ts
//
// M4 — Quality / ranking surface on /quality. The mock store is a single
// in-memory instance across the whole e2e run, so the mutating tests are
// ordered: anomaly review (#1), formula activate (v2 #1) → rollback (back to
// v3 #2), and the service-override set→clear flow each touch the shared store
// exactly once. admin@example.com = SUPERADMIN (write controls visible);
// mod@example.com = MODERATOR (non-super, write controls hidden).
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Quality / ranking (M4)", () => {
  test("each tab renders as SUPERADMIN", async ({ page }) => {
    await loginAsMockAdmin(page, "/quality");
    await expect(page.getByTestId("quality-tabs")).toBeVisible();
    await expect(page.getByTestId("service-metrics-table")).toBeVisible();
    await expect(page.getByTestId("service-metric-row-501")).toBeVisible();

    await page.getByTestId("quality-tab-providers").click();
    await page.waitForURL("**/quality?tab=providers");
    await expect(page.getByTestId("provider-metrics-table")).toBeVisible();
    await expect(page.getByTestId("provider-metric-row-201")).toBeVisible();

    await page.getByTestId("quality-tab-formula-configs").click();
    await page.waitForURL("**/quality?tab=formula-configs");
    await expect(page.getByTestId("formula-configs-table")).toBeVisible();
    await expect(page.getByTestId("formula-config-row-1")).toBeVisible();

    await page.getByTestId("quality-tab-anomalies").click();
    await page.waitForURL("**/quality?tab=anomalies");
    await expect(page.getByTestId("anomalies-table")).toBeVisible();
    await expect(page.getByTestId("anomaly-row-1")).toBeVisible();
  });

  test("anomalies reviewed/unreviewed filter narrows the list", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/quality?tab=anomalies&resolved=true");
    // #2 is seeded reviewed; #1 is unreviewed and filtered out.
    await expect(page.getByTestId("anomaly-row-2")).toBeVisible();
    await expect(page.getByTestId("anomaly-row-1")).toHaveCount(0);

    await page.getByTestId("anomalies-filter-unreviewed").click();
    await page.waitForURL("**/quality?tab=anomalies&resolved=false");
    await expect(page.getByTestId("anomaly-row-1")).toBeVisible();
    await expect(page.getByTestId("anomaly-row-2")).toHaveCount(0);
  });

  test("an unknown service id shows a not-found state", async ({ page }) => {
    await loginAsMockAdmin(page, "/quality/services/999999");
    await expect(page.getByTestId("service-metric-error")).toBeVisible();
    await expect(page.getByTestId("service-metric-error")).toContainText(
      "No service quality metric",
    );
  });

  test("review an unreviewed anomaly marks it reviewed (SUPERADMIN)", async ({
    page,
  }) => {
    // Mutates shared store: anomaly #1 → reviewed. Runs before the reviewed
    // filter assertions rely on #1 being unreviewed? No — the filter test above
    // runs first (alphabetical-ish file order is not guaranteed, so this test
    // does not assume #1 still unreviewed elsewhere; it asserts the transition).
    await loginAsMockAdmin(page, "/quality?tab=anomalies&resolved=false");
    const row = page.getByTestId("anomaly-row-1");
    await expect(row.getByTestId("anomaly-reviewed-1")).toContainText("Pending");
    await expect(row.getByTestId("anomaly-review-1")).toBeVisible();

    await row.getByTestId("anomaly-review-1-note").fill("Confirmed benign");
    await row.getByTestId("anomaly-review-1").click();

    // Barrier: reviewAnomalyAction revalidates /quality with no redirect, so the
    // reviewed row drops out of the unreviewed filter on THIS page. Wait for that
    // before navigating — otherwise the goto below can race ahead of the mutation
    // commit and the reviewed list won't yet contain #1 (the actual flake).
    await expect(page.getByTestId("anomaly-row-1")).toHaveCount(0);

    // Switch to reviewed and confirm it now shows as Reviewed.
    await page.goto("/quality?tab=anomalies&resolved=true");
    await expect(
      page.getByTestId("anomaly-row-1").getByTestId("anomaly-reviewed-1"),
    ).toContainText("Reviewed");
  });

  test("activate a formula config then roll back (SUPERADMIN)", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/quality?tab=formula-configs");
    // v3 (#2) is seeded active; v2 (#1) inactive with an Activate button.
    await expect(
      page.getByTestId("formula-config-row-2").getByTestId("formula-config-status-2"),
    ).toContainText("Active");
    await expect(page.getByTestId("formula-activate-1")).toBeVisible();

    page.on("dialog", (d) => d.accept());
    await page.getByTestId("formula-activate-1").click();

    // Active flag moves to #1; #2 becomes inactive.
    await expect(
      page.getByTestId("formula-config-row-1").getByTestId("formula-config-active-1"),
    ).toBeVisible();
    await expect(
      page.getByTestId("formula-config-row-2").getByTestId("formula-config-status-2"),
    ).toContainText("Inactive");

    // Roll back: previous active (#2) is restored.
    await page.getByTestId("formula-rollback").click();
    await expect(
      page.getByTestId("formula-config-row-2").getByTestId("formula-config-active-2"),
    ).toBeVisible();
    await expect(
      page.getByTestId("formula-config-row-1").getByTestId("formula-config-status-1"),
    ).toContainText("Inactive");
  });

  test("set then clear a service manual override (SUPERADMIN)", async ({
    page,
  }) => {
    // Service #502 is seeded with no override. Set one, confirm it shows, then
    // clear it. Runs as the override mutation for #502 (independent of #501).
    await loginAsMockAdmin(page, "/quality/services/502");
    await expect(page.getByTestId("override-none")).toBeVisible();
    await expect(page.getByTestId("override-controls")).toBeVisible();

    await page.getByTestId("override-coefficient").fill("1.5");
    await page.getByTestId("override-reason").fill("Promo boost");
    await page.getByTestId("override-submit").click();

    await expect(page.getByTestId("override-coefficient-value")).toContainText(
      "×1.5",
    );

    page.on("dialog", (d) => d.accept());
    await page.getByTestId("clear-override-submit").click();
    await expect(page.getByTestId("override-none")).toBeVisible();
  });

  test("non-SUPERADMIN sees no write controls", async ({ page }) => {
    // mod@example.com is a MODERATOR — reads still work, but the formula
    // activate/rollback, anomaly review, and override controls are not rendered.
    await loginAsMockAdmin(page, "/quality?tab=formula-configs", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("formula-configs-table")).toBeVisible();
    await expect(page.getByTestId("formula-rollback-panel")).toHaveCount(0);
    await expect(page.getByTestId("formula-activate-1")).toHaveCount(0);

    // Anomalies tab (all rows — resolved state is shared-store-dependent, so we
    // don't filter): the Review control must never render for a non-SUPERADMIN.
    await page.goto("/quality?tab=anomalies");
    await expect(page.getByTestId("anomalies-table")).toBeVisible();
    await expect(page.getByTestId("anomaly-row-2")).toBeVisible();
    await expect(page.getByTestId("anomaly-review-1")).toHaveCount(0);
    await expect(page.getByTestId("anomaly-review-2")).toHaveCount(0);

    // Service override controls hidden on the detail route.
    await page.goto("/quality/services/501");
    await expect(page.getByTestId("service-metric-id")).toBeVisible();
    await expect(page.getByTestId("override-controls")).toHaveCount(0);
  });
});
