import Link from "next/link";

interface DashboardOverviewProps {
  userName: string;
  bookingsCount: number;
  totalSpent: number;
  nextBooking?: string;
  completedCount: number;
}

export default function DashboardOverview({
  userName,
  bookingsCount,
  totalSpent,
  nextBooking,
  completedCount,
}: DashboardOverviewProps) {
  return (
    <section className="rounded-4xl border border-slate-800/60 bg-slate-950/90 p-8 text-white shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-emerald-400">
            Dashboard overview
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Hello, {userName.split(" ")[0] ?? "Creator"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Your studio schedule, invoices, and booking pulse are all in one
            place. Keep the next session on track and manage your project flow
            with clarity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Active bookings
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {bookingsCount}
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Completed
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {completedCount}
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Total spent
            </p>
            <p className="mt-4 text-3xl font-semibold text-emerald-300">
              ₦{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-3xl border border-emerald-500/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
            Next session
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            {nextBooking || "No sessions scheduled yet"}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Plan your workflow around the next confirmed booking, and keep the
            shoot or session on schedule.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900/90 p-6 text-slate-300 shadow-xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Quick actions
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              href="/bookings/new"
              className="rounded-3xl bg-emerald-500/90 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Book a new session
            </Link>
            <Link
              href="/invoices"
              className="rounded-3xl border border-slate-700 px-5 py-4 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              View invoices
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
