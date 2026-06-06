import { Suspense } from "react";
import PaymentVerifyPageInner from "./PaymentVerifyPageInner";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading payment...</div>}>
      <PaymentVerifyPageInner />
    </Suspense>
  );
}
