// src/app/(routes)/promotions/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import {
  createDiscountRule,
  createMonthlyDiscount,
  createProduct,
  createTariff,
  createZone,
  deactivateDiscountRule,
  deactivateMonthlyDiscount,
  deactivateProduct,
  updateDiscountRule,
  updateMonthlyDiscount,
  updateProduct,
  updateTariff,
  updateZone,
} from "@/lib/promotions/api";
import type {
  DiscountRuleCreatePayload,
  DiscountRuleUpdatePayload,
  MonthlyDiscountCreatePayload,
  MonthlyDiscountUpdatePayload,
  ProductCreatePayload,
  ProductUpdatePayload,
  TariffCreatePayload,
  TariffUpdatePayload,
  ZoneCreatePayload,
  ZoneUpdatePayload,
} from "@/lib/promotions/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}
function ok(): ActionState {
  return { ok: true, error: null };
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Parse a JSON object field (translations); "" / missing → undefined.
function parseJsonObject(
  fd: FormData,
  key: string,
): Record<string, string> | undefined | "INVALID" {
  const raw = fd.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return "INVALID";
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== "string") return "INVALID";
      out[k] = v;
    }
    return out;
  } catch {
    return "INVALID";
  }
}

function intField(
  fd: FormData,
  key: string,
  min: number,
): { value?: number; error?: string } {
  const raw = str(fd, key);
  if (raw === undefined) return {};
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min)
    return { error: `${key} must be an integer ≥ ${min}` };
  return { value: n };
}

function percentField(
  fd: FormData,
  key: string,
): { value?: number; error?: string } {
  const raw = str(fd, key);
  if (raw === undefined) return {};
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 100)
    return { error: `${key} must be a number in (0, 100]` };
  return { value: n };
}

function idField(fd: FormData, key = "id"): number | null {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= 1 ? n : null;
}

// --------------------------------------------------------------------------- //
// Products                                                                     //
// --------------------------------------------------------------------------- //

export async function createProductAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const code = str(fd, "code");
  const defaultBillingUnit = str(fd, "default_billing_unit");
  if (!code || !defaultBillingUnit)
    return fail("Code and default billing unit are required");
  const nameTr = parseJsonObject(fd, "name_translations");
  if (nameTr === "INVALID") return fail("Invalid name translations JSON");
  if (!nameTr || Object.keys(nameTr).length === 0)
    return fail("At least one name translation is required");
  const descTr = parseJsonObject(fd, "description_translations");
  if (descTr === "INVALID")
    return fail("Invalid description translations JSON");

  const payload: ProductCreatePayload = {
    code,
    name_translations: nameTr,
    default_billing_unit: defaultBillingUnit,
  };
  if (descTr !== undefined) payload.description_translations = descTr;
  const scope = str(fd, "service_scope");
  if (scope !== undefined) payload.service_scope = scope;
  const period = str(fd, "period_type");
  if (period !== undefined) payload.period_type = period;
  payload.is_active = fd.get("is_active") === "on";

  const res = await createProduct(payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function updateProductAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid product id");
  const payload: ProductUpdatePayload = {};
  const nameTr = parseJsonObject(fd, "name_translations");
  if (nameTr === "INVALID") return fail("Invalid name translations JSON");
  if (nameTr !== undefined && Object.keys(nameTr).length > 0)
    payload.name_translations = nameTr;
  const descTr = parseJsonObject(fd, "description_translations");
  if (descTr === "INVALID")
    return fail("Invalid description translations JSON");
  if (descTr !== undefined) payload.description_translations = descTr;
  const dbu = str(fd, "default_billing_unit");
  if (dbu !== undefined) payload.default_billing_unit = dbu;
  const scope = str(fd, "service_scope");
  if (scope !== undefined) payload.service_scope = scope;
  const period = str(fd, "period_type");
  if (period !== undefined) payload.period_type = period;
  payload.is_active = fd.get("is_active") === "on";

  const res = await updateProduct(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function deactivateProductAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid product id");
  const res = await deactivateProduct(id);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

// --------------------------------------------------------------------------- //
// Tariffs                                                                      //
// --------------------------------------------------------------------------- //

export async function createTariffAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const pid = intField(fd, "product_id", 1);
  if (pid.error) return fail(pid.error);
  if (pid.value === undefined) return fail("Product id is required");
  const billingUnit = str(fd, "billing_unit");
  const basePrice = str(fd, "base_price");
  const currency = str(fd, "currency");
  if (!billingUnit || !basePrice || !currency)
    return fail("Billing unit, base price and currency are required");
  if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0)
    return fail("Base price must be ≥ 0");

  const payload: TariffCreatePayload = {
    product_id: pid.value,
    billing_unit: billingUnit,
    base_price: basePrice,
    currency,
  };
  const vpu = intField(fd, "volume_per_unit", 1);
  if (vpu.error) return fail(vpu.error);
  if (vpu.value !== undefined) payload.volume_per_unit = vpu.value;
  const mu = intField(fd, "min_units", 1);
  if (mu.error) return fail(mu.error);
  if (mu.value !== undefined) payload.min_units = mu.value;

  const res = await createTariff(payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function updateTariffAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid tariff id");
  const payload: TariffUpdatePayload = {};
  const billingUnit = str(fd, "billing_unit");
  if (billingUnit !== undefined) payload.billing_unit = billingUnit;
  const basePrice = str(fd, "base_price");
  if (basePrice !== undefined) {
    if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0)
      return fail("Base price must be ≥ 0");
    payload.base_price = basePrice;
  }
  const currency = str(fd, "currency");
  if (currency !== undefined) payload.currency = currency;
  const vpu = intField(fd, "volume_per_unit", 1);
  if (vpu.error) return fail(vpu.error);
  if (vpu.value !== undefined) payload.volume_per_unit = vpu.value;
  const mu = intField(fd, "min_units", 1);
  if (mu.error) return fail(mu.error);
  if (mu.value !== undefined) payload.min_units = mu.value;
  if (Object.keys(payload).length === 0) return fail("Nothing to update");

  const res = await updateTariff(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

// --------------------------------------------------------------------------- //
// Discount rules                                                               //
// --------------------------------------------------------------------------- //

export async function createDiscountRuleAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const mu = intField(fd, "min_units", 1);
  if (mu.error) return fail(mu.error);
  if (mu.value === undefined) return fail("Min units is required");
  const dp = percentField(fd, "discount_percent");
  if (dp.error) return fail(dp.error);
  if (dp.value === undefined) return fail("Discount percent is required");

  const payload: DiscountRuleCreatePayload = {
    min_units: mu.value,
    discount_percent: dp.value,
  };
  const pid = intField(fd, "product_id", 1);
  if (pid.error) return fail(pid.error);
  if (pid.value !== undefined) payload.product_id = pid.value;
  const tid = intField(fd, "tariff_id", 1);
  if (tid.error) return fail(tid.error);
  if (tid.value !== undefined) payload.tariff_id = tid.value;
  const vf = str(fd, "valid_from");
  if (vf !== undefined) payload.valid_from = vf;
  const vt = str(fd, "valid_to");
  if (vt !== undefined) payload.valid_to = vt;
  payload.is_active = fd.get("is_active") === "on";

  const res = await createDiscountRule(payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function updateDiscountRuleAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid discount rule id");
  const payload: DiscountRuleUpdatePayload = {};
  const mu = intField(fd, "min_units", 1);
  if (mu.error) return fail(mu.error);
  if (mu.value !== undefined) payload.min_units = mu.value;
  const dp = percentField(fd, "discount_percent");
  if (dp.error) return fail(dp.error);
  if (dp.value !== undefined) payload.discount_percent = dp.value;
  const pid = intField(fd, "product_id", 1);
  if (pid.error) return fail(pid.error);
  if (pid.value !== undefined) payload.product_id = pid.value;
  const tid = intField(fd, "tariff_id", 1);
  if (tid.error) return fail(tid.error);
  if (tid.value !== undefined) payload.tariff_id = tid.value;
  const vf = str(fd, "valid_from");
  if (vf !== undefined) payload.valid_from = vf;
  const vt = str(fd, "valid_to");
  if (vt !== undefined) payload.valid_to = vt;
  payload.is_active = fd.get("is_active") === "on";

  const res = await updateDiscountRule(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function deactivateDiscountRuleAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid discount rule id");
  const res = await deactivateDiscountRule(id);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

// --------------------------------------------------------------------------- //
// Monthly discounts                                                            //
// --------------------------------------------------------------------------- //

export async function createMonthlyDiscountAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const monthStart = str(fd, "month_start");
  if (!monthStart) return fail("Month start is required");
  const dp = percentField(fd, "discount_percent");
  if (dp.error) return fail(dp.error);
  if (dp.value === undefined) return fail("Discount percent is required");

  const payload: MonthlyDiscountCreatePayload = {
    month_start: monthStart,
    discount_percent: dp.value,
  };
  const pid = intField(fd, "product_id", 1);
  if (pid.error) return fail(pid.error);
  if (pid.value !== undefined) payload.product_id = pid.value;
  const tid = intField(fd, "tariff_id", 1);
  if (tid.error) return fail(tid.error);
  if (tid.value !== undefined) payload.tariff_id = tid.value;
  const mct = intField(fd, "max_campaigns_total", 1);
  if (mct.error) return fail(mct.error);
  if (mct.value !== undefined) payload.max_campaigns_total = mct.value;
  const mcps = intField(fd, "max_campaigns_per_service", 1);
  if (mcps.error) return fail(mcps.error);
  if (mcps.value !== undefined) payload.max_campaigns_per_service = mcps.value;
  payload.is_active = fd.get("is_active") === "on";

  const res = await createMonthlyDiscount(payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function updateMonthlyDiscountAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid monthly discount id");
  const payload: MonthlyDiscountUpdatePayload = {};
  const monthStart = str(fd, "month_start");
  if (monthStart !== undefined) payload.month_start = monthStart;
  const dp = percentField(fd, "discount_percent");
  if (dp.error) return fail(dp.error);
  if (dp.value !== undefined) payload.discount_percent = dp.value;
  const pid = intField(fd, "product_id", 1);
  if (pid.error) return fail(pid.error);
  if (pid.value !== undefined) payload.product_id = pid.value;
  const tid = intField(fd, "tariff_id", 1);
  if (tid.error) return fail(tid.error);
  if (tid.value !== undefined) payload.tariff_id = tid.value;
  const mct = intField(fd, "max_campaigns_total", 1);
  if (mct.error) return fail(mct.error);
  if (mct.value !== undefined) payload.max_campaigns_total = mct.value;
  const mcps = intField(fd, "max_campaigns_per_service", 1);
  if (mcps.error) return fail(mcps.error);
  if (mcps.value !== undefined) payload.max_campaigns_per_service = mcps.value;
  payload.is_active = fd.get("is_active") === "on";

  const res = await updateMonthlyDiscount(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function deactivateMonthlyDiscountAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid monthly discount id");
  const res = await deactivateMonthlyDiscount(id);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

// --------------------------------------------------------------------------- //
// Zones                                                                        //
// --------------------------------------------------------------------------- //

export async function createZoneAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const code = str(fd, "code");
  const timeGranularity = str(fd, "time_granularity");
  if (!code || !timeGranularity)
    return fail("Code and time granularity are required");
  const ms = intField(fd, "max_slots", 0);
  if (ms.error) return fail(ms.error);
  if (ms.value === undefined) return fail("Max slots is required");

  const payload: ZoneCreatePayload = {
    code,
    time_granularity: timeGranularity,
    max_slots: ms.value,
  };
  const res = await createZone(payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}

export async function updateZoneAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = idField(fd);
  if (id === null) return fail("Invalid zone id");
  const payload: ZoneUpdatePayload = {};
  const tg = str(fd, "time_granularity");
  if (tg !== undefined) payload.time_granularity = tg;
  const ms = intField(fd, "max_slots", 0);
  if (ms.error) return fail(ms.error);
  if (ms.value !== undefined) payload.max_slots = ms.value;
  if (Object.keys(payload).length === 0) return fail("Nothing to update");

  const res = await updateZone(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/promotions");
  return ok();
}
