"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type Enrollment = {
  _id: string;
  status: "active" | "completed" | "cancelled";
  progressPercent: number;
  updatedAt: string;
  course?: {
    _id: string;
    title: string;
    slug: string;
    summary: string;
    pricingType: "free" | "paid" | "membership";
  };
};

type ActiveMembership = {
  _id: string;
  status: "pending" | "active" | "expired" | "cancelled";
  expiresAt?: string;
  plan?: { code?: string; name?: string; interval?: string };
};

export default function MyCoursesPage() {
  const [enrollId, setEnrollId] = useState<string | null>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("enroll");
    setEnrollId(value);
  }, []);

  const load = async () => {
    const [enrollmentsRes, membershipRes] = await Promise.all([
      apiJson<{ enrollments: Enrollment[] }>("/academy/enrollments/mine"),
      apiJson<{ subscription?: ActiveMembership | null }>(
        "/academy/memberships/my",
      ).catch(() => ({ subscription: null })),
    ]);
    setEnrollments(enrollmentsRes.enrollments ?? []);
    setMembership(membershipRes.subscription ?? null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setActionMessage(null);
      try {
        if (enrollId) {
          setEnrolling(true);
          try {
            await apiJson("/academy/enrollments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId: enrollId }),
            });
            if (mounted) {
              setActionMessage("Enrollment processed successfully.");
            }
          } catch (err) {
            if (mounted) {
              setError(
                getErrorMessage(err, "Failed to enroll in this course."),
              );
            }
          }
        }
        if (!mounted) return;
        await load();
      } catch (err) {
        if (mounted)
          setError(getErrorMessage(err, "Failed to load your courses."));
      } finally {
        if (mounted) {
          setLoading(false);
          setEnrolling(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [enrollId]);

  const activeCount = useMemo(
    () => enrollments.filter((e) => e.status === "active").length,
    [enrollments],
  );

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Panda Academy"
        title="My Courses"
        summary="Track your learning progress and continue where you stopped."
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase">
            Active courses: {activeCount}
          </p>
          <p className="border-2 border-black bg-[#fef2d2] px-3 py-2 text-xs font-black uppercase">
            Membership:{" "}
            {membership?.status === "active" ? "Active" : "Inactive"}
          </p>
          <Link
            href="/academy"
            className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
          >
            Browse academy
          </Link>
          <Link
            href="/academy/membership"
            className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase"
          >
            Manage membership
          </Link>
        </div>

        {membership?.status === "active" ? (
          <section className="border-4 border-black bg-[#fef2d2] p-4 shadow-[6px_6px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Current plan
            </p>
            <p className="mt-1 text-sm font-black">
              {membership.plan?.name ?? membership.plan?.code ?? "Membership"}
            </p>
            {membership.expiresAt ? (
              <p className="mt-1 text-sm">
                Expires {new Date(membership.expiresAt).toLocaleDateString()}
              </p>
            ) : null}
          </section>
        ) : null}

        {enrolling ? <p className="text-sm">Processing enrollment...</p> : null}
        {actionMessage ? (
          <p className="text-sm text-green-700">{actionMessage}</p>
        ) : null}
        {loading ? <p className="text-sm">Loading enrollments...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((item) => (
            <article
              key={item._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {item.status}
              </p>
              <h2 className="mt-2 text-lg font-black uppercase">
                {item.course?.title ?? "Course"}
              </h2>
              <p className="mt-2 text-sm">
                {item.course?.summary ?? "No summary"}
              </p>
              <p className="mt-3 text-sm font-black">
                {item.progressPercent}% complete
              </p>
              <div className="mt-2 h-2 w-full border border-black bg-[#f2eadf]">
                <div
                  className="h-full bg-black"
                  style={{
                    width: `${Math.max(0, Math.min(100, item.progressPercent))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Updated {new Date(item.updatedAt).toLocaleDateString()}
              </p>
            </article>
          ))}
          {!loading && enrollments.length === 0 ? (
            <p className="col-span-full text-sm text-slate-600">
              You are not enrolled in any courses yet.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
