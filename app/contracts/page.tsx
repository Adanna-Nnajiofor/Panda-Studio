"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

type Contract = {
  _id: string;
  title: string;
  contractType: string;
  status: "draft" | "sent" | "signed" | "cancelled";
  createdAt: string;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiJson<{ contracts: Contract[] }>("/contracts");
        if (active) setContracts(data.contracts ?? []);
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
        kicker="Legal"
        title="Contracts"
        summary="Track draft, sent, signed, and cancelled contracts for projects and crew work."
      >
        <section className="space-y-3">
          {contracts.map((contract) => (
            <article
              key={contract._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {contract.contractType}
              </p>
              <h3 className="mt-1 text-lg font-black">{contract.title}</h3>
              <p className="mt-1 text-sm capitalize">
                Status: {contract.status}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created {new Date(contract.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
          {contracts.length === 0 && (
            <article className="border-4 border-black bg-[#fffdf7] p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">
                No contracts yet. Use the contract API to create one.
              </p>
            </article>
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
