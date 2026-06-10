// Plain GET form — submitting sets the querystring and re-renders the server
// page. entity_type is free text (backend accepts an arbitrary str ≤64); do not
// constrain it to an enum the contract does not define.
export default function RegistryFilters({
  attributeKey,
  categoryId,
  entityType,
}: {
  attributeKey?: string;
  categoryId?: string;
  entityType?: string;
}) {
  return (
    <form
      action="/registry"
      role="search"
      data-testid="registry-filters"
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-xs text-zinc-500">
        Attribute key
        <input
          type="text"
          name="attribute_key"
          defaultValue={attributeKey ?? ""}
          data-testid="registry-filter-attribute-key"
          className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        Category id
        <input
          type="number"
          name="category_id"
          min={1}
          defaultValue={categoryId ?? ""}
          data-testid="registry-filter-category-id"
          className="mt-1 w-32 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        Entity type
        <input
          type="text"
          name="entity_type"
          defaultValue={entityType ?? ""}
          data-testid="registry-filter-entity-type"
          className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        data-testid="registry-filter-apply"
        className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white"
      >
        Apply
      </button>
    </form>
  );
}
