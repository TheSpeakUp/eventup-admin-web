"use client";

import { useActionState } from "react";
import type { ProviderDetail } from "@/lib/providers/types";
import { editProviderFieldsAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

/**
 * Inline DATA-field edit form (M7). Pre-filled from the current provider record.
 * Each field carries a hidden `__cur_<field>` mirror of its current value so the
 * Server Action can diff new-vs-current and PATCH only what changed (omit =
 * unchanged, blank-on-nullable = clear → null). Required fields (name,
 * account_currency) cannot be cleared.
 */
export default function ProviderFieldEditForm({
  provider,
}: {
  provider: ProviderDetail;
}) {
  const [state, formAction, pending] = useActionState(
    editProviderFieldsAction,
    EMPTY_STATE,
  );

  return (
    <form
      action={formAction}
      data-testid="provider-field-edit-form"
      className="space-y-4 rounded-md border border-zinc-200 bg-surface-1 p-6"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Edit fields
      </h2>

      <input type="hidden" name="providerId" value={provider.id} />
      {/* Current-value mirrors used by the action to compute the diff. */}
      <input type="hidden" name="__cur_name" value={provider.name} />
      <input
        type="hidden"
        name="__cur_account_currency"
        value={provider.account_currency}
      />
      <input
        type="hidden"
        name="__cur_description"
        value={provider.description ?? ""}
      />
      <input
        type="hidden"
        name="__cur_website"
        value={provider.website ?? ""}
      />
      <input
        type="hidden"
        name="__cur_address"
        value={provider.address ?? ""}
      />
      <input
        type="hidden"
        name="__cur_logo_url"
        value={provider.logo_url ?? ""}
      />
      <input
        type="hidden"
        name="__cur_location_id"
        value={provider.location_id ?? ""}
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Name <span className="text-red-500">*</span>
          </span>
          <input
            name="name"
            defaultValue={provider.name}
            required
            data-testid="provider-field-name"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Account currency <span className="text-red-500">*</span>
          </span>
          <input
            name="account_currency"
            defaultValue={provider.account_currency}
            required
            data-testid="provider-field-account_currency"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm uppercase focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Website</span>
          <input
            name="website"
            defaultValue={provider.website ?? ""}
            data-testid="provider-field-website"
            placeholder="Empty clears the value"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Location id</span>
          <input
            name="location_id"
            type="number"
            min={1}
            defaultValue={provider.location_id ?? ""}
            data-testid="provider-field-location_id"
            placeholder="Empty clears the value"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Address</span>
          <input
            name="address"
            defaultValue={provider.address ?? ""}
            data-testid="provider-field-address"
            placeholder="Empty clears the value"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Logo URL</span>
          <input
            name="logo_url"
            defaultValue={provider.logo_url ?? ""}
            data-testid="provider-field-logo_url"
            placeholder="Empty clears the value"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={provider.description ?? ""}
          data-testid="provider-field-description"
          placeholder="Empty clears the value"
          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </label>

      {state.error ? (
        <p
          data-testid="provider-field-edit-error"
          className="text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          data-testid="provider-field-edit-success"
          className="text-sm text-emerald-300"
        >
          Saved.
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          data-testid="provider-field-edit-submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Save fields"}
        </button>
      </div>
    </form>
  );
}
