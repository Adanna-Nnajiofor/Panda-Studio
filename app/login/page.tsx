"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { useAuthContext } from '../../components/AuthProvider';
import { roleHomePath } from '../../lib/roles';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0 && !pending, [email, password, pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const user = await login({ email, password });
      router.replace(roleHomePath(user.role as string | null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-10 text-black">
      <div className="mx-auto max-w-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-[0.3em]">Login</p>
        <h1 className="mt-3 text-4xl font-black uppercase">Enter the studio</h1>
        <p className="mt-2 text-sm">
          Sign in to manage bookings, assignments, availability, and all production workflows.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Email</span>
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
            <span className="text-xs font-black uppercase tracking-[0.2em]">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 pr-12 outline-none"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error ? <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] disabled:opacity-60"
          >
            {pending ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <Link href="/" className="font-black uppercase tracking-[0.18em] underline">
            Back home
          </Link>
          <Link href="/register" className="font-black uppercase tracking-[0.18em] underline">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}