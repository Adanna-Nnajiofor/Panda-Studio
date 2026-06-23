"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { getErrorMessage } from "../../lib/errors";
import EquipmentActions from "../../components/shopping/EquipmentActions";
import { useAuthContext } from "../../components/AuthProvider";
import AuthActionModal from "../../components/AuthActionModal";
import { EQUIPMENT_CATEGORIES } from "../../lib/studio";

type Equipment = {
  _id: string;
  name: string;
  type: string;
  description?: string;
  hourlyRate: number;
  quantity: number;
  images?: string[];
};

async function fetchCatalogEquipments(): Promise<Equipment[]> {
  const res = await fetch("/api/catalog/equipment", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `Request failed with status ${res.status}`,
    );
  }
  const data = await res.json();
  return data.equipment ?? [];
}

export default function EquipmentPage() {
  const { isAuthenticated } = useAuthContext();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCatalogEquipments();
      setEquipment(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load equipment catalog."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEquipment();
  }, [loadEquipment]);

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  const filtered =
    filter === "all"
      ? equipment
      : equipment.filter(
          (item) => item.type.toLowerCase() === filter.toLowerCase(),
        );

  return (
    <>
      <DashboardShell
        kicker="Equipment rental"
        title="Film & studio gear"
        summary="Browse cameras, lenses, lighting, audio, drones, and production accessories. Add gear to your booking when scheduling a session."
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`border-2 border-black px-3 py-1 text-xs font-black uppercase transition-colors ${filter === "all" ? "bg-black text-[#f2eadf]" : "bg-white hover:bg-gray-50"}`}
          >
            All
          </button>
          {EQUIPMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`border-2 border-black px-3 py-1 text-xs font-black uppercase transition-colors ${filter === cat ? "bg-black text-[#f2eadf]" : "bg-white hover:bg-gray-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
            <p className="text-sm font-black uppercase tracking-widest">
              Loading catalog...
            </p>
          </div>
        ) : error ? (
          <div className="mt-8 border-4 border-black bg-red-50 p-6 shadow-[6px_6px_0_0_#000]">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              onClick={() => void loadEquipment()}
              className="mt-4 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        ) : (
          <section className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="col-span-full border-4 border-black bg-white p-12 text-center shadow-[8px_8px_0_0_#000]">
                <p className="text-lg font-black uppercase">No gear found</p>
                <p className="mt-2 text-sm text-gray-600">
                  Try adjusting your filters or browse the full catalog.
                </p>
              </div>
            ) : null}
            {filtered.map((item) => (
              <article
                key={item._id}
                className="group border-4 border-black bg-white transition-transform hover:-translate-y-1 shadow-[8px_8px_0_0_#000]"
              >
                {/* Equipment image */}
                <div className="relative h-48 w-full overflow-hidden border-b-4 border-black bg-[#f2eadf]">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center opacity-40">
                      <span className="text-5xl">📷</span>
                    </div>
                  )}
                  {item.images && item.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 border-2 border-black bg-white px-2 py-0.5 text-[0.65rem] font-black uppercase">
                      +{item.images.length - 1} View
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-gray-500">
                    {item.type}
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase leading-tight">
                    {item.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-700 min-h-[2.5rem]">
                    {item.description ||
                      "Professional grade studio rental unit."}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t-2 border-black pt-4">
                    <p className="text-sm font-black uppercase tracking-widest">
                      ₦{item.hourlyRate.toLocaleString()}
                      <span className="ml-1 text-[0.65rem] text-gray-500">
                        / hr
                      </span>
                    </p>
                    <p className="text-[0.65rem] font-black uppercase text-gray-500">
                      Stock: {item.quantity}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    <EquipmentActions
                      equipmentId={item._id}
                      equipmentName={item.name}
                      compact
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/bookings/new?equipmentId=${encodeURIComponent(item._id)}`}
                        onClick={handleProtectedAction}
                        className="border-2 border-black bg-[#f2eadf] py-2.5 text-center text-[0.65rem] font-black uppercase tracking-[0.16em] hover:bg-[#e6d8c0] transition-colors"
                      >
                        Add to booking
                      </Link>
                      <Link
                        href={`/equipment/rent?equipmentId=${encodeURIComponent(item._id)}`}
                        onClick={handleProtectedAction}
                        className="border-2 border-black bg-white py-2.5 text-center text-[0.65rem] font-black uppercase tracking-[0.16em] hover:bg-gray-100 transition-colors"
                      >
                        Rent now
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </DashboardShell>

      <AuthActionModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message="Sign in to your Panda Studio account to rent gear, manage your cart, or add items to your production bookings."
      />
    </>
  );
}
