"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type StudioRoom = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  capacity: number;
  basePrice: number;
  isFeatured?: boolean;
  amenities?: string[];
  images?: string[];
};

export default function StudioRoomDetailsPage() {
  const params = useParams<{ id?: string | string[] }>();
  const roomId = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params]);

  const [room, setRoom] = useState<StudioRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError("Studio room not found.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiJson<{ room: StudioRoom }>(
          `/studio-rooms/${roomId}`,
        );
        setRoom(res.room ?? null);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Could not load studio room."));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [roomId]);

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Studio"
        title={room?.name ?? "Studio Room"}
        summary="Review room capacity, amenities, and gallery before booking your session."
      >
        {room?.isFeatured ? (
          <p className="inline-block border-2 border-black bg-[#fff2b8] px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
            Featured Studio Room
          </p>
        ) : null}

        {loading ? <p className="text-sm">Loading room...</p> : null}

        {!loading && error ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-4 text-sm font-black">
            {error}
          </p>
        ) : null}

        {!loading && !error && room ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                About this room
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {room.description || "No description provided yet."}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="border-2 border-black bg-[#fff8ea] p-3">
                  <p className="text-[11px] font-black uppercase text-slate-600">
                    Price
                  </p>
                  <p className="text-lg font-black">
                    ₦{room.basePrice.toLocaleString()}/hr
                  </p>
                </div>
                <div className="border-2 border-black bg-[#fff8ea] p-3">
                  <p className="text-[11px] font-black uppercase text-slate-600">
                    Capacity
                  </p>
                  <p className="text-lg font-black">{room.capacity} people</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  Amenities
                </p>
                {room.amenities?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No amenities listed yet.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  Actions
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/bookings/new?studioRoomId=${room._id}`}
                    className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
                  >
                    Book this room
                  </Link>
                  <Link
                    href="/studio-map"
                    className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase"
                  >
                    Back to map
                  </Link>
                </div>
              </div>

              <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  Gallery
                </p>
                {room.images?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {room.images.map((image) => (
                      <a
                        key={image}
                        href={image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={image}
                          alt={`${room.name} gallery`}
                          className="h-28 w-full border-2 border-black object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No gallery images yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </DashboardShell>
    </RoleGate>
  );
}
