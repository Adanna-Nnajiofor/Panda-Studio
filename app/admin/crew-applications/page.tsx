"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type Applicant = {
  _id: string;
  user?: {
    _id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
  };
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  hourlyRate?: number;
  showreelUrl?: string;
  portfolioUrl?: string;
  equipmentOwned?: string[];
  position?: string;
  department?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
};

type ActionState = Record<string, "approving" | "rejecting" | null>;

export default function CrewApplicationsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await apiJson<{ applications?: Applicant[] }>(
        "/crew-applications?status=pending",
      );
      setApplicants(result.applications ?? []);
    } catch (err: unknown) {
      setFetchError(getErrorMessage(err, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const getName = (a: Applicant) =>
    a.user?.fullName ?? a.user?.name ?? "Unknown";

  const handleAction = async (
    applicant: Applicant,
    action: "approve" | "reject",
  ) => {
    const id = applicant._id;
    setActionState((s) => ({
      ...s,
      [id]: action === "approve" ? "approving" : "rejecting",
    }));
    setActionError((s) => ({ ...s, [id]: "" }));

    try {
      await apiJson(`/crew-applications/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      setApplicants((prev) => prev.filter((a) => a._id !== id));
    } catch (err: unknown) {
      setActionError((s) => ({
        ...s,
        [id]: getErrorMessage(
          err,
          action === "approve" ? "Approval failed." : "Rejection failed.",
        ),
      }));
    } finally {
      setActionState((s) => ({ ...s, [id]: null }));
    }
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="Crew applications"
        summary="Review and approve or reject crew membership applications from clients."
      >
        {loading ? (
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Loading applications...
          </p>
        ) : fetchError ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-4 text-sm font-black">
            {fetchError}
          </p>
        ) : applicants.length === 0 ? (
          <div className="border-4 border-black bg-[#fff8ea] p-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              All clear
            </p>
            <p className="mt-2 text-sm">No pending crew applications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              {applicants.length} pending application
              {applicants.length !== 1 ? "s" : ""}
            </p>

            {applicants.map((applicant) => {
              const id = applicant._id;
              const busy = actionState[id];

              return (
                <article
                  key={id}
                  className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 min-w-0">
                      <p className="text-lg font-black uppercase">
                        {getName(applicant)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {applicant.user?.email}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="border-2 border-black bg-[#fff8ea] px-2 py-1 font-black uppercase">
                          Current role: {applicant.user?.role ?? "client"}
                        </span>
                        <span className="border-2 border-black bg-[#ffefc7] px-2 py-1 font-black uppercase">
                          Requested: crew
                        </span>
                        <span className="border-2 border-black bg-[#d8f0dd] px-2 py-1 font-black uppercase">
                          Status: {applicant.status ?? "pending"}
                        </span>
                      </div>

                      {(applicant.position || applicant.department) && (
                        <p className="text-sm">
                          <span className="font-black">Role:</span>{" "}
                          {[applicant.position, applicant.department]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      )}

                      {(applicant.yearsOfExperience ?? 0) > 0 && (
                        <p className="text-sm">
                          <span className="font-black">Experience:</span>{" "}
                          {applicant.yearsOfExperience} year
                          {applicant.yearsOfExperience !== 1 ? "s" : ""}
                        </p>
                      )}

                      {(applicant.hourlyRate ?? 0) > 0 && (
                        <p className="text-sm">
                          <span className="font-black">Hourly rate:</span> ₦
                          {applicant.hourlyRate?.toLocaleString()}
                        </p>
                      )}

                      {applicant.specialties &&
                        applicant.specialties.length > 0 && (
                          <p className="text-sm">
                            <span className="font-black">Specialties:</span>{" "}
                            {applicant.specialties.join(", ")}
                          </p>
                        )}

                      {applicant.equipmentOwned &&
                        applicant.equipmentOwned.length > 0 && (
                          <p className="text-sm">
                            <span className="font-black">Equipment:</span>{" "}
                            {applicant.equipmentOwned.join(", ")}
                          </p>
                        )}

                      {applicant.portfolioUrl && (
                        <p className="text-sm">
                          <span className="font-black">Portfolio:</span>{" "}
                          <a
                            href={applicant.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {applicant.portfolioUrl}
                          </a>
                        </p>
                      )}

                      {applicant.showreelUrl && (
                        <p className="text-sm">
                          <span className="font-black">Showreel:</span>{" "}
                          <a
                            href={applicant.showreelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {applicant.showreelUrl}
                          </a>
                        </p>
                      )}

                      {applicant.bio && (
                        <p className="mt-1 max-w-xl whitespace-pre-line text-sm text-slate-700">
                          {applicant.bio}
                        </p>
                      )}

                      {applicant.createdAt && (
                        <p className="text-xs text-slate-400">
                          Applied{" "}
                          {new Date(applicant.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <button
                        type="button"
                        onClick={() => handleAction(applicant, "approve")}
                        disabled={!!busy}
                        className="border-4 border-black bg-black px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
                      >
                        {busy === "approving" ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(applicant, "reject")}
                        disabled={!!busy}
                        className="border-4 border-black bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-60"
                      >
                        {busy === "rejecting" ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>

                  {actionError[id] ? (
                    <p className="mt-3 border-2 border-black bg-[#ffcfbf] p-2 text-xs font-black">
                      {actionError[id]}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
