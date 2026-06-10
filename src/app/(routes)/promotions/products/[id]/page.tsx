// src/app/(routes)/promotions/products/[id]/page.tsx
//
// Product detail — exercises the GET /promotions/products/{id} endpoint. A 404
// renders a clear not-found state (rather than Next's generic notFound shell)
// so the operator sees an actionable message. Edit happens inline in the table;
// this page is read-only detail + a link back to the catalog.
import Link from "next/link";
import { getProduct } from "@/lib/promotions/api";
import ActiveBadge from "../../_components/ActiveBadge";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getProduct(Number(id));

  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Promotion product</h1>
        <div
          data-testid="promotion-detail-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {res.status === 404
            ? `No promotion product with id ${id}.`
            : res.status === 403
              ? "Viewing promotions requires an admin role."
              : `Failed to load product: ${res.message}`}
        </div>
        <Link
          href="/promotions"
          className="mt-4 inline-block text-sm text-blue-700"
        >
          ← Back to promotions
        </Link>
      </div>
    );
  }

  const p = res.data;
  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1
          className="text-2xl font-semibold"
          data-testid="promotion-detail-code"
        >
          {p.code}
        </h1>
        <ActiveBadge isActive={p.is_active} />
      </div>
      <dl className="mt-4 max-w-xl space-y-2 text-sm text-zinc-700">
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Name (en)</dt>
          <dd>{p.name_translations.en ?? "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Default billing unit</dt>
          <dd>{p.default_billing_unit}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Service scope</dt>
          <dd>{p.service_scope}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Period type</dt>
          <dd>{p.period_type}</dd>
        </div>
      </dl>
      <Link
        href="/promotions"
        className="mt-6 inline-block text-sm text-blue-700"
      >
        ← Back to promotions
      </Link>
    </div>
  );
}
