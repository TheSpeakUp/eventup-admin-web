"use client";

import Icon from "./Icon";

/**
 * Footer control for the accumulating grid view: a "Load more" button while
 * more pages remain, an inline retry message on failure, and a "N shown" (or
 * "N of TOTAL shown") count. Pairs with `useLoadMore`.
 */
export default function LoadMoreButton({
  hasMore,
  loading,
  error,
  shown,
  total,
  onLoadMore,
  testid,
}: {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  shown: number;
  total?: number;
  onLoadMore: () => void;
  testid?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-5">
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          data-testid={testid}
          className="inline-flex items-center gap-2 rounded-md border border-hairline-strong bg-surface-2 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-3 disabled:opacity-60"
        >
          <Icon
            name={loading ? "refresh" : "plus"}
            size={15}
            className={loading ? "animate-spin" : undefined}
          />
          {loading ? "Loading…" : "Load more"}
        </button>
      ) : null}
      {error ? (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      ) : null}
      <span className="text-xs text-ink-tertiary" data-testid={testid ? `${testid}-count` : undefined}>
        {total != null ? `${shown} of ${total} shown` : `${shown} shown`}
      </span>
    </div>
  );
}
