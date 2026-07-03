"use client";

import { useMemo, useState } from "react";
import { apiJson } from "../../lib/api";

type Scope =
  | "all"
  | "crew"
  | "equipment"
  | "projects"
  | "bookings"
  | "invoices"
  | "clients";

type SearchResponse = {
  equipment?: Array<{ _id: string; name?: string; type?: string }>;
  crew?: Array<{ _id: string; fullName?: string; position?: string }>;
  projects?: Array<{ _id: string; progressStatus?: string }>;
  bookings?: Array<{ _id: string; referenceNumber?: string; status?: string }>;
  invoices?: Array<{ _id: string; referenceNumber?: string; status?: string }>;
  clients?: Array<{ _id: string; fullName?: string; email?: string }>;
};

const SCOPES: Scope[] = [
  "all",
  "crew",
  "equipment",
  "projects",
  "bookings",
  "invoices",
  "clients",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    if (!result) return 0;
    return (
      (result.equipment?.length ?? 0) +
      (result.crew?.length ?? 0) +
      (result.projects?.length ?? 0) +
      (result.bookings?.length ?? 0) +
      (result.invoices?.length ?? 0) +
      (result.clients?.length ?? 0)
    );
  }, [result]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const endpoint = scope === "all" ? "/search/global" : `/search/${scope}`;
      const data = await apiJson<SearchResponse>(
        `${endpoint}?query=${encodeURIComponent(query.trim())}&scope=${scope}`,
      );
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black uppercase tracking-[0.15em]">
        Global search
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Search Crew, Equipment, Projects, Bookings, Invoices, and Clients.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="border-2 border-black px-3 py-2 text-sm"
        />
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className="border-2 border-black px-3 py-2 text-sm font-black uppercase"
        >
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={runSearch}
          className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {result && (
        <section className="mt-6 border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            {totals} results
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {result.crew?.map((i) => (
              <p key={i._id}>
                Crew: {i.fullName} ({i.position ?? "N/A"})
              </p>
            ))}
            {result.equipment?.map((i) => (
              <p key={i._id}>
                Equipment: {i.name} ({i.type ?? "N/A"})
              </p>
            ))}
            {result.projects?.map((i) => (
              <p key={i._id}>Project: {i.progressStatus ?? "N/A"}</p>
            ))}
            {result.bookings?.map((i) => (
              <p key={i._id}>
                Booking: {i.referenceNumber} ({i.status ?? "N/A"})
              </p>
            ))}
            {result.invoices?.map((i) => (
              <p key={i._id}>
                Invoice: {i.referenceNumber} ({i.status ?? "N/A"})
              </p>
            ))}
            {result.clients?.map((i) => (
              <p key={i._id}>
                Client: {i.fullName} ({i.email ?? "N/A"})
              </p>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
