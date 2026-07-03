"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiJson } from "../../lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 6 && password === confirm && !pending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setPending(true);
    setError("");
    try {
      await apiJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. The link may have expired.");
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-lg border-4 border-black bg-[#ffcfbf] p-8 shadow-[10px_10px_0_0_#000]">
        <h1 className="text-2xl font-black uppercase">Invalid Link</h1>
        <p className="mt-3 text-sm">This reset link is missing a token. Please request a new one.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-black uppercase tracking-[0.18em] underline">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg border-4 border-black bg-[#fffef8] p-8 shadow-[10px_10px_0_0_#000]">
      <p className="text-xs font-black uppercase tracking-[0.3em]">Panda Studio</p>
      <h1 className="mt-3 text-3xl font-black uppercase">Reset Password</h1>
      <p className="mt-2 text-sm">Enter your new password below.</p>

      {success ? (
        <div className="mt-6 border-4 border-black bg-[#d8f0dd] p-5">
          <p className="font-black uppercase tracking-[0.15em]">Password reset ✅</p>
          <p className="mt-2 text-sm">Redirecting you to login…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em]">New password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 pr-12 outline-none"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <span className="mt-1 block text-xs text-slate-500">Minimum 6 characters</span>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Confirm password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
              required
            />
            {confirm && password !== confirm && (
              <span className="mt-1 block text-xs font-black text-red-600">Passwords do not match</span>
            )}
          </label>

          {error && <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">{error}</p>}

          <button type="submit" disabled={!canSubmit}
            className="w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60">
            {pending ? "Resetting…" : "Reset password"}
          </button>

          <Link href="/login" className="block text-center text-sm font-black uppercase tracking-[0.18em] underline">
            Back to login
          </Link>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-16 text-black">
      <Suspense fallback={<p className="text-center text-sm">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
