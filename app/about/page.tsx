"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { apiJson } from "@/lib/api";

type CmsPage = {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
};

export default function AboutPage() {
  const [cms, setCms] = useState<CmsPage | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ page: CmsPage }>("/cms/pages/about");
        setCms(data.page ?? null);
      } catch {
        setCms(null);
      }
    };
    void load();
  }, []);

  const heroTitle =
    cms?.heroTitle ?? "Build productions that actually run smoothly";
  const heroSubtitle =
    cms?.heroSubtitle ??
    "Panda Studio is a single, role-aware platform for booking crews, renting equipment, tracking projects, and approving media—so your next shoot does not depend on who has the latest message.";
  const primaryCtaLabel = cms?.ctaPrimaryLabel ?? "Register";
  const primaryCtaHref = cms?.ctaPrimaryHref ?? "/register";
  const secondaryCtaLabel = cms?.ctaSecondaryLabel ?? "Contact us";
  const secondaryCtaHref = cms?.ctaSecondaryHref ?? "/contact";

  return (
    <>
      <main className="min-h-screen px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto">
        <section className="relative overflow-hidden rounded-4xl border-4 border-black bg-white p-4 sm:p-6 lg:p-10 shadow-[12px_12px_0_0_#000]">
          <div className="absolute -right-10 sm:-right-20 top-0 h-60 sm:h-72 w-60 sm:w-72 rounded-full bg-[#f4d98f]/30 blur-3xl" />
          <div className="absolute -left-6 sm:-left-10 top-32 sm:top-40 h-52 sm:h-64 w-52 sm:w-64 rounded-full bg-black/5 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-[#7d673d]">
                About Panda Studio
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-tight">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm sm:text-base opacity-80">
                {heroSubtitle}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-stretch">
              <div className="rounded-3xl border-4 border-black bg-[#f7f0e2] p-6 shadow-[8px_8px_0_0_#000] flex flex-col">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-4xl overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
                    <Image
                      src="/about-me.jpeg"
                      alt="Owner of Panda Studio"
                      fill
                      className="object-cover"
                      sizes="96px"
                      priority
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                      Founder / Owner
                    </p>
                    <p className="text-xl font-black uppercase leading-tight">
                      Panda Studio Story
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm opacity-85">
                  I built Panda Studio after noticing the same problem in every
                  production: information gets scattered—WhatsApp here,
                  spreadsheets there, and files everywhere. So we designed a
                  platform that keeps the entire workflow connected.
                </p>

                <ul className="mt-4 space-y-2 text-sm opacity-85 list-disc list-inside">
                  <li>Clear schedules and responsibilities</li>
                  <li>Fast approvals and delivery tracking</li>
                  <li>Bookings + payments that don’t break mid-shoot</li>
                </ul>

                <div className="mt-auto pt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] shadow-[6px_6px_0_0_#000] transition hover:bg-[#f2eadf] w-full"
                  >
                    Meet Panda Studio
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border-4 border-black bg-black text-white p-6 shadow-[8px_8px_0_0_#000] flex flex-col">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d9c7a0]">
                  What we’re about
                </p>
                <h2 className="mt-3 text-2xl font-black uppercase">
                  Less chaos. More cinema.
                </h2>
                <p className="mt-3 text-sm opacity-85">
                  Panda Studio helps creators and studios run the complete
                  workflow: plan the project, book the right people, rent the
                  kit, approve media, and handle invoices—without losing
                  momentum.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Bookings", value: "1 place" },
                    { label: "Crew", value: "Role-aware" },
                    { label: "Equipment", value: "Instant" },
                    { label: "Approvals", value: "Clear" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-3xl border border-white/20 bg-white/5 p-4"
                    >
                      <p className="text-lg font-black uppercase">{s.value}</p>
                      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-[#d9c7a0] font-bold">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Built for speed",
                  bg: "bg-[#f2eadf]",
                  bullets: [
                    "Quick booking and clear schedules",
                    "Roles, availability, and visibility",
                    "Invoices & payments that stay on track",
                  ],
                },
                {
                  title: "Designed for studios",
                  bg: "bg-[#f7f0e2]",
                  bullets: [
                    "Equipment management and rental flows",
                    "Project pipeline from idea → delivery",
                    "Client approvals and secure media delivery",
                  ],
                },
                {
                  title: "Trusted workflow",
                  bg: "bg-[#f2eadf]",
                  bullets: [
                    "Transparent status updates",
                    "Less back-and-forth",
                    "A single record of what was agreed",
                  ],
                },
              ].map((card) => (
                <section
                  key={card.title}
                  className={`rounded-3xl border-4 border-black ${card.bg} p-6 shadow-[8px_8px_0_0_#000]`}
                >
                  <h2 className="text-xl font-black uppercase">{card.title}</h2>
                  <ul className="mt-4 space-y-2 text-sm opacity-85 list-disc list-inside">
                    {card.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="rounded-4xl border-4 border-black bg-black text-white p-6 sm:p-10 shadow-[12px_12px_0_0_#000]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase">
                    Ready to run your next production?
                  </h2>
                  <p className="mt-3 text-sm opacity-85">
                    Create an account and start booking your crew, renting
                    equipment, and approving media in minutes.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={primaryCtaHref}
                    className="w-full sm:w-auto border-4 border-white bg-white px-6 py-3 text-sm font-black uppercase text-black text-center rounded-full"
                  >
                    {primaryCtaLabel}
                  </Link>
                  <Link
                    href={secondaryCtaHref}
                    className="w-full sm:w-auto border-4 border-white bg-transparent px-6 py-3 text-sm font-black uppercase text-white text-center rounded-full"
                  >
                    {secondaryCtaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
