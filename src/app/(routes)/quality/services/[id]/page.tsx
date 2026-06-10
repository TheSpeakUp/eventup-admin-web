// src/app/(routes)/quality/services/[id]/page.tsx
//
// Service quality metric detail — exercises GET /quality/services/{id}. Shows
// the score breakdown. SUPERADMIN additionally gets the manual-override SET
// form and (when an override is active) the CLEAR action. A 404 renders an
// actionable not-found panel (same idiom as the promotions order detail route).
import Link from "next/link";
import { getServiceMetric } from "@/lib/quality/api";
import { getAdminSession } from "@/lib/auth/session";
import TierBadge from "../../_components/TierBadge";
import OverrideForm from "../../_components/OverrideForm";
import ClearOverrideButton from "../../_components/ClearOverrideButton";

export default async function ServiceMetricDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getServiceMetric(Number(id));

  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Service quality metric</h1>
        <div
          data-testid="service-metric-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {res.status === 404
            ? `No service quality metric with id ${id}.`
            : res.status === 403
              ? "Viewing quality metrics requires an admin role."
              : `Failed to load metric: ${res.message}`}
        </div>
        <Link
          href="/quality?tab=services"
          className="mt-4 inline-block text-sm text-blue-700"
        >
          ← Back to service metrics
        </Link>
      </div>
    );
  }

  const m = res.data;
  const session = await getAdminSession();
  const canManage = session?.role === "SUPERADMIN";
  const hasOverride = m.manual_override_coefficient !== null;

  const scoreRows: { label: string; value: string }[] = [
    { label: "Ranking score", value: m.ranking_score.toFixed(3) },
    { label: "Trust score", value: m.trust_score.toFixed(3) },
    { label: "Conversion score", value: m.conversion_score.toFixed(3) },
    { label: "Response score", value: m.response_score.toFixed(3) },
    { label: "Cancellation quality", value: m.cancellation_quality.toFixed(3) },
    { label: "Complaint quality", value: m.complaint_quality.toFixed(3) },
    {
      label: "Anti-gaming coefficient",
      value: m.anti_gaming_coefficient.toFixed(3),
    },
    { label: "Anomaly score", value: m.anomaly_score.toFixed(3) },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold" data-testid="service-metric-id">
          Service #{m.service_id}
        </h1>
        <TierBadge tier={m.quality_tier} />
        <span className="text-sm text-zinc-500">
          provider #{m.provider_id} · formula {m.formula_version}
        </span>
      </div>

      <h2 className="mt-6 text-lg font-semibold">Score breakdown</h2>
      <dl
        className="mt-2 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-sm text-zinc-700"
        data-testid="service-metric-scores"
      >
        {scoreRows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <dt className="text-zinc-500">{row.label}</dt>
            <dd className="font-mono">{row.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-6 text-lg font-semibold">Volumes</h2>
      <dl
        className="mt-2 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-sm text-zinc-700"
        data-testid="service-metric-volumes"
      >
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Favorites</dt>
          <dd>{m.favorites_total}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Reservations</dt>
          <dd>{m.reservations_total}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Converted</dt>
          <dd>{m.reservations_converted}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Failed</dt>
          <dd>{m.reservations_failed}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Complaints</dt>
          <dd>{m.complaints_total}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">SLA breaches</dt>
          <dd>
            {m.sla_breaches} / {m.sla_activity_total}
          </dd>
        </div>
      </dl>

      <h2 className="mt-6 text-lg font-semibold">Manual override</h2>
      <div className="mt-2" data-testid="override-state">
        {hasOverride ? (
          <p className="text-sm text-zinc-700">
            Active:{" "}
            <span className="font-mono" data-testid="override-coefficient-value">
              ×{m.manual_override_coefficient}
            </span>
            {m.manual_override_reason
              ? ` — ${m.manual_override_reason}`
              : null}
            {m.manual_override_until
              ? ` (until ${m.manual_override_until})`
              : ""}
          </p>
        ) : (
          <p className="text-sm text-zinc-500" data-testid="override-none">
            No manual override on this service.
          </p>
        )}
      </div>

      {canManage ? (
        <div className="mt-4 max-w-2xl space-y-4" data-testid="override-controls">
          <OverrideForm metric={m} />
          {hasOverride ? (
            <ClearOverrideButton serviceId={m.service_id} />
          ) : null}
        </div>
      ) : null}

      <Link
        href="/quality?tab=services"
        className="mt-6 inline-block text-sm text-blue-700"
      >
        ← Back to service metrics
      </Link>
    </div>
  );
}
