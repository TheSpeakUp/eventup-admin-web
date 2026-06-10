import Link from "next/link";

// Offset/limit pagination — the payments list endpoint returns `total` plus a
// page of `items`, so we can compute Prev/Next deterministically rather than
// following a cursor (unlike the providers list).

type Props = {
  total: number;
  limit: number;
  offset: number;
  basePath: string;
  // Filter params preserved across page links (status/currency/q/etc.).
  searchParams: Record<string, string | undefined>;
};

function withParams(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  overrides: Record<string, string | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) sp.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function PaymentsPagination({
  total,
  limit,
  offset,
  basePath,
  searchParams,
}: Props) {
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  if (!hasPrev && !hasNext) return null;

  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, total);

  return (
    <div
      className="flex items-center justify-between"
      data-testid="payments-pagination"
    >
      <span className="text-xs text-zinc-500" data-testid="payments-range">
        {rangeStart}–{rangeEnd} of {total}
      </span>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={withParams(
              basePath,
              searchParams,
              prevOffset === 0
                ? { offset: null }
                : { offset: String(prevOffset) },
            )}
            data-testid="payments-prev"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Prev
          </Link>
        ) : (
          <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-300">
            Prev
          </span>
        )}
        {hasNext ? (
          <Link
            href={withParams(basePath, searchParams, {
              offset: String(nextOffset),
            })}
            data-testid="payments-next"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
