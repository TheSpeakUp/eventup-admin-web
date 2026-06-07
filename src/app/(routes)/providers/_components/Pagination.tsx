import Link from "next/link";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

function pageHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) sp.set(k, v);
  }
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ page, pageSize, total, basePath, searchParams }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;
  const from = Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= lastPage;
  return (
    <div className="flex items-center justify-between" data-testid="providers-pagination">
      <span className="text-xs text-zinc-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-300">Prev</span>
        ) : (
          <Link
            href={pageHref(basePath, searchParams, page - 1)}
            data-testid="providers-prev"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Prev
          </Link>
        )}
        <span className="text-xs text-zinc-500" data-testid="providers-page-indicator">
          Page {page} of {lastPage}
        </span>
        {nextDisabled ? (
          <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-300">Next</span>
        ) : (
          <Link
            href={pageHref(basePath, searchParams, page + 1)}
            data-testid="providers-next"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
