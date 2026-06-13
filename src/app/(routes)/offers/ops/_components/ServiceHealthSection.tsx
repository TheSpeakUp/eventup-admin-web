import { formatDateTime } from "@/lib/format";
import { getServiceHealth } from "@/lib/offers/api";

export default async function ServiceHealthSection() {
  const result = await getServiceHealth({ limit: 50 });
  if (!result.ok) return <p data-testid="service-health-error" className="text-sm text-red-300">{result.message}</p>;
  const items = result.data.items;
  return (
    <section data-testid="service-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Service health</h2>
        <span className="text-xs text-zinc-500" data-testid="service-health-generated-at">
          Updated {formatDateTime(result.data.generated_at)}
        </span>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Service</th>
            <th className="px-2 py-1">On review</th>
            <th className="px-2 py-1">In SLA</th>
            <th className="px-2 py-1">Warning</th>
            <th className="px-2 py-1">Overdue</th>
            <th className="px-2 py-1">Overdue %</th>
            <th className="px-2 py-1">Escalation</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-2 py-3 text-center text-zinc-500" data-testid="service-health-empty">
                No service health data.
              </td>
            </tr>
          ) : null}
          {items.map((it) => (
            <tr key={it.service_id} data-testid={`service-health-row-${it.service_id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.service_title ?? `#${it.service_id}`}</td>
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
