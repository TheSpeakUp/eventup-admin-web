import Link from "next/link";
import {
  formatCount,
  formatCtr,
  type ListingStat,
  type ListingType,
} from "@/lib/traffic/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

export default function ListingStatTable({
  rows,
  type,
  testid,
  emptyLabel,
}: {
  rows: ListingStat[];
  type: ListingType;
  testid: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        data-testid={`${testid}-empty`}
        className="rounded border border-zinc-200 bg-surface-1 p-4 text-sm text-zinc-500"
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <Table
      data-testid={testid}
      className="border-collapse overflow-hidden bg-surface-1"
    >
      <Thead>
        <tr>
          <Th>Listing</Th>
          <Th>Provider</Th>
          <Th className="text-right">Views</Th>
          <Th className="text-right">Clicks</Th>
          <Th className="text-right">CTR</Th>
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.subject_id} data-testid={`${testid}-row-${r.subject_id}`}>
            <Td>
              <Link
                href={`/traffic/listings/${type}/${r.subject_id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {r.name ?? `#${r.subject_id}`}
              </Link>
            </Td>
            <Td className="text-zinc-600">{r.provider_name ?? "—"}</Td>
            <Td className="text-right tabular-nums">{formatCount(r.views)}</Td>
            <Td className="text-right tabular-nums">{formatCount(r.clicks)}</Td>
            <Td className="text-right tabular-nums">{formatCtr(r.ctr)}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
