// src/app/(routes)/promo-codes/new/page.tsx
import PromoCodeForm from "../_components/PromoCodeForm";

export default function NewPromoCodePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">New promo code</h1>
      <div className="mt-4 max-w-2xl">
        <PromoCodeForm mode="create" />
      </div>
    </div>
  );
}
