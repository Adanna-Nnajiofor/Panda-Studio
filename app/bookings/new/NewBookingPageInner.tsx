"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type ServiceOption = {
  _id: string;
  name: string;
  basePrice: number;
  durationInHours: number;
};

type EquipmentOption = {
  _id: string;
  name: string;
  hourlyRate: number;
};

export default function NewBookingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedService = searchParams.get("serviceId") ?? "";
  const preselectedEquipment = searchParams.get("equipmentId") ?? "";

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);

  const [serviceId, setServiceId] = useState(preselectedService);
  const [equipmentIds, setEquipmentIds] = useState<string[]>(
    preselectedEquipment ? [preselectedEquipment] : [],
  );

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [duration, setDuration] = useState(2);
  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [svc, eq] = await Promise.all([
          apiJson<ServiceOption[]>("/services"),
          apiJson<{ equipment: EquipmentOption[] }>("/equipment"),
        ]);

        setServices(Array.isArray(svc) ? svc : []);
        setEquipmentList(eq.equipment ?? []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load booking options."));
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const svc = services.find((s) => s._id === serviceId);
    if (svc) {
      setDuration(svc.durationInHours);
      setTotalAmount(svc.basePrice);
    }
  }, [serviceId, services]);

  const toggleEquipment = (id: string) => {
    setEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiJson("/bookings", {
        method: "POST",
        body: JSON.stringify({
          service: serviceId,
          equipment: equipmentIds.length ? equipmentIds : undefined,
          bookingDate,
          bookingTime,
          duration,
          totalAmount,
          notes: notes || undefined,
        }),
      });

      router.push("/bookings");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not create booking."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="New booking"
        title="Book a Panda Studio session"
        summary="Choose a service, optional equipment rental, date/time, and notes for your production."
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl space-y-5 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
        >
          {error && <p className="text-sm text-red-700">{error}</p>}

          {/* Service */}
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.2em]">
              Service
            </label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} — ₦{s.basePrice.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Equipment (optional)
            </p>

            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto border-2 border-black p-3">
              {equipmentList.map((eq) => (
                <label key={eq._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={equipmentIds.includes(eq._id)}
                    onChange={() => toggleEquipment(eq._id)}
                  />
                  {eq.name} (₦{eq.hourlyRate}/hr)
                </label>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em]">
                Date
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em]">
                Time
              </label>
              <input
                type="time"
                required
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Duration + Total */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em]">
                Duration (hours)
              </label>
              <input
                type="number"
                min={1}
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em]">
                Total (₦)
              </label>
              <input
                type="number"
                min={0}
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.2em]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              placeholder="Shot list, references, crew needs..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="border-4 border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Confirm booking"}
          </button>
        </form>
      </DashboardShell>
    </RoleGate>
  );
}
