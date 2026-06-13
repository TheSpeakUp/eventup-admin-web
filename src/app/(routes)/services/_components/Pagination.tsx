import Link from "next/link";

type Props = {
  nextLastId: number | null;
  hasMore: boolean;
  count: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  lastId: number | undefined;
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

export default function Pagination({
  nextLastId,
  hasMore,
  count,
  basePath,
  searchParams,
  lastId,
}: Props) {
  const onFirstPage = lastId === undefined;
  if (onFirstPage && !hasMore) return null;
  return (
    <div className="flex items-center justify-between" data-testid="services-pagination">
      <span className="text-xs text-ink-subtle" data-testid="page-count">
        {count} on this page
      </span>
      <div className="flex items-center gap-2">
        {onFirstPage ? (
          <span className="rounded-md border border-hairline px-3 py-1 text-xs text-ink-tertiary">First</span>
        ) : (
          <Link
            href={withParams(basePath, searchParams, { last_id: null })}
            data-testid="services-first"
            className="rounded-md border border-hairline bg-surface-1 px-3 py-1 text-xs text-ink hover:border-hairline-strong hover:bg-surface-2"
          >
            First
          </Link>
        )}
        {hasMore && nextLastId !== null ? (
          <Link
            href={withParams(basePath, searchParams, { last_id: String(nextLastId) })}
            data-testid="services-next"
            className="rounded-md border border-hairline bg-surface-1 px-3 py-1 text-xs text-ink hover:border-hairline-strong hover:bg-surface-2"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-hairline px-3 py-1 text-xs text-ink-tertiary">Next</span>
        )}
      </div>
    </div>
  );
}
