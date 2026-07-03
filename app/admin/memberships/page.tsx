"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type MembershipPlan = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  isActive: boolean;
  isPublic: boolean;
};

export default function AdminMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("10000");
  const [currency, setCurrency] = useState("NGN");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [featuresText, setFeaturesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ plans: MembershipPlan[] }>(
        "/academy/memberships/admin/plans",
      );
      setPlans(res.plans ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setSaving(true);
    try {
      const features = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      await apiJson("/academy/memberships/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          price: Number(price),
          currency: currency.trim().toUpperCase(),
          interval,
          features,
          isActive: true,
          isPublic: true,
        }),
      });

      setCode("");
      setName("");
      setDescription("");
      setFeaturesText("");
      setPrice("10000");
      setCurrency("NGN");
      setInterval("monthly");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (
    plan: MembershipPlan,
    field: "isActive" | "isPublic",
  ) => {
    await apiJson(`/academy/memberships/plans/${plan._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !plan[field] }),
    });
    await load();
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="Membership Plans"
        summary="Create and manage Panda Academy subscription plans and public visibility."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <form onSubmit={createPlan} className="grid gap-3 md:grid-cols-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Plan code (e.g. PRO)"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Plan name"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min={0}
              placeholder="Price"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Currency"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <select
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value as "monthly" | "yearly")
              }
              className="border-2 border-black px-3 py-2 text-sm"
            >
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
            </select>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={4}
              placeholder={
                "Features (one per line)\nPremium courses\nCertificates\nPriority support"
              }
              className="border-2 border-black px-3 py-2 text-sm md:col-span-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-fit border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              {saving ? "Saving..." : "Create plan"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">Loading plans...</p>
            </article>
          ) : plans.length === 0 ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No membership plans yet.</p>
            </article>
          ) : (
            plans.map((plan) => (
              <article
                key={plan._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {plan.code} · {plan.interval}
                </p>
                <h3 className="mt-1 text-lg font-black uppercase">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm font-black">
                  {plan.currency} {plan.price.toLocaleString()} /{" "}
                  {plan.interval}
                </p>
                {plan.description ? (
                  <p className="mt-2 text-sm">{plan.description}</p>
                ) : null}
                {plan.features?.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void togglePlan(plan, "isActive")}
                    className="border-2 border-black px-3 py-2 text-xs font-black uppercase"
                  >
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void togglePlan(plan, "isPublic")}
                    className="border-2 border-black px-3 py-2 text-xs font-black uppercase"
                  >
                    {plan.isPublic ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
