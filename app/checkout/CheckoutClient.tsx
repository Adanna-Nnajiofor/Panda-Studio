"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { useShopping } from "../../components/shopping/ShoppingProvider";
import { apiJson, apiUpload } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatNaira, type CartItem, type CartResponse } from "../../lib/shopping";

type ConfirmResponse = {
  success: boolean;
  booking?: { _id?: string; id?: string };
};

type PaymentInitResponse = {
  authorizationUrl?: string;
  reference?: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const { refresh: refreshCounts } = useShopping();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verifying" | "paying">("form");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [service, setService] = useState("rental");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [bookingTime, setBookingTime] = useState("10:00");
  const [duration, setDuration] = useState(2);
  const [notes, setNotes] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);

  const equipmentIds = useMemo(
    () => cartItems.map((x) => x.equipment._id).filter(Boolean),
    [cartItems],
  );

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const data = await apiJson<CartResponse>("/cart");
        setCartItems(data.cart.items);
        setTotalAmount(data.cart.totalAmount);
        if (data.cart.items[0]) {
          setDuration(data.cart.items[0].durationHours);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load cart for checkout"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const canSubmit =
    cartItems.length > 0 &&
    bookingDate &&
    bookingTime &&
    duration > 0 &&
    !!service &&
    !!idFile;

  const submit = async () => {
    if (!canSubmit || !idFile) return;
    setError(null);
    setStep("verifying");

    try {
      const form = new FormData();
      form.append("idFile", idFile);
      form.append("service", service);
      if (equipmentIds.length) {
        form.append("equipment", JSON.stringify(equipmentIds));
      }
      form.append("bookingDate", bookingDate);
      form.append("bookingTime", bookingTime);
      form.append("duration", String(duration));
      form.append("totalAmount", String(totalAmount));
      if (notes.trim()) form.append("notes", notes.trim());

      await apiUpload<{ success: boolean }>("/checkout/verify-id", form);

      setStep("paying");

      const confirmRes = await apiJson<ConfirmResponse>("/checkout/confirm", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const bookingId =
        confirmRes.booking?._id ?? confirmRes.booking?.id ?? undefined;

      await refreshCounts();

      if (!bookingId) {
        router.replace("/invoices");
        return;
      }

      const payment = await apiJson<PaymentInitResponse>(
        "/payments/initialize",
        {
          method: "POST",
          body: JSON.stringify({ bookingId, paymentMethod: "paystack" }),
        },
      );

      if (payment.authorizationUrl) {
        window.location.href = payment.authorizationUrl;
        return;
      }

      router.replace(`/invoices?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed"));
      setStep("form");
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Secure checkout"
        title="Complete your booking"
        summary="Verify your ID, confirm your slot, and pay with Paystack — all in one flow."
      >
        {loading ? (
          <p className="text-sm">Loading checkout...</p>
        ) : error ? (
          <p className="border-2 border-red-600 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : cartItems.length === 0 ? (
          <div className="border-4 border-black bg-white p-10 text-center shadow-[8px_8px_0_0_#000]">
            <p className="text-xl font-black uppercase">Cart is empty</p>
            <p className="mt-2 text-sm">Add equipment before checking out.</p>
            <Link
              href="/equipment"
              className="mt-6 inline-block border-2 border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
            >
              Browse equipment
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                Step 1 — Booking details
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase">Date</span>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="mt-1 w-full border-2 border-black p-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase">Time</span>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="mt-1 w-full border-2 border-black p-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase">
                    Duration (hours)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) =>
                      setDuration(Math.max(1, Number(e.target.value)))
                    }
                    className="mt-1 w-full border-2 border-black p-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase">Service</span>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="mt-1 w-full border-2 border-black p-2"
                  >
                    <option value="rental">Equipment rental</option>
                    <option value="equipment_rental">Studio + gear</option>
                    <option value="hire">Crew hire</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-black uppercase">
                    Notes (optional)
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 w-full border-2 border-black p-2"
                    placeholder="Special instructions for the studio team"
                  />
                </label>
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.24em]">
                Step 2 — ID verification
              </p>
              <label className="mt-4 block">
                <span className="text-xs font-black uppercase">
                  Upload government ID
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full border-2 border-dashed border-black p-4"
                />
                <span className="mt-1 block text-xs text-slate-600">
                  JPG, PNG, or PDF — required before payment
                </span>
              </label>

              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || step !== "form"}
                className="mt-8 w-full border-2 border-black bg-black px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf] disabled:opacity-50"
              >
                {step === "verifying"
                  ? "Verifying ID..."
                  : step === "paying"
                    ? "Redirecting to Paystack..."
                    : `Pay ${formatNaira(totalAmount)}`}
              </button>
            </section>

            <aside className="h-fit border-4 border-black bg-[#f6e9d7] p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                Order summary
              </p>
              <ul className="mt-4 space-y-3">
                {cartItems.map((item) => (
                  <li
                    key={item._id}
                    className="border-b-2 border-black/20 pb-3 text-sm last:border-b-0"
                  >
                    <p className="font-black uppercase">
                      {item.equipment.name ?? "Equipment"}
                    </p>
                    <p className="text-xs">
                      Qty {item.quantity} · {item.durationHours}h
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-3xl font-black">
                {formatNaira(totalAmount)}
              </p>
              <Link
                href="/cart"
                className="mt-4 block text-xs font-black uppercase tracking-[0.16em] underline"
              >
                Edit cart
              </Link>
            </aside>
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
