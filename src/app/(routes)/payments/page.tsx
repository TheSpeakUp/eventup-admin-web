// src/app/(routes)/payments/page.tsx
//
// Read-only operator payments list (M5). Offset/limit paginated against
// GET /eventup-admin/v1/marketplace/payments; the endpoint returns `total`
// alongside the page items. Filters (status, currency, free-text q) ride the
// querystring and reset the offset. A 403 surfaces the admin-role panel. No
// write/refund path — reads only.
import { listPayments } from "@/lib/payments/api";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import { isPaymentStatus } from "@/lib/payments/types";
import PaymentsFilters from "./_components/PaymentsFilters";
import PaymentsPagination from "./_components/PaymentsPagination";
import PaymentsTable from "./_components/PaymentsTable";

const LIMIT = 10;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickOffset(value: string | undefined): number {
  if (value === undefined) return 0;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawStatus = pickString(sp.status)?.trim();
  const status = rawStatus && isPaymentStatus(rawStatus) ? rawStatus : undefined;
  const currency = pickString(sp.currency)?.trim() || undefined;
  const q = pickString(sp.q)?.trim() || undefined;
  const offset = pickOffset(pickString(sp.offset));

  const result = await listPayments({
    status,
    currency,
    q,
    limit: LIMIT,
    offset,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div
          data-testid="payments-error"
          className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {result.status === 403
            ? "Viewing payments requires an admin role."
            : `Failed to load payments: ${result.message}`}
        </div>
      </div>
    );
  }

  const { items, total } = result.data;
  const preserved = { status, currency, q };

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-center gap-3">
          <ExportCsvButton surface="payments" params={{ status, currency, q }} />
          <span className="text-xs text-zinc-500" data-testid="payments-total">
            {total} payment{total === 1 ? "" : "s"} total
          </span>
        </div>
      </div>
      <PaymentsFilters />
      <PaymentsTable rows={items} />
      <PaymentsPagination
        total={total}
        limit={LIMIT}
        offset={offset}
        basePath="/payments"
        searchParams={preserved}
      />
    </div>
  );
}
