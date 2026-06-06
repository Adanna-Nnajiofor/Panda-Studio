"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  author?: { fullName: string };
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ posts: Post[] }>("/blog")
      .then((d) => setPosts(d.posts ?? []))
      .catch((e) => setError(getErrorMessage(e, "Failed to load posts.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Studio"
        title="Blog & Insights"
        summary="Production tips, behind-the-scenes stories, and industry insights from the Panda Studio team."
      >
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p._id}
              className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
            >
              {p.coverImage ? (
                <div className="h-44 overflow-hidden border-b-4 border-black relative">
                  <Image
                    src={p.coverImage}
                    alt={p.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center border-b-4 border-black bg-[#f2eadf] text-4xl">
                  📝
                </div>
              )}
              <div className="p-5">
                {p.tags?.length ? (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <h2 className="text-lg font-black uppercase leading-tight">
                  {p.title}
                </h2>
                {p.excerpt ? (
                  <p className="mt-2 text-sm line-clamp-3">{p.excerpt}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {p.author?.fullName ?? "Panda Studio"} ·{" "}
                    {new Date(
                      p.publishedAt ?? p.createdAt,
                    ).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="border-2 border-black bg-black px-3 py-1.5 text-xs font-black uppercase text-[#f2eadf]"
                  >
                    Read
                  </Link>
                </div>
              </div>
            </article>
          ))}
          {!loading && posts.length === 0 ? (
            <p className="col-span-full text-sm text-gray-600">
              No posts published yet.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
