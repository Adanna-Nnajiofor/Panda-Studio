"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type Rental = {
  _id: string;
  referenceNumber: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  equipment?: { name?: string; type?: string };
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiJson<{ rentals: Rental[] }>("/rentals/mine")
      .then((data) => setRentals(data.rentals ?? []))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "Failed to load rentals.")),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="My rentals"
        title="Equipment rental history"
        summary="Track pending, active, and returned gear."
      >
        {loading ? <p>Loading...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <section className="divide-y-4 divide-black border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
          {rentals.map((r) => (
            <div key={r._id} className="grid grid-cols-4 gap-2 p-4 text-sm">
              <div className="font-black">{r.referenceNumber}</div>
              <div>{r.equipment?.name ?? "Equipment"}</div>
              <div className="uppercase">{r.status}</div>
              <div>₦{r.totalAmount.toLocaleString()}</div>
            </div>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
