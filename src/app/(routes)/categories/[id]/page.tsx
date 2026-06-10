// src/app/(routes)/categories/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, listCategories } from "@/lib/categories/api";
import { getAdminSession } from "@/lib/auth/session";
import { CategoryForm } from "../_components/CategoryForm";
import { DeleteCategoryButton } from "../_components/DeleteCategoryButton";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const [catRes, listRes, session] = await Promise.all([
    getCategory(numId),
    listCategories({ limit: 100 }),
    getAdminSession(),
  ]);

  if (catRes.status === 404) notFound();
  if (!catRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category</h1>
        <div
          data-testid="category-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load category: ${catRes.message}`}
        </div>
      </div>
    );
  }

  const category = catRes.data;
  const parentOptions = listRes.ok
    ? listRes.data.items.map((c) => ({ id: c.id, name: c.name }))
    : [];
  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${category.id}:${category.name}:${category.slug}:${category.sort_order}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold" data-testid="category-detail-name">
        {category.name}
      </h1>
      <Link
        href={`/categories/${category.id}/attributes`}
        data-testid="category-attributes-link"
        className="mt-1 inline-block text-sm text-blue-700"
      >
        Manage attributes →
      </Link>
      <div className="mt-4 max-w-2xl space-y-6">
        {/*
          Translations are intentionally NOT passed on edit: the backend
          MarketplaceCategoryRead DTO does not return name_translations /
          description_translations, so there is no source to round-trip them.
          The editor opens empty; saving sends only locales the operator
          (re)enters (empty dict is skipped server-side → no data loss). A
          future PR that adds a translations read endpoint should wire
          nameTranslations / descriptionTranslations here.
        */}
        <CategoryForm
          key={formKey}
          mode="edit"
          category={category}
          parentOptions={parentOptions}
        />
        {canDelete ? <DeleteCategoryButton id={category.id} /> : null}
      </div>
    </div>
  );
}
