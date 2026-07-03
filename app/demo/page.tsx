"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import Footer from "@/components/Footer";
import HeroDemoModal from "@/components/HeroDemoModal";

type DemoMode = "client" | "crew" | "staff" | "admin";

const modeCopy: Record<
  DemoMode,
  { title: string; subtitle: string; primary: string; secondary: string }
> = {
  client: {
    title: "Book crews & kit",
    subtitle:
      "Pick equipment or studio packages, then reserve with a single sign-in flow.",
    primary: "Try booking demo",
    secondary: "Go to login",
  },
  crew: {
    title: "Get hired faster",
    subtitle:
      "View your assignments and keep delivery status up to date during shoots.",
    primary: "View crew workflow",
    secondary: "Go to login",
  },
  staff: {
    title: "Run studio operations",
    subtitle:
      "Coordinate schedules, equipment availability, and approvals from one dashboard.",
    primary: "Open ops dashboard",
    secondary: "Go to login",
  },
  admin: {
    title: "Manage everything",
    subtitle:
      "Monitor projects, handle roles, and keep the system healthy end-to-end.",
    primary: "Open admin area",
    secondary: "Go to login",
  },
};

export default function DemoPage() {
  const [openDemo, setOpenDemo] = useState(false);
  const [mode, setMode] = useState<DemoMode>("client");

  const copy = modeCopy[mode];

  const nextTarget = useMemo(() => {
    // Keep it simple: this is a demo page, not a full reservation engine.
    // We route users to existing pages that demonstrate the system.
    if (mode === "client") return "/bookings/new";
    if (mode === "crew") return "/dashboard";
    if (mode === "staff") return "/dashboard";
    return "/admin";
  }, [mode]);

  return (
    <>
      <main className="min-h-screen px-4 sm:px-6 py-10 sm:py-14 max-w-6xl mx-auto">
        {/* Top hero */}
        <section className="relative overflow-hidden rounded-4xl border-4 border-black bg-white p-4 sm:p-6 lg:p-10 shadow-[12px_12px_0_0_#000]">
          <div className="absolute -right-10 sm:-right-20 top-0 h-60 sm:h-72 w-60 sm:w-72 rounded-full bg-[#f4d98f]/30 blur-3xl" />
          <div className="absolute -left-6 sm:-left-10 top-28 sm:top-40 h-52 sm:h-64 w-52 sm:w-64 rounded-full bg-black/5 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row gap-8 lg:items-stretch">
            <div className="flex-1 space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-[#7d673d]">
                Demo
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-tight">
                Panda Studio — role-aware experience
              </h1>
              <p className="text-sm sm:text-base opacity-80 max-w-2xl">
                Choose a role to preview how Panda Studio flows through booking,
                operations, and approvals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setOpenDemo(true)}
                  className="rounded-full border-2 border-black bg-black px-6 py-3 text-sm font-black uppercase text-white shadow-[6px_6px_0_0_#000]"
                >
                  {"Watch quick demo"}
                </button>
                <Link
                  href={nextTarget}
                  className="rounded-full border-2 border-black bg-[#f2eadf] px-6 py-3 text-sm font-black uppercase text-black shadow-[6px_6px_0_0_#000] hover:bg-white transition"
                >
                  {copy.primary}
                </Link>
              </div>

              <div className="rounded-3xl border-4 border-black bg-[#f7f0e2] p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                  Selected mode
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-black uppercase">
                  {copy.title}
                </h2>
                <p className="mt-2 text-sm opacity-85">{copy.subtitle}</p>
              </div>
            </div>

            <div className="w-full lg:w-90 lg:shrink-0">
              <div className="relative overflow-hidden rounded-3xl border-4 border-black bg-black shadow-[8px_8px_0_0_#000]">
                <div className="relative h-64">
                  <Image
                    src="/demo-image.png"
                    alt="Panda Studio demo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 360px"
                    priority
                  />
                </div>
                <div className="p-5 bg-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">
                    Quick actions
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Link
                      href={mode === "admin" ? "/admin" : "/login"}
                      className="w-full rounded-full border-2 border-black bg-black text-white px-4 py-3 text-sm font-black uppercase shadow-[6px_6px_0_0_#000] text-center"
                    >
                      {mode === "admin" ? "Go to admin" : copy.secondary}
                    </Link>
                    <Link
                      href="/"
                      className="w-full rounded-full border-2 border-black bg-[#f2eadf] px-4 py-3 text-sm font-black uppercase text-black shadow-[6px_6px_0_0_#000] text-center hover:bg-white transition"
                    >
                      Back to home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mode selector */}
        <section className="mt-8">
          <h2 className="text-xs font-black uppercase tracking-[0.4em]">
            Choose a role
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { mode: "client", label: "Client" },
                { mode: "crew", label: "Crew" },
                { mode: "staff", label: "Staff" },
                { mode: "admin", label: "Admin" },
              ] as { mode: DemoMode; label: string }[]
            ).map(({ mode: m, label }) => {
              const active = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-3xl border-4 px-4 py-4 text-left shadow-[6px_6px_0_0_#000] transition ${
                    active
                      ? "border-black bg-black text-[#f2eadf]"
                      : "border-black bg-white hover:bg-[#f2eadf]"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">
                    Mode
                  </p>
                  <p className="mt-2 text-lg font-black uppercase">{label}</p>
                  <p className="mt-2 text-sm opacity-85">
                    {m === "client"
                      ? "Book & approve"
                      : m === "crew"
                        ? "Manage work"
                        : m === "staff"
                          ? "Coordinate ops"
                          : "Control roles"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mt-10 rounded-4xl border-4 border-black bg-[#1f1b18] text-[#f2eadf] p-6 sm:p-8 shadow-[12px_12px_0_0_#000]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase">
                Want the full experience?
              </h2>
              <p className="mt-2 text-sm opacity-90 max-w-2xl">
                Start with the real pages already in the project. The demo modal
                uses the same visuals as the homepage.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="rounded-full border-2 border-[#f2eadf] bg-[#f2eadf] px-6 py-3 text-sm font-black uppercase text-black hover:bg-white transition"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-full border-2 border-[#f2eadf] bg-transparent px-6 py-3 text-sm font-black uppercase text-[#f2eadf] hover:bg-[#2a2522] transition"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <HeroDemoModal open={openDemo} onClose={() => setOpenDemo(false)} />
    </>
  );
}
