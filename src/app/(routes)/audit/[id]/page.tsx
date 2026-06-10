import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuditEvent } from "@/lib/audit/api";
import AuditEventView from "./_components/AuditEventView";

type Params = Promise<{ id: string }>;

// Read-only audit event detail (M6). Event ids are UUID strings. There is no
// action panel — this surface IS the audit log.
export default async function AuditEventPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  if (!id || !id.trim()) notFound();
  const result = await getAuditEvent(id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <Link href="/audit" className="text-sm text-zinc-500 hover:underline">
          ← Back to audit log
        </Link>
        <div
          data-testid="audit-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {result.status === 403
            ? "Viewing the audit log requires the audit-read permission."
            : `Failed to load audit event: ${result.message}`}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/audit" className="text-sm text-zinc-500 hover:underline">
        ← Back to audit log
      </Link>
      <AuditEventView event={result.data} />
    </div>
  );
}
