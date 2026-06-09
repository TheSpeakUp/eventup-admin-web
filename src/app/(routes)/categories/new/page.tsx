// src/app/(routes)/categories/new/page.tsx
import { listCategories } from "@/lib/categories/api";
import { CategoryForm } from "../_components/CategoryForm";

export default async function NewCategoryPage() {
  const res = await listCategories({ limit: 100 });
  const parentOptions = res.ok
    ? res.data.items.map((c) => ({ id: c.id, name: c.name }))
    : [];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">New category</h1>
      <div className="mt-4 max-w-2xl">
        <CategoryForm mode="create" parentOptions={parentOptions} />
      </div>
    </div>
  );
}
