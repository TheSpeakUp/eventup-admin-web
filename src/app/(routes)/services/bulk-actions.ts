"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { approveService, rejectService } from "@/lib/services/api";

const payloadSchema = z.object({
  kind: z.enum(["approve", "reject"]),
  ids: z.array(z.number().int().positive()).min(1).max(100),
  reason: z.string().trim().min(10).max(500).optional(),
});

export type BulkModerationResult = {
  done: number;
  failed: { id: number; error: string }[];
};

// Layer-4 bulk moderation: N sequential calls to the existing single-item
// endpoints (deliberate — preserves per-item permission gating, audit events
// and error attribution; a batch endpoint would add new audit semantics for
// no benefit at admin-queue volumes).
export async function bulkModerateServices(
  payload: unknown,
): Promise<BulkModerationResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      done: 0,
      failed: [
        { id: 0, error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      ],
    };
  }
  const { kind, ids, reason } = parsed.data;
  if (kind === "reject" && !reason) {
    return { done: 0, failed: [{ id: 0, error: "Reason is required" }] };
  }

  const failed: { id: number; error: string }[] = [];
  let done = 0;
  for (const id of ids) {
    const res =
      kind === "approve"
        ? await approveService(id)
        : await rejectService(id, reason as string);
    if (res.ok) done += 1;
    else failed.push({ id, error: res.message ?? `HTTP ${res.status}` });
  }

  revalidatePath("/services");
  return { done, failed };
}
