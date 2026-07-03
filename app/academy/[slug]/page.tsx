"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";
import { useAuthContext } from "../../../components/AuthProvider";

type Course = {
  _id: string;
  title: string;
  summary: string;
  description?: string;
  level: string;
  pricingType: "free" | "paid" | "membership";
  price: number;
  currency: string;
  category?: { name?: string };
};

type CourseModule = {
  _id: string;
  title: string;
  description?: string;
  order: number;
};

type Lesson = {
  _id: string;
  module: string;
  title: string;
  durationMinutes?: number;
  isPreview: boolean;
  order: number;
};

export default function AcademyCourseDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [courseRes, outlineRes] = await Promise.all([
          apiJson<{ course: Course }>(`/academy/courses/${slug}`),
          apiJson<{ modules: CourseModule[]; lessons: Lesson[] }>(
            `/academy/courses/${slug}/outline`,
          ),
        ]);
        setCourse(courseRes.course);
        setModules(outlineRes.modules ?? []);
        setLessons(outlineRes.lessons ?? []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load course details."));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const startCheckout = async () => {
    if (!course) return;
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/academy/${slug}`)}`);
      return;
    }

    if (course.pricingType !== "paid") {
      if (course.pricingType === "membership") {
        router.push("/academy/membership");
        return;
      }
      router.push(`/academy/my-courses?enroll=${course._id}`);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const response = await apiJson<{ authorizationUrl: string }>(
        "/academy/payments/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course._id,
            paymentMethod: "paystack",
          }),
        },
      );

      if (!response.authorizationUrl) {
        throw new Error("Payment authorization URL was not returned");
      }
      window.location.href = response.authorizationUrl;
    } catch (err) {
      setCheckoutError(getErrorMessage(err, "Failed to initialize payment."));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
      allowAnonymous
    >
      <DashboardShell
        kicker="Panda Academy"
        title={course?.title ?? "Course"}
        summary={course?.summary ?? "Detailed course information."}
      >
        {loading ? <p className="text-sm">Loading course...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {course ? (
          <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              {course.category?.name ?? "General"} · {course.level}
            </p>
            <p className="mt-2 text-sm">
              {course.description ?? course.summary}
            </p>
            <p className="mt-3 text-sm font-black">
              {course.pricingType === "free"
                ? "Free"
                : `${course.currency} ${course.price.toLocaleString()}`}
            </p>
            <button
              type="button"
              onClick={() => void startCheckout()}
              disabled={checkoutLoading}
              className="mt-4 inline-block border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
            >
              {checkoutLoading
                ? "Processing..."
                : course.pricingType === "paid"
                  ? "Buy course"
                  : course.pricingType === "membership"
                    ? "Get membership"
                    : "Enroll now"}
            </button>
            {checkoutError ? (
              <p className="mt-2 text-sm text-red-700">{checkoutError}</p>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4">
          {modules.map((module) => {
            const moduleLessons = lessons
              .filter((l) => String(l.module) === String(module._id))
              .sort((a, b) => a.order - b.order);

            return (
              <article
                key={module._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <h2 className="text-lg font-black uppercase">{module.title}</h2>
                {module.description ? (
                  <p className="mt-1 text-sm">{module.description}</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {moduleLessons.map((lesson) => (
                    <li
                      key={lesson._id}
                      className="flex items-center justify-between border-2 border-black bg-[#f2eadf] px-3 py-2 text-sm"
                    >
                      <span>
                        {lesson.title}
                        {lesson.isPreview ? " (Preview)" : ""}
                      </span>
                      <span className="text-xs font-black">
                        {lesson.durationMinutes
                          ? `${lesson.durationMinutes}m`
                          : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
