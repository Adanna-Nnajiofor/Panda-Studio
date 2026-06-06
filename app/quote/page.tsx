"use client";

import { useEffect, useState, type FormEvent } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type QuoteItem = {
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

type Quote = {
  _id: string;
  referenceNumber: string;
  status: string;
  total: number;
  currency: string;
  validUntil: string;
  items: QuoteItem[];
  notes?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-blue-100 text-blue-900",
  accepted: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
  expired: "bg-amber-100 text-amber-900",
};

const PRESETS: { label: string; price: number }[] = [
  { label: "Studio A — Full Day", price: 150000 },
  { label: "Studio A — Half Day", price: 80000 },
  { label: "Studio B — Full Day", price: 100000 },
  { label: "Video Shoot Package", price: 250000 },
  { label: "Photography — Product Shoot", price: 75000 },
  { label: "Sound Recording (per hour)", price: 15000 },
  { label: "DOP (per day)", price: 60000 },
  { label: "Video Editor (per day)", price: 35000 },
  { label: "Equipment Rental — Camera Kit", price: 45000 },
  { label: "Post Production Package", price: 120000 },
];

export default function QuotePage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showBuilder, setShowBuilder] = useState(false);
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<
    { description: string; unitPrice: string; quantity: string }[]
  >([{ description: "", unitPrice: "", quantity: "1" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await apiJson<{ quotes: Quote[] }>("/quotes");
      setQuotes(data.quotes ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load quotes."));
    } finally {
      setLoading(false);
    }
  };

  const addPreset = (preset: { label: string; price: number }) => {
    setItems((prev) => [
      ...prev,
      {
        description: preset.label,
        unitPrice: String(preset.price),
        quantity: "1",
      },
    ]);
  };

  const addBlankItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", unitPrice: "", quantity: "1" },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const computedSubtotal = items.reduce((sum, item) => {
    return sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
  }, 0);

  const computedTotal = computedSubtotal - (discount || 0);

  const formatNGN = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const handleCreateQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      setSuccess(
        "Quote preview generated. Save and submit logic is pending implementation.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create quote."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="Quotes"
        title="Proposal builder"
        summary="Review existing quotes or build a new proposal for a client."
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black">Quotes</h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage your current proposals and create new quote drafts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBuilder((prev) => !prev)}
              className="inline-flex items-center justify-center rounded border-2 border-black bg-black px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#f2eadf]"
            >
              {showBuilder ? "Hide builder" : "Open builder"}
            </button>
          </div>

          {success ? (
            <div className="rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="rounded border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {showBuilder ? (
            <section className="rounded border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-black">Quote builder</h2>
                <p className="text-sm text-slate-600">
                  Fill in details and preview your client quote.
                </p>
              </div>

              <form onSubmit={handleCreateQuote} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Client ID
                    <input
                      type="text"
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      className="mt-2 w-full rounded border px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Valid until
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(event) => setValidUntil(event.target.value)}
                      className="mt-2 w-full rounded border px-3 py-2"
                    />
                  </label>
                </div>

                <label className="block text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                  Notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-2 w-full rounded border px-3 py-2"
                    rows={3}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Discount
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(event) =>
                        setDiscount(Number(event.target.value))
                      }
                      className="mt-2 w-full rounded border px-3 py-2"
                    />
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                      Presets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.slice(0, 3).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => addPreset(preset)}
                          className="rounded border border-black bg-white px-3 py-2 text-xs font-black uppercase"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                      Line items
                    </h3>
                    <button
                      type="button"
                      onClick={addBlankItem}
                      className="rounded border border-black bg-white px-3 py-2 text-xs font-black uppercase"
                    >
                      Add item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={`${item.description}-${idx}`}
                        className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
                      >
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(event) =>
                            updateItem(idx, "description", event.target.value)
                          }
                          className="rounded border px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Unit price"
                          min={0}
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(idx, "unitPrice", event.target.value)
                          }
                          className="rounded border px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(idx, "quantity", event.target.value)
                          }
                          className="rounded border px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="rounded border border-rose-500 bg-rose-50 px-3 py-2 text-xs font-black uppercase text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4 text-sm">
                  <p className="font-black uppercase tracking-[0.12em] text-slate-700">
                    Subtotal
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {formatNGN(computedSubtotal)}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Total after discount: {formatNGN(computedTotal)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded border-2 border-black bg-black px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#f2eadf] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save quote"}
                </button>
              </form>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            {loading ? (
              <p className="text-sm">Loading quotes...</p>
            ) : quotes.length === 0 ? (
              <p className="text-sm">No quotes found yet.</p>
            ) : (
              quotes.map((quote) => (
                <article
                  key={quote._id}
                  className="rounded border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase ${STATUS_COLORS[quote.status] ?? "bg-slate-100 text-slate-800"}`}
                    >
                      {quote.status}
                    </span>
                    <span className="text-sm text-slate-500">
                      Valid until {quote.validUntil}
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-[0.04em]">
                    {quote.referenceNumber}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Created {new Date(quote.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p>{quote.notes || "No notes added."}</p>
                    <p className="font-black">
                      Total: {formatNGN(quote.total)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
