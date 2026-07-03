"use client";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Referral = {
  _id: string;
  referee?: { fullName?: string };
  status: string;
  rewardAmount?: number;
  createdAt: string;
};

function formatCurrency(value: number | null | undefined) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `₦${safeValue.toLocaleString()}`;
}

export default function ReferralsPage() {
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiJson<{ code: string }>("/referrals/my-code"),
      apiJson<{
        referrals: Referral[];
        totalReferrals: number;
        successfulReferrals: number;
        totalEarnings: number;
      }>("/referrals/mine"),
    ])
      .then(([c, r]) => {
        setCode(c.code ?? "");
        setReferrals(r.referrals ?? []);
        setStats({
          total: Number(r.totalReferrals ?? 0),
          successful: Number(r.successfulReferrals ?? 0),
          earnings: Number(r.totalEarnings ?? 0),
        });
      })
      .catch((e) => setMsg(getErrorMessage(e, "Failed to load.")))
      .finally(() => setLoading(false));
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apply = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    setMsg(null);
    try {
      await apiJson<{ success: boolean; message?: string }>(
        "/referrals/apply",
        {
          method: "POST",
          body: JSON.stringify({ code: applyCode }),
        },
      );
      setMsg("Code applied!");
      setApplyCode("");
    } catch (e) {
      setMsg(getErrorMessage(e, "Failed."));
    } finally {
      setApplying(false);
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Rewards"
        title="Referrals"
        summary="Invite friends and earn rewards when they book their first session."
      >
        {loading ? <p className="text-sm">Loading...</p> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="border-4 border-black bg-black p-5 text-[#f2eadf] shadow-[8px_8px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Your Referral Code
              </p>
              <p className="mt-2 text-4xl font-black tracking-widest">
                {code || "—"}
              </p>
              <button
                onClick={copy}
                className="mt-3 border-2 border-[#f2eadf] px-4 py-2 text-xs font-black uppercase"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Total", stats.total],
                ["Successful", stats.successful],
                ["Earnings", formatCurrency(stats.earnings)],
              ].map(([l, v]) => (
                <div
                  key={String(l)}
                  className="border-4 border-black bg-white p-4 text-center shadow-[4px_4px_0_0_#000]"
                >
                  <p className="text-[0.6rem] font-black uppercase text-gray-500">
                    {l}
                  </p>
                  <p className="mt-1 text-2xl font-black">{v}</p>
                </div>
              ))}
            </div>
            <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Apply a Code
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value)}
                  placeholder="Enter code..."
                  className="flex-1 border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm font-black outline-none"
                />
                <button
                  onClick={apply}
                  disabled={applying}
                  className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
                >
                  {applying ? "..." : "Apply"}
                </button>
              </div>
              {msg ? <p className="mt-2 text-xs font-black">{msg}</p> : null}
            </div>
          </div>
          <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">
              History
            </p>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between border-b border-black py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-black">
                      {r.referee?.fullName ?? "Anonymous"}
                    </p>
                    <p className="text-[0.65rem] text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase ${r.status === "completed" ? "bg-green-100" : "bg-gray-100"}`}
                    >
                      {r.status}
                    </span>
                    {typeof r.rewardAmount === "number" &&
                    r.rewardAmount > 0 ? (
                      <p className="mt-0.5 text-xs font-black">
                        {formatCurrency(r.rewardAmount)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              {!loading && referrals.length === 0 ? (
                <p className="text-sm text-gray-600">No referrals yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
