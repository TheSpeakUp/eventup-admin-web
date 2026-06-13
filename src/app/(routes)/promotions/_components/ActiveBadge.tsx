// src/app/(routes)/promotions/_components/ActiveBadge.tsx
// Active / inactive status pill.
import Badge from "@/app/_components/ui/Badge";

export default function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      tone={isActive ? "success" : "neutral"}
      data-testid="active-badge"
      data-active={isActive}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
