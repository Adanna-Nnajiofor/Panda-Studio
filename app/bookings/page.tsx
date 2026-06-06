"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type BookingRow = {
  _id: string;
  referenceNumber?: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalAmount: number;
  service?: { name?: string } | string;
  user?: { fullName?: string; email?: string };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ bookings?: BookingRow[] }>("/bookings");

        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load bookings."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const serviceName = (b: BookingRow) =>
    typeof b.service === "object" && b.service?.name
      ? b.service.name
      : "Studio service";

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="Bookings"
        title="Production pipeline"
        summary="Your scheduled sessions — photo, video, podcast, branding, and film work."
      >
        <div className="flex justify-end">
          <Link
            href="/bookings/new"
            className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#f2eadf]"
          >
            New booking
          </Link>
        </div>

        {loading ? <p>Loading bookings...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
          <div className="grid grid-cols-5 border-b-4 border-black bg-[#f6e7c9] p-4 text-xs font-black uppercase tracking-[0.24em]">
            <div>Reference</div>
            <div>Service</div>
            <div>Status</div>
            <div>When</div>
            <div>Amount</div>
          </div>
          {!loading && bookings.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">
              No bookings yet. Create your first session.
            </p>
          ) : null}
          {bookings.map((row) => (
            <div
              key={row._id}
              className="grid grid-cols-5 border-b-2 border-black p-4 text-sm last:border-b-0"
            >
              <div className="font-black">
                {row.referenceNumber ?? row._id.slice(-6)}
              </div>
              <div>{serviceName(row)}</div>
              <div className="uppercase">{row.status}</div>
              <div>
                {new Date(row.bookingDate).toLocaleDateString()}{" "}
                {row.bookingTime}
              </div>
              <div>₦{row.totalAmount.toLocaleString()}</div>
            </div>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
