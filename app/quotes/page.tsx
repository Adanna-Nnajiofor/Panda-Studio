"use client";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Quote = { _id: string; referenceNumber: string; total: number; status: string; validUntil: string; client?: { fullName: string; email: string }; createdAt: string };

const STATUS_BG: Record<string, string> = { draft: "bg-gray-100", sent: "bg-blue-100", accepted: "bg-green-100", rejected: "bg-red-100", expired: "bg-yellow-100" };

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ quotes: Quote[] }>("/quotes").then(d => setQuotes(d.quotes ?? [])).catch(e => setError(getErrorMessage(e, "Failed to load quotes."))).finally(() => setLoading(false));
  }, []);

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell kicker="Finance" title="Quotes" summary="View and manage production quotes.">
        {loading ? <p className="text-sm">Loading...</p> : error ? <p className="text-sm text-red-700">{error}</p> : null}
        <section className="space-y-3">
          {quotes.map(q => (
            <article key={q._id} className="flex flex-col gap-3 border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]">{q.referenceNumber}</p>
                {q.client ? <p className="mt-1 text-sm font-black">{q.client.fullName} · {q.client.email}</p> : null}
                <p className="text-sm">₦{q.total.toLocaleString()} · Valid until {new Date(q.validUntil).toLocaleDateString()}</p>
              </div>
              <span className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${STATUS_BG[q.status] ?? ""}`}>{q.status}</span>
            </article>
          ))}
          {!loading && quotes.length === 0 ? <p className="text-sm text-gray-600">No quotes found.</p> : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
