import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, listCategoryBindings } from "@/lib/categories/api";
import { BindingsTable } from "./_components/BindingsTable";

export default async function CategoryBindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const [catRes, bindingsRes] = await Promise.all([
    getCategory(numId),
    listCategoryBindings(numId),
  ]);

  if (catRes.status === 404 || bindingsRes.status === 404) notFound();
  if (!catRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category attributes</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {catRes.status === 403
            ? "Viewing category attributes requires an admin role."
            : `Failed to load bindings: ${catRes.message}`}
        </div>
      </div>
    );
  }
  if (!bindingsRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category attributes</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {bindingsRes.status === 403
            ? "Viewing category attributes requires an admin role."
            : `Failed to load bindings: ${bindingsRes.message}`}
        </div>
      </div>
    );
  }

  const rows = [...bindingsRes.data.items].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.attribute_key.localeCompare(b.attribute_key),
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            data-testid="bindings-category-name"
          >
            {catRes.data.name} — attributes
          </h1>
          <Link
            href={`/categories/${numId}`}
            className="text-sm text-blue-700"
          >
            ← Back to category
          </Link>
        </div>
        <Link
          href={`/categories/${numId}/attributes/new`}
          data-testid="binding-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Add attribute
        </Link>
      </div>
      <div className="mt-4">
        <BindingsTable categoryId={numId} rows={rows} />
      </div>
    </div>
  );
}
