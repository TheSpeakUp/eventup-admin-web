// src/app/(routes)/attribute-definitions/new/page.tsx
import { AttributeDefinitionForm } from "../_components/AttributeDefinitionForm";

export default function NewAttributeDefinitionPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">New attribute definition</h1>
      <div className="mt-4 max-w-2xl">
        <AttributeDefinitionForm mode="create" />
      </div>
    </div>
  );
}
