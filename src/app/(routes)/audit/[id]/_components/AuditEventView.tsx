import { formatDateTime } from "@/lib/format";
import type { AuditEventDetail } from "@/lib/audit/types";
import AuditOutcomeBadge from "../../_components/AuditOutcomeBadge";

function Field({
  label,
  children,
  testid,
}: {
  label: string;
  children: React.ReactNode;
  testid?: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900" data-testid={testid}>
        {children}
      </dd>
    </div>
  );
}

function Mono({ value }: { value: string | null }) {
  return <span className="break-all font-mono text-xs">{value ?? "—"}</span>;
}

// Render a free-form JSON blob readably. An empty/absent payload shows the
// em-dash placeholder; otherwise pretty-printed JSON in a scrollable <pre>.
function JsonBlock({
  payload,
  testid,
}: {
  payload: Record<string, unknown> | null;
  testid: string;
}) {
  if (!payload || Object.keys(payload).length === 0) {
    return (
      <p className="text-sm text-zinc-400" data-testid={`${testid}-empty`}>
        —
      </p>
    );
  }
  return (
    <pre
      data-testid={testid}
      className="mt-1 max-h-96 overflow-auto rounded-md bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800 ring-1 ring-inset ring-zinc-200"
    >
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

export default function AuditEventView({
  event,
}: {
  event: AuditEventDetail;
}) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            data-testid="audit-detail-title"
          >
            {event.action}
          </h1>
          <p className="text-sm text-zinc-500">
            {event.event_domain} · {event.event_name} ·{" "}
            {formatDateTime(event.occurred_at)}
          </p>
        </div>
        <AuditOutcomeBadge outcome={event.outcome} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Field label="Event ID" testid="audit-field-id">
          <Mono value={event.id} />
        </Field>
        <Field label="Correlation ID" testid="audit-field-correlation">
          <Mono value={event.correlation_id} />
        </Field>
        <Field label="Realm" testid="audit-field-realm">
          {event.realm}
        </Field>
        <Field label="Event type" testid="audit-field-event-type">
          {event.event_type}
        </Field>
        <Field label="Action" testid="audit-field-action">
          <span className="font-mono text-xs">{event.action}</span>
        </Field>
        <Field label="Outcome" testid="audit-field-outcome">
          {event.outcome} ({event.success ? "success" : "failure"})
        </Field>
        <Field label="Actor email" testid="audit-field-actor-email">
          {event.actor_email ?? "—"}
        </Field>
        <Field label="Actor ID" testid="audit-field-actor-id">
          <Mono value={event.actor_id} />
        </Field>
        <Field label="Entity type" testid="audit-field-entity-type">
          {event.entity_type ?? "—"}
        </Field>
        <Field label="Entity ID" testid="audit-field-entity-id">
          <Mono value={event.entity_id} />
        </Field>
        <Field label="Occurred at" testid="audit-field-occurred">
          {formatDateTime(event.occurred_at)}
        </Field>
        <Field label="Recorded at" testid="audit-field-created">
          {formatDateTime(event.created_at)}
        </Field>
      </dl>

      <div className="border-t border-zinc-100 pt-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Request
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Method" testid="audit-field-method">
            {event.request_method ?? "—"}
          </Field>
          <Field label="Path" testid="audit-field-path">
            <Mono value={event.request_path} />
          </Field>
          <Field label="IP address" testid="audit-field-ip">
            <Mono value={event.ip_address} />
          </Field>
          <Field label="User agent" testid="audit-field-user-agent">
            <Mono value={event.user_agent} />
          </Field>
        </dl>
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Metadata
        </h2>
        <JsonBlock payload={event.metadata} testid="audit-metadata" />
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Details
        </h2>
        <JsonBlock payload={event.details} testid="audit-details" />
      </div>

      {event.error_message ? (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-900"
          data-testid="audit-error-message"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Error
          </p>
          <p className="mt-1">{event.error_message}</p>
        </div>
      ) : null}
    </div>
  );
}
