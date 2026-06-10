import Link from "next/link";
import { notFound } from "next/navigation";
import { findRegistrySnapshot } from "@/lib/registry/api";
import { getAdminSession } from "@/lib/auth/session";
import { SnapshotView } from "./_components/SnapshotView";
import { RollbackButton } from "./_components/RollbackButton";

// Read-only registry snapshot detail (F13). There is NO GET-by-id endpoint —
// the row is reconstructed from a capped list (findRegistrySnapshot). Rollback
// requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
export default async function RegistrySnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();

  const [found, session] = await Promise.all([
    findRegistrySnapshot(numericId),
    getAdminSession(),
  ]);

  if (!found.ok) {
    return (
      <div className="p-8">
        <Link
          href="/registry"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to registry
        </Link>
        <div
          data-testid="snapshot-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {found.status === 403
            ? "Viewing registry snapshots requires the marketplace-read permission."
            : `Failed to load registry snapshot: ${found.message}`}
        </div>
      </div>
    );
  }
  if (!found.snapshot) notFound();

  const snapshot = found.snapshot;
  const canRollback =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  return (
    <div className="p-8 space-y-6">
      <Link href="/registry" className="text-sm text-zinc-500 hover:underline">
        ← Back to registry
      </Link>
      <h1
        className="text-2xl font-semibold"
        data-testid="snapshot-detail-id"
      >
        Snapshot #{snapshot.id}
      </h1>
      <SnapshotView snapshot={snapshot} />
      {canRollback ? <RollbackButton snapshotId={snapshot.id} /> : null}
    </div>
  );
}
