"use client";

import { useActionState } from "react";
import type { ServiceDetail } from "@/lib/services/types";
import { editServiceFieldsAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import { FormField, Input, Select, Textarea } from "@/app/_components/ui/FormField";
import Button from "@/app/_components/ui/Button";

/**
 * Inline DATA-field edit form (M7). Pre-filled from the current service record.
 * Each field carries a hidden `__cur_<field>` mirror of its current value so the
 * Server Action can diff new-vs-current and PATCH only what changed (omit =
 * unchanged, blank-on-nullable = clear → null). Required fields (title,
 * pricing_type, recipient_type, remote_available, publication_discount_enabled)
 * cannot be cleared.
 */
export default function ServiceFieldEditForm({
  service,
}: {
  service: ServiceDetail;
}) {
  const [state, formAction, pending] = useActionState(
    editServiceFieldsAction,
    EMPTY_STATE,
  );

  return (
    <form
      action={formAction}
      data-testid="service-field-edit-form"
      className="space-y-4 rounded-lg border border-hairline bg-surface-1 p-6"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
        Edit fields
      </h2>

      <input type="hidden" name="serviceId" value={service.id} />
      {/* Current-value mirrors used by the action to compute the diff. */}
      <input type="hidden" name="__cur_title" value={service.title} />
      <input
        type="hidden"
        name="__cur_pricing_type"
        value={service.pricing_type}
      />
      <input
        type="hidden"
        name="__cur_recipient_type"
        value={service.recipient_type}
      />
      <input
        type="hidden"
        name="__cur_remote_available"
        value={service.remote_available ? "true" : "false"}
      />
      <input
        type="hidden"
        name="__cur_publication_discount_enabled"
        value={service.publication_discount_enabled ? "true" : "false"}
      />
      <input
        type="hidden"
        name="__cur_description"
        value={service.description ?? ""}
      />
      <input
        type="hidden"
        name="__cur_currency"
        value={service.currency ?? ""}
      />
      <input
        type="hidden"
        name="__cur_external_url"
        value={service.external_url ?? ""}
      />
      <input type="hidden" name="__cur_address" value={service.address ?? ""} />
      <input
        type="hidden"
        name="__cur_publication_discount_promo_code"
        value={service.publication_discount_promo_code ?? ""}
      />
      <input
        type="hidden"
        name="__cur_category_id"
        value={service.category_id ?? ""}
      />
      <input
        type="hidden"
        name="__cur_base_price_minor"
        value={service.base_price_minor ?? ""}
      />
      <input
        type="hidden"
        name="__cur_pricing_interval_minutes"
        value={service.pricing_interval_minutes ?? ""}
      />
      <input
        type="hidden"
        name="__cur_max_units_per_order"
        value={service.max_units_per_order ?? ""}
      />
      <input
        type="hidden"
        name="__cur_publication_discount_percent"
        value={service.publication_discount_percent ?? ""}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          htmlFor="service-field-title"
          label={
            <>
              Title <span className="text-red-400">*</span>
            </>
          }
        >
          <Input
            id="service-field-title"
            name="title"
            defaultValue={service.title}
            required
            data-testid="service-field-title"
          />
        </FormField>
        <FormField
          htmlFor="service-field-pricing_type"
          label={
            <>
              Pricing type <span className="text-red-400">*</span>
            </>
          }
        >
          <Input
            id="service-field-pricing_type"
            name="pricing_type"
            defaultValue={service.pricing_type}
            required
            data-testid="service-field-pricing_type"
          />
        </FormField>
        <FormField
          htmlFor="service-field-recipient_type"
          label={
            <>
              Recipient type <span className="text-red-400">*</span>
            </>
          }
        >
          <Select
            id="service-field-recipient_type"
            name="recipient_type"
            defaultValue={String(service.recipient_type)}
            data-testid="service-field-recipient_type"
          >
            <option value="0">All</option>
            <option value="1">Speaker</option>
            <option value="2">Organizer</option>
          </Select>
        </FormField>
        <FormField htmlFor="service-field-category_id" label="Category id">
          <Input
            id="service-field-category_id"
            name="category_id"
            type="number"
            min={1}
            defaultValue={service.category_id ?? ""}
            data-testid="service-field-category_id"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="service-field-base_price_minor" label="Base price (minor)">
          <Input
            id="service-field-base_price_minor"
            name="base_price_minor"
            type="number"
            min={0}
            defaultValue={service.base_price_minor ?? ""}
            data-testid="service-field-base_price_minor"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="service-field-currency" label="Currency">
          <Input
            id="service-field-currency"
            name="currency"
            defaultValue={service.currency ?? ""}
            data-testid="service-field-currency"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField
          htmlFor="service-field-pricing_interval_minutes"
          label="Pricing interval (minutes)"
        >
          <Input
            id="service-field-pricing_interval_minutes"
            name="pricing_interval_minutes"
            type="number"
            min={1}
            defaultValue={service.pricing_interval_minutes ?? ""}
            data-testid="service-field-pricing_interval_minutes"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField
          htmlFor="service-field-max_units_per_order"
          label="Max units per order"
        >
          <Input
            id="service-field-max_units_per_order"
            name="max_units_per_order"
            type="number"
            min={1}
            defaultValue={service.max_units_per_order ?? ""}
            data-testid="service-field-max_units_per_order"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="service-field-external_url" label="External URL">
          <Input
            id="service-field-external_url"
            name="external_url"
            defaultValue={service.external_url ?? ""}
            data-testid="service-field-external_url"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField htmlFor="service-field-address" label="Address">
          <Input
            id="service-field-address"
            name="address"
            defaultValue={service.address ?? ""}
            data-testid="service-field-address"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField
          htmlFor="service-field-publication_discount_percent"
          label="Discount percent"
        >
          <Input
            id="service-field-publication_discount_percent"
            name="publication_discount_percent"
            type="number"
            min={0}
            defaultValue={service.publication_discount_percent ?? ""}
            data-testid="service-field-publication_discount_percent"
            placeholder="Empty clears the value"
          />
        </FormField>
        <FormField
          htmlFor="service-field-publication_discount_promo_code"
          label="Discount promo code"
        >
          <Input
            id="service-field-publication_discount_promo_code"
            name="publication_discount_promo_code"
            defaultValue={service.publication_discount_promo_code ?? ""}
            data-testid="service-field-publication_discount_promo_code"
            placeholder="Empty clears the value"
          />
        </FormField>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="remote_available"
            defaultChecked={service.remote_available}
            data-testid="service-field-remote_available"
          />
          Remote available
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="publication_discount_enabled"
            defaultChecked={service.publication_discount_enabled}
            data-testid="service-field-publication_discount_enabled"
          />
          Publication discount enabled
        </label>
      </div>

      <FormField htmlFor="service-field-description" label="Description">
        <Textarea
          id="service-field-description"
          name="description"
          rows={3}
          defaultValue={service.description ?? ""}
          data-testid="service-field-description"
          placeholder="Empty clears the value"
        />
      </FormField>

      {state.error ? (
        <p
          data-testid="service-field-edit-error"
          className="text-sm text-red-400"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          data-testid="service-field-edit-success"
          className="text-sm text-emerald-400"
        >
          Saved.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          data-testid="service-field-edit-submit"
        >
          {pending ? "Saving…" : "Save fields"}
        </Button>
      </div>
    </form>
  );
}
