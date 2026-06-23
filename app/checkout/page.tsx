import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

function Loading() {
  return <p className="p-6">Loading checkout...</p>;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutClient />
    </Suspense>
  );
}
