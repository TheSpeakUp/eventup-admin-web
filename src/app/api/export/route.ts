// GET /api/export?surface=<key>&<filters…> — server-side CSV download proxy.
//
// The backend's `format=csv` lives on cookie-less bearer-auth endpoints, so
// the browser cannot hit them directly; this route attaches the admin access
// token server-side and pipes the CSV through. `surface` is resolved via an
// ALLOWLIST (never a caller-supplied path — no SSRF), every other query param
// is forwarded verbatim so the export honours the table's current filters.

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/api-config";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

const SURFACES: Record<string, string> = {
  payments: "/eventup-admin/v1/marketplace/payments",
  services: "/eventup-admin/v1/marketplace/services",
  providers: "/eventup-admin/v1/marketplace/providers",
  audit: "/eventup-admin/v1/audit",
  "quality-services": "/eventup-admin/v1/marketplace/quality/services",
  "promotion-orders": "/eventup-admin/v1/marketplace/promotions/orders",
  "promotion-campaigns": "/eventup-admin/v1/marketplace/promotions/campaigns",
  "offers-queue": "/eventup-admin/v1/marketplace/offers/review-sla/summary",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const surface = url.searchParams.get("surface") ?? "";
  const path = SURFACES[surface];
  if (!path) {
    return NextResponse.json({ error: "unknown surface" }, { status: 400 });
  }

  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const target = new URL(buildApiUrl(path));
  url.searchParams.forEach((value, key) => {
    if (key !== "surface" && key !== "format") target.searchParams.append(key, value);
  });
  target.searchParams.set("format", "csv");

  const upstream = await fetch(target.toString(), {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `export failed (${upstream.status})` },
      { status: upstream.status },
    );
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/csv",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="${surface}.csv"`,
      ...(upstream.headers.get("x-export-truncated")
        ? { "X-Export-Truncated": "true" }
        : {}),
    },
  });
}
