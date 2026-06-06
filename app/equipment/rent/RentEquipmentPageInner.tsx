"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type Equipment = { _id: string; name: string; hourlyRate: number };

export default function RentEquipmentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const equipmentId = searchParams.get("equipmentId") ?? "";

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationType, setDurationType] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!equipmentId) return;

    apiJson<{ equipment: Equipment }>(`/equipment/${equipmentId}`)
      .then((data) => {
        setEquipment(data.equipment);
        setTotalAmount(data.equipment.hourlyRate * 8);
      })
      .catch(() => setError("Could not load equipment."));
  }, [equipmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiJson("/rentals", {
        method: "POST",
        body: JSON.stringify({
          equipment: equipmentId,
          startDate,
          endDate,
          durationType,
          totalAmount,
          notes: notes || undefined,
        }),
      });

      router.push("/equipment/rentals");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Rental request failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Equipment rental"
        title={equipment ? `Rent ${equipment.name}` : "Rent equipment"}
        summary="Select dates and confirm rental. A 30% deposit is calculated automatically."
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-4 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
        >
          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-black uppercase">Start</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase">End</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase">
              Duration type
            </label>
            <select
              value={durationType}
              onChange={(e) =>
                setDurationType(e.target.value as typeof durationType)
              }
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase">Total (₦)</label>
            <input
              type="number"
              min={0}
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
            />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="w-full border-2 border-black px-3 py-2 text-sm"
            rows={2}
          />

          <button
            type="submit"
            disabled={loading || !equipmentId}
            className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Request rental"}
          </button>
        </form>
      </DashboardShell>
    </RoleGate>
  );
}
