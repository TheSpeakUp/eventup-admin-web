// src/app/(routes)/quality/_components/OverrideForm.tsx
"use client";
import { useActionState } from "react";
import { setOverrideAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ServiceQualityMetricRead } from "@/lib/quality/types";
import Button from "@/app/_components/ui/Button";
import { FormField, Input } from "@/app/_components/ui/FormField";

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
      className="space-y-3 rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <input type="hidden" name="service_id" value={metric.service_id} />

      <FormField label="Coefficient (0, 10]" htmlFor="override-coefficient">
        <Input
          id="override-coefficient"
          name="coefficient"
          data-testid="override-coefficient"
          type="number"
          step="0.01"
          min="0.01"
          max="10"
          defaultValue={metric.manual_override_coefficient ?? ""}
          required
        />
      </FormField>

      <FormField label="Reason" htmlFor="override-reason">
        <Input
          id="override-reason"
          name="reason"
          data-testid="override-reason"
          defaultValue={metric.manual_override_reason ?? ""}
          required
        />
      </FormField>

      <FormField label="Until (optional)" htmlFor="override-until">
        <Input
          id="override-until"
          name="until"
          data-testid="override-until"
          type="datetime-local"
          defaultValue={untilDefault}
        />
      </FormField>

      <Button type="submit" disabled={pending} data-testid="override-submit">
        {pending ? "Saving…" : "Set override"}
      </Button>
      {state && !state.ok && state.error ? (
        <p data-testid="override-error" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
