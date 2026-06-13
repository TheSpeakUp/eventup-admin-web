// src/app/(routes)/attribute-definitions/_components/AttributeDefinitionForm.tsx
"use client";
import { useActionState } from "react";
import {
  createAttributeDefinitionAction,
  updateAttributeDefinitionAction,
} from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";
import { DescriptorEditor } from "./DescriptorEditor";

export function AttributeDefinitionForm({
  mode,
  definition,
}: {
  mode: "create" | "edit";
  definition?: AttributeDefinitionRead;
}) {
  const action =
    mode === "create"
      ? createAttributeDefinitionAction
      : updateAttributeDefinitionAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const d = definition;
  return (
    <form
      action={formAction}
      data-testid="attribute-definition-form"
      className="space-y-4"
    >
      {mode === "edit" && d ? (
        <input type="hidden" name="key" value={d.key} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Key</span>
        <input
          name={mode === "create" ? "key" : undefined}
          data-testid="attribute-definition-key"
          defaultValue={d?.key ?? ""}
          required={mode === "create"}
          readOnly={mode === "edit"}
          className="mt-1 w-full rounded border px-2 py-1 read-only:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Group name</span>
        <input
          name="group_name"
          data-testid="attribute-definition-group"
          defaultValue={d?.group_name ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Sort order</span>
        <input
          name="sort_order"
          type="number"
          defaultValue={d?.sort_order ?? 100}
          className="mt-1 w-32 rounded border px-2 py-1"
        />
      </label>

      {/* Hidden "false" sentinel so an unchecked box submits is_active=false.
          Placed BEFORE checkbox so checkbox value comes last in FormData (checked → both present).
          getAll() will include "true" if checkbox was checked; otherwise only "false". */}
      <input type="hidden" name="is_active" value="false" />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          data-testid="attribute-definition-active"
          defaultChecked={d?.is_active ?? true}
        />
        <span className="text-sm font-medium">Active</span>
      </label>

      <input type="hidden" name="is_system" value="false" />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_system"
          value="true"
          data-testid="attribute-definition-system"
          defaultChecked={d?.is_system ?? false}
        />
        <span className="text-sm font-medium">System</span>
      </label>

      <DescriptorEditor initial={d?.descriptor ?? null} />

      <button
        type="submit"
        disabled={pending}
        data-testid="attribute-definition-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="attribute-definition-error"
          className="text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
