"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type CrewMember = {
  _id: string;
  fullName: string;
  position?: string;
  department?: string;
  availability: string;
  avatar?: string;
  bio?: string;
  portfolio?: {
    specialties?: string[];
    hourlyRate?: number;
    showreelUrl?: string;
  };
};

const AVAIL_COLOR: Record<string, string> = {
  available: "bg-green-100",
  busy: "bg-yellow-100",
  on_project: "bg-blue-100",
  offline: "bg-gray-100",
};

export default function DiscoverPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiJson<{ crew: CrewMember[] }>("/portfolios/crew/directory")
      .then((d) => setCrew(d.crew ?? []))
      .catch((e) => setError(getErrorMessage(e, "Failed to load crew.")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = crew.filter(
    (c) =>
      !search ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.position ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <RoleGate
      allowedRoles={["client", "admin", "super_admin", "staff", "crew"]}
    >
      <DashboardShell
        kicker="Marketplace"
        title="Discover Crew"
        summary="Browse and hire professional crew members, directors, editors, and creatives."
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 text-sm font-black outline-none md:max-w-sm"
        />
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c._id}
              className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
            >
              <div className="flex items-center gap-4 border-b-4 border-black p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden border-2 border-black bg-[#f2eadf] relative">
                  {c.avatar ? (
                    <Image
                      src={c.avatar}
                      alt={c.fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-2xl">
                      👤
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-black uppercase">{c.fullName}</h2>
                  <p className="text-xs text-gray-600">
                    {c.position ?? c.department ?? "Creative"}
                  </p>
                  <span
                    className={`mt-1 inline-block border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase ${AVAIL_COLOR[c.availability] ?? ""}`}
                  >
                    {c.availability.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {c.bio ? <p className="text-sm line-clamp-2">{c.bio}</p> : null}
                {c.portfolio?.specialties?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.portfolio.specialties.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                {c.portfolio?.hourlyRate ? (
                  <p className="mt-2 text-xs font-black">
                    ₦{c.portfolio.hourlyRate.toLocaleString()}/hr
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/hire?crewId=${c._id}`}
                    className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
                  >
                    Hire
                  </a>
                  {c.portfolio?.showreelUrl ? (
                    <a
                      href={c.portfolio.showreelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase"
                    >
                      Showreel
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 ? (
            <p className="col-span-full text-sm text-gray-600">
              No crew members found.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
