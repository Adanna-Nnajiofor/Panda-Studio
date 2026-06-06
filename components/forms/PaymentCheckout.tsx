"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";

interface PaymentCheckoutProps {
  bookingId: string;
  bookingReference: string;
  totalAmount: number;
  serviceName: string;
  onSuccess?: () => void;
}

type PaystackCallbackResponse = {
  reference: string;
};

type PaystackSetupOptions = {
  key: string;
  email: string;
  amount: number;
  reference: string;
  onClose?: () => void;
  callback?: (response: PaystackCallbackResponse) => void | Promise<void>;
};

type PaystackHandler = {
  openIframe: () => void;
};

type PaystackPop = {
  setup: (options: PaystackSetupOptions) => PaystackHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

export function PaymentCheckout({
  bookingId,
  bookingReference,
  totalAmount,
  serviceName,
  onSuccess,
}: PaymentCheckoutProps) {
  const router = useRouter();
  const { initializePayment, verifyPayment, loading, error } = usePayment();
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "stripe">(
    "paystack",
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePaystackPayment = async () => {
    setProcessing(true);

    try {
      const initResult = await initializePayment(bookingId, "paystack");
      if (!initResult.success) {
        throw new Error(initResult.message || "Payment initialization failed");
      }

      const paystack = window.PaystackPop;
      const publicKey =
        initResult.publicKey ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        "";
      if (!paystack || !publicKey) {
        throw new Error(
          "Paystack is not available. Make sure the public key is configured.",
        );
      }

      const handler = paystack.setup({
        key: publicKey,
        email: initResult.email || "customer@example.com",
        amount: totalAmount * 100,
        reference: initResult.reference,
        onClose: () => {
          setProcessing(false);
        },
        callback: async (response: { reference: string }) => {
          const verifyResult = await verifyPayment(
            response.reference,
            bookingId,
          );
          if (verifyResult.success) {
            if (onSuccess) {
              onSuccess();
            }
            router.push("/bookings");
          } else {
            alert("Payment was not verified. Please try again.");
          }
        },
      });

      handler.openIframe();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    setProcessing(true);
    try {
      await initializePayment(bookingId, "stripe");
      alert(
        "Stripe integration is ready. Redirecting to Stripe checkout is next.",
      );
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Stripe payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "paystack") {
      await handlePaystackPayment();
    } else {
      await handleStripePayment();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Secure payment
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Complete your booking
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Pay securely and confirm your studio booking immediately.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Service</p>
            <p className="font-semibold text-slate-900">{serviceName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Booking reference</p>
            <p className="font-semibold text-slate-900">{bookingReference}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm text-slate-500">Amount due</p>
            <p className="text-3xl font-semibold text-emerald-700">
              ₦{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Choose payment method
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              {
                id: "paystack",
                label: "Paystack",
                description: "NGN payments with card or bank transfer.",
              },
              {
                id: "stripe",
                label: "Stripe",
                description: "International payments with Stripe.",
              },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setPaymentMethod(option.id as "paystack" | "stripe")
                }
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  paymentMethod === option.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                }`}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePayment}
          disabled={processing || loading}
          className="w-full rounded-full bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {processing || loading
            ? "Processing payment..."
            : `Pay ₦${totalAmount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
