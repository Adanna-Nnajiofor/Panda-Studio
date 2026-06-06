"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type CrewMember = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  role: string;
  department?: string;
  position?: string;
  bio?: string;
  availability?: string;
};

export default function CrewMarketplacePage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void apiJson<{ users: CrewMember[] }>("/users/crew")
      .then((data) => setCrew(data.users ?? []))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "Could not load crew directory.")),
      )
      .finally(() => setLoading(false));
  }, []);

  const submitHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiJson("/hire", {
        method: "POST",
        body: JSON.stringify({
          crewId: selectedId,
          message,
          proposedRate: proposedRate ? Number(proposedRate) : undefined,
        }),
      });
      setSuccess("Hire request sent successfully.");
      setMessage("");
      setSelectedId(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not send hire request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Crew marketplace"
        title="Hire creative professionals"
        summary="DOPs, editors, sound engineers, stylists, and more — send hire requests directly."
      >
        {loading ? <p>Loading crew...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {success ? <p className="text-sm text-green-800">{success}</p> : null}

        {selectedId ? (
          <form
            onSubmit={submitHire}
            className="mb-6 border-4 border-black bg-[#fef1cf] p-5 shadow-[8px_8px_0_0_#000]"
          >
            <h2 className="text-lg font-black uppercase">Hire request</h2>
            <textarea
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the job, dates, and deliverables..."
              className="mt-3 w-full border-2 border-black px-3 py-2 text-sm"
              rows={4}
            />
            <input
              type="number"
              placeholder="Proposed rate (optional)"
              value={proposedRate}
              onChange={(e) => setProposedRate(e.target.value)}
              className="mt-2 w-full border-2 border-black px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
              >
                Send request
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="border-2 border-black px-4 py-2 text-xs font-black uppercase"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crew.map((member) => {
            const id = String(member._id ?? member.id ?? "");
            const name = member.fullName ?? member.name ?? "Crew member";
            return (
              <article
                key={id}
                className="border-4 border-black bg-[#dff7ec] p-5 shadow-[8px_8px_0_0_#000]"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {member.position ?? member.department ?? "Creative"}
                </p>
                <h2 className="mt-2 text-xl font-black uppercase">{name}</h2>
                <p className="mt-2 text-sm">
                  {member.bio || "Available for studio and on-location work."}
                </p>
                <p className="mt-3 text-xs font-black uppercase">
                  Availability: {member.availability ?? "available"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className="mt-4 border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
                >
                  Hire
                </button>
              </article>
            );
          })}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
