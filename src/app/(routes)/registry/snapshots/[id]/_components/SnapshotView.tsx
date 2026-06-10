import { formatDateTime } from "@/lib/format";
import type { RegistrySnapshot } from "@/lib/registry/types";

function JsonBlock({
  label,
  value,
  testid,
}: {
  label: string;
  value: Record<string, unknown> | null;
  testid: string;
}) {
  return (
    <div className="flex-1">
      <h3 className="text-sm font-medium text-zinc-600">{label}</h3>
      <pre
        data-testid={testid}
        className="mt-1 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs"
      >
        {value === null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function SnapshotView({ snapshot }: { snapshot: RegistrySnapshot }) {
  return (
    <div className="space-y-5">
      <dl
        data-testid="snapshot-meta"
        className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3"
      >
        <div>
          <dt className="text-zinc-500">Entity type</dt>
          <dd>{snapshot.entity_type}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Action</dt>
          <dd data-testid="snapshot-action">{snapshot.action}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Attribute key</dt>
          <dd className="font-mono text-xs">{snapshot.attribute_key}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Category id</dt>
          <dd>{snapshot.category_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Binding id</dt>
          <dd>{snapshot.binding_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Actor</dt>
          <dd>{snapshot.actor_display_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">When</dt>
          <dd>{formatDateTime(snapshot.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rollback source</dt>
          <dd data-testid="snapshot-rollback-source">
            {snapshot.rollback_source_snapshot_id ?? "—"}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 md:flex-row">
        <JsonBlock
          label="Before"
          value={snapshot.before_state}
          testid="snapshot-before"
        />
        <JsonBlock
          label="After"
          value={snapshot.after_state}
          testid="snapshot-after"
        />
      </div>
    </div>
  );
}
