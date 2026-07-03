"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import { apiJson } from "../lib/api";

type CmsSection = {
  title: string;
  content?: string;
  bullets?: string[];
};

type CmsPagePayload = {
  title?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  sections?: CmsSection[];
};

type CmsPublicPageProps = {
  slug: string;
  fallback: {
    title: string;
    heroTitle: string;
    heroSubtitle: string;
    sections: CmsSection[];
    ctaPrimaryLabel?: string;
    ctaPrimaryHref?: string;
    ctaSecondaryLabel?: string;
    ctaSecondaryHref?: string;
  };
};

export default function CmsPublicPage({ slug, fallback }: CmsPublicPageProps) {
  const [page, setPage] = useState<CmsPagePayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiJson<{ page: CmsPagePayload }>(
          `/cms/pages/${slug}`,
        );
        setPage(res.page ?? null);
      } catch {
        setPage(null);
      }
    };
    void load();
  }, [slug]);

  const data = page ?? fallback;
  const heroTitle = data.heroTitle ?? fallback.heroTitle;
  const heroSubtitle = data.heroSubtitle ?? fallback.heroSubtitle;
  const sections = data.sections?.length ? data.sections : fallback.sections;

  return (
    <>
      <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto max-w-5xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7d673d]">
            {data.title ?? fallback.title}
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
            {heroTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base">{heroSubtitle}</p>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <article
                key={section.title}
                className="border-2 border-black bg-[#fff8ea] p-4"
              >
                <h2 className="text-lg font-black uppercase">
                  {section.title}
                </h2>
                {section.content ? (
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {section.content}
                  </p>
                ) : null}
                {section.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={
                data.ctaPrimaryHref ?? fallback.ctaPrimaryHref ?? "/contact"
              }
              className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
            >
              {data.ctaPrimaryLabel ?? fallback.ctaPrimaryLabel ?? "Contact us"}
            </Link>
            <Link
              href={
                data.ctaSecondaryHref ??
                fallback.ctaSecondaryHref ??
                "/services"
              }
              className="border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
            >
              {data.ctaSecondaryLabel ??
                fallback.ctaSecondaryLabel ??
                "Explore services"}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
