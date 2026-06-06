"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";

const stats = [
  { label: "Teams monitored", value: "6" },
  { label: "Jobs pending approval", value: "11" },
  { label: "Crew availability flags", value: "18" },
  { label: "Payroll prep items", value: "7" },
];

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin dashboard"
        title="Operations, approvals, and oversight"
        summary="Use this workspace to manage the studio machine: services, bookings, equipment, crew, and payroll prep."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="border-4 border-black bg-[#fff2d8] p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-black">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-xl font-black uppercase">Crew marketplace</h2>
            <p className="mt-2 text-sm">
              Match open assignments with available crew, then approve the best
              fit before the day starts.
            </p>
          </article>

          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-xl font-black uppercase">Scheduling</h2>
            <p className="mt-2 text-sm">
              Maintain service timelines, holds, and day-of adjustments from one
              view.
            </p>
          </article>

          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-xl font-black uppercase">
              Payroll foundations
            </h2>
            <p className="mt-2 text-sm">
              Review approvals and hours so payment prep stays clean and
              auditable.
            </p>
          </article>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
