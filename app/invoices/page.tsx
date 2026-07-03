"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiFetch, apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type InvoiceItem = { description: string; quantity: number; unitPrice: number; subtotal: number };
type Invoice = {
  _id: string;
  referenceNumber: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  currency: string;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  notes?: string;
  couponCode?: string;
  items: InvoiceItem[];
  client?: { fullName?: string; email?: string };
  booking?: { referenceNumber?: string; bookingDate?: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-[#d8f0dd] text-black",
  sent: "bg-[#fff8ea] text-black",
  draft: "bg-slate-100 text-slate-600",
  overdue: "bg-[#ffcfbf] text-black",
  cancelled: "bg-slate-200 text-slate-500",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [openingReceipt, setOpeningReceipt] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ invoices: Invoice[] }>("/invoices");
      setInvoices(res.invoices ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const openReceipt = async (id: string) => {
    setOpeningReceipt(id);
    try {
      const res = await apiFetch(`/invoices/${id}/receipt`);
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
    } catch {
      alert("Failed to open receipt.");
    } finally {
      setOpeningReceipt(null);
    }
  };

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.total, 0);

  return (
    <RoleGate allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Billing"
        title="Invoices"
        summary="View and download your invoices and payment receipts."
      >
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total invoices", value: invoices.length, bg: "bg-white" },
            { label: "Total paid", value: `₦${totalPaid.toLocaleString()}`, bg: "bg-[#d8f0dd]" },
            { label: "Outstanding", value: `₦${totalOutstanding.toLocaleString()}`, bg: "bg-[#fff8ea]" },
          ].map((s) => (
            <div key={s.label} className={`border-4 border-black ${s.bg} p-5 shadow-[6px_6px_0_0_#000]`}>
              <p className="text-xs font-black uppercase tracking-[0.2em]">{s.label}</p>
              <p className="mt-2 text-3xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-sm font-black uppercase tracking-[0.2em]">Loading invoices…</p>
        ) : error ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-4 text-sm font-black">{error}</p>
        ) : invoices.length === 0 ? (
          <div className="border-4 border-black bg-[#fff8ea] p-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.3em]">No invoices yet</p>
            <p className="mt-2 text-sm">Your invoices will appear here once issued by Panda Studio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <article
                key={inv._id}
                className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000]"
              >
                <div
                  className="flex cursor-pointer flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => setSelected(selected?._id === inv._id ? null : inv)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black uppercase">{inv.referenceNumber}</p>
                      <span className={`border-2 border-black px-2 py-0.5 text-xs font-black uppercase ${STATUS_STYLE[inv.status] ?? "bg-white"}`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Due {new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {inv.paidAt && ` · Paid ${new Date(inv.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                    {inv.booking?.referenceNumber && (
                      <p className="text-xs text-slate-500">Booking: {inv.booking.referenceNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-black">₦{inv.total.toLocaleString()}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openReceipt(inv._id); }}
                      disabled={openingReceipt === inv._id}
                      className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#f2eadf] disabled:opacity-60"
                    >
                      {openingReceipt === inv._id ? "Opening…" : "Receipt"}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {selected?._id === inv._id && (
                  <div className="border-t-4 border-black bg-[#fffef8] p-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-black">
                          <th className="pb-2 text-left text-xs font-black uppercase tracking-[0.15em]">Description</th>
                          <th className="pb-2 text-center text-xs font-black uppercase tracking-[0.15em]">Qty</th>
                          <th className="pb-2 text-right text-xs font-black uppercase tracking-[0.15em]">Unit</th>
                          <th className="pb-2 text-right text-xs font-black uppercase tracking-[0.15em]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map((item, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2">{item.description}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">₦{item.unitPrice.toLocaleString()}</td>
                            <td className="py-2 text-right font-black">₦{item.subtotal.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                      <p>Subtotal: <span className="font-black">₦{inv.subtotal.toLocaleString()}</span></p>
                      {inv.discount > 0 && <p className="text-green-700">Discount{inv.couponCode ? ` (${inv.couponCode})` : ""}: <span className="font-black">-₦{inv.discount.toLocaleString()}</span></p>}
                      {inv.tax > 0 && <p>Tax: <span className="font-black">₦{inv.tax.toLocaleString()}</span></p>}
                      <p className="text-lg font-black">Total: ₦{inv.total.toLocaleString()}</p>
                    </div>
                    {inv.notes && <p className="mt-3 border-2 border-black bg-[#fff8ea] p-3 text-sm">{inv.notes}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
