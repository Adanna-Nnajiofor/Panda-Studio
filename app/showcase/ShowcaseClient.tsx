"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type PortfolioItem = {
  _id: string;
  title: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  type: "video" | "image" | "audio";
  views: number;
};

type Portfolio = {
  _id: string;
  user?: {
    _id?: string;
    fullName?: string;
    avatar?: string;
    position?: string;
  };
  bio?: string;
  showreelUrl?: string;
  specialties?: string[];
  items: PortfolioItem[];
};

type BlogPost = {
  _id: string;
  title: string;
  excerpt?: string;
  slug?: string;
  coverImage?: string;
  publishedAt?: string;
};

type Testimonial = {
  id: string;
  author: string;
  rating: number;
  comment: string;
};

type Award = {
  _id: string;
  title: string;
  issuer: string;
  year: number;
  category?: string;
  projectName?: string;
};

export default function ShowcaseClient() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [portfolioRes, postRes, awardRes] = await Promise.all([
          apiJson<{ portfolios: Portfolio[] }>("/portfolios"),
          apiJson<{ posts: BlogPost[] }>(
            "/blog?category=behind_the_scenes&limit=6",
          ),
          apiJson<{ awards: Award[] }>("/awards").catch(() => ({ awards: [] })),
        ]);

        const publicPortfolios = (portfolioRes.portfolios ?? []).filter(
          (p) => (p.items?.length ?? 0) > 0,
        );
        setPortfolios(publicPortfolios.slice(0, 9));
        setPosts(postRes.posts ?? []);
        setAwards(awardRes.awards ?? []);

        const targetIds = publicPortfolios
          .map((p) => p.user?._id)
          .filter((id): id is string => Boolean(id))
          .slice(0, 4);

        const reviewGroups = await Promise.all(
          targetIds.map((id) =>
            apiJson<{
              reviews: Array<{
                _id: string;
                rating: number;
                comment?: string;
                author?: { fullName?: string };
              }>;
            }>(`/reviews/crew/${id}`).catch(() => ({ reviews: [] })),
          ),
        );

        const merged = reviewGroups
          .flatMap((group) => group.reviews ?? [])
          .filter(
            (review) =>
              review.rating >= 4 && (review.comment ?? "").trim().length > 0,
          )
          .slice(0, 6)
          .map((review) => ({
            id: review._id,
            author: review.author?.fullName ?? "Verified Client",
            rating: review.rating,
            comment: review.comment ?? "",
          }));

        setTestimonials(merged);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load showcase content."));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const totalVideos = portfolios.reduce(
      (sum, p) => sum + p.items.filter((item) => item.type === "video").length,
      0,
    );
    const totalImages = portfolios.reduce(
      (sum, p) => sum + p.items.filter((item) => item.type === "image").length,
      0,
    );

    return {
      projects: portfolios.length,
      videos: totalVideos,
      images: totalImages,
      testimonials: testimonials.length,
    };
  }, [portfolios, testimonials]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border-4 border-black bg-[#fff5df] p-6 shadow-[10px_10px_0_0_#000] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em]">
          Public Portfolio
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-2xl">
          Panda Studio Work Showcase
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
          Explore project galleries, video cuts, client testimonials, awards,
          and behind-the-scenes stories from productions delivered by Panda
          Studio.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/quote"
            className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
          >
            Start a project
          </Link>
          <Link
            href="/contact"
            className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
          >
            Contact team
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Projects
          </p>
          <p className="mt-1 text-2xl font-black">{stats.projects}</p>
        </article>
        <article className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Video assets
          </p>
          <p className="mt-1 text-2xl font-black">{stats.videos}</p>
        </article>
        <article className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Photo assets
          </p>
          <p className="mt-1 text-2xl font-black">{stats.images}</p>
        </article>
        <article className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Testimonials
          </p>
          <p className="mt-1 text-2xl font-black">{stats.testimonials}</p>
        </article>
      </section>

      {loading ? <p className="mt-8 text-sm">Loading showcase...</p> : null}
      {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

      <section className="mt-10">
        <h2 className="text-xl font-black uppercase">
          Project Galleries and Videos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => {
            const lead = portfolio.items[0];
            const owner = portfolio.user?.fullName ?? "Panda Studio Team";
            const videos = portfolio.items.filter(
              (item) => item.type === "video",
            ).length;
            return (
              <article
                key={portfolio._id}
                className="overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
              >
                <div className="relative h-40 border-b-4 border-black bg-[#f2eadf]">
                  {lead?.thumbnailUrl || lead?.mediaUrl ? (
                    <Image
                      src={lead.thumbnailUrl ?? lead.mediaUrl}
                      alt={lead?.title ?? owner}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      🎞️
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em]">
                    {owner}
                  </p>
                  <p className="mt-1 text-sm">
                    {portfolio.bio ||
                      "Creative direction and production delivery across campaign, event, and studio formats."}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {portfolio.items.length} assets · {videos} videos
                  </p>
                  {portfolio.showreelUrl ? (
                    <a
                      href={portfolio.showreelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block border-2 border-black px-3 py-1.5 text-xs font-black uppercase"
                    >
                      Watch showreel
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
          {!loading && portfolios.length === 0 ? (
            <p className="text-sm text-slate-600">
              No public portfolio items available yet.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black uppercase">Client Testimonials</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.id}
              className="border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {item.author}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                &quot;{item.comment}&quot;
              </p>
              <p className="mt-2 text-xs">
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </p>
            </article>
          ))}
          {!loading && testimonials.length === 0 ? (
            <p className="text-sm text-slate-600">
              Testimonials will appear as clients review completed work.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black uppercase">Awards and Recognition</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <article
              key={award._id}
              className="border-4 border-black bg-[#fff5df] p-4 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {award.year}
              </p>
              <h3 className="mt-1 text-sm font-black uppercase">
                {award.title}
              </h3>
              <p className="mt-2 text-xs text-slate-700">{award.issuer}</p>
              {award.category ? (
                <p className="mt-1 text-[11px] text-slate-600">
                  {award.category}
                </p>
              ) : null}
            </article>
          ))}
          {!loading && awards.length === 0 ? (
            <p className="text-sm text-slate-600">
              Awards and recognitions will appear here once published.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black uppercase">Behind the Scenes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post._id}
              className="overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
            >
              <div className="relative h-36 border-b-4 border-black bg-[#f2eadf]">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    🎬
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-black uppercase leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs text-slate-700">
                  {post.excerpt ??
                    "Read how Panda Studio plans, shoots, and delivers production work from briefing to final output."}
                </p>
                <Link
                  href="/blog"
                  className="mt-3 inline-block border-2 border-black px-3 py-1.5 text-xs font-black uppercase"
                >
                  Read stories
                </Link>
              </div>
            </article>
          ))}
          {!loading && posts.length === 0 ? (
            <p className="text-sm text-slate-600">
              No behind-the-scenes stories have been published yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
