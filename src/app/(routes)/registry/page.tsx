// Read-only registry snapshots audit list (F13). Cursor-paginated against
// GET /eventup-admin/v1/marketplace/attribute-registry/snapshots. Filters
// (attribute_key / category_id / entity_type) ride the querystring; a 403
// surfaces the read-permission panel. The revalidation panel lives at the
// bottom — running it requires MODERATOR+ (any authenticated admin).
import { listRegistrySnapshots } from "@/lib/registry/api";
import RegistryFilters from "./_components/RegistryFilters";
import RegistryPagination from "./_components/RegistryPagination";
import { RegistrySnapshotsTable } from "./_components/RegistrySnapshotsTable";
import RevalidationPanel from "./_components/RevalidationPanel";

const LIMIT = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickPositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const attributeKey = pickString(sp.attribute_key)?.trim() || undefined;
  const entityType = pickString(sp.entity_type)?.trim() || undefined;
  const categoryIdRaw = pickString(sp.category_id)?.trim() || undefined;
  const categoryId = pickPositiveInt(categoryIdRaw);
  const lastId = pickPositiveInt(pickString(sp.last_id));

  const result = await listRegistrySnapshots({
    attribute_key: attributeKey,
    category_id: categoryId,
    entity_type: entityType,
    last_id: lastId,
    limit: LIMIT,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Registry</h1>
        <div
          data-testid="registry-error"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {result.status === 403
            ? "Viewing registry snapshots requires the marketplace-read permission."
            : `Failed to load registry snapshots: ${result.message}`}
        </div>
      </div>
    );
  }

  const { items, next_last_id, has_more } = result.data;
  const filters = {
    attribute_key: attributeKey,
    category_id: categoryIdRaw,
    entity_type: entityType,
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Registry snapshots</h1>
      <RegistryFilters
        attributeKey={attributeKey}
        categoryId={categoryIdRaw}
        entityType={entityType}
      />
      <RegistrySnapshotsTable rows={items} />
      <RegistryPagination
        nextLastId={next_last_id}
        hasMore={has_more}
        filters={filters}
      />
      <RevalidationPanel />
    </div>
  );
}
