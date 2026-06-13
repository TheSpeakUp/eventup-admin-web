// src/app/(routes)/payments/page.tsx
//
// Read-only operator payments list (M5). Offset/limit paginated against
// GET /eventup-admin/v1/marketplace/payments; the endpoint returns `total`
// alongside the page items. Filters (status, currency, free-text q) ride the
// querystring and reset the offset. A 403 surfaces the admin-role panel. No
// write/refund path — reads only.
import { listPayments } from "@/lib/payments/api";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import {
  Alert,
  PageHeader,
  Panel,
  StatusSegments,
  type SegmentOption,
} from "@/app/_components/ui";
import { PAYMENT_STATUSES, isPaymentStatus } from "@/lib/payments/types";
import PaymentsFilters from "./_components/PaymentsFilters";
import PaymentsPagination from "./_components/PaymentsPagination";
import PaymentsTable from "./_components/PaymentsTable";

const LIMIT = 10;

const STATUS_OPTIONS: SegmentOption[] = PAYMENT_STATUSES.map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

const DESCRIPTION =
  "Operator view of marketplace payments and refund status.";

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
  const createdFrom = pickString(sp.created_from)?.trim() || undefined;
  const createdTo = pickString(sp.created_to)?.trim() || undefined;
  const offset = pickOffset(pickString(sp.offset));

  const result = await listPayments({
    status,
    currency,
    q,
    created_from: createdFrom,
    created_to: createdTo,
    limit: LIMIT,
    offset,
  });

  if (!result.ok) {
    return (
      <div className="p-8 space-y-5">
        <PageHeader title="Payments" description={DESCRIPTION} />
        <Alert variant="danger" data-testid="payments-error">
          {result.status === 403
            ? "Viewing payments requires an admin role."
            : `Failed to load payments: ${result.message}`}
        </Alert>
      </div>
    );
  }

  const { items, total } = result.data;
  const preserved = {
    status,
    currency,
    q,
    created_from: createdFrom,
    created_to: createdTo,
  };

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Payments"
        description={DESCRIPTION}
        actions={
          <ExportCsvButton surface="payments" params={preserved} />
        }
      />
      <Panel
        title="Payments"
        accent="primary"
        bodyClassName="p-0"
        action={
          <span className="text-xs text-ink-subtle" data-testid="payments-total">
            {total} payment{total === 1 ? "" : "s"} total
          </span>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <StatusSegments
            param="status"
            options={STATUS_OPTIONS}
            current={status}
            basePath="/payments"
            searchParams={{
              currency,
              q,
              created_from: createdFrom,
              created_to: createdTo,
            }}
            testidPrefix="payments-status"
          />
          <PaymentsFilters />
        </div>
        <PaymentsTable rows={items} />
        <div className="px-4 py-3 border-t border-hairline">
          <PaymentsPagination
            total={total}
            limit={LIMIT}
            offset={offset}
            basePath="/payments"
            searchParams={preserved}
          />
        </div>
      </Panel>
    </div>
  );
}
