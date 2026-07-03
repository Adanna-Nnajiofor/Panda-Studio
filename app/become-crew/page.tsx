"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type ApplicationStatus = "pending" | "approved" | "rejected" | null;

type MyApplicationResponse = {
  success: boolean;
  application: { status: ApplicationStatus } | null;
};

export default function BecomeCrewPage() {
  const [existingStatus, setExistingStatus] = useState<ApplicationStatus>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [showreelUrl, setShowreelUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [equipmentOwned, setEquipmentOwned] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<MyApplicationResponse>("/crew-applications/my")
      .then((res) => setExistingStatus(res.application?.status ?? null))
      .catch(() => setExistingStatus(null))
      .finally(() => setCheckingStatus(false));
  }, []);

  const canSubmit =
    !existingStatus &&
    bio.trim().length >= 20 &&
    position.trim().length > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiJson("/crew-applications", {
        method: "POST",
        body: JSON.stringify({
          bio: bio.trim(),
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          yearsOfExperience: Number(yearsOfExperience) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          showreelUrl: showreelUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
          equipmentOwned: equipmentOwned
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          position: position.trim(),
          department: department.trim(),
          phone: phone.trim(),
        }),
        headers: { "Content-Type": "application/json" },
      });
      setExistingStatus("pending");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit application."));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <RoleGate allowedRoles={["client"]}>
        <DashboardShell kicker="Join the team" title="Become a crew member">
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Checking application status...
          </p>
        </DashboardShell>
      </RoleGate>
    );
  }

  return (
    <RoleGate allowedRoles={["client"]}>
      <DashboardShell
        kicker="Join the team"
        title="Become a crew member"
        summary="Apply to work with Panda Studio as a creative professional. We review every application manually."
      >
        {existingStatus === "pending" && (
          <div className="border-4 border-black bg-[#d8f0dd] p-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              Application submitted
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase">
              Crew Application — Pending Approval
            </h2>
            <p className="mt-3 max-w-xl text-sm">
              Your application is under review. The Panda Studio team will
              assess your profile and notify you of their decision. Your account
              remains active as a client in the meantime.
            </p>
          </div>
        )}

        {existingStatus === "rejected" && (
          <div className="border-4 border-black bg-[#ffcfbf] p-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              Application not approved
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase">
              Crew Application — Not Approved
            </h2>
            <p className="mt-3 max-w-xl text-sm">
              Your previous application was not approved. Please contact Panda
              Studio for more information.
            </p>
          </div>
        )}

        {!existingStatus && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Creative role *
                  </span>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                    placeholder="Photographer, editor, director..."
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Department / specialty
                  </span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                    placeholder="Video, photography, sound..."
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Years of experience
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                    placeholder="e.g. 5"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Hourly rate (₦)
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                    placeholder="e.g. 15000"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Specialties (comma-separated)
                </span>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="Color grading, drone operation, sound mixing..."
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Equipment owned (comma-separated)
                </span>
                <input
                  type="text"
                  value={equipmentOwned}
                  onChange={(e) => setEquipmentOwned(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="Sony A7 III, DJI Mavic 3, Rode NTG4..."
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Portfolio URL
                </span>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="https://yourportfolio.com"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Showreel URL
                </span>
                <input
                  type="url"
                  value={showreelUrl}
                  onChange={(e) => setShowreelUrl(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Phone
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="Optional contact number"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  About you *
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  rows={6}
                  placeholder="Tell us about your background, experience, and what makes you a great fit for Panda Studio. (min 20 characters)"
                  required
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {bio.trim().length} / 20 min characters
                </span>
              </label>

              {error ? (
                <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            </form>

            <aside className="space-y-5">
              <div className="border-4 border-black bg-[#fff8ea] p-5 shadow-[8px_8px_0_0_#000]">
                <h2 className="text-xl font-black uppercase">What we look for</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>✅ Proven creative experience</li>
                  <li>✅ Portfolio or showreel</li>
                  <li>✅ Professional equipment</li>
                  <li>✅ Clear specialty or role</li>
                  <li>✅ Availability for bookings</li>
                </ul>
              </div>

              <div className="border-4 border-black bg-[#fff8ea] p-5 shadow-[8px_8px_0_0_#000]">
                <h2 className="text-xl font-black uppercase">After approval</h2>
                <p className="mt-3 text-sm">
                  Your account is upgraded to crew. You gain access to the crew
                  workbench, project assignments, availability management, and
                  your public portfolio.
                </p>
              </div>

              <div className="border-4 border-black bg-[#fff8ea] p-5 shadow-[8px_8px_0_0_#000]">
                <h2 className="text-xl font-black uppercase">Crew roles</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  <li>📷 Photographer</li>
                  <li>🎬 Videographer</li>
                  <li>✂️ Editor</li>
                  <li>🎬 Director</li>
                  <li>🚁 Drone operator</li>
                  <li>🎙️ Sound engineer</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
