"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

type FilmOpsProject = {
  _id: string;
  title: string;
  callSheets: unknown[];
  dprs: unknown[];
  attendance: unknown[];
  locations: unknown[];
  talents: unknown[];
};

export default function FilmOpsPage() {
  const [records, setRecords] = useState<FilmOpsProject[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiJson<{ records: FilmOpsProject[] }>(
          "/film-ops/projects",
        );
        if (active) setRecords(data.records ?? []);
      } catch {
        // silent
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <RoleGate allowedRoles={["admin", "super_admin", "staff", "crew"]}>
      <DashboardShell
        kicker="Production"
        title="Film ops"
        summary="Manage call sheets, daily production reports, attendance, locations, and talent records."
      >
        <section className="space-y-3">
          {records.map((record) => (
            <article
              key={record._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <h3 className="text-lg font-black uppercase">{record.title}</h3>
              <p className="mt-2 text-sm">
                {record.callSheets.length} call sheets · {record.dprs.length}{" "}
                DPRs · {record.attendance.length} attendance ·{" "}
                {record.locations.length} locations · {record.talents.length}{" "}
                talent
              </p>
            </article>
          ))}
          {records.length === 0 && (
            <article className="border-4 border-black bg-[#fffdf7] p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No film ops records found yet.</p>
            </article>
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
