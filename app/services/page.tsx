"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Service = {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  durationInHours: number;
  slug?: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<Service[]>("/services");
        setServices(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load services."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Services"
        title="Book studio & production services"
        summary="Photography, video, podcast, branding, film production, and post-production — all bookable in one place."
      >
        {loading ? <p>Loading services...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-4 lg:grid-cols-3">
          {!loading && services.length === 0 ? (
            <p className="text-sm text-gray-700">
              No services in the catalog yet. An admin can add services via the
              API.
            </p>
          ) : null}
          {services.map((service) => (
            <article
              key={service._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <h2 className="text-xl font-black uppercase">{service.name}</h2>
              <p className="mt-2 text-sm">
                {service.description || "Studio service package."}
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.2em]">
                ₦{service.basePrice.toLocaleString()} ·{" "}
                {service.durationInHours}h
              </p>
              <Link
                href={`/bookings/new?serviceId=${encodeURIComponent(service._id)}`}
                className="mt-4 inline-block border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
              >
                Book session
              </Link>
            </article>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
