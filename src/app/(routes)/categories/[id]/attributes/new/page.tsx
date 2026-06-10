import { notFound, redirect } from "next/navigation";
import {
  getAttributeDefinition,
  listAttributeDefinitions,
} from "@/lib/attribute-definitions/api";
import { getCategory, listCategoryBindings } from "@/lib/categories/api";
import { BindingForm } from "../_components/BindingForm";

export default async function NewBindingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const sp = await searchParams;
  const [catRes, bindingsRes] = await Promise.all([
    getCategory(numId),
    listCategoryBindings(numId),
  ]);

  if (catRes.status === 404 || bindingsRes.status === 404) notFound();
  if (!catRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Add attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {catRes.status === 403
            ? "Managing category attributes requires an admin role."
            : `Failed to load: ${catRes.message}`}
        </div>
      </div>
    );
  }
  if (!bindingsRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Add attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {bindingsRes.status === 403
            ? "Managing category attributes requires an admin role."
            : `Failed to load: ${bindingsRes.message}`}
        </div>
      </div>
    );
  }

  const bound = new Set(bindingsRes.data.items.map((b) => b.attribute_key));

  // Step 1 — no key selected yet: pick an unbound active definition.
  // Known cap: only the first 100 active definitions appear (fine at current
  // scale; picker pagination is out of scope per the spec).
  if (!sp.key) {
    const defsRes = await listAttributeDefinitions({
      is_active: true,
      limit: 100,
    });
    const options = defsRes.ok
      ? defsRes.data.items.filter((d) => !bound.has(d.key))
      : [];
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">
          Add attribute to {catRes.data.name}
        </h1>
        {/* GET form: submitting re-renders this page with ?key=<selection>. */}
        <form method="GET" className="mt-4 flex max-w-2xl items-end gap-2">
          <label className="block grow">
            <span className="text-sm font-medium">Attribute definition</span>
            <select
              name="key"
              required
              data-testid="binding-key-select"
              className="mt-1 w-full rounded border px-2 py-1"
            >
              {options.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.key}
                  {d.group_name ? ` (${d.group_name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            data-testid="binding-picker-continue"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Continue
          </button>
        </form>
        {options.length === 0 ? (
          <p data-testid="binding-picker-empty" className="mt-4 text-gray-500">
            No unbound active attribute definitions available.
          </p>
        ) : null}
      </div>
    );
  }

  // Step 2 — key chosen: prefill the binding form from the definition.
  if (bound.has(sp.key)) {
    // Already bound — go edit instead of silently overwriting via upsert.
    redirect(
      `/categories/${numId}/attributes/${encodeURIComponent(sp.key)}`,
    );
  }
  const defRes = await getAttributeDefinition(sp.key);
  if (defRes.status === 404) notFound();
  if (!defRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Add attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load attribute definition: ${defRes.message}`}
        </div>
      </div>
    );
  }
  const def = defRes.data;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">
        Bind &ldquo;{def.key}&rdquo; to {catRes.data.name}
      </h1>
      <div className="mt-4 max-w-2xl">
        <BindingForm
          categoryId={numId}
          attributeKey={def.key}
          initial={{
            descriptor: def.descriptor,
            group_name: def.group_name,
            sort_order: def.sort_order,
            is_visible_in_filters: true,
            is_visible_in_card: true,
          }}
          submitLabel="Bind attribute"
        />
      </div>
    </div>
  );
}
