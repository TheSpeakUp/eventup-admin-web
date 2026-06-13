import { formatDateTime } from "@/lib/format";
import { getDispatchRuns } from "@/lib/offers/api";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import Alert from "@/app/_components/ui/Alert";

export default async function DispatchRunsSection() {
  const result = await getDispatchRuns({ limit: 50 });
  if (!result.ok)
    return (
      <div data-testid="dispatch-runs-error">
        <Alert tone="danger">{result.message}</Alert>
      </div>
    );
  const items = result.data.items;
  return (
    <section data-testid="dispatch-runs">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Dispatch runs ({result.data.total})</h2>
      </header>
      <Table>
        <THead>
          <Tr>
            <Th>Created at</Th>
            <Th>Scope</Th>
            <Th>Status</Th>
            <Th>Actor</Th>
            <Th>Idempotency key</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={5} align="center" className="py-3 text-ink-subtle" data-testid="dispatch-runs-empty">
                No dispatch runs.
              </Td>
            </Tr>
          ) : null}
          {items.map((it) => (
            <Tr key={it.id} data-testid={`dispatch-runs-row-${it.id}`}>
              <Td>{formatDateTime(it.created_at)}</Td>
              <Td>{it.dispatch_scope}</Td>
              <Td>{it.status}</Td>
              <Td>{it.actor_email ?? "—"}</Td>
              <Td className="font-mono text-xs">{it.idempotency_key ?? "—"}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </section>
  );
}
