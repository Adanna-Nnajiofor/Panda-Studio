"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthContext } from "../AuthProvider";
import { isRole, type Role } from "../../lib/roles";

type RoleGateProps = {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
  allowAnonymous?: boolean;
};

export function RoleGate({
  allowedRoles,
  children,
  fallback,
  allowAnonymous = false,
}: RoleGateProps) {
  const { user, loading } = useAuthContext();

  // Hydration-safe: render a stable placeholder until auth is resolved on the client.
  // DashboardShell/RoleGate currently depend on user data; rendering the same structure
  // first avoids server/client markup differences.
  const shouldBlock = loading && !allowAnonymous;

  const role = user?.role;

  if (shouldBlock) {
    return (
      <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
        <p className="text-sm font-black uppercase tracking-[0.2em]">
          Loading access
        </p>
        <p className="mt-2 text-sm">Checking session and role permissions...</p>
      </div>
    );
  }

  const hasAccess =
    allowAnonymous ||
    (typeof role === "string" &&
      isRole(role) &&
      allowedRoles.includes(role as Role));

  if (!hasAccess) {
    if (!user) {
      return (
        fallback ?? (
          <div className="border-4 border-black bg-[#ffefc7] p-6 shadow-[6px_6px_0_0_#000]">
            <p className="text-sm font-black uppercase tracking-[0.2em]">
              Login required
            </p>
            <p className="mt-2 text-sm">
              Sign in or register to access booking and rental flows.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
              >
                Register
              </Link>
            </div>
          </div>
        )
      );
    }

    return (
      fallback ?? (
        <div className="border-4 border-black bg-[#ffefc7] p-6 shadow-[6px_6px_0_0_#000]">
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Access denied
          </p>
          <p className="mt-2 text-sm">
            This area is not available for your current role.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export default RoleGate;
