"use client";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

type Stats = { totalUsers: number; totalClients: number; totalCrew: number; totalStaff: number; totalBookings: number; confirmedBookings: number; completedBookings: number; pendingBookings: number };
type Revenue = { revenueByMonth: { _id: { year: number; month: number }; total: number; count: number }[]; totalRevenue: number };

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiJson<{ stats: Stats }>("/analytics/stats"),
      apiJson<Revenue>("/analytics/revenue"),
    ]).then(([s, r]) => { setStats(s.stats); setRevenue(r); }).finally(() => setLoading(false));
  }, []);

  const stat = (label: string, value: number | string) => (
    <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell kicker="Admin" title="Analytics" summary="Platform revenue, bookings, users, and performance metrics.">
        {loading ? <p className="text-sm">Loading analytics...</p> : null}
        {stats ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stat("Total Users", stats.totalUsers)}
              {stat("Clients", stats.totalClients)}
              {stat("Crew", stats.totalCrew)}
              {stat("Staff", stats.totalStaff)}
            </section>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stat("Total Bookings", stats.totalBookings)}
              {stat("Confirmed", stats.confirmedBookings)}
              {stat("Completed", stats.completedBookings)}
              {stat("Pending", stats.pendingBookings)}
            </section>
          </>
        ) : null}
        {revenue ? (
          <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">Total Revenue</p>
            <p className="mt-1 text-3xl font-black">₦{revenue.totalRevenue.toLocaleString()}</p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Last 6 Months</p>
              {revenue.revenueByMonth.map(m => (
                <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-black">{MONTH[m._id.month - 1]}</span>
                  <div className="flex-1 border-2 border-black bg-[#f2eadf]">
                    <div className="bg-black py-1" style={{ width: `${Math.min(100, (m.total / (revenue.totalRevenue || 1)) * 100 * 6)}%` }} />
                  </div>
                  <span className="text-xs font-black">₦{m.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DashboardShell>
    </RoleGate>
  );
}
