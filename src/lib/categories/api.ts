// src/lib/categories/api.ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  CategoryAttributeBindingListResponse,
  CategoryAttributeBindingRead,
  CategoryAttributeBindingUpsertPayload,
  CategoryCursorPage,
  CategoryListQuery,
  CategoryMutationPayload,
  CategoryRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/categories";

// List is a POST with a body filter (NOT a GET query, unlike providers).
export function listCategories(
  query: CategoryListQuery = {},
): Promise<ApiFetchResult<CategoryCursorPage>> {
  const body: Record<string, unknown> = { limit: query.limit ?? 50 };
  if (query.search) body.search = query.search;
  if (query.sort) body.sort = query.sort;
  if (query.last_id !== undefined) body.last_id = query.last_id;
  return apiFetch<CategoryCursorPage>(`${BASE}/list`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getCategory(id: number): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(`${BASE}/${id}`);
}

export function createCategory(
  payload: CategoryMutationPayload,
): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateCategory(
  id: number,
  payload: CategoryMutationPayload,
): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deleteCategory(
  id: number,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${id}`,
    { method: "DELETE", redirectOn401: false },
  );
}

// ---- Category↔attribute bindings sub-resource (F14) ----

export function listCategoryBindings(
  categoryId: number,
): Promise<ApiFetchResult<CategoryAttributeBindingListResponse>> {
  return apiFetch<CategoryAttributeBindingListResponse>(
    `${BASE}/${categoryId}/bindings`,
  );
}

export function upsertCategoryBinding(
  categoryId: number,
  attributeKey: string,
  payload: CategoryAttributeBindingUpsertPayload,
): Promise<ApiFetchResult<CategoryAttributeBindingRead>> {
  return apiFetch<CategoryAttributeBindingRead>(
    `${BASE}/${categoryId}/bindings/${encodeURIComponent(attributeKey)}`,
    { method: "PUT", body: JSON.stringify(payload), redirectOn401: false },
  );
}

export function deleteCategoryBinding(
  categoryId: number,
  attributeKey: string,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${categoryId}/bindings/${encodeURIComponent(attributeKey)}`,
    { method: "DELETE", redirectOn401: false },
  );
}
