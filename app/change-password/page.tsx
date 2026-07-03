"use client";

import { useState, FormEvent } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirm &&
    !pending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("New passwords do not match."); return; }
    setPending(true);
    setError("");
    setSuccess(false);
    try {
      await apiJson("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { "Content-Type": "application/json" },
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Account security"
        title="Change password"
        summary="Update your password to keep your account secure."
      >
        <div className="mx-auto max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em]">Current password</span>
              <div className="relative mt-2">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 pr-12 outline-none"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showCurrent ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em]">New password</span>
              <div className="relative mt-2">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 pr-12 outline-none"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showNew ? "🙈" : "👁️"}
                </button>
              </div>
              <span className="mt-1 block text-xs text-slate-500">Minimum 6 characters</span>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em]">Confirm new password</span>
              <input
                type={showNew ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                required
              />
              {confirm && newPassword !== confirm && (
                <span className="mt-1 block text-xs font-black text-red-600">Passwords do not match</span>
              )}
            </label>

            {error && <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">{error}</p>}
            {success && <p className="border-4 border-black bg-[#d8f0dd] p-3 text-sm font-black">Password changed successfully ✅</p>}

            <button type="submit" disabled={!canSubmit}
              className="w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60">
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
