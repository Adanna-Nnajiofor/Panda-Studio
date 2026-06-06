import { Suspense } from "react";
import RentEquipmentPageInner from "./RentEquipmentPageInner";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Loading rental form...</p>}>
      <RentEquipmentPageInner />
    </Suspense>
  );
}
