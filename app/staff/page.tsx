"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";

const metrics = [
  { label: "Equipment holds", value: "8" },
  { label: "Scheduling tasks", value: "12" },
  { label: "Inbound messages", value: "21" },
  { label: "Payroll checks", value: "4" },
];

export default function StaffPage() {
  return (
    <RoleGate allowedRoles={["staff"]}>
      <DashboardShell
        kicker="Staff desk"
        title="Keep operations moving"
        summary="Staff coordinate equipment, schedule handoffs, and support payroll foundations so each job closes cleanly."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <article
              key={item.label}
              className="border-4 border-black bg-[#fff3d8] p-5 shadow-[8px_8px_0_0_#000]"
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
            <h2 className="text-xl font-black uppercase">Equipment</h2>
            <p className="mt-2 text-sm">
              Track what is checked out, what is due back, and what still needs
              a prep pass.
            </p>
          </article>
          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-xl font-black uppercase">Scheduling</h2>
            <p className="mt-2 text-sm">
              Coordinate crew call times, delivery windows, and production
              timelines.
            </p>
          </article>
          <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-xl font-black uppercase">
              Payroll foundations
            </h2>
            <p className="mt-2 text-sm">
              Make sure hours, approvals, and change notes are ready for the
              next step.
            </p>
          </article>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
