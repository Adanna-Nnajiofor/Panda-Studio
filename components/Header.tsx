"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "./AuthProvider";

const navigation = [
  { href: "/services", label: "Services" },
  { href: "/equipment", label: "Equipment" },
  { href: "/bookings", label: "My bookings" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold text-slate-900"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200/50">
            PS
          </span>
          <div className="text-sm leading-tight">
            <span className="block text-lg">Panda Studio</span>
            <span className="text-xs text-slate-500">
              Studio booking & workspace
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition ${
                pathname === item.href
                  ? "font-semibold text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition ${
                  pathname === "/dashboard"
                    ? "font-semibold text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/invoices"
                className={`text-sm transition ${
                  pathname === "/invoices"
                    ? "font-semibold text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Invoices
              </Link>
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <Link
                  href="/admin"
                  className="text-sm rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition hover:border-slate-300"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
