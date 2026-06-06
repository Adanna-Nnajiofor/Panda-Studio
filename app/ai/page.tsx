"use client";
import { useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type BreakdownResult = { wordCount: number; estimatedScenes: number; crewList: { role: string; count: number; priority: string }[]; equipmentList: { item: string; quantity: number; note?: string }[]; schedule: { preProduction: string; production: string; postProduction: string; totalEstimate: string }; warnings: string[] };

export default function AIPage() {
  const [tab, setTab] = useState<"breakdown" | "contract">("breakdown");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<{ title: string; content: string } | null>(null);
  const [contractForm, setContractForm] = useState({ contractType: "service", clientName: "", projectTitle: "", paymentAmount: "" });

  const runBreakdown = async () => {
    if (script.trim().length < 20) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiFetch("/ai/script-breakdown", { method: "POST", body: JSON.stringify({ script }), headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.success) setResult(data.analysis);
      else setError(data.message);
    } catch (e) { setError(getErrorMessage(e, "Failed.")); }
    finally { setLoading(false); }
  };

  const genContract = async () => {
    setLoading(true); setError(null); setContract(null);
    try {
      const res = await apiFetch("/ai/generate-contract", { method: "POST", body: JSON.stringify({ ...contractForm, paymentAmount: Number(contractForm.paymentAmount) || undefined }), headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.success) setContract(data.contract);
      else setError(data.message);
    } catch (e) { setError(getErrorMessage(e, "Failed.")); }
    finally { setLoading(false); }
  };

  const PRIORITY_COLOR: Record<string, string> = { required: "bg-red-100", recommended: "bg-yellow-100", optional: "bg-gray-100" };

  return (
    <RoleGate allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}>
      <DashboardShell kicker="AI Tools" title="Production AI" summary="Script breakdown, smart scheduling, and contract generation powered by AI.">
        <div className="flex gap-2">
          {(["breakdown", "contract"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`border-2 border-black px-4 py-2 text-xs font-black uppercase ${tab === t ? "bg-black text-[#f2eadf]" : "bg-white"}`}>
              {t === "breakdown" ? "Script Breakdown" : "Contract Generator"}
            </button>
          ))}
        </div>

        {tab === "breakdown" && (
          <div className="space-y-4">
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} placeholder="Paste your script here (minimum 20 words)..." className="w-full border-4 border-black bg-[#fff8ea] px-4 py-3 text-sm font-black outline-none resize-none" />
            <button onClick={runBreakdown} disabled={loading || script.trim().length < 20} className="border-4 border-black bg-black px-6 py-3 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50">{loading ? "Analysing..." : "Analyse Script"}</button>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {result && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[["Words", result.wordCount], ["Scenes", result.estimatedScenes], ["Total Days", result.schedule.totalEstimate]].map(([l, v]) => (
                    <div key={String(l)} className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
                      <p className="text-[0.6rem] font-black uppercase text-gray-500">{l}</p>
                      <p className="mt-1 text-2xl font-black">{v}</p>
                    </div>
                  ))}
                </div>
                {result.warnings.length > 0 && (
                  <div className="border-4 border-black bg-yellow-50 p-4">
                    <p className="text-xs font-black uppercase">⚠️ Warnings</p>
                    {result.warnings.map((w, i) => <p key={i} className="mt-1 text-sm">{w}</p>)}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">Crew List</p>
                    {result.crewList.map(c => (
                      <div key={c.role} className="flex items-center justify-between border-b border-black py-2 last:border-0">
                        <p className="text-sm font-black">{c.role} ×{c.count}</p>
                        <span className={`border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase ${PRIORITY_COLOR[c.priority]}`}>{c.priority}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">Equipment</p>
                    {result.equipmentList.map(e => (
                      <div key={e.item} className="border-b border-black py-2 last:border-0">
                        <p className="text-sm font-black">{e.item} ×{e.quantity}</p>
                        {e.note ? <p className="text-[0.65rem] text-gray-500">{e.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "contract" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black uppercase">Contract Type</label>
                  <select value={contractForm.contractType} onChange={e => setContractForm(f => ({ ...f, contractType: e.target.value }))} className="mt-1 w-full border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm font-black outline-none">
                    {["service", "hire", "nda", "usage_rights"].map(t => <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
                {[["clientName", "Client Name"], ["projectTitle", "Project Title"], ["paymentAmount", "Payment Amount (₦)"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-black uppercase">{l}</label>
                    <input value={(contractForm as any)[k]} onChange={e => setContractForm(f => ({ ...f, [k]: e.target.value }))} className="mt-1 w-full border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm font-black outline-none" />
                  </div>
                ))}
                <button onClick={genContract} disabled={loading || !contractForm.clientName || !contractForm.projectTitle} className="w-full border-4 border-black bg-black py-3 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50">{loading ? "Generating..." : "Generate Contract"}</button>
              </div>
              {contract && (
                <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                  <p className="mb-2 text-xs font-black uppercase">{contract.title}</p>
                  <pre className="whitespace-pre-wrap text-[0.7rem] leading-relaxed max-h-96 overflow-y-auto">{contract.content}</pre>
                  <button onClick={() => navigator.clipboard.writeText(contract.content)} className="mt-3 border-2 border-black px-4 py-2 text-xs font-black uppercase">Copy Contract</button>
                </div>
              )}
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
