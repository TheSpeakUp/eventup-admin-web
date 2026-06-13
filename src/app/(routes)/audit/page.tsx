// src/app/(routes)/audit/page.tsx
//
// Read-only operator audit log (M6). Offset/limit paginated against
// GET /eventup-admin/v1/audit (the router root); the endpoint returns `total`
// alongside the page items. Filters (actor_email, action, entity_type, success)
// ride the querystring and reset the offset. A 403 surfaces the audit-read
// permission panel. THIS SURFACE IS THE AUDIT LOG — there is no write path.
import { listAuditEvents } from "@/lib/audit/api";
import AuditFilters from "./_components/AuditFilters";
import AuditPagination from "./_components/AuditPagination";
import AuditTable from "./_components/AuditTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import PageHeader from "@/app/_components/ui/PageHeader";
import { Panel } from "@/app/_components/ui";

const LIMIT = 10;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickOffset(value: string | undefined): number {
  if (value === undefined) return 0;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// "true"/"false" → boolean; anything else clears the filter.
function pickSuccess(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const actorEmail = pickString(sp.actor_email)?.trim() || undefined;
  const action = pickString(sp.action)?.trim() || undefined;
  const entityType = pickString(sp.entity_type)?.trim() || undefined;
  const rawSuccess = pickString(sp.success)?.trim();
  const success = pickSuccess(rawSuccess);
  const realm = pickString(sp.realm)?.trim() || undefined;
  // Date params carry the raw YYYY-MM-DD value — the backend accepts it; no
  // time-zone conversion (matches the payments date-range filter).
  const occurredFrom = pickString(sp.occurred_from)?.trim() || undefined;
  const occurredTo = pickString(sp.occurred_to)?.trim() || undefined;
  const offset = pickOffset(pickString(sp.offset));

  const result = await listAuditEvents({
    actor_email: actorEmail,
    action,
    entity_type: entityType,
    success,
    realm,
    occurred_from: occurredFrom,
    occurred_to: occurredTo,
    limit: LIMIT,
    offset,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Audit log
        </h1>
        <div
          data-testid="audit-error"
          className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {result.status === 403
            ? "Viewing the audit log requires the audit-read permission."
            : `Failed to load audit events: ${result.message}`}
        </div>
      </div>
    );
  }

  const { items, total } = result.data;
  const preserved = {
    actor_email: actorEmail,
    action,
    entity_type: entityType,
    success: rawSuccess && (rawSuccess === "true" || rawSuccess === "false")
      ? rawSuccess
      : undefined,
    realm,
    occurred_from: occurredFrom,
    occurred_to: occurredTo,
  };

  return (
    <div className="p-8 space-y-5">
      <PageHeader title="Audit log" />
      <Panel
        title="Audit log"
        accent="primary"
        bodyClassName="p-0"
        action={
          <div className="flex items-center gap-3">
            <ExportCsvButton surface="audit" params={preserved} />
            <span className="text-xs text-zinc-500" data-testid="audit-total">
              {total} event{total === 1 ? "" : "s"} total
            </span>
          </div>
        }
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <AuditFilters />
        </div>
        <AuditTable rows={items} />
        <div className="px-4 py-3 border-t border-hairline">
          <AuditPagination
            total={total}
            limit={LIMIT}
            offset={offset}
            basePath="/audit"
            searchParams={preserved}
          />
        </div>
      </Panel>
    </div>
  );
}
