"use client";

import Link from "next/link";
import { Suspense, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "../../components/AuthProvider";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { roleHomePath } from "../../lib/roles";

type ReferralLookupResponse = {
  valid: boolean;
  referrerName?: string;
  rewardAmount?: number;
  currency?: string;
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralHint, setReferralHint] = useState<string | null>(null);

  const referralFromQuery = useMemo(
    () => (searchParams.get("ref") ?? "").trim().toUpperCase(),
    [searchParams],
  );

  useEffect(() => {
    if (!referralFromQuery) return;
    setReferralCode(referralFromQuery);

    let cancelled = false;
    apiJson<ReferralLookupResponse>(`/referrals/lookup/${referralFromQuery}`)
      .then((result) => {
        if (cancelled) return;
        if (!result.valid) {
          setReferralHint("Referral code is invalid or expired.");
          return;
        }

        const amount = Number(result.rewardAmount ?? 0).toLocaleString();
        const currency = result.currency ?? "NGN";
        setReferralHint(
          `Invited by ${result.referrerName ?? "a Panda Studio user"}. Reward: ${currency} ${amount}.`,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setReferralHint("Referral code is invalid or expired.");
      });

    return () => {
      cancelled = true;
    };
  }, [referralFromQuery]);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");

    return next && next.startsWith("/") ? next : "";
  }, [searchParams]);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      !pending,
    [name, email, password, pending],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setError(null);

    try {
      const user = await register({
        name,
        email,
        password,
      });

      if (referralCode) {
        try {
          await apiJson("/referrals/apply", {
            method: "POST",
            body: JSON.stringify({ code: referralCode }),
          });
        } catch {
          // Registration should still succeed even if referral apply fails.
        }
      }

      router.replace(nextPath || roleHomePath(user.role as string | null));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to register."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl border-4 border-black bg-[#fffef8] p-6 shadow-[10px_10px_0_0_#000]">
      <p className="text-xs font-black uppercase tracking-[0.3em]">Register</p>

      <h1 className="mt-3 text-4xl font-black uppercase">
        Create your account
      </h1>

      <p className="mt-2 text-sm">
        Sign up as a client to start booking Panda Studio services. Crew and
        staff roles are granted by the Panda Studio team after review.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            Name
          </span>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
            autoComplete="name"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            Email
          </span>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            Password
          </span>

          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 pr-12 outline-none"
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        {error ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">
            {error}
          </p>
        ) : null}

        {referralHint ? (
          <p className="border-4 border-black bg-[#fff8ea] p-3 text-sm font-black">
            {referralHint}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm">
        <Link
          href="/"
          className="font-black uppercase tracking-[0.18em] underline"
        >
          Back home
        </Link>

        <Link
          href={
            nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
          }
          className="font-black uppercase tracking-[0.18em] underline"
        >
          Login instead
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-10 text-black">
      <Suspense fallback={<p>Loading...</p>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
