export const ROLES = ['client', 'admin', 'super_admin', 'crew', 'staff'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  client: 'Client',
  admin: 'Admin',
  super_admin: 'Super Admin',
  crew: 'Crew',
  staff: 'Staff',
};

export const ROLE_HOME_PATH: Record<Role, string> = {
  client: '/dashboard',
  admin: '/admin',
  super_admin: '/admin',
  crew: '/crew',
  staff: '/staff',
};

export const ROLE_DASHBOARD_COPY: Record<Role, string> = {
  client: 'Client command center.',
  admin: 'Admin control room.',
  super_admin: 'Super admin control room.',
  crew: 'Crew workbench.',
  staff: 'Staff operations desk.',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function roleLabel(role?: string | null): string {
  if (role && isRole(role)) return ROLE_LABELS[role];
  return 'Guest';
}

export function roleHomePath(role?: string | null): string {
  if (role && isRole(role)) return ROLE_HOME_PATH[role];
  return '/';
}

export function isPrivilegedRole(role?: string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isAdminRole(role?: string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}