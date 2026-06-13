// src/app/(routes)/categories/new/page.tsx
import { listCategories } from "@/lib/categories/api";
import PageHeader from "@/app/_components/ui/PageHeader";
import { CategoryForm } from "../_components/CategoryForm";

export default async function NewCategoryPage() {
  const res = await listCategories({ limit: 100 });
  const parentOptions = res.ok
    ? res.data.items.map((c) => ({ id: c.id, name: c.name }))
    : [];
  return (
    <div className="p-8">
      <PageHeader title="New category" />
      <div className="mt-4 max-w-2xl">
        <CategoryForm mode="create" parentOptions={parentOptions} />
      </div>
    </div>
  );
}
