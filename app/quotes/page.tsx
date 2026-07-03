"use client";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Quote = {
  _id: string;
  referenceNumber: string;
  total: number;
  status: string;
  validUntil: string;
  notes?: string;
  items?: { description: string; quantity: number; subtotal: number }[];
  client?: { fullName: string; email: string };
  createdAt: string;
};

const STATUS_BG: Record<string, string> = {
  draft: "bg-gray-100",
  sent: "bg-blue-100",
  accepted: "bg-green-100",
  rejected: "bg-red-100",
  expired: "bg-yellow-100",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ quotes: Quote[] }>("/quotes")
      .then((d) => setQuotes(d.quotes ?? []))
      .catch((e) => setError(getErrorMessage(e, "Failed to load quotes.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGate
      allowedRoles={["client", "admin", "super_admin", "staff"]}
      allowAnonymous
    >
      <DashboardShell
        kicker="Finance"
        title="Quotes"
        summary="View and manage production quotes."
      >
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <section className="grid gap-4 lg:grid-cols-2">
          {quotes.map((q) => (
            <article
              key={q._id}
              className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    {q.referenceNumber}
                  </p>
                  {q.client ? (
                    <p className="mt-1 text-sm font-black">
                      {q.client.fullName} · {q.client.email}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${STATUS_BG[q.status] ?? ""}`}
                >
                  {q.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-black">
                ₦{q.total.toLocaleString()} · Valid until{" "}
                {new Date(q.validUntil).toLocaleDateString()}
              </p>
              {q.items?.length ? (
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {q.items.slice(0, 3).map((item) => (
                    <li
                      key={`${q._id}-${item.description}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{item.description}</span>
                      <span className="font-black">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {q.notes ? (
                <p className="mt-3 text-xs text-gray-600">{q.notes}</p>
              ) : null}
            </article>
          ))}
          {!loading && quotes.length === 0 ? (
            <p className="text-sm text-gray-600">No quotes found.</p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
