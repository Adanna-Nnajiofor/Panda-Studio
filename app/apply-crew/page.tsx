"use client";

import { useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

export default function ApplyCrewPage() {
  const [bio, setBio] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = bio.trim().length >= 20 && position.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiJson<{ success: true }>("/users/apply-crew", {
        method: "PATCH",
        body: JSON.stringify({
          phone: phone.trim(),
          position: position.trim(),
          department: department.trim(),
          bio: bio.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      setSuccess(
        "Your crew application has been submitted. Panda Studio will review it and approve you when ready.",
      );
      setBio("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit application."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client"]}>
      <DashboardShell
        kicker="Become crew"
        title="Apply to join Panda Studio as crew"
        summary="Submit your creative profile and portfolio summary for review."
      >
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <p className="rounded border-4 border-black bg-[#fff8ea] p-5 text-sm">
              Panda Studio crew are vetted professionals. Apply with your
              experience, specialties, and contact details, and our team will
              review your application.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Creative role
                </span>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  placeholder="Photographer, editor, sound engineer..."
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
                  placeholder="Video, photography, sound, lighting..."
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
                  placeholder="Optional phone number"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Application notes
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                  rows={6}
                  placeholder="Tell us about your experience, specialties, equipment, and availability."
                  required
                />
              </label>

              {error ? (
                <p className="rounded border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded border-4 border-black bg-[#d8f0dd] p-3 text-sm font-black">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            </form>
          </div>

          <aside className="space-y-4 rounded border-4 border-black bg-[#fff8ea] p-5 shadow-[8px_8px_0_0_#000]">
            <div>
              <h2 className="text-xl font-black uppercase">What we need</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>✅ Your creative role and specialty</li>
                <li>✅ A summary of experience and equipment</li>
                <li>✅ Contact details and preferred work types</li>
                <li>✅ Approval by Panda Studio staff</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">After you apply</h2>
              <p className="mt-3 text-sm">
                We review applications manually. Once approved, your account
                becomes a crew profile and you can receive booking requests.
              </p>
            </div>
          </aside>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
