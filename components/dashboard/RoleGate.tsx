"use client";

import type { ReactNode } from "react";
import { useAuthContext } from "../AuthProvider";
import { isRole, type Role } from "../../lib/roles";

type RoleGateProps = {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
        <p className="text-sm font-black uppercase tracking-[0.2em]">
          Loading access
        </p>
        <p className="mt-2 text-sm">Checking session and role permissions...</p>
      </div>
    );
  }

  const role = user?.role;

  const hasAccess =
    typeof role === "string" &&
    isRole(role) &&
    allowedRoles.includes(role as Role);

  if (!hasAccess) {
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
