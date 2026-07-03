"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

const SPACES = [
  {
    id: "main-studio",
    label: "Main Studio",
    size: "col-span-2 row-span-2",
    emoji: "🎬",
    desc: "4K cinema setup, cyclorama wall, full lighting grid",
  },
  {
    id: "podcast-booth",
    label: "Podcast Booth",
    size: "col-span-1 row-span-1",
    emoji: "🎙️",
    desc: "Soundproofed, 4-mic setup, acoustic panels",
  },
  {
    id: "green-room",
    label: "Green Room",
    size: "col-span-1 row-span-1",
    emoji: "🪑",
    desc: "Client waiting area, makeup station",
  },
  {
    id: "edit-suite",
    label: "Edit Suite",
    size: "col-span-1 row-span-1",
    emoji: "🖥️",
    desc: "DaVinci Resolve, 4K monitors, colour grading",
  },
  {
    id: "equipment-bay",
    label: "Equipment Bay",
    size: "col-span-1 row-span-1",
    emoji: "📦",
    desc: "Gear storage, checkout counter",
  },
  {
    id: "outdoor-terrace",
    label: "Outdoor Terrace",
    size: "col-span-2 row-span-1",
    emoji: "🌿",
    desc: "Natural light shoots, rooftop backdrop",
  },
];

const INFO = [
  { label: "Address", value: "Panda Studio, Victoria Island, Lagos, Nigeria" },
  { label: "Hours", value: "Mon–Sat: 8am – 10pm · Sun: 10am – 6pm" },
  { label: "Parking", value: "Free on-site parking for up to 10 vehicles" },
  { label: "Contact", value: "studio@pandastudio.ng · +234 800 PANDA" },
];

type StudioRoom = {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  capacity: number;
  isFeatured?: boolean;
  amenities?: string[];
};

export default function StudioMapPage() {
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await apiJson<{ rooms: StudioRoom[] }>("/studio-rooms");
        setRooms(res.rooms ?? []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Could not load studio rooms."));
      } finally {
        setLoadingRooms(false);
      }
    };

    void loadRooms();
  }, []);

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Facility"
        title="Studio Map"
        summary="Explore our studio spaces, facilities, and amenities before your session."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Floor plan */}
          <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em]">
              Floor Plan — Ground Level
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SPACES.map((s) => (
                <div
                  key={s.id}
                  className={`border-4 border-black bg-[#f2eadf] p-3 ${s.size}`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <p className="mt-1 text-xs font-black uppercase">{s.label}</p>
                  <p className="mt-1 text-[0.6rem] text-gray-600 leading-tight">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Info + amenities */}
          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">
                Studio Info
              </p>
              {INFO.map((i) => (
                <div
                  key={i.label}
                  className="border-b border-black py-2 last:border-0"
                >
                  <p className="text-[0.65rem] font-black uppercase text-gray-500">
                    {i.label}
                  </p>
                  <p className="text-sm font-black">{i.value}</p>
                </div>
              ))}
            </div>
            <div className="border-4 border-black bg-black p-5 text-[#f2eadf] shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Book a Space
              </p>
              <p className="mt-2 text-sm">
                All studio spaces are bookable through the services page.
                Contact us for custom configurations or multi-day productions.
              </p>
              <a
                href="/services"
                className="mt-4 inline-block border-2 border-[#f2eadf] px-4 py-2 text-xs font-black uppercase"
              >
                View Services →
              </a>
            </div>

            <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">
                Live Studio Rooms
              </p>

              {loadingRooms ? (
                <p className="text-sm text-slate-500">Loading rooms...</p>
              ) : error ? (
                <p className="text-sm text-red-700">{error}</p>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No active rooms available yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      className="border-2 border-black bg-[#fff8ea] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black">{room.name}</p>
                        {room.isFeatured ? (
                          <span className="border border-black bg-[#fff2b8] px-1.5 py-0.5 text-[10px] font-black uppercase">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        ₦{room.basePrice.toLocaleString()}/hr · Capacity{" "}
                        {room.capacity}
                      </p>
                      {room.description ? (
                        <p className="mt-1 text-xs text-slate-600">
                          {room.description}
                        </p>
                      ) : null}
                      {room.amenities?.length ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {room.amenities.slice(0, 4).join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href={`/studio-rooms/${room._id}`}
                          className="inline-block border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase"
                        >
                          View details
                        </Link>
                        <Link
                          href={`/bookings/new?studioRoomId=${room._id}`}
                          className="inline-block border-2 border-black px-2 py-1 text-[11px] font-black uppercase"
                        >
                          Book this room
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
