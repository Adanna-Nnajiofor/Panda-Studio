"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { apiJson } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiJson("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: { "Content-Type": "application/json" },
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-16 text-black">
      <div className="mx-auto max-w-lg border-4 border-black bg-[#fffef8] p-8 shadow-[10px_10px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-[0.3em]">Panda Studio</p>
        <h1 className="mt-3 text-3xl font-black uppercase">Forgot Password</h1>
        <p className="mt-2 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="mt-6 border-4 border-black bg-[#d8f0dd] p-5">
            <p className="font-black uppercase tracking-[0.15em]">Check your inbox</p>
            <p className="mt-2 text-sm">
              If that email is registered, a reset link has been sent. Check your spam folder too.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-black uppercase tracking-[0.18em] underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em]">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
                autoComplete="email"
                required
              />
            </label>

            {error && (
              <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending || !email.trim()}
              className="w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/login" className="font-black uppercase tracking-[0.18em] underline">
                Back to login
              </Link>
              <Link href="/register" className="font-black uppercase tracking-[0.18em] underline">
                Create account
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
