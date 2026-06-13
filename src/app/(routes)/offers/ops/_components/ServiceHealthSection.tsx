import { formatDateTime } from "@/lib/format";
import { getServiceHealth } from "@/lib/offers/api";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import Alert from "@/app/_components/ui/Alert";

export default async function ServiceHealthSection() {
  const result = await getServiceHealth({ limit: 50 });
  if (!result.ok)
    return (
      <div data-testid="service-health-error">
        <Alert tone="danger">{result.message}</Alert>
      </div>
    );
  const items = result.data.items;
  return (
    <section data-testid="service-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Service health</h2>
        <span className="text-xs text-ink-subtle" data-testid="service-health-generated-at">
          Updated {formatDateTime(result.data.generated_at)}
        </span>
      </header>
      <Table>
        <THead>
          <Tr>
            <Th>Service</Th>
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
              <Td colSpan={7} align="center" className="py-3 text-ink-subtle" data-testid="service-health-empty">
                No service health data.
              </Td>
            </Tr>
          ) : null}
          {items.map((it) => (
            <Tr key={it.service_id} data-testid={`service-health-row-${it.service_id}`}>
              <Td>{it.service_title ?? `#${it.service_id}`}</Td>
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
