import { Suspense } from "react";
import CartClient from "./CartClient";

function Loading() {
  return <p className="p-6">Loading cart...</p>;
}

export default function CartPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CartClient />
    </Suspense>
  );
}
