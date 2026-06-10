// src/app/(routes)/promotions/_components/OrdersFilter.tsx
import ListFilter from "./ListFilter";

const ORDER_STATUSES = ["pending", "paid", "canceled", "refunded"];

export default function OrdersFilter({
  status,
  serviceId,
}: {
  status?: string;
  serviceId?: number;
}) {
  return (
    <ListFilter
      tab="orders"
      status={status}
      serviceId={serviceId}
      statuses={ORDER_STATUSES}
      testid="orders"
    />
  );
}
