import Link from "next/link";
import { notFound } from "next/navigation";
import { getService } from "@/lib/services/api";
import ServiceDetailView from "./_components/ServiceDetail";
import ServiceFieldEditForm from "./_components/ServiceFieldEditForm";
import ServiceModerationPanel from "./_components/ServiceModerationPanel";
import Alert from "@/app/_components/ui/Alert";

type Params = Promise<{ id: string }>;

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) notFound();
  const result = await getService(idNum);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8 space-y-4">
        <Link href="/services" className="text-sm text-ink-subtle hover:underline">
          ← Back to services
        </Link>
        <div data-testid="service-detail-error">
          <Alert tone="danger">Failed to load service: {result.message}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/services" className="text-sm text-ink-subtle hover:underline">
        ← Back to services
      </Link>
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="space-y-5">
          <ServiceDetailView service={result.data} />
          <ServiceFieldEditForm service={result.data} />
        </div>
        <aside className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">Moderation</h2>
          <ServiceModerationPanel
            serviceId={result.data.id}
            status={result.data.status}
          />
        </aside>
      </div>
    </div>
  );
}
