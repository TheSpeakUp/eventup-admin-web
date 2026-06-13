import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider } from "@/lib/providers/api";
import { Panel } from "@/app/_components/ui";
import ProviderDetailView from "./_components/ProviderDetail";
import ProviderFieldEditForm from "./_components/ProviderFieldEditForm";
import ProviderModerationPanel from "./_components/ProviderModerationPanel";

type Params = Promise<{ id: string }>;

export default async function ProviderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) notFound();
  const result = await getProvider(idNum);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <Link href="/providers" className="text-sm text-ink-subtle hover:underline">
          ← Back to providers
        </Link>
        <div
          data-testid="provider-detail-error"
          className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          Failed to load provider: {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/providers" className="text-sm text-ink-subtle hover:underline">
        ← Back to providers
      </Link>
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="space-y-5">
          <Panel title="Provider profile" accent="primary">
            <ProviderDetailView provider={result.data} />
          </Panel>
          <Panel title="Edit fields" accent="info">
            <ProviderFieldEditForm provider={result.data} />
          </Panel>
        </div>
        <aside>
          <Panel title="Moderation" accent="warning">
            <ProviderModerationPanel
              providerId={result.data.id}
              status={result.data.verification_status}
            />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
