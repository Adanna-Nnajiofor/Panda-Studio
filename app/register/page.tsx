"use client";

import Link from "next/link";
import { Suspense, FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "../../components/AuthProvider";
import { ROLES, roleHomePath } from "../../lib/roles";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("client");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        role,
      });

      router.replace(nextPath || roleHomePath(user.role as string | null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl border-4 border-black bg-[#fffef8] p-6 shadow-[10px_10px_0_0_#000]">
      <p className="text-xs font-black uppercase tracking-[0.3em]">Register</p>

      <h1 className="mt-3 text-4xl font-black uppercase">Create your role</h1>

      <p className="mt-2 text-sm">
        Start with a profile and join the studio as a client, crew member, staff
        member, or admin-linked account.
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
            Role
          </span>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 outline-none"
          >
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
