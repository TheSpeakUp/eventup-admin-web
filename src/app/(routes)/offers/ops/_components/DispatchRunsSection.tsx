import { getDispatchRuns } from "@/lib/offers/api";

export default async function DispatchRunsSection() {
  const result = await getDispatchRuns({ limit: 50 });
  if (!result.ok) return <p data-testid="dispatch-runs-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="dispatch-runs">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dispatch runs ({result.data.total})</h2>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Created at</th>
            <th className="px-2 py-1">Scope</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Actor</th>
            <th className="px-2 py-1">Idempotency key</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.id} data-testid={`dispatch-runs-row-${it.id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.created_at}</td>
              <td className="px-2 py-1">{it.dispatch_scope}</td>
              <td className="px-2 py-1">{it.status}</td>
              <td className="px-2 py-1">{it.actor_email ?? "—"}</td>
              <td className="px-2 py-1 font-mono text-xs">{it.idempotency_key ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
