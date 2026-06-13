import { formatDateTime } from "@/lib/format";
import { getDlq } from "@/lib/offers/api";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import Alert from "@/app/_components/ui/Alert";

export default async function DlqSection({ excludeReplayed = true }: { excludeReplayed?: boolean }) {
  const result = await getDlq({ exclude_replayed_successes: excludeReplayed, limit: 50 });
  if (!result.ok)
    return (
      <div data-testid="dlq-error">
        <Alert tone="danger">{result.message}</Alert>
      </div>
    );
  const items = result.data.items;
  return (
    <section data-testid="dlq">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">DLQ ({result.data.total})</h2>
      </header>
      <Table>
        <THead>
          <Tr>
            <Th>Key</Th>
            <Th>Channel</Th>
            <Th>Provider</Th>
            <Th>Created at</Th>
            <Th>Outcome</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={5} align="center" className="py-3 text-ink-subtle" data-testid="dlq-empty">
                No DLQ entries.
              </Td>
            </Tr>
          ) : null}
          {items.map((it) => (
            <Tr key={it.dlq_key} data-testid={`dlq-row-${it.dlq_key}`}>
              <Td className="font-mono text-xs">{it.dlq_key}</Td>
              <Td>{it.channel}</Td>
              <Td>#{it.provider_id}</Td>
              <Td>{formatDateTime(it.created_at)}</Td>
              <Td>{String((it.delivery_outcome as { status?: string })?.status ?? "—")}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </section>
  );
}
