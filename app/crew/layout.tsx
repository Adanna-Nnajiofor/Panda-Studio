import { ReactNode } from 'react';
import RoleGate from '../../components/dashboard/RoleGate';

export default function CrewLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={['crew']}>{children}</RoleGate>;
}