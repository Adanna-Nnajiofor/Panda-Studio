"use client";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Milestone = { _id: string; title: string; dueDate: string; status: string; description?: string };
type Project = { _id: string; title: string; progressStatus: string; startDate?: string; endDate?: string; milestones?: Milestone[]; client?: { fullName: string }; createdAt: string };

const STATUS_COLOR: Record<string, string> = { pending: "bg-gray-100", in_progress: "bg-blue-100", completed: "bg-green-100", cancelled: "bg-red-100", on_hold: "bg-yellow-100" };
const MILESTONE_COLOR: Record<string, string> = { pending: "border-gray-400 bg-gray-50", completed: "border-green-500 bg-green-50", overdue: "border-red-500 bg-red-50" };

export default function TimelinePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ projects: Project[] }>("/projects").then(d => { setProjects(d.projects ?? []); if (d.projects?.length) setSelected(d.projects[0]._id); }).catch(e => setError(getErrorMessage(e, "Failed to load projects."))).finally(() => setLoading(false));
  }, []);

  const active = projects.find(p => p._id === selected);

  const milestoneStatus = (m: Milestone) => {
    if (m.status === "completed") return "completed";
    if (new Date(m.dueDate) < new Date()) return "overdue";
    return "pending";
  };

  return (
    <RoleGate allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}>
      <DashboardShell kicker="Projects" title="Timeline" summary="Track project milestones, deadlines, and production progress.">
        {loading ? <p className="text-sm">Loading...</p> : error ? <p className="text-sm text-red-700">{error}</p> : null}
        {projects.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            {/* Project list */}
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Projects</p>
              {projects.map(p => (
                <button key={p._id} onClick={() => setSelected(p._id)} className={`w-full border-4 border-black p-3 text-left shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5 ${selected === p._id ? "bg-black text-[#f2eadf]" : "bg-white"}`}>
                  <p className="text-xs font-black uppercase">{p.title}</p>
                  <span className={`mt-1 inline-block border border-current px-2 py-0.5 text-[0.6rem] font-black uppercase`}>{p.progressStatus.replace("_", " ")}</span>
                </button>
              ))}
            </div>

            {/* Timeline */}
            {active && (
              <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase">{active.title}</h2>
                    {active.client ? <p className="text-sm text-gray-600">Client: {active.client.fullName}</p> : null}
                  </div>
                  <span className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${STATUS_COLOR[active.progressStatus] ?? ""}`}>{active.progressStatus.replace("_", " ")}</span>
                </div>

                {active.startDate || active.endDate ? (
                  <div className="mt-4 flex gap-6 text-xs font-black">
                    {active.startDate ? <span>Start: {new Date(active.startDate).toLocaleDateString()}</span> : null}
                    {active.endDate ? <span>End: {new Date(active.endDate).toLocaleDateString()}</span> : null}
                  </div>
                ) : null}

                <div className="mt-6">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.2em]">Milestones</p>
                  {active.milestones?.length ? (
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute left-2 top-0 h-full w-0.5 bg-black" />
                      {active.milestones.map(m => {
                        const ms = milestoneStatus(m);
                        return (
                          <div key={m._id} className={`relative border-2 p-4 ${MILESTONE_COLOR[ms]}`}>
                            <div className="absolute -left-[1.35rem] top-4 h-4 w-4 border-2 border-black bg-white" />
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-black uppercase">{m.title}</p>
                              <span className={`border border-current px-2 py-0.5 text-[0.6rem] font-black uppercase`}>{ms}</span>
                            </div>
                            {m.description ? <p className="mt-1 text-xs">{m.description}</p> : null}
                            <p className="mt-1 text-[0.65rem] text-gray-500">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No milestones set for this project.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {!loading && projects.length === 0 ? <p className="text-sm text-gray-600">No projects found.</p> : null}
      </DashboardShell>
    </RoleGate>
  );
}
