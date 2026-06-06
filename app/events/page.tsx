"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson, apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Event = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type: string;
  capacity?: number;
  registrations?: string[];
  coverImage?: string;
  isFree: boolean;
  price?: number;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ events: Event[] }>("/events")
      .then((d) => setEvents(d.events ?? []))
      .catch((e) => setError(getErrorMessage(e, "Failed to load events.")))
      .finally(() => setLoading(false));
  }, []);

  const register = async (id: string) => {
    setRegistering(id);
    try {
      await apiFetch(`/events/${id}/register`, { method: "POST" });
    } finally {
      setRegistering(null);
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Community"
        title="Events"
        summary="Workshops, masterclasses, networking sessions, and studio open days."
      >
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <article
              key={ev._id}
              className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
            >
              {ev.coverImage ? (
                <div className="h-40 w-full overflow-hidden border-b-4 border-black relative">
                  <Image
                    src={ev.coverImage}
                    alt={ev.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center border-b-4 border-black bg-[#f2eadf] text-4xl">
                  🎬
                </div>
              )}
              <div className="p-5">
                <span className="border-2 border-black px-2 py-0.5 text-[0.6rem] font-black uppercase">
                  {ev.type}
                </span>
                <h2 className="mt-2 text-lg font-black uppercase">
                  {ev.title}
                </h2>
                {ev.description ? (
                  <p className="mt-1 text-sm line-clamp-2">{ev.description}</p>
                ) : null}
                <p className="mt-2 text-xs font-black">
                  {new Date(ev.date).toLocaleDateString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {ev.location ? (
                  <p className="text-xs text-gray-600">📍 {ev.location}</p>
                ) : null}
                <p className="mt-1 text-xs font-black">
                  {ev.isFree ? "Free" : `₦${ev.price?.toLocaleString()}`}
                </p>
                <button
                  onClick={() => register(ev._id)}
                  disabled={registering === ev._id}
                  className="mt-3 border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
                >
                  {registering === ev._id ? "Registering..." : "Register"}
                </button>
              </div>
            </article>
          ))}
          {!loading && events.length === 0 ? (
            <p className="col-span-full text-sm text-gray-600">
              No upcoming events. Check back soon.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
