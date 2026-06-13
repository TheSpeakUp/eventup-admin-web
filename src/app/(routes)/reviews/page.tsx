// src/app/(routes)/reviews/page.tsx
//
// Admin reviews moderation surface (Layer 4 admin polish). List with filters
// by status, rating, provider_id, and search query. Write controls (moderate
// review, moderate reply) render only for SUPERADMIN. A 403 from the list
// surfaces the admin-role panel.
import { listReviews } from "@/lib/reviews/api";
import { getAdminSession } from "@/lib/auth/session";
import type { ReviewListQuery, ReviewStatus } from "@/lib/reviews/types";
import ReviewsTable from "./_components/ReviewsTable";
import ReviewsFilter from "./_components/ReviewsFilter";
import {
  Alert,
  PageHeader,
  Panel,
  StatusSegments,
  type SegmentOption,
} from "@/app/_components/ui";

const STATUS_OPTIONS: SegmentOption[] = [
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
  { value: "removed", label: "Removed" },
];

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    provider_id?: string;
    rating?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;

  const query: ReviewListQuery = {
    status: (sp.status ?? undefined) as ReviewStatus | undefined,
    provider_id: sp.provider_id ? Number(sp.provider_id) : undefined,
    rating: sp.rating ? Number(sp.rating) : undefined,
    q: sp.q ? String(sp.q) : undefined,
    limit: 50,
  };

  const session = await getAdminSession();
  const canManage = session?.role === "SUPERADMIN";

  const status = sp.status as ReviewStatus | undefined;

  const res = await listReviews(query);
  if (!res.ok) {
    return (
      <div className="p-8 space-y-5">
        <PageHeader
          title="Reviews"
          description="Moderate marketplace reviews and provider replies."
        />
        <Alert variant="danger" data-testid="reviews-error">
          {res.status === 403
            ? "Viewing reviews requires an admin role."
            : `Failed to load reviews: ${res.message}`}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Reviews"
        description="Moderate marketplace reviews and provider replies."
      />
      <Panel title="Reviews" accent="primary" bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <StatusSegments
            param="status"
            options={STATUS_OPTIONS}
            current={status}
            basePath="/reviews"
            searchParams={{
              rating: sp.rating,
              provider_id: sp.provider_id,
              q: sp.q,
            }}
            testidPrefix="reviews-status"
          />
          <ReviewsFilter
            status={status}
            provider_id={sp.provider_id}
            rating={sp.rating}
            q={sp.q}
          />
        </div>
        <ReviewsTable rows={res.data.items} canManage={canManage} />
      </Panel>
    </div>
  );
}
