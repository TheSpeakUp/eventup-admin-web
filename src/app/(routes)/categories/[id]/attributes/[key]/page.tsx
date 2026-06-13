import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { listCategoryBindings } from "@/lib/categories/api";
import { BindingForm } from "../_components/BindingForm";
import { DeleteBindingButton } from "../_components/DeleteBindingButton";

export default async function BindingDetailPage({
  params,
}: {
  params: Promise<{ id: string; key: string }>;
}) {
  const { id, key } = await params;
  const numId = Number(id);
  const decodedKey = decodeURIComponent(key);
  const [bindingsRes, session] = await Promise.all([
    listCategoryBindings(numId),
    getAdminSession(),
  ]);

  if (bindingsRes.status === 404) notFound();
  if (!bindingsRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {bindingsRes.status === 403
            ? "Managing category attributes requires an admin role."
            : `Failed to load bindings: ${bindingsRes.message}`}
        </div>
      </div>
    );
  }

  // No GET-by-key binding endpoint — reconstruct from the list (F13 precedent).
  const binding = bindingsRes.data.items.find(
    (b) => b.attribute_key === decodedKey,
  );
  if (!binding) notFound();

  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${binding.binding_id}:${binding.sort_order}:${binding.group_name}:${binding.is_visible_in_filters}:${binding.is_visible_in_card}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold" data-testid="binding-detail-key">
        {binding.attribute_key}
      </h1>
      <div className="mt-4 max-w-2xl space-y-6">
        <BindingForm
          key={formKey}
          categoryId={numId}
          attributeKey={binding.attribute_key}
          initial={{
            descriptor: binding.descriptor,
            group_name: binding.group_name,
            sort_order: binding.sort_order,
            is_visible_in_filters: binding.is_visible_in_filters,
            is_visible_in_card: binding.is_visible_in_card,
          }}
          submitLabel="Save"
        />
        {canDelete ? (
          <DeleteBindingButton
            categoryId={numId}
            attributeKey={binding.attribute_key}
          />
        ) : null}
      </div>
    </div>
  );
}
