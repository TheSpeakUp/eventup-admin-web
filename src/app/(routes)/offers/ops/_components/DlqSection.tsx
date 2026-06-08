import { getDlq } from "@/lib/offers/api";

export default async function DlqSection({ excludeReplayed = true }: { excludeReplayed?: boolean }) {
  const result = await getDlq({ exclude_replayed_successes: excludeReplayed, limit: 50 });
  if (!result.ok) return <p data-testid="dlq-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="dlq">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">DLQ ({result.data.total})</h2>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Channel</th>
            <th className="px-2 py-1">Provider</th>
            <th className="px-2 py-1">Created at</th>
            <th className="px-2 py-1">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.dlq_key} data-testid={`dlq-row-${it.dlq_key}`} className="border-t border-zinc-100">
              <td className="px-2 py-1 font-mono text-xs">{it.dlq_key}</td>
              <td className="px-2 py-1">{it.channel}</td>
              <td className="px-2 py-1">#{it.provider_id}</td>
              <td className="px-2 py-1">{it.created_at}</td>
              <td className="px-2 py-1">{String((it.delivery_outcome as { status?: string })?.status ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
