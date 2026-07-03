"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { getErrorMessage } from "../../lib/errors";
import { useAuthContext } from "../../components/AuthProvider";
import AuthActionModal from "../../components/AuthActionModal";

type Service = {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  durationInHours: number;
  slug?: string;
};

async function fetchCatalogServices(): Promise<Service[]> {
  const res = await fetch("/api/catalog/services", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `Request failed with status ${res.status}`,
    );
  }
  const data = await res.json();
  return data.services ?? [];
}

export default function ServicesPage() {
  const { isAuthenticated } = useAuthContext();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCatalogServices();
      setServices(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load studio services."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <DashboardShell
        kicker="Studio modules"
        title="Production services"
        summary="Photography, video, podcast, branding, film production, and post-production — all bookable in one unified cinematic workspace."
      >
        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 py-16">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-black border-t-transparent" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">
              Opening the vault...
            </p>
          </div>
        ) : error ? (
          <div className="mt-8 border-4 border-black bg-red-50 p-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              onClick={() => void loadServices()}
              className="mt-6 border-2 border-black bg-white px-6 py-2.5 text-xs font-black uppercase hover:bg-gray-50 transition-all active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {!loading && services.length === 0 ? (
              <div className="col-span-full border-4 border-black bg-white p-16 text-center shadow-[10px_10px_0_0_#000]">
                <p className="text-xl font-black uppercase text-gray-300 tracking-tighter">
                  No active services
                </p>
                <p className="mt-2 text-sm text-gray-500 italic">
                  Check back later for updated production packages.
                </p>
              </div>
            ) : null}
            {services.map((service) => (
              <article
                key={service._id}
                className="group flex flex-col border-4 border-black bg-white p-5 sm:p-6 lg:p-8 shadow-[8px_8px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#000] sm:hover:shadow-[14px_14px_0_0_#000]"
              >
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-black uppercase leading-[0.95] tracking-tight break-words group-hover:text-gray-800 transition-colors">
                    {service.name}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-gray-700">
                    {service.description ||
                      "Premium studio service package tailored for world-class production outputs."}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t-2 border-black pt-5 sm:mt-8 sm:pt-6">
                  <div className="space-y-0.5">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400">
                      Base Price
                    </p>
                    <p className="text-xl font-black">
                      ₦{service.basePrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400">
                      Duration
                    </p>
                    <p className="text-xl font-black">
                      {service.durationInHours}h
                    </p>
                  </div>
                </div>

                <Link
                  href={`/bookings/new?serviceId=${encodeURIComponent(service._id)}`}
                  onClick={handleProtectedAction}
                  className="mt-6 sm:mt-8 block w-full border-4 border-black bg-black py-3.5 text-center text-[0.7rem] sm:text-[0.75rem] font-black uppercase tracking-[0.14em] sm:tracking-[0.25em] text-[#f2eadf] hover:bg-gray-800 transition-all active:scale-95 shadow-[4px_4px_0_0_#ddd] group-hover:shadow-[6px_6px_0_0_#aaa]"
                >
                  Book now
                </Link>
              </article>
            ))}
          </section>
        )}
      </DashboardShell>

      <AuthActionModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message="Authentication is required to start a booking. Please sign in to choose dates and finalize your session details."
      />
    </>
  );
}
