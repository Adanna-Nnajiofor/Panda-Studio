"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuthContext } from "../AuthProvider";
import { ROLE_LABELS, roleHomePath, type Role } from "../../lib/roles";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  note?: string;
};

const NAV_ITEMS: NavItem[] = [
  // Client
  { href: "/dashboard", label: "Overview", roles: ["client"] },
  {
    href: "/bookings",
    label: "Bookings",
    roles: ["client", "admin", "super_admin", "staff"],
  },
  {
    href: "/bookings/new",
    label: "Book Session",
    roles: ["client", "admin", "super_admin"],
  },
  {
    href: "/services",
    label: "Services",
    roles: ["client", "admin", "super_admin"],
  },
  {
    href: "/equipment",
    label: "Equipment",
    roles: ["client", "admin", "super_admin", "staff"],
  },
  {
    href: "/equipment/rentals",
    label: "My Rentals",
    roles: ["client", "admin", "super_admin"],
  },
  {
    href: "/projects",
    label: "Projects",
    roles: ["client", "admin", "super_admin", "crew", "staff"],
  },
  {
    href: "/timeline",
    label: "Timeline",
    roles: ["client", "admin", "super_admin", "crew", "staff"],
  },
  {
    href: "/moodboard",
    label: "Mood Boards",
    roles: ["client", "crew", "admin", "super_admin"],
  },
  {
    href: "/discover",
    label: "Discover Crew",
    roles: ["client", "admin", "super_admin"],
  },
  { href: "/hire/mine", label: "Hire Requests", roles: ["client", "crew"] },
  {
    href: "/quotes",
    label: "Quotes",
    roles: ["client", "admin", "super_admin", "staff"],
  },
  {
    href: "/invoices",
    label: "Invoices",
    roles: ["client", "admin", "super_admin"],
  },
  {
    href: "/referrals",
    label: "Referrals",
    roles: ["client", "crew", "staff", "admin", "super_admin"],
  },
  // Shared
  {
    href: "/events",
    label: "Events",
    roles: ["client", "crew", "staff", "admin", "super_admin"],
  },
  {
    href: "/blog",
    label: "Blog",
    roles: ["client", "crew", "staff", "admin", "super_admin"],
  },
  {
    href: "/studio-map",
    label: "Studio Map",
    roles: ["client", "crew", "staff", "admin", "super_admin"],
  },
  {
    href: "/ai",
    label: "AI Tools",
    roles: ["client", "crew", "staff", "admin", "super_admin"],
  },
  // Crew
  { href: "/crew", label: "Crew Workbench", roles: ["crew"] },
  {
    href: "/portfolio",
    label: "My Portfolio",
    roles: ["crew", "admin", "super_admin"],
  },
  // Staff
  { href: "/staff", label: "Staff Desk", roles: ["staff"] },
  // Admin
  { href: "/admin", label: "Admin Overview", roles: ["admin", "super_admin"] },
  { href: "/analytics", label: "Analytics", roles: ["admin", "super_admin"] },
];

export function RoleNav() {
  const pathname = usePathname();
  const { user } = useAuthContext();

  const role = (user?.role as Role | undefined) ?? undefined;
  const items = useMemo(
    () =>
      NAV_ITEMS.filter((item) =>
        role ? item.roles.includes(role) : item.roles.includes("client"),
      ),
    [role],
  );

  const activeClass = "bg-black text-[#f2eadf]";
  const inactiveClass = "bg-white text-black hover:-translate-y-0.5";

  return (
    <nav className="border-4 border-black bg-[#f6e9d7] p-4 shadow-[8px_8px_0_0_#000]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em]">
            Navigation
          </p>
          <p className="mt-1 text-sm">
            {role ? `${ROLE_LABELS[role]} routes` : "Public routes"}
          </p>
        </div>
        {role ? (
          <Link
            href="/"
            className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#f2eadf]"
          >
            Home
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition-transform",
                isActive ? activeClass : inactiveClass,
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default RoleNav;
