import Link from "next/link";
import { notFound } from "next/navigation";
import { getService } from "@/lib/services/api";
import ServiceDetailView from "./_components/ServiceDetail";
import ServiceModerationPanel from "./_components/ServiceModerationPanel";

type Params = Promise<{ id: string }>;

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const result = await getService(id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <Link href="/services" className="text-sm text-zinc-500 hover:underline">
          ← Back to services
        </Link>
        <div
          data-testid="service-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Failed to load service: {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/services" className="text-sm text-zinc-500 hover:underline">
        ← Back to services
      </Link>
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <ServiceDetailView service={result.data} />
        <aside className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Moderation</h2>
          <ServiceModerationPanel serviceId={result.data.id} />
        </aside>
      </div>
    </div>
  );
}
