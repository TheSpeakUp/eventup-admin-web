import { formatDateTime } from "@/lib/format";
import { getProviderHealth } from "@/lib/offers/api";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import Alert from "@/app/_components/ui/Alert";

export default async function ProviderHealthSection() {
  const result = await getProviderHealth({ limit: 50 });
  if (!result.ok)
    return (
      <div data-testid="provider-health-error">
        <Alert tone="danger">{result.message}</Alert>
      </div>
    );
  const items = result.data.items;
  return (
    <section data-testid="provider-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Provider health</h2>
        <span className="text-xs text-ink-subtle">Updated {formatDateTime(result.data.generated_at)}</span>
      </header>
      <Table>
        <THead>
          <Tr>
            <Th>Provider</Th>
            <Th>Services</Th>
            <Th>On review</Th>
            <Th>In SLA</Th>
            <Th>Warning</Th>
            <Th>Overdue</Th>
            <Th>Overdue %</Th>
            <Th>Escalation</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={8} align="center" className="py-3 text-ink-subtle" data-testid="provider-health-empty">
                No provider health data.
              </Td>
            </Tr>
          ) : null}
          {items.map((it) => (
            <Tr key={it.provider_id} data-testid={`provider-health-row-${it.provider_id}`}>
              <Td>{it.provider_name ?? `#${it.provider_id}`}</Td>
              <Td>{it.services_total}</Td>
              <Td>{it.total_on_review}</Td>
              <Td>{it.in_sla}</Td>
              <Td>{it.warning}</Td>
              <Td>{it.overdue_response}</Td>
              <Td>{(it.overdue_share * 100).toFixed(0)}%</Td>
              <Td>{it.escalation_recommended ? "yes" : "no"}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </section>
  );
}
