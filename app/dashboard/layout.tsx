import { ReactNode } from 'react';
import RoleGate from '../../components/dashboard/RoleGate';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={['client']}>{children}</RoleGate>;
}