import Link from "next/link";

// Forward-only cursor (the backend exposes next_last_id / has_more, no "prev").
// "Next" carries last_id=next_last_id and preserves active filters.
export default function RegistryPagination({
  nextLastId,
  hasMore,
  filters,
}: {
  nextLastId: number | null;
  hasMore: boolean;
  filters: { attribute_key?: string; category_id?: string; entity_type?: string };
}) {
  if (!hasMore || nextLastId === null) return null;
  const params = new URLSearchParams();
  if (filters.attribute_key) params.set("attribute_key", filters.attribute_key);
  if (filters.category_id) params.set("category_id", filters.category_id);
  if (filters.entity_type) params.set("entity_type", filters.entity_type);
  params.set("last_id", String(nextLastId));
  return (
    <Link
      href={`/registry?${params.toString()}`}
      data-testid="registry-next"
      className="inline-block rounded border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      Next →
    </Link>
  );
}
