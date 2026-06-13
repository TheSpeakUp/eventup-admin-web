// src/app/(routes)/promo-codes/new/page.tsx
import PageHeader from "@/app/_components/ui/PageHeader";
import PromoCodeForm from "../_components/PromoCodeForm";

export default function NewPromoCodePage() {
  return (
    <div className="p-8">
      <PageHeader title="New promo code" />
      <div className="mt-4 max-w-2xl">
        <PromoCodeForm mode="create" />
      </div>
    </div>
  );
}
