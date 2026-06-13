// src/app/(routes)/promo-codes/_components/PromoStatusBadge.tsx
import Badge from "@/app/_components/ui/Badge";

export default function PromoStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      tone={isActive ? "success" : "neutral"}
      data-testid="promo-status-badge"
      data-active={isActive}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
