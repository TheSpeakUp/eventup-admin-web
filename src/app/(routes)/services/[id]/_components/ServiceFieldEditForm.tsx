"use client";

import { useActionState } from "react";
import type { ServiceDetail } from "@/lib/services/types";
import { editServiceFieldsAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

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

  const inputCls =
    "mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none";

  return (
    <form
      action={formAction}
      data-testid="service-field-edit-form"
      className="space-y-4"
    >
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
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Title <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            defaultValue={service.title}
            required
            data-testid="service-field-title"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Pricing type <span className="text-red-500">*</span>
          </span>
          <input
            name="pricing_type"
            defaultValue={service.pricing_type}
            required
            data-testid="service-field-pricing_type"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Recipient type <span className="text-red-500">*</span>
          </span>
          <select
            name="recipient_type"
            defaultValue={String(service.recipient_type)}
            data-testid="service-field-recipient_type"
            className={inputCls}
          >
            <option value="0">All</option>
            <option value="1">Speaker</option>
            <option value="2">Organizer</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Category id</span>
          <input
            name="category_id"
            type="number"
            min={1}
            defaultValue={service.category_id ?? ""}
            data-testid="service-field-category_id"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Base price (minor)
          </span>
          <input
            name="base_price_minor"
            type="number"
            min={0}
            defaultValue={service.base_price_minor ?? ""}
            data-testid="service-field-base_price_minor"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Currency</span>
          <input
            name="currency"
            defaultValue={service.currency ?? ""}
            data-testid="service-field-currency"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Pricing interval (minutes)
          </span>
          <input
            name="pricing_interval_minutes"
            type="number"
            min={1}
            defaultValue={service.pricing_interval_minutes ?? ""}
            data-testid="service-field-pricing_interval_minutes"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Max units per order
          </span>
          <input
            name="max_units_per_order"
            type="number"
            min={1}
            defaultValue={service.max_units_per_order ?? ""}
            data-testid="service-field-max_units_per_order"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">External URL</span>
          <input
            name="external_url"
            defaultValue={service.external_url ?? ""}
            data-testid="service-field-external_url"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Address</span>
          <input
            name="address"
            defaultValue={service.address ?? ""}
            data-testid="service-field-address"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Discount percent
          </span>
          <input
            name="publication_discount_percent"
            type="number"
            min={0}
            defaultValue={service.publication_discount_percent ?? ""}
            data-testid="service-field-publication_discount_percent"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Discount promo code
          </span>
          <input
            name="publication_discount_promo_code"
            defaultValue={service.publication_discount_promo_code ?? ""}
            data-testid="service-field-publication_discount_promo_code"
            placeholder="Empty clears the value"
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="remote_available"
            defaultChecked={service.remote_available}
            data-testid="service-field-remote_available"
          />
          Remote available
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="publication_discount_enabled"
            defaultChecked={service.publication_discount_enabled}
            data-testid="service-field-publication_discount_enabled"
          />
          Publication discount enabled
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={service.description ?? ""}
          data-testid="service-field-description"
          placeholder="Empty clears the value"
          className={inputCls}
        />
      </label>

      {state.error ? (
        <p
          data-testid="service-field-edit-error"
          className="text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          data-testid="service-field-edit-success"
          className="text-sm text-emerald-300"
        >
          Saved.
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          data-testid="service-field-edit-submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Save fields"}
        </button>
      </div>
    </form>
  );
}
