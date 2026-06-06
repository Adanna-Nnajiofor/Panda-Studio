"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthContext } from "../AuthProvider";
import { ROLE_LABELS, roleHomePath, type Role } from "../../lib/roles";
import RoleNav from "./RoleNav";

type DashboardShellProps = {
  title: string;
  kicker?: string;
  summary?: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  kicker,
  summary,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuthContext();
  const role = (user?.role as Role | undefined) ?? undefined;
  const roleLabel = role ? ROLE_LABELS[role] : "Guest";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ea,#f2eadf_45%,#e7d8bf_100%)] px-4 py-6 text-black">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-4 border-black bg-[#fffef8] p-5 shadow-[10px_10px_0_0_#000]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.3em]">
                {kicker ?? "Panda Studio"}
              </p>
              <h1 className="text-3xl font-black uppercase leading-none md:text-5xl">
                {title}
              </h1>
              {summary ? (
                <p className="max-w-2xl text-sm md:text-base">{summary}</p>
              ) : null}
            </div>

            <div className="border-4 border-black bg-black p-4 text-[#f2eadf] shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Signed in as
              </p>
              <p className="mt-1 text-lg font-black">
                {user?.name ?? user?.email ?? "Team member"}
              </p>
              <p className="text-sm">{roleLabel}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={role ? roleHomePath(role) : "/"}
                  className="border-2 border-[#f2eadf] bg-[#f2eadf] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-black"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="border-2 border-[#f2eadf] bg-transparent px-3 py-2 text-xs font-black uppercase tracking-[0.2em]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <RoleNav />

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardShell;
