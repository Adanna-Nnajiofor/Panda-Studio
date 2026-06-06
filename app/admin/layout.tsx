import { ReactNode } from 'react';
import RoleGate from '../../components/dashboard/RoleGate';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={['admin', 'super_admin']}>{children}</RoleGate>;
}