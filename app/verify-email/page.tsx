"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiJson } from "../../lib/api";

type Status = "verifying" | "success" | "error" | "idle";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    apiJson("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
    })
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-lg border-4 border-black bg-[#fffef8] p-8 shadow-[10px_10px_0_0_#000]">
      <p className="text-xs font-black uppercase tracking-[0.3em]">Panda Studio</p>

      {status === "verifying" && (
        <>
          <h1 className="mt-3 text-3xl font-black uppercase">Verifying…</h1>
          <p className="mt-3 text-sm">Please wait while we verify your email address.</p>
          <div className="mt-6 h-2 w-full overflow-hidden border-2 border-black bg-[#fff8ea]">
            <div className="h-full w-1/2 animate-pulse bg-black" />
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="mt-3 text-3xl font-black uppercase">Email Verified ✅</h1>
          <p className="mt-3 text-sm">
            Your email has been verified successfully. You can now log in and access all features.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf]"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="mt-3 text-3xl font-black uppercase">Link Expired</h1>
          <p className="mt-3 text-sm">
            {message || "This verification link is invalid or has expired."}
          </p>
          <ResendForm />
        </>
      )}

      {status === "idle" && (
        <>
          <h1 className="mt-3 text-3xl font-black uppercase">Verify Your Email</h1>
          <p className="mt-3 text-sm">
            Check your inbox for a verification link. If you didn't receive it, request a new one below.
          </p>
          <ResendForm />
        </>
      )}
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await apiJson("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <p className="mt-6 border-4 border-black bg-[#d8f0dd] p-4 text-sm font-black">
        If that email exists and is unverified, a new link has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="mt-6 space-y-3">
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.2em]">Your email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
          required
        />
      </label>
      {error && <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">{error}</p>}
      <button
        type="submit"
        disabled={sending || !email.trim()}
        className="border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
      >
        {sending ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-16 text-black">
      <Suspense fallback={<p className="text-center text-sm">Loading…</p>}>
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}
