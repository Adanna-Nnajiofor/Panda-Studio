"use client";

import Link from "next/link";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";

const highlights = [
  {
    label: "Open bookings",
    value: "12",
    note: "Upcoming production jobs in motion.",
  },
  {
    label: "Pending invoices",
    value: "4",
    note: "Waiting on client approval or payment.",
  },
  {
    label: "Active requests",
    value: "8",
    note: "Crew, equipment, and service asks.",
  },
  { label: "Messages", value: "23", note: "Fresh updates from the team." },
];

export default function ClientDashboardPage() {
  return (
    <RoleGate allowedRoles={["client"]}>
      <DashboardShell
        kicker="Client dashboard"
        title="Your studio command center"
        summary="Track bookings, invoices, services, and the status of every request without losing the thread."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <article
              key={item.label}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-black">{item.value}</p>
              <p className="mt-2 text-sm">{item.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="border-4 border-black bg-[#fef2d2] p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">What to do next</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                • Review the latest crew marketplace matches for open dates.
              </li>
              <li>
                • Create a new booking when a project moves from idea to action.
              </li>
              <li>
                • Check invoices and keep approvals aligned with delivery dates.
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/bookings/new"
                className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#f2eadf]"
              >
                New booking
              </Link>
              <Link
                href="/services"
                className="border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em]"
              >
                Explore services
              </Link>
              <Link
                href="/projects"
                className="border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em]"
              >
                My downloads
              </Link>
            </div>
          </article>

          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">Workflow snapshot</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="border-2 border-black p-3">
                <p className="font-black uppercase">Crew marketplace</p>
                <p>Discover and hold crew for upcoming production dates.</p>
              </div>
              <div className="border-2 border-black p-3">
                <p className="font-black uppercase">Assignments</p>
                <p>Keep each booking tied to the right people and gear.</p>
              </div>
              <div className="border-2 border-black p-3">
                <p className="font-black uppercase">Messaging</p>
                <p>Coordinate changes before call time and after delivery.</p>
              </div>
            </div>
          </article>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
