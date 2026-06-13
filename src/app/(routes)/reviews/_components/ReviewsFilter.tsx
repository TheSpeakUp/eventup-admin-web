"use client";

// src/app/(routes)/reviews/_components/ReviewsFilter.tsx
// Filter bar for reviews list: status (all/published/hidden/removed),
// rating (all/1-5), provider_id, and search query. Submits via GET so the
// params drive the server render.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@/lib/reviews/types";

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

  const handleStatusChange = (newStatus: ReviewStatus | "all") => {
    const params = new URLSearchParams();
    if (newStatus !== "all") params.set("status", newStatus);
    if (provider_id) params.set("provider_id", provider_id);
    if (rating) params.set("rating", rating);
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`/reviews?${params.toString()}`);
    });
  };

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQ = e.target.value;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (provider_id) params.set("provider_id", provider_id);
    if (rating) params.set("rating", rating);
    if (newQ) params.set("q", newQ);
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

  const currentStatus = status ?? "all";
  const currentRating = rating ?? "all";

  return (
    <div
      data-testid="reviews-filter"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as ReviewStatus | "all")}
            disabled={pending}
            data-testid="reviews-filter-status"
            className="mt-1 rounded border border-zinc-200 px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Rating</label>
          <select
            value={currentRating}
            onChange={(e) => handleRatingChange(e.target.value)}
            disabled={pending}
            data-testid="reviews-filter-rating"
            className="mt-1 rounded border border-zinc-200 px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="1">1 star</option>
            <option value="2">2 stars</option>
            <option value="3">3 stars</option>
            <option value="4">4 stars</option>
            <option value="5">5 stars</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Provider ID</label>
          <input
            type="text"
            value={provider_id ?? ""}
            onChange={handleProviderIdChange}
            disabled={pending}
            placeholder="Filter by provider"
            data-testid="reviews-filter-provider-id"
            className="mt-1 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Search</label>
          <input
            type="text"
            value={q ?? ""}
            onChange={handleSearchChange}
            disabled={pending}
            placeholder="Search review body"
            data-testid="reviews-filter-search"
            className="mt-1 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
