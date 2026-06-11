// src/app/(routes)/broadcast/page.tsx
//
// Layer-4 broadcast: compose an announcement for provider teams. SUPERADMIN
// surface (backend gate ADMIN_NOTIFICATIONS_WRITE); the nav link is already
// role-filtered, the page guards directly via the role claim too.
import { getAdminSession } from "@/lib/auth/session";
import BroadcastComposer from "./_components/BroadcastComposer";

export default async function BroadcastPage() {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Broadcast</h1>
        <div
          data-testid="broadcast-denied"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Broadcasting announcements requires the SUPERADMIN role.
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Broadcast</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send an in-app announcement to provider teams (console bell + live
          push). Delivery rides the notification outbox with retries.
        </p>
      </div>
      <BroadcastComposer />
    </div>
  );
}
