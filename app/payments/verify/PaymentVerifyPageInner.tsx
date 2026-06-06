"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

export default function PaymentVerifyPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const bookingId = searchParams.get("bookingId") ?? "";

  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verify = async () => {
      if (!reference || !bookingId) {
        setMessage("Missing payment reference. Return to invoices.");
        return;
      }

      try {
        await apiJson("/payments/verify", {
          method: "POST",
          body: JSON.stringify({ reference, bookingId }),
        });

        setMessage("Payment successful! Redirecting...");

        setTimeout(() => {
          router.replace("/invoices");
        }, 1500);
      } catch (err: unknown) {
        setMessage(getErrorMessage(err, "Verification failed."));
      }
    };

    verify();
  }, [reference, bookingId, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f2eadf] p-6">
      <div className="border-4 border-black bg-white p-8 shadow-[10px_10px_0_0_#000] text-center max-w-md">
        <h1 className="text-2xl font-black uppercase">Payment</h1>
        <p className="mt-4 text-sm">{message}</p>
      </div>
    </main>
  );
}
