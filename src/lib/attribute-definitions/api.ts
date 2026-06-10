import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AttributeDefinitionCursorPage,
  AttributeDefinitionListQuery,
  AttributeDefinitionMutationPayload,
  AttributeDefinitionRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/attribute-definitions";

// List is a POST with a body filter (mirror categories).
export function listAttributeDefinitions(
  query: AttributeDefinitionListQuery = {},
): Promise<ApiFetchResult<AttributeDefinitionCursorPage>> {
  const body: Record<string, unknown> = { limit: query.limit ?? 50 };
  if (query.search) body.search = query.search;
  if (query.group_name) body.group_name = query.group_name;
  if (query.is_active !== undefined) body.is_active = query.is_active;
  if (query.sort) body.sort = query.sort;
  if (query.last_id !== undefined) body.last_id = query.last_id;
  return apiFetch<AttributeDefinitionCursorPage>(`${BASE}/list`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getAttributeDefinition(
  key: string,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(`${BASE}/${encodeURIComponent(key)}`);
}

export function createAttributeDefinition(
  payload: AttributeDefinitionMutationPayload,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateAttributeDefinition(
  key: string,
  payload: AttributeDefinitionMutationPayload,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(
    `${BASE}/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      redirectOn401: false,
    },
  );
}

export function deleteAttributeDefinition(
  key: string,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${encodeURIComponent(key)}`,
    { method: "DELETE", redirectOn401: false },
  );
}
