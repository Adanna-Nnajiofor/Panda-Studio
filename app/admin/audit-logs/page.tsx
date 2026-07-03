"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type AuditLog = {
  _id: string;
  action: string;
  entityType: string;
  message: string;
  createdAt: string;
  actor?: { fullName?: string; email?: string };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiJson<{ logs: AuditLog[] }>(
          "/audit-logs?limit=200",
        );
        if (!active) return;
        setLogs(data.logs ?? []);
      } catch {
        // silent
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Governance"
        title="Audit logs"
        summary="View administrative and operational actions with retention-backed records."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          {loading ? (
            <p className="text-sm font-black uppercase tracking-[0.2em]">
              Loading logs...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-sm">No audit logs found.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <article
                  key={log._id}
                  className="border-2 border-black bg-[#fffdf7] p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.1em]">
                    {log.action} - {log.entityType}
                  </p>
                  <p className="mt-1 text-sm">{log.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()} ·{" "}
                    {log.actor?.fullName ?? log.actor?.email ?? "System"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
