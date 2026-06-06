"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { EQUIPMENT_CATEGORIES } from "../../lib/studio";
import { getErrorMessage } from "../../lib/errors";

type Equipment = {
  _id: string;
  name: string;
  type: string;
  description?: string;
  hourlyRate: number;
  quantity: number;
  images?: string[];
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ equipment: Equipment[] }>("/equipment");
        setEquipment(data.equipment ?? []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load equipment."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered =
    filter === "all"
      ? equipment
      : equipment.filter(
          (item) => item.type.toLowerCase() === filter.toLowerCase(),
        );

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="Equipment rental"
        title="Film & studio gear"
        summary="Browse cameras, lenses, lighting, audio, drones, and production accessories. Add gear to your booking when scheduling a session."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${filter === "all" ? "bg-black text-[#f2eadf]" : "bg-white"}`}
          >
            All
          </button>
          {EQUIPMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${filter === cat ? "bg-black text-[#f2eadf]" : "bg-white"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? <p className="mt-4">Loading equipment...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!loading && filtered.length === 0 ? (
            <p className="text-sm">
              No equipment listed yet for this category.
            </p>
          ) : null}
          {filtered.map((item) => (
            <article
              key={item._id}
              className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
            >
              {/* Equipment image */}
              {item.images && item.images.length > 0 ? (
                <div className="relative h-48 w-full overflow-hidden border-b-4 border-black">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    sizes="100vw"
                    unoptimized
                    className="object-cover"
                  />
                  {item.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 border-2 border-black bg-white px-2 py-0.5 text-xs font-black">
                      +{item.images.length - 1} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center border-b-4 border-black bg-[#f2eadf]">
                  <span className="text-4xl">📷</span>
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em]">
                  {item.type}
                </p>
                <h2 className="mt-2 text-xl font-black uppercase">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm">
                  {item.description || "Professional rental unit."}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em]">
                  ₦{item.hourlyRate.toLocaleString()}/hr · Qty {item.quantity}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/bookings/new?equipmentId=${encodeURIComponent(item._id)}`}
                    className="border-2 border-black bg-[#f2eadf] px-3 py-2 text-xs font-black uppercase tracking-[0.16em]"
                  >
                    Add to booking
                  </Link>
                  <Link
                    href={`/equipment/rent?equipmentId=${encodeURIComponent(item._id)}`}
                    className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
                  >
                    Rent gear
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
