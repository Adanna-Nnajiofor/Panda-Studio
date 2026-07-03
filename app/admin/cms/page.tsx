"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type CmsSection = {
  title: string;
  content?: string;
  bullets?: string[];
};

type CmsPage = {
  slug: string;
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  sections?: CmsSection[];
  isPublished: boolean;
};

const MANAGED_SLUGS = ["about", "terms", "privacy", "faq"];

export default function AdminCmsPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("about");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPage = useMemo(
    () => pages.find((p) => p.slug === selectedSlug),
    [pages, selectedSlug],
  );

  const [title, setTitle] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState("");
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState("");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState("");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [sectionsJson, setSectionsJson] = useState("[]");

  const load = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await apiJson<{ pages?: CmsPage[] }>("/cms/admin/pages");
      setPages(res.pages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load CMS pages");
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const page = selectedPage;
    if (!page) {
      setTitle(selectedSlug.toUpperCase());
      setHeroTitle("");
      setHeroSubtitle("");
      setCtaPrimaryLabel("");
      setCtaPrimaryHref("");
      setCtaSecondaryLabel("");
      setCtaSecondaryHref("");
      setIsPublished(true);
      setSectionsJson("[]");
      return;
    }

    setTitle(page.title ?? "");
    setHeroTitle(page.heroTitle ?? "");
    setHeroSubtitle(page.heroSubtitle ?? "");
    setCtaPrimaryLabel(page.ctaPrimaryLabel ?? "");
    setCtaPrimaryHref(page.ctaPrimaryHref ?? "");
    setCtaSecondaryLabel(page.ctaSecondaryLabel ?? "");
    setCtaSecondaryHref(page.ctaSecondaryHref ?? "");
    setIsPublished(page.isPublished ?? true);
    setSectionsJson(JSON.stringify(page.sections ?? [], null, 2));
  }, [selectedPage, selectedSlug]);

  const save = async () => {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const parsedSections = JSON.parse(sectionsJson) as CmsSection[];
      await apiJson(`/cms/admin/pages/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          title,
          heroTitle,
          heroSubtitle,
          ctaPrimaryLabel,
          ctaPrimaryHref,
          ctaSecondaryLabel,
          ctaSecondaryHref,
          isPublished,
          sections: parsedSections,
        }),
      });
      setSuccess("CMS page saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save CMS page");
    } finally {
      setPending(false);
    }
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="CMS editor"
        summary="Edit key public pages without code deploys."
      >
        {error ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="border-4 border-black bg-[#d8f0dd] p-3 text-sm font-black">
            {success}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Pages
            </p>
            <div className="mt-3 grid gap-2">
              {MANAGED_SLUGS.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSelectedSlug(slug)}
                  className={[
                    "border-2 border-black px-3 py-2 text-left text-xs font-black uppercase",
                    selectedSlug === slug
                      ? "bg-black text-[#f2eadf]"
                      : "bg-white",
                  ].join(" ")}
                >
                  {slug}
                </button>
              ))}
            </div>
          </aside>

          <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000] space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Editing /{selectedSlug}
            </p>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Hero title"
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Hero subtitle"
              rows={3}
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={ctaPrimaryLabel}
                onChange={(e) => setCtaPrimaryLabel(e.target.value)}
                placeholder="Primary CTA label"
                className="w-full border-2 border-black px-3 py-2 text-sm"
              />
              <input
                value={ctaPrimaryHref}
                onChange={(e) => setCtaPrimaryHref(e.target.value)}
                placeholder="Primary CTA href"
                className="w-full border-2 border-black px-3 py-2 text-sm"
              />
              <input
                value={ctaSecondaryLabel}
                onChange={(e) => setCtaSecondaryLabel(e.target.value)}
                placeholder="Secondary CTA label"
                className="w-full border-2 border-black px-3 py-2 text-sm"
              />
              <input
                value={ctaSecondaryHref}
                onChange={(e) => setCtaSecondaryHref(e.target.value)}
                placeholder="Secondary CTA href"
                className="w-full border-2 border-black px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-black uppercase">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Published
            </label>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Sections JSON
              </p>
              <textarea
                value={sectionsJson}
                onChange={(e) => setSectionsJson(e.target.value)}
                rows={14}
                className="mt-2 w-full border-2 border-black px-3 py-2 font-mono text-xs"
              />
            </div>

            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save page"}
            </button>
          </div>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
