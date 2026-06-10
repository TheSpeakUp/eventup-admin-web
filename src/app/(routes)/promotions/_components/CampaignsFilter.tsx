// src/app/(routes)/promotions/_components/CampaignsFilter.tsx
import ListFilter from "./ListFilter";

const CAMPAIGN_STATUSES = ["active", "scheduled", "canceled", "expired"];

export default function CampaignsFilter({
  status,
  serviceId,
}: {
  status?: string;
  serviceId?: number;
}) {
  return (
    <ListFilter
      tab="campaigns"
      status={status}
      serviceId={serviceId}
      statuses={CAMPAIGN_STATUSES}
      testid="campaigns"
    />
  );
}
