import ForceDispatchButtons from "./_components/ForceDispatchButtons";
import ServiceHealthSection from "./_components/ServiceHealthSection";
import ProviderHealthSection from "./_components/ProviderHealthSection";
import DispatchRunsSection from "./_components/DispatchRunsSection";
import DlqSection from "./_components/DlqSection";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OpsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const excludeReplayed = sp.exclude_replayed !== "false";
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Offers — SLA ops</h1>
      <ForceDispatchButtons />
      <ServiceHealthSection />
      <ProviderHealthSection />
      <DispatchRunsSection />
      <DlqSection excludeReplayed={excludeReplayed} />
    </main>
  );
}
