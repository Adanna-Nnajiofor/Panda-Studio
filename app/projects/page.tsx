"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { PROJECT_STATUS_LABELS } from "../../lib/studio";

type Project = {
  _id: string;
  progressStatus: string;
  expiryDate: string;
  isArchived: boolean;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ projects: Project[] }>("/projects/mine");
        setProjects(data.projects ?? []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load your projects."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <RoleGate
      allowedRoles={["client", "admin", "super_admin", "crew", "staff"]}
    >
      <DashboardShell
        kicker="Download center"
        title="Your projects & deliverables"
        summary="When work is complete, photos, videos, and brand assets appear here for preview and download."
      >
        {loading ? <p>Loading projects...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-4 md:grid-cols-2">
          {!loading && projects.length === 0 ? (
            <p className="text-sm">
              No projects yet. Completed bookings become projects with
              deliverables.
            </p>
          ) : null}
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project._id}`}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000] transition-transform hover:-translate-y-1"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em]">
                Project
              </p>
              <p className="mt-2 text-lg font-black">
                {project._id.slice(-8).toUpperCase()}
              </p>
              <p className="mt-2 text-sm">
                Status:{" "}
                {PROJECT_STATUS_LABELS[project.progressStatus] ??
                  project.progressStatus}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Access until {new Date(project.expiryDate).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
