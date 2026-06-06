"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type Hire = {
  _id: string;
  message: string;
  status: string;
  proposedRate?: number;
  client?: { fullName?: string; email?: string };
  crew?: { fullName?: string; email?: string };
};

export default function HireRequestsPage() {
  const [hires, setHires] = useState<Hire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    void apiJson<{ hires: Hire[] }>("/hire/mine")
      .then((data) => setHires(data.hires ?? []))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "Failed to load requests.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id: string, status: "accepted" | "declined") => {
    try {
      await apiJson(`/hire/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update request."));
    }
  };

  return (
    <RoleGate allowedRoles={["client", "crew"]}>
      <DashboardShell
        kicker="Hire requests"
        title="Collaboration inbox"
        summary="Sent and received hire requests."
      >
        {loading ? <p>Loading...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <section className="space-y-4">
          {hires.map((h) => (
            <article
              key={h._id}
              className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase">{h.status}</p>
              <p className="mt-2 text-sm">{h.message}</p>
              <p className="mt-2 text-xs text-gray-600">
                {h.client?.fullName ? `Client: ${h.client.fullName}` : ""}
                {h.crew?.fullName ? `Crew: ${h.crew.fullName}` : ""}
              </p>
              {h.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void respond(h._id, "accepted")}
                    className="border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase text-[#f2eadf]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void respond(h._id, "declined")}
                    className="border-2 border-black px-3 py-1 text-xs font-black uppercase"
                  >
                    Decline
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
