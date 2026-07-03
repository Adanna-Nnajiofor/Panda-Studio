"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { useAuthContext } from "../../components/AuthProvider";

type CrewProfile = {
  user: {
    _id: string;
    fullName: string;
    position?: string;
    department?: string;
    availability?: string;
    avatar?: string;
    bio?: string;
  };
  specialties?: string[];
  hourlyRate?: number;
  showreelUrl?: string;
};

const AVAIL_COLOR: Record<string, string> = {
  available: "bg-green-100",
  busy: "bg-yellow-100",
  on_project: "bg-blue-100",
  offline: "bg-gray-100",
};

export default function HireClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  const crewId = searchParams.get("crewId") ?? "";
  const currentPath = useMemo(
    () => (crewId ? `/hire?crewId=${encodeURIComponent(crewId)}` : "/hire"),
    [crewId],
  );

  const [crew, setCrew] = useState<CrewProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Hi, I loved your profile and would like to discuss a production hire for my next project.",
  );
  const [proposedRate, setProposedRate] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!crewId) {
      setLoading(false);
      setError("No crew selected. Please pick a crew member from Discover.");
      return;
    }

    apiJson<{ portfolio: CrewProfile }>(`/portfolios/user/${crewId}`)
      .then((data) => {
        setCrew(data.portfolio ?? null);
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "Unable to load crew profile.")),
      )
      .finally(() => setLoading(false));
  }, [crewId]);

  const hireButtonDisabled = !message.trim() || pending || !crewId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      await apiJson<{ message: string }>("/hire", {
        method: "POST",
        body: JSON.stringify({
          crewId,
          message,
          proposedRate: proposedRate ? Number(proposedRate) : undefined,
        }),
      });

      setSuccess(
        "Your hire request was sent. You can track it in your hire inbox.",
      );
      setMessage(
        "Hi, I loved your profile and would like to discuss a production hire for my next project.",
      );
      setProposedRate("");
      void router.push("/hire/mine");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to submit request."));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f2eadf] px-4 py-10 text-black">
      <DashboardShell
        kicker="Hire crew"
        title="Book your creative partner"
        summary="Send a hire request to a crew member and keep your project conversations in one place."
      >
        {loading ? <p>Loading crew details…</p> : null}
        {error ? (
          <div className="rounded border-4 border-black bg-[#ffcfbf] p-5 text-sm font-black uppercase text-black">
            {error}
          </div>
        ) : null}

        {!loading && crew ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="space-y-6 rounded border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border-4 border-black bg-[#f2eadf]">
                  {crew.user.avatar ? (
                    <img
                      src={crew.user.avatar}
                      alt={crew.user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase">
                    {crew.user.fullName}
                  </h2>
                  <p className="text-sm text-gray-700">
                    {crew.user.position ??
                      crew.user.department ??
                      "Creative crew"}
                  </p>
                  {crew.user.availability ? (
                    <span
                      className={`mt-2 inline-block rounded-full border px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] ${
                        AVAIL_COLOR[crew.user.availability] ?? "bg-gray-100"
                      }`}
                    >
                      {crew.user.availability.replace("_", " ")}
                    </span>
                  ) : null}
                </div>
              </div>

              {crew.user.bio ? (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.25em] text-black">
                    Profile
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {crew.user.bio}
                  </p>
                </div>
              ) : null}

              {crew.specialties?.length ? (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.25em] text-black">
                    Specialties
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {crew.specialties.map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-black px-3 py-1 text-[0.65rem] font-black uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {crew.hourlyRate ? (
                <p className="rounded border border-black bg-[#fff8ea] px-4 py-3 text-sm font-black">
                  Suggested rate: ₦{crew.hourlyRate.toLocaleString()} / hr
                </p>
              ) : null}

              {crew.showreelUrl ? (
                <a
                  href={crew.showreelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#f2eadf]"
                >
                  View showreel
                </a>
              ) : null}
            </section>

            <section className="rounded border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
              {!isAuthenticated ? (
                <div className="space-y-5">
                  <p className="text-sm font-black uppercase tracking-[0.2em]">
                    Sign in to send this hire request
                  </p>
                  <p className="text-sm text-gray-700">
                    Your message will be preserved when you log in or register.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/login?next=${encodeURIComponent(currentPath)}`}
                      className="inline-block rounded border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#f2eadf]"
                    >
                      Login
                    </Link>
                    <Link
                      href={`/register?next=${encodeURIComponent(currentPath)}`}
                      className="inline-block rounded border-4 border-black bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.15em]"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.18em] text-black">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      className="mt-2 w-full border-4 border-black bg-[#fff8ea] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.18em] text-black">
                      Proposed rate (optional)
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-black">₦</span>
                      <input
                        type="number"
                        min="0"
                        value={proposedRate}
                        onChange={(event) =>
                          setProposedRate(event.target.value)
                        }
                        className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 text-sm outline-none"
                        placeholder="e.g. 15000"
                      />
                    </div>
                  </div>

                  {success ? (
                    <p className="rounded border border-black bg-[#d1f7dc] p-4 text-sm font-black text-black">
                      {success}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="rounded border border-black bg-[#ffcfbf] p-4 text-sm font-black text-black">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={hireButtonDisabled}
                    className="w-full rounded border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#f2eadf] disabled:opacity-60"
                  >
                    {pending ? "Sending request…" : "Send hire request"}
                  </button>
                </form>
              )}
            </section>
          </div>
        ) : null}
      </DashboardShell>
    </main>
  );
}
