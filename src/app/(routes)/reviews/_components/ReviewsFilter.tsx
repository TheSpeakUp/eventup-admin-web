"use client";

// src/app/(routes)/reviews/_components/ReviewsFilter.tsx
// Filter bar for reviews list: status (all/published/hidden/removed),
// rating (all/1-5), provider_id, and search query. Submits via GET so the
// params drive the server render.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@/lib/reviews/types";
import { SearchInput } from "@/app/_components/ui";

export default function ReviewsFilter({
  status,
  provider_id,
  rating,
  q,
}: {
  status?: ReviewStatus;
  provider_id?: string;
  rating?: string;
  q?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRatingChange = (newRating: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (provider_id) params.set("provider_id", provider_id);
    if (newRating !== "all") params.set("rating", newRating);
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`/reviews?${params.toString()}`);
    });
  };

  const handleProviderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProviderId = e.target.value;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (newProviderId) params.set("provider_id", newProviderId);
    if (rating) params.set("rating", rating);
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`/reviews?${params.toString()}`);
    });
  };

  const currentRating = rating ?? "all";

  return (
    <div
      data-testid="reviews-filter"
      className="flex flex-wrap items-center gap-2"
    >
      <select
        value={currentRating}
        onChange={(e) => handleRatingChange(e.target.value)}
        disabled={pending}
        data-testid="reviews-filter-rating"
        className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none"
      >
        <option value="all">All ratings</option>
        <option value="1">1 star</option>
        <option value="2">2 stars</option>
        <option value="3">3 stars</option>
        <option value="4">4 stars</option>
        <option value="5">5 stars</option>
      </select>

      <input
        type="text"
        value={provider_id ?? ""}
        onChange={handleProviderIdChange}
        disabled={pending}
        placeholder="Provider ID"
        data-testid="reviews-filter-provider-id"
        className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none"
      />

      <SearchInput
        param="q"
        testid="reviews-filter-search"
        placeholder="Search review body…"
      />
    </div>
  );
}
