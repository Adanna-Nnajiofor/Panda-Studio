"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ROLE_LABELS, ROLE_HOME_PATH, type Role } from "../lib/roles";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroDemoModal from "@/components/HeroDemoModal";
import Image from "next/image";
// Image import removed (not used yet)

const featureRows = [
  {
    title: "Production OS",
    text: "Run full film operations in one system.",
    bullets: [
      "Bookings & calendar",
      "Crew assignments",
      "Shot lists & delivery",
    ],
  },
  {
    title: "Crew Intelligence",
    text: "Hire, assign, and track creatives instantly.",
    bullets: ["Crew profiles", "Availability matching", "Ratings & payments"],
  },
  {
    title: "Smart Rentals",
    text: "Real-time equipment availability & booking.",
    bullets: ["Inventory control", "Damage logs", "Flexible rates"],
  },
  {
    title: "Project Pipeline",
    text: "From idea → shoot → delivery.",
    bullets: ["Project timelines", "Deliverables", "Approvals & revisions"],
  },
  {
    title: "Finance Control",
    text: "Invoices, payments, payroll tracking.",
    bullets: ["Client invoices", "Payment reconciliation", "Refunds & reports"],
  },
  {
    title: "Media Vault",
    text: "Secure delivery & client approvals.",
    bullets: ["Secure links", "Versioning", "Client approvals"],
  },
];

const stats = [
  { label: "Active Productions", value: "120+" },
  { label: "Crew Members", value: "850+" },
  { label: "Equipment Units", value: "2,400+" },
  { label: "Completed Projects", value: "1,100+" },
];

const recentActivity = [
  "New crew hired for Music Video Shoot",
  "Camera package booked for 3 days",
  "Client approved final documentary cut",
  "Payment released to cinematography team",
];

const roleCards: { role: Role; blurb: string; outcome: string }[] = [
  {
    role: "client",
    blurb: "Book, track, and approve productions.",
    outcome: "Book & Pay",
  },
  {
    role: "admin",
    blurb: "Control all studio operations.",
    outcome: "Manage Studio",
  },
  {
    role: "crew",
    blurb: "Get hired and manage your work.",
    outcome: "Find Work",
  },
  {
    role: "staff",
    blurb: "Handle logistics & studio workflow.",
    outcome: "Run Ops",
  },
];

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false);
  return (
    <>
      <Header />

      <main className="min-h-screen bg-linear-to-b from-[#f6efe3] via-[#efe0c2] to-[#e6d2aa] text-black">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 py-24">
          {/* glowing background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),transparent_60%)]" />

          <div className="relative mx-auto max-w-6xl grid gap-10 md:grid-cols-2 items-center">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70">
                Built For Creators & Studios
              </p>

              <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
                Panda Studio — Run production end-to-end
              </h1>

              <p className="mt-5 text-lg opacity-80">
                One platform to book crews, manage equipment, handle invoices,
                and deliver final media, so teams move faster and clients stay
                happy.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase text-white text-center"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto border-4 border-black bg-white px-6 py-3 text-sm font-black uppercase text-center"
                >
                  Login
                </Link>
                <button
                  onClick={() => setShowDemo(true)}
                  className="w-full sm:w-auto border-2 border-black px-4 py-2 text-sm font-black uppercase"
                >
                  Watch demo
                </button>
              </div>

              {/* stats */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="border-4 border-black bg-white/70 backdrop-blur p-4 shadow-[6px_6px_0_0_#000]"
                  >
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs uppercase font-bold tracking-wide">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — Hero media (poster + play) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative border-4 border-black bg-white/80 backdrop-blur-xl p-0 shadow-[12px_12px_0_0_#000] overflow-hidden"
            >
              <div className="relative h-80 w-full">
                <Image
                  src="/demo-image.png"
                  alt="Panda Studio demo hero"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />

                <button
                  onClick={() => setShowDemo(true)}
                  aria-label="Watch demo"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/80 text-white flex items-center justify-center text-lg font-bold"
                >
                  ▶
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">
                  Live Studio Activity
                </h3>

                <div className="mt-4 space-y-3">
                  {recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="border-2 border-black bg-[#f7f0e2] p-3 text-sm font-medium"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-4 border-black bg-black text-white p-4">
                  <p className="text-xs uppercase tracking-[0.3em]">
                    System Status
                  </p>
                  <p className="text-lg font-black mt-1">
                    All Systems Operational
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 sm:px-6 py-12 mx-auto max-w-6xl">
          <h2 className="text-xs font-black uppercase tracking-[0.4em]">
            How it works
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create Project",
                text: "Add services, dates and deliverables.",
              },
              {
                step: "2",
                title: "Book Crew & Kit",
                text: "Real-time availability and scheduling.",
              },
              {
                step: "3",
                title: "Deliver & Invoice",
                text: "Secure delivery, approvals, and payments.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center font-black">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-black uppercase">{s.title}</h3>
                    <p className="mt-1 text-sm opacity-80">{s.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STUDIO VISUALS */}
        <section className="px-6 py-12 mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em]">
                Studio Visuals
              </p>
              <h2 className="mt-4 text-3xl md:text-4xl font-black leading-tight">
                Creative studio moments that make Panda Studio feel alive.
              </h2>
              <p className="mt-4 max-w-2xl text-sm opacity-80">
                Visual storytelling for the creative teams, sets, and workflows
                that power every production.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="group overflow-hidden rounded border-4 border-black bg-[#f8f1e6] shadow-[8px_8px_0_0_#000]">
                  <div className="relative h-72 sm:h-80">
                    <Image
                      src="/demo-image.png"
                      alt="Creative studio production image"
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-black uppercase tracking-[0.2em] text-xs">
                      Production still
                    </p>
                    <p className="mt-3 text-sm opacity-80">
                      A polished studio scene that reflects the Panda Studio
                      workflow.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded border-4 border-black bg-black shadow-[8px_8px_0_0_#000]">
                  <video
                    className="h-72 w-full object-cover"
                    src="/demo-video.mp4"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                  <div className="p-4 bg-white">
                    <p className="font-black uppercase tracking-[0.2em] text-xs">
                      Studio reel
                    </p>
                    <p className="mt-3 text-sm opacity-80">
                      A short creative clip showing how projects move from
                      planning to delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  quote:
                    "Panda replaced three tools — we saved weeks of coordination.",
                  who: "— Luna Films",
                },
                {
                  quote: "Bookings and payments finally live in one place.",
                  who: "— Bright Studio",
                },
                {
                  quote: "Fast setup and our team adopted it in days.",
                  who: "— Director A.",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="rounded border-4 border-black bg-[#f7f0e2] p-6 shadow-[8px_8px_0_0_#000]"
                >
                  <p className="text-sm italic">“{t.quote}”</p>
                  <p className="mt-3 text-xs font-black">{t.who}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-4 sm:px-6 py-16 mx-auto max-w-6xl">
          <h2 className="text-xs font-black uppercase tracking-[0.4em]">
            Studio Modules
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {featureRows.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
              >
                <h3 className="text-lg font-black uppercase">{f.title}</h3>
                <p className="mt-2 text-sm opacity-80">{f.text}</p>
                <ul className="mt-3 text-sm list-inside list-disc space-y-1 opacity-80">
                  {f.bullets?.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ROLE GATE */}
        <section className="bg-[#1f1b18] text-[#f2eadf] px-4 sm:px-6 py-20 border-t-4 border-black">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em]">
              Enter System
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              {roleCards.map((r) => (
                <Link
                  key={r.role}
                  href={ROLE_HOME_PATH[r.role]}
                  className="border-4 border-[#f2eadf] p-5 hover:bg-[#f2eadf] hover:text-black transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black uppercase tracking-[0.2em]">
                      {ROLE_LABELS[r.role]}
                    </p>
                    <p className="text-xs font-bold">{r.outcome}</p>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{r.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 py-20">
          <div className="mx-auto max-w-6xl border-4 border-black bg-white p-6 sm:p-10 shadow-[12px_12px_0_0_#000]">
            <h2 className="text-4xl font-black uppercase md:text-5xl">
              Build. Shoot. Deliver. Repeat.
            </h2>

            <p className="mt-4 opacity-80 max-w-2xl">
              Panda Studio is a full production operating system built for
              modern creators, studios, and production teams.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto border-4 border-black bg-black px-6 py-3 text-white font-black uppercase text-center"
              >
                Start Now
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border-4 border-black px-6 py-3 font-black uppercase text-center"
              >
                Access Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <HeroDemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </>
  );
}
