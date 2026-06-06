import { ReactNode } from "react";
import RoleGate from "../../components/dashboard/RoleGate";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={["staff"]}>{children}</RoleGate>;
}
