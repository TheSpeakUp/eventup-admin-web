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

function ErrorPanel({ message, status }: { message: string; status: number }) {
  return (
    <div
      data-testid="reviews-error"
      className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
    >
      {status === 403
        ? "Viewing reviews requires an admin role."
        : `Failed to load reviews: ${message}`}
    </div>
  );
}

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

  const res = await listReviews(query);
  if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reviews</h1>
      </div>
      <div className="mt-4">
        <ReviewsFilter
          status={sp.status as ReviewStatus | undefined}
          provider_id={sp.provider_id}
          rating={sp.rating}
          q={sp.q}
        />
      </div>
      <div className="mt-4">
        <ReviewsTable rows={res.data.items} canManage={canManage} />
      </div>
    </div>
  );
}
