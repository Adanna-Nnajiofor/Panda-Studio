"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

type AdminDashboardStats = {
  teamsMonitored: number;
  jobsPendingApproval: number;
  crewAvailabilityFlags: number;
  payrollPrepItems: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    teamsMonitored: 0,
    jobsPendingApproval: 0,
    crewAvailabilityFlags: 0,
    payrollPrepItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await apiJson<{
          success: boolean;
          stats: AdminDashboardStats;
        }>("/analytics/admin-dashboard");
        if (!active || !response?.stats) return;
        setStats(response.stats);
      } catch {
        // Keep fallback stats when API is temporarily unavailable.
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const cardStats = [
    { label: "Teams monitored", value: String(stats.teamsMonitored) },
    {
      label: "Jobs pending approval",
      value: String(stats.jobsPendingApproval),
    },
    {
      label: "Crew availability flags",
      value: String(stats.crewAvailabilityFlags),
    },
    { label: "Payroll prep items", value: String(stats.payrollPrepItems) },
  ];

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin dashboard"
        title="Operations, approvals, and oversight"
        summary="Use this workspace to manage the studio machine: services, bookings, equipment, crew, and payroll prep."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cardStats.map((item) => (
            <article
              key={item.label}
              className="border-4 border-black bg-[#fff2d8] p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-black">
                {loading ? "..." : item.value}
              </p>
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

        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-xl font-black uppercase">Content management</h2>
          <p className="mt-2 text-sm">
            Update public pages like About, Terms, Privacy, and FAQ directly
            from the CMS editor.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/cms"
              className="inline-block border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              Open CMS editor
            </Link>
            <Link
              href="/admin/studio-rooms"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Manage studio rooms
            </Link>
            <Link
              href="/admin/audit-logs"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              View audit logs
            </Link>
            <Link
              href="/contracts"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Contracts
            </Link>
            <Link
              href="/film-ops"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Film ops
            </Link>
            <Link
              href="/admin/categories"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Categories
            </Link>
            <Link
              href="/admin/faqs"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              FAQs
            </Link>
            <Link
              href="/admin/awards"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Awards
            </Link>
            <Link
              href="/admin/memberships"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Membership plans
            </Link>
            <Link
              href="/admin/settings"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              System settings
            </Link>
            <Link
              href="/conversations"
              className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              Conversations
            </Link>
          </div>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
