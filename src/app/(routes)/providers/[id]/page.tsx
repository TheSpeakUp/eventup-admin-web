import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider } from "@/lib/providers/api";
import ProviderDetailView from "./_components/ProviderDetail";
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
        <Link href="/providers" className="text-sm text-zinc-500 hover:underline">
          ← Back to providers
        </Link>
        <div
          data-testid="provider-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Failed to load provider: {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/providers" className="text-sm text-zinc-500 hover:underline">
        ← Back to providers
      </Link>
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <ProviderDetailView provider={result.data} />
        <aside className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Moderation</h2>
          <ProviderModerationPanel providerId={result.data.id} status={result.data.verification_status} />
        </aside>
      </div>
    </div>
  );
}
