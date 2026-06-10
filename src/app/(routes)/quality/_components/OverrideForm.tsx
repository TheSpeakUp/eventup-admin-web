// src/app/(routes)/quality/_components/OverrideForm.tsx
"use client";
import { useActionState } from "react";
import { setOverrideAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ServiceQualityMetricRead } from "@/lib/quality/types";

// Manual-override SET form (POST /services/{id}/override). Pre-fills from the
// current override when one is active. coefficient bounded (0, 10]; reason
// required; until optional. Structured backend errors render inline.
export default function OverrideForm({
  metric,
}: {
  metric: ServiceQualityMetricRead;
}) {
  const [state, formAction, pending] = useActionState(
    setOverrideAction,
    EMPTY_STATE,
  );
  // datetime-local wants "YYYY-MM-DDTHH:mm"; trim the ISO seconds/zone.
  const untilDefault = metric.manual_override_until
    ? metric.manual_override_until.slice(0, 16)
    : "";
  return (
    <form
      action={formAction}
      data-testid="override-form"
      className="space-y-3 rounded border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="service_id" value={metric.service_id} />

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Coefficient (0, 10]
        </span>
        <input
          name="coefficient"
          data-testid="override-coefficient"
          type="number"
          step="0.01"
          min="0.01"
          max="10"
          defaultValue={metric.manual_override_coefficient ?? ""}
          required
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Reason</span>
        <input
          name="reason"
          data-testid="override-reason"
          defaultValue={metric.manual_override_reason ?? ""}
          required
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Until (optional)
        </span>
        <input
          name="until"
          data-testid="override-until"
          type="datetime-local"
          defaultValue={untilDefault}
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        data-testid="override-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set override"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="override-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
