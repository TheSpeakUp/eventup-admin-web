"use client";
import { useActionState } from "react";
import { DescriptorEditor } from "@/app/(routes)/attribute-definitions/_components/DescriptorEditor";
import { upsertBindingAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export type BindingFormInitial = {
  descriptor: Record<string, unknown>;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
};

export function BindingForm({
  categoryId,
  attributeKey,
  initial,
  submitLabel,
}: {
  categoryId: number;
  attributeKey: string;
  initial: BindingFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    upsertBindingAction,
    EMPTY_STATE,
  );
  return (
    <form action={formAction} data-testid="binding-form" className="space-y-4">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="attribute_key" value={attributeKey} />

      <label className="block">
        <span className="text-sm font-medium">Attribute key</span>
        <input
          data-testid="binding-key"
          value={attributeKey}
          readOnly
          className="mt-1 w-full rounded border px-2 py-1 read-only:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Group name</span>
        <input
          name="group_name"
          data-testid="binding-group"
          defaultValue={initial.group_name ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Sort order</span>
        <input
          name="sort_order"
          type="number"
          data-testid="binding-sort"
          defaultValue={initial.sort_order}
          className="mt-1 w-32 rounded border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_visible_in_filters"
          value="true"
          data-testid="binding-visible-filters"
          defaultChecked={initial.is_visible_in_filters}
        />
        <span className="text-sm font-medium">Visible in filters</span>
      </label>
      {/* Hidden "false" sentinel so an unchecked box still submits the field;
          the action reads getAll(...).includes("true"). */}
      <input type="hidden" name="is_visible_in_filters" value="false" />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_visible_in_card"
          value="true"
          data-testid="binding-visible-card"
          defaultChecked={initial.is_visible_in_card}
        />
        <span className="text-sm font-medium">Visible in card</span>
      </label>
      <input type="hidden" name="is_visible_in_card" value="false" />

      <DescriptorEditor initial={initial.descriptor} />

      <button
        type="submit"
        disabled={pending}
        data-testid="binding-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="binding-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
