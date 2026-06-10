// src/app/(routes)/attribute-definitions/[key]/page.tsx
import { notFound } from "next/navigation";
import { getAttributeDefinition } from "@/lib/attribute-definitions/api";
import { getAdminSession } from "@/lib/auth/session";
import { AttributeDefinitionForm } from "../_components/AttributeDefinitionForm";
import { DeleteAttributeDefinitionButton } from "../_components/DeleteAttributeDefinitionButton";

export default async function AttributeDefinitionDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const [defRes, session] = await Promise.all([
    getAttributeDefinition(decodedKey),
    getAdminSession(),
  ]);

  if (defRes.status === 404) notFound();
  if (!defRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Attribute definition</h1>
        <div
          data-testid="attribute-definition-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load attribute definition: ${defRes.message}`}
        </div>
      </div>
    );
  }

  const definition = defRes.data;
  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${definition.key}:${definition.sort_order}:${definition.is_active}:${definition.is_system}`;

  return (
    <div className="p-8">
      <h1
        className="text-2xl font-semibold"
        data-testid="attribute-definition-detail-key"
      >
        {definition.key}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bound to {definition.bindings_count}{" "}
        {definition.bindings_count === 1 ? "category" : "categories"}
      </p>
      <div className="mt-4 max-w-2xl space-y-6">
        <AttributeDefinitionForm
          key={formKey}
          mode="edit"
          definition={definition}
        />
        {canDelete ? (
          <DeleteAttributeDefinitionButton attrKey={definition.key} />
        ) : null}
      </div>
    </div>
  );
}
