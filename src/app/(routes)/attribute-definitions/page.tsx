import Link from "next/link";
import { listAttributeDefinitions } from "@/lib/attribute-definitions/api";
import { isAttributeDefinitionSort } from "@/lib/attribute-definitions/types";
import PageHeader from "@/app/_components/ui/PageHeader";
import { buttonClass } from "@/app/_components/ui/Button";
import { AttributeDefinitionsTable } from "./_components/AttributeDefinitionsTable";

export default async function AttributeDefinitionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    group_name?: string;
    is_active?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort =
    sp.sort && isAttributeDefinitionSort(sp.sort) ? sp.sort : "sort_order_asc";
  const is_active =
    sp.is_active === "true" ? true : sp.is_active === "false" ? false : undefined;
  const result = await listAttributeDefinitions({
    search: sp.search,
    group_name: sp.group_name,
    is_active,
    sort,
    limit: 100,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Attribute Definitions
        </h1>
        <div
          data-testid="attribute-definitions-error"
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {result.status === 403
            ? "Viewing attribute definitions requires an admin role."
            : `Failed to load attribute definitions: ${result.message}`}
        </div>
      </div>
    );
  }

  const rows = result.data.items;

  return (
    <div className="p-8">
      <PageHeader
        title="Attribute Definitions"
        actions={
          <Link
            href="/attribute-definitions/new"
            data-testid="attribute-definition-new"
            className={buttonClass("primary")}
          >
            New attribute definition
          </Link>
        }
      />

      <form
        className="mt-4 flex flex-wrap gap-2"
        data-testid="attribute-definitions-search"
      >
        <input
          name="search"
          placeholder="Search key or group"
          defaultValue={sp.search ?? ""}
          className="rounded border px-2 py-1"
        />
        <input
          name="group_name"
          placeholder="Group name"
          defaultValue={sp.group_name ?? ""}
          className="rounded border px-2 py-1"
        />
        <select
          name="is_active"
          defaultValue={sp.is_active ?? ""}
          className="rounded border px-2 py-1"
        >
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select name="sort" defaultValue={sort} className="rounded border px-2 py-1">
          <option value="sort_order_asc">Sort ↑</option>
          <option value="sort_order_desc">Sort ↓</option>
          <option value="key_asc">Key A–Z</option>
          <option value="key_desc">Key Z–A</option>
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Apply
        </button>
      </form>

      <div className="mt-4">
        <AttributeDefinitionsTable rows={rows} />
      </div>
    </div>
  );
}
