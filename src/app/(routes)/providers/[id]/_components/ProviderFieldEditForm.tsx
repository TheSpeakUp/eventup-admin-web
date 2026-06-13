"use client";

import { useActionState } from "react";
import type { ProviderDetail } from "@/lib/providers/types";
import { editProviderFieldsAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";
import { FormField, Input, Textarea } from "@/app/_components/ui/FormField";

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
      className="space-y-4 rounded-lg border border-hairline bg-surface-1 p-6"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
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
        <FormField
          htmlFor="provider-field-name"
          label={
            <>
              Name <span className="text-red-400">*</span>
            </>
          }
        >
          <Input
            id="provider-field-name"
            name="name"
            defaultValue={provider.name}
            required
            data-testid="provider-field-name"
          />
        </FormField>
        <FormField
          htmlFor="provider-field-account_currency"
          label={
            <>
              Account currency <span className="text-red-400">*</span>
            </>
          }
        >
          <Input
            id="provider-field-account_currency"
            name="account_currency"
            defaultValue={provider.account_currency}
            required
            data-testid="provider-field-account_currency"
            className="uppercase"
          />
        </FormField>
        <FormField htmlFor="provider-field-website" label="Website">
          <Input
            id="provider-field-website"
            name="website"
            defaultValue={provider.website ?? ""}
            data-testid="provider-field-website"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="provider-field-location_id" label="Location id">
          <Input
            id="provider-field-location_id"
            name="location_id"
            type="number"
            min={1}
            defaultValue={provider.location_id ?? ""}
            data-testid="provider-field-location_id"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="provider-field-address" label="Address">
          <Input
            id="provider-field-address"
            name="address"
            defaultValue={provider.address ?? ""}
            data-testid="provider-field-address"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="provider-field-logo_url" label="Logo URL">
          <Input
            id="provider-field-logo_url"
            name="logo_url"
            defaultValue={provider.logo_url ?? ""}
            data-testid="provider-field-logo_url"
            placeholder="Empty clears the value"
          />
        </FormField>
      </div>

      <FormField htmlFor="provider-field-description" label="Description">
        <Textarea
          id="provider-field-description"
          name="description"
          rows={3}
          defaultValue={provider.description ?? ""}
          data-testid="provider-field-description"
          placeholder="Empty clears the value"
        />
      </FormField>

      {state.error ? (
        <p
          data-testid="provider-field-edit-error"
          className="text-sm text-red-400"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          data-testid="provider-field-edit-success"
          className="text-sm text-emerald-400"
        >
          Saved.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          data-testid="provider-field-edit-submit"
        >
          {pending ? "Saving…" : "Save fields"}
        </Button>
      </div>
    </form>
  );
}
