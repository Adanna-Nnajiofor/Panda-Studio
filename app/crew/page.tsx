"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";

const tiles = [
  { label: "Open shifts", value: "5" },
  { label: "Availability updates", value: "14" },
  { label: "Unread messages", value: "9" },
  { label: "Assignments due", value: "3" },
];

export default function CrewPage() {
  return (
    <RoleGate allowedRoles={["crew"]}>
      <DashboardShell
        kicker="Crew workbench"
        title="Find work, mark availability, stay booked"
        summary="Crew can scan the marketplace, accept assignments, and keep the team updated without leaving the dashboard."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiles.map((item) => (
            <article
              key={item.label}
              className="border-4 border-black bg-[#dff7ec] p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-black">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">
              Marketplace snapshot
            </h2>
            <p className="mt-2 text-sm">
              View nearby jobs, pickup notices, and last-minute openings that
              need a crew hand fast.
            </p>
          </article>
          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">
              Availability and messaging
            </h2>
            <p className="mt-2 text-sm">
              Mark your open dates, respond to production changes, and keep the
              day on track.
            </p>
          </article>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
