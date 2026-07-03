"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Course = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced";
  pricingType: "free" | "paid" | "membership";
  price: number;
  currency: string;
  category?: { name?: string };
};

export default function AcademyCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ courses: Course[] }>("/academy/courses")
      .then((res) => setCourses(res.courses ?? []))
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load academy courses.")),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        (c.category?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [courses, query]);

  const getCoursePrimaryHref = (course: Course) => {
    if (course.pricingType === "free") {
      return `/academy/my-courses?enroll=${course._id}`;
    }
    if (course.pricingType === "membership") {
      return "/academy/membership";
    }
    return `/academy/${course.slug}`;
  };

  const getCoursePrimaryLabel = (course: Course) => {
    if (course.pricingType === "free") return "Enroll";
    if (course.pricingType === "membership") return "Get membership";
    return "Buy course";
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
      allowAnonymous
    >
      <DashboardShell
        kicker="Panda Academy"
        title="Learn production. Grow faster."
        summary="Browse practical production courses across equipment, studio workflows, safety, and business."
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full max-w-sm border-2 border-black px-3 py-2 text-sm"
          />
          <Link
            href="/academy/membership"
            className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
          >
            Membership plans
          </Link>
          <Link
            href="/academy/my-courses"
            className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
          >
            My courses
          </Link>
        </div>

        {loading ? <p className="text-sm">Loading courses...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <article
              key={course._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {course.category?.name ?? "General"}
              </p>
              <h2 className="mt-2 text-lg font-black uppercase">
                {course.title}
              </h2>
              <p className="mt-2 text-sm">{course.summary}</p>
              <p className="mt-3 text-xs font-black uppercase text-slate-600">
                {course.level}
              </p>
              <p className="mt-1 text-sm font-black">
                {course.pricingType === "free"
                  ? "Free"
                  : `${course.currency} ${course.price.toLocaleString()}`}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={getCoursePrimaryHref(course)}
                  className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
                >
                  {getCoursePrimaryLabel(course)}
                </Link>
                <Link
                  href={`/academy/${course.slug}`}
                  className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase"
                >
                  View
                </Link>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 ? (
            <p className="col-span-full text-sm text-slate-600">
              No courses found.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
