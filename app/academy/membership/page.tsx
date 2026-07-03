"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";
import { useAuthContext } from "../../../components/AuthProvider";

type MembershipPlan = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
};

type ActiveMembership = {
  _id: string;
  status: string;
  expiresAt?: string;
  plan?: {
    name?: string;
    code?: string;
  };
};

export default function AcademyMembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activeMembership, setActiveMembership] =
    useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [plansRes, membershipRes] = await Promise.all([
          apiJson<{ plans: MembershipPlan[] }>("/academy/memberships/plans"),
          isAuthenticated
            ? apiJson<{ subscription?: ActiveMembership | null }>(
                "/academy/memberships/my",
              ).catch(() => ({ subscription: null }))
            : Promise.resolve({ subscription: null }),
        ]);
        setPlans(plansRes.plans ?? []);
        setActiveMembership(membershipRes.subscription ?? null);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load membership plans."));
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const checkout = async (planId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/academy/membership")}`);
      return;
    }

    setCheckoutId(planId);
    setError(null);
    try {
      const response = await apiJson<{ authorizationUrl: string }>(
        "/academy/memberships/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, paymentMethod: "paystack" }),
        },
      );
      if (!response.authorizationUrl) {
        throw new Error("Payment authorization URL was not returned");
      }
      window.location.href = response.authorizationUrl;
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to initialize membership payment."),
      );
    } finally {
      setCheckoutId(null);
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
      allowAnonymous
    >
      <DashboardShell
        kicker="Panda Academy"
        title="Membership Plans"
        summary="Unlock premium and membership-only academy courses with monthly or yearly access."
      >
        {activeMembership?.status === "active" ? (
          <section className="border-4 border-black bg-[#fef2d2] p-5 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Active membership
            </p>
            <p className="mt-2 text-sm font-black">
              {activeMembership.plan?.name ??
                activeMembership.plan?.code ??
                "Membership"}
            </p>
            {activeMembership.expiresAt ? (
              <p className="mt-1 text-sm">
                Expires{" "}
                {new Date(activeMembership.expiresAt).toLocaleDateString()}
              </p>
            ) : null}
          </section>
        ) : null}

        {loading ? <p className="text-sm">Loading plans...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {plan.code}
              </p>
              <h2 className="mt-2 text-xl font-black uppercase">{plan.name}</h2>
              {plan.description ? (
                <p className="mt-2 text-sm">{plan.description}</p>
              ) : null}
              <p className="mt-3 text-lg font-black">
                {plan.currency} {plan.price.toLocaleString()} / {plan.interval}
              </p>
              {plan.features?.length ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => void checkout(plan._id)}
                disabled={checkoutId === plan._id}
                className="mt-4 border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
              >
                {checkoutId === plan._id ? "Processing..." : "Subscribe"}
              </button>
            </article>
          ))}
          {!loading && plans.length === 0 ? (
            <p className="col-span-full text-sm text-slate-600">
              No active membership plans published yet.
            </p>
          ) : null}
        </section>

        <Link
          href="/academy"
          className="inline-block border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
        >
          Back to academy
        </Link>
      </DashboardShell>
    </RoleGate>
  );
}
