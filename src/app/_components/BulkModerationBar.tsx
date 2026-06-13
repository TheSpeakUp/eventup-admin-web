"use client";

import { useState } from "react";

export type BulkResult = {
  done: number;
  failed: { id: number; error: string }[];
} | null;

// Sticky action bar shown when rows are selected (Layer-4 bulk moderation).
// Approve fires immediately; Reject expands a shared-reason input (the same
// reason is sent for every selected row — backend requires ≥10 chars).
export default function BulkModerationBar({
  count,
  pending,
  result,
  onApprove,
  onReject,
  onClear,
}: {
  count: number;
  pending: boolean;
  result: BulkResult;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClear: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (count === 0 && !result) return null;

  return (
    <div
      data-testid="bulk-bar"
      className="sticky bottom-4 z-10 mt-3 flex flex-wrap items-center gap-3 rounded-md border border-zinc-300 bg-surface-1 p-3 shadow-lg"
    >
      {count > 0 ? (
        <>
          <span className="text-sm font-medium text-zinc-700" data-testid="bulk-count">
            {count} selected
          </span>
          {!rejecting ? (
            <>
              <button
                type="button"
                data-testid="bulk-approve"
                disabled={pending}
                onClick={onApprove}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-400"
              >
                {pending ? "Working…" : "Approve selected"}
              </button>
              <button
                type="button"
                data-testid="bulk-reject-open"
                disabled={pending}
                onClick={() => setRejecting(true)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
              >
                Reject selected…
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Shared rejection reason (min 10 chars)…"
                data-testid="bulk-reject-reason"
                className="w-72 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                data-testid="bulk-reject-confirm"
                disabled={pending || reason.trim().length < 10}
                onClick={() => {
                  onReject(reason.trim());
                  setRejecting(false);
                  setReason("");
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
              >
                {pending ? "Working…" : `Reject ${count}`}
              </button>
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="text-sm text-zinc-500 hover:underline"
              >
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            data-testid="bulk-clear"
            onClick={onClear}
            className="ml-auto text-sm text-zinc-500 hover:underline"
          >
            Clear selection
          </button>
        </>
      ) : null}
      {result ? (
        <span className="text-sm" data-testid="bulk-result">
          <span className="text-emerald-700">{result.done} done</span>
          {result.failed.length > 0 ? (
            <span className="ml-2 text-red-700">
              {result.failed.length} failed (
              {result.failed.map((f) => `#${f.id}`).join(", ")})
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
