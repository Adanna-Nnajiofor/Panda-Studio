"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type PaymentRow = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  paymentMethod: string;
  booking?:
    | {
        _id?: string;
        referenceNumber?: string;
        totalAmount?: number;
        status?: string;
      }
    | string;
};

export default function InvoicesPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ payments: PaymentRow[] }>(
          "/payments/mine",
        );
        setPayments(data.payments ?? []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load payments."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const payBooking = async (bookingId: string) => {
    setPayingId(bookingId);
    setError(null);
    try {
      const data = await apiJson<{
        authorizationUrl?: string;
        reference?: string;
      }>("/payments/initialize", {
        method: "POST",
        body: JSON.stringify({ bookingId, paymentMethod: "paystack" }),
      });
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setError(
        "Payment initialized but no checkout URL returned. Check Paystack env keys.",
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Payment could not be started."));
    } finally {
      setPayingId(null);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Invoices & payments"
        title="Billing history"
        summary="View payment status and pay outstanding booking balances via Paystack."
      >
        {loading ? <p>Loading payments...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
          <div className="grid grid-cols-5 border-b-4 border-black bg-[#f6e7c9] p-4 text-xs font-black uppercase tracking-[0.24em]">
            <div>Reference</div>
            <div>Booking</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          {!loading && payments.length === 0 ? (
            <p className="p-4 text-sm">
              No payments yet. Complete a booking to generate an invoice.
            </p>
          ) : null}
          {payments.map((p) => (
            <div
              key={p._id}
              className="grid grid-cols-5 border-b-2 border-black p-4 text-sm last:border-b-0"
            >
              <div className="font-black">{p.reference ?? p._id.slice(-8)}</div>
              <div>
                {typeof p.booking === "object" && p.booking?.referenceNumber
                  ? p.booking.referenceNumber
                  : "—"}
              </div>
              <div>
                {p.currency} {p.amount.toLocaleString()}
              </div>
              <div className="uppercase">{p.status}</div>
              <div>
                {p.status === "pending" && p.booking ? (
                  <button
                    type="button"
                    disabled={payingId !== null}
                    onClick={() =>
                      void payBooking(
                        typeof p.booking === "object" && p.booking?._id
                          ? String(p.booking._id)
                          : typeof p.booking === "string"
                            ? p.booking
                            : "",
                      )
                    }
                    className="border-2 border-black bg-black px-2 py-1 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
                  >
                    Pay
                  </button>
                ) : (
                  "—"
                )}
              </div>
            </div>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
