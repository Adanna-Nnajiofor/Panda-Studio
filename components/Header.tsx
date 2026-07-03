"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "./AuthProvider";
import ShoppingHeaderIcons from "./shopping/ShoppingHeaderIcons";
import { useShopping } from "./shopping/ShoppingProvider";
import NotificationBell from "./NotificationBell";

const navigation = [
  { href: "/showcase", label: "Showcase" },
  { href: "/services", label: "Services" },
  { href: "/equipment", label: "Equipment" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { cartCount, wishlistCount } = useShopping();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const navItemClass = (href: string) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      isActive(href)
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="min-w-0 flex items-center gap-2.5 font-semibold text-slate-900 sm:gap-3"
          onClick={closeMenu}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200/50 sm:h-11 sm:w-11">
            PS
          </span>
          <div className="min-w-0 text-sm leading-tight">
            <span className="block truncate text-base sm:text-lg">
              Panda Studio
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Studio booking & workspace
            </span>
          </div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-2 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navItemClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            aria-label="Search"
          >
            Search
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={
                    navItemClass("/dashboard") +
                    " border border-slate-200 bg-white text-slate-900"
                  }
                >
                  Workspace
                </Link>
                {(user?.role === "admin" || user?.role === "super_admin") && (
                  <Link
                    href="/admin"
                    className={
                      navItemClass("/admin") +
                      " border border-slate-200 bg-white text-slate-900"
                    }
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : null}
            <Link
              href="/search"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Search
            </Link>
            <ShoppingHeaderIcons />
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition hover:border-slate-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 lg:hidden"
          >
            <span className="text-2xl leading-none">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <section className="absolute inset-x-0 top-full z-[100] border-t border-slate-200 bg-white shadow-2xl lg:hidden">
          <div className="mx-auto flex max-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-4 overflow-y-auto px-4 pb-5 pt-3 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <span>Cart</span>
                <span className="rounded-full bg-black px-2 py-1 text-[11px] font-black text-[#f2eadf]">
                  {cartCount}
                </span>
              </Link>
              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <span>Wishlist</span>
                <span className="rounded-full bg-black px-2 py-1 text-[11px] font-black text-[#f2eadf]">
                  {wishlistCount}
                </span>
              </Link>
              <Link
                href="/search"
                onClick={closeMenu}
                className="col-span-2 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Search
              </Link>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Explore
              </p>
              <nav className="grid gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={
                      navItemClass(item.href) +
                      " block rounded-2xl bg-slate-50 px-4 py-3 text-left"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Workspace
                </p>
                <div className="grid gap-2">
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className={
                      navItemClass("/dashboard") +
                      " block rounded-2xl bg-slate-50 px-4 py-3 text-left"
                    }
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={closeMenu}
                    className={
                      navItemClass("/bookings") +
                      " block rounded-2xl bg-slate-50 px-4 py-3 text-left"
                    }
                  >
                    My bookings
                  </Link>
                  <Link
                    href="/invoices"
                    onClick={closeMenu}
                    className={
                      navItemClass("/invoices") +
                      " block rounded-2xl bg-slate-50 px-4 py-3 text-left"
                    }
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/settings/security"
                    onClick={closeMenu}
                    className={
                      navItemClass("/settings/security") +
                      " block rounded-2xl bg-slate-50 px-4 py-3 text-left"
                    }
                  >
                    Security
                  </Link>
                  {user?.role === "client" &&
                    (user?.requestedRole === "crew" ? (
                      <span className="block rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">
                        Crew Application - Pending
                      </span>
                    ) : (
                      <Link
                        href="/become-crew"
                        onClick={closeMenu}
                        className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        Become a Crew Member
                      </Link>
                    ))}
                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      Admin section
                    </Link>
                  )}
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 border-t border-slate-200 pt-4">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="block rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </header>
  );
}
