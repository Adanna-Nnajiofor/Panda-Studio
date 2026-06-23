import { Suspense } from "react";
import WishlistClient from "./WishlistClient";

function Loading() {
  return <p className="p-6">Loading wishlist...</p>;
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WishlistClient />
    </Suspense>
  );
}
