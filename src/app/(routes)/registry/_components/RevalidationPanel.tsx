"use client";
import { useActionState } from "react";
import { runRevalidationAction } from "../actions";
import { EMPTY_REVALIDATION_STATE } from "../action-types";

export default function RevalidationPanel() {
  const [state, formAction, pending] = useActionState(
    runRevalidationAction,
    EMPTY_REVALIDATION_STATE,
  );
  return (
    <section
      data-testid="revalidation-panel"
      className="rounded-md border border-zinc-200 bg-surface-1 p-5"
    >
      <h2 className="text-lg font-semibold">Run attribute revalidation</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Manually revalidate / backfill marketplace attribute data. Leave the id
        lists empty to run unscoped.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-zinc-500">
          Category ids (comma-separated)
          <input
            type="text"
            name="category_ids"
            placeholder="e.g. 7, 12"
            data-testid="revalidation-category-ids"
            className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Service ids (comma-separated)
          <input
            type="text"
            name="service_ids"
            placeholder="e.g. 101, 102"
            data-testid="revalidation-service-ids"
            className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Limit
          <input
            type="number"
            name="limit"
            min={1}
            max={5000}
            defaultValue={500}
            data-testid="revalidation-limit"
            className="mt-1 w-28 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Source
          <input
            type="text"
            name="source"
            defaultValue="admin_manual"
            maxLength={64}
            data-testid="revalidation-source"
            className="mt-1 w-40 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          {/* hidden sentinel + checkbox = F9 bool pattern */}
          <input type="hidden" name="only_pending" value="false" />
          <input
            type="checkbox"
            name="only_pending"
            value="true"
            defaultChecked
            data-testid="revalidation-only-pending"
          />
          Only pending
        </label>
        <button
          type="submit"
          disabled={pending}
          data-testid="revalidation-run"
          className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Running…" : "Run revalidation"}
        </button>
      </form>
      {state.ok === false ? (
        <p
          data-testid="revalidation-error"
          className="mt-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok === true ? (
        <dl
          data-testid="revalidation-result"
          className="mt-4 grid grid-cols-4 gap-3 text-sm"
        >
          <div>
            <dt className="text-zinc-500">Processed</dt>
            <dd
              data-testid="revalidation-processed"
              className="font-semibold"
            >
              {state.result.processed_count}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Valid</dt>
            <dd className="font-semibold">{state.result.valid_count}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Invalid</dt>
            <dd className="font-semibold">{state.result.invalid_count}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Pending</dt>
            <dd className="font-semibold">{state.result.pending_count}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
