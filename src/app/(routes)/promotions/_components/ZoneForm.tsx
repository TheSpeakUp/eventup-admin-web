// src/app/(routes)/promotions/_components/ZoneForm.tsx
"use client";
import { useActionState } from "react";
import { createZoneAction, updateZoneAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ZoneRead } from "@/lib/promotions/types";

export default function ZoneForm({
  mode,
  zone,
}: {
  mode: "create" | "edit";
  zone?: ZoneRead;
}) {
  const action = mode === "create" ? createZoneAction : updateZoneAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const z = zone;
  return (
    <form
      action={formAction}
      data-testid="zone-form"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      {mode === "edit" && z ? (
        <input type="hidden" name="id" value={z.id} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Code</span>
        <input
          name="code"
          data-testid="zone-code"
          defaultValue={z?.code ?? ""}
          required={mode === "create"}
          disabled={mode === "edit"}
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Time granularity
          </span>
          <input
            name="time_granularity"
            data-testid="zone-time-granularity"
            defaultValue={z?.time_granularity ?? "day"}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Max slots</span>
          <input
            name="max_slots"
            type="number"
            data-testid="zone-max-slots"
            defaultValue={z?.max_slots ?? 0}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="zone-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create zone" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="zone-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
