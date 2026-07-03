"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import Image from "next/image";

const email = "pandastudiong@gmail.com";
const whatsappNumberE164 = "2348036973681"; // without +

const socials = [
  {
    key: "instagram",
    label: "Instagram",
    href: "https://instagram.com/pandastudiong",
    // Inline SVG logo (to avoid adding new image assets)
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M7 2C4.239 2 2 4.239 2 7v10c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V7c0-2.761-2.239-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3.5A5.5 5.5 0 1 0 17.5 12 5.506 5.506 0 0 0 12 7.5zm0 2a3.5 3.5 0 1 1-3.5 3.5A3.504 3.504 0 0 1 12 9.5zM18 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    key: "twitter",
    label: "Twitter / X",
    href: "https://twitter.com/pandastudiong",
    svg: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M18.244 2H21l-5.6 6.397L22 22h-5.2l-4.07-6.63L7.5 22H4.745l6.012-6.874L2 2h5.33l3.68 5.93L18.244 2Zm-1.03 18h1.57L6.99 3.93H5.3L17.214 20Z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://facebook.com/pandastudiong",
    svg: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99H8.08V12h2.36V9.8c0-2.33 1.39-3.62 3.52-3.62 1.02 0 2.08.18 2.08.18v2.3h-1.17c-1.15 0-1.51.71-1.51 1.44V12h2.57l-.41 2.88h-2.16v6.99A10 10 0 0 0 22 12z" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: `https://wa.me/${whatsappNumberE164}?text=${encodeURIComponent(
      "Hello Panda Studio! I want to make an inquiry.",
    )}`,
    svg: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 .01 5.36.01 11.99c0 1.99.52 3.95 1.51 5.69L0 24l6.46-1.67A11.9 11.9 0 0 0 12 24c6.63 0 11.99-5.36 11.99-11.99 0-2.86-1-5.47-2.47-7.53zM12 21.62a9.58 9.58 0 0 1-4.73-1.24l-.34-.2-3.7.95.99-3.57-.22-.36a9.56 9.56 0 0 1-1.38-4.91C2.61 6.71 6.71 2.61 12 2.61c2.3 0 4.46.9 6.08 2.53A8.52 8.52 0 0 1 21.39 12c0 5.29-4.1 9.62-9.39 9.62zm5.08-6.93c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.33.22-.61.08-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.46.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.13-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.03 2.82 1.17 3.01c.14.19 2 3.1 4.85 4.29.68.29 1.21.46 1.62.62.68.26 1.3.22 1.79.13.55-.1 1.67-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z" />
      </svg>
    ),
  },
];

function SocialCard({
  label,
  href,
  svg,
}: {
  label: string;
  href: string;
  svg: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-3xl border-4 border-black bg-white/80 px-5 py-4 shadow-[6px_6px_0_0_#000] transition hover:bg-white"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
        {svg}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#7d673d]">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900 group-hover:underline">
          {href.replace(/^https?:\/\//, "")}
        </p>
      </div>
      <span aria-hidden="true" className="ml-auto text-xl font-black">
        →
      </span>
    </Link>
  );
}

export default function ContactPage() {
  return (
    <>
      <main className="min-h-screen px-4 sm:px-6 py-16 max-w-6xl mx-auto">
        <div className="border-4 border-black bg-white p-6 sm:p-10 shadow-[12px_12px_0_0_#000]">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#7d673d]">
              Contact
            </p>
            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-tight">
              Let’s talk productions
            </h1>
            <p className="mt-4 max-w-2xl text-sm opacity-80">
              Reach Panda Studio via email, WhatsApp, or your favorite social
              platform.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href={`mailto:${email}`}
              className="group flex items-center gap-3 rounded-3xl border-4 border-black bg-[#f7f0e2] px-5 py-4 shadow-[6px_6px_0_0_#000] transition hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#7d673d]">
                  Email
                </p>
                <p className="mt-1 font-semibold group-hover:underline">
                  {email}
                </p>
              </div>
              <span aria-hidden="true" className="ml-auto text-xl font-black">
                →
              </span>
            </Link>

            <Link
              href={`https://wa.me/${whatsappNumberE164}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-3xl border-4 border-black bg-[#f7f0e2] px-5 py-4 shadow-[6px_6px_0_0_#000] transition hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 .01 5.36.01 11.99c0 1.99.52 3.95 1.51 5.69L0 24l6.46-1.67A11.9 11.9 0 0 0 12 24c6.63 0 11.99-5.36 11.99-11.99 0-2.86-1-5.47-2.47-7.53zM12 21.62a9.58 9.58 0 0 1-4.73-1.24l-.34-.2-3.7.95.99-3.57-.22-.36a9.56 9.56 0 0 1-1.38-4.91C2.61 6.71 6.71 2.61 12 2.61c2.3 0 4.46.9 6.08 2.53A8.52 8.52 0 0 1 21.39 12c0 5.29-4.1 9.62-9.39 9.62zm5.08-6.93c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.33.22-.61.08-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.46.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.13-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.03 2.82 1.17 3.01c.14.19 2 3.1 4.85 4.29.68.29 1.21.46 1.62.62.68.26 1.3.22 1.79.13.55-.1 1.67-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#7d673d]">
                  WhatsApp
                </p>
                <p className="mt-1 font-semibold group-hover:underline">
                  +234 803 697 3681
                </p>
              </div>
              <span aria-hidden="true" className="ml-auto text-xl font-black">
                →
              </span>
            </Link>
          </div>

          <div className="mt-10">
            <h2 className="text-xl sm:text-2xl font-black uppercase">
              Socials
            </h2>
            <p className="mt-2 text-sm opacity-80">
              Click an icon to open the real profile.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {socials.map((s) => (
                <SocialCard
                  key={s.key}
                  label={s.label}
                  href={s.href}
                  svg={s.svg}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
