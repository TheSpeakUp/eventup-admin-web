import { getProviderHealth } from "@/lib/offers/api";

export default async function ProviderHealthSection() {
  const result = await getProviderHealth({ limit: 50 });
  if (!result.ok) return <p data-testid="provider-health-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="provider-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Provider health</h2>
        <span className="text-xs text-zinc-500">Updated {result.data.generated_at}</span>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Provider</th>
            <th className="px-2 py-1">Services</th>
            <th className="px-2 py-1">On review</th>
            <th className="px-2 py-1">In SLA</th>
            <th className="px-2 py-1">Warning</th>
            <th className="px-2 py-1">Overdue</th>
            <th className="px-2 py-1">Overdue %</th>
            <th className="px-2 py-1">Escalation</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.provider_id} data-testid={`provider-health-row-${it.provider_id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.provider_name ?? `#${it.provider_id}`}</td>
              <td className="px-2 py-1">{it.services_total}</td>
              <td className="px-2 py-1">{it.total_on_review}</td>
              <td className="px-2 py-1">{it.in_sla}</td>
              <td className="px-2 py-1">{it.warning}</td>
              <td className="px-2 py-1">{it.overdue_response}</td>
              <td className="px-2 py-1">{(it.overdue_share * 100).toFixed(0)}%</td>
              <td className="px-2 py-1">{it.escalation_recommended ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
