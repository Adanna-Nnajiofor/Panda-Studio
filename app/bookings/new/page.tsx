import { Suspense } from "react";
import NewBookingPageInner from "./NewBookingPageInner";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Loading booking form...</p>}>
      <NewBookingPageInner />
    </Suspense>
  );
}
