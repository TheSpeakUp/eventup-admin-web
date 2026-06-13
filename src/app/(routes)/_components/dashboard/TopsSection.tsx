import { formatMoneyMinor } from "@/lib/format";
import type { TopsResponse } from "@/lib/dashboard/types";

function Table({
  title,
  columns,
  rows,
  testid,
  emptyMessage,
}: {
  title: string;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, string>[];
  testid: string;
  emptyMessage: string;
}) {
  return (
    <div data-testid={testid} className="rounded border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      {rows.length === 0 ? (
        <div className="text-xs text-zinc-400">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 font-medium text-zinc-600 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-zinc-700 ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TopsSection({ data }: { data: TopsResponse }) {
  if (!data) {
    return <div className="text-sm text-zinc-500">No top performers data</div>;
  }

  const { providers, services, promo_discounts } = data;

  // Format providers
  const providerRows = (providers || []).map((p) => ({
    name: p.provider_name || `Provider #${p.provider_id}`,
    gross: formatMoneyMinor(p.gross_minor, p.currency),
    payments: p.payment_count.toLocaleString(),
  }));

  // Format services
  const serviceRows = (services || []).map((s) => ({
    title: s.service_title || `Service #${s.service_id}`,
    provider: s.provider_name || `Provider #${s.provider_id}` || "—",
    gross: formatMoneyMinor(s.gross_minor, s.currency),
    payments: s.payment_count.toLocaleString(),
  }));

  // Format promo discounts
  const promoRows = (promo_discounts || []).map((p) => ({
    currency: p.currency || "—",
    discount: formatMoneyMinor(p.discount_minor, p.currency),
    usage: p.usage_count.toLocaleString(),
  }));

  return (
    <div data-testid="tops-section" className="space-y-6">
      <Table
        title="Top Providers"
        columns={[
          { key: "name", label: "Provider", align: "left" },
          { key: "gross", label: "Gross Revenue", align: "right" },
          { key: "payments", label: "Payments", align: "right" },
        ]}
        rows={providerRows}
        testid="tops-providers-table"
        emptyMessage="No provider data available"
      />

      <Table
        title="Top Services"
        columns={[
          { key: "title", label: "Service", align: "left" },
          { key: "provider", label: "Provider", align: "left" },
          { key: "gross", label: "Gross Revenue", align: "right" },
          { key: "payments", label: "Payments", align: "right" },
        ]}
        rows={serviceRows}
        testid="tops-services-table"
        emptyMessage="No service data available"
      />

      <Table
        title="Promo Discounts"
        columns={[
          { key: "currency", label: "Currency", align: "left" },
          { key: "discount", label: "Total Discount", align: "right" },
          { key: "usage", label: "Usage Count", align: "right" },
        ]}
        rows={promoRows}
        testid="tops-promos-table"
        emptyMessage="No promo discount data available"
      />
    </div>
  );
}
