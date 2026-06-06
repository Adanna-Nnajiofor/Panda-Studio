import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">Panda Studio</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Professional studio booking, equipment management, and client
            services in one sleek platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <Link href="/services" className="hover:text-slate-900">
            Services
          </Link>
          <Link href="/equipment" className="hover:text-slate-900">
            Equipment
          </Link>
          <Link href="/bookings" className="hover:text-slate-900">
            My bookings
          </Link>
          <Link href="/admin" className="hover:text-slate-900">
            Admin
          </Link>
          <Link href="/demo" className="hover:text-slate-900">
            Request demo
          </Link>
          <Link
            href="mailto:hello@panda.studio"
            className="hover:text-slate-900"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
