"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";
import Link from "next/link";

type CalEvent = {
  _id: string;
  startAt: string;
  endAt: string;
  label: string;
  type:
    | "booking"
    | "project"
    | "rental"
    | "event"
    | "manual"
    | "shoot_call"
    | "dpr";
  status?: string;
  link?: string;
};

const TYPE_COLOR: Record<string, string> = {
  booking: "bg-black text-[#f2eadf]",
  project: "bg-[#ffefc7] text-black border border-black",
  rental: "bg-[#d8f0dd] text-black border border-black",
  event: "bg-[#d8e7ff] text-black border border-black",
  manual: "bg-[#fce0f7] text-black border border-black",
  shoot_call: "bg-[#ffe1c2] text-black border border-black",
  dpr: "bg-[#e7e7e7] text-black border border-black",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const last = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
      const data = await apiJson<{ events: any[] }>(
        `/calendar/events?from=${from}&to=${to}`,
      );

      const all: CalEvent[] = (data.events ?? []).map((e) => {
        const startAt =
          typeof e.startAt === "string"
            ? e.startAt
            : new Date(e.startAt).toISOString();
        const eventType =
          e.eventType === "booking" ||
          e.eventType === "project" ||
          e.eventType === "rental" ||
          e.eventType === "event" ||
          e.eventType === "manual" ||
          e.eventType === "shoot_call" ||
          e.eventType === "dpr"
            ? e.eventType
            : "manual";
        return {
          _id: e._id,
          startAt,
          endAt: typeof e.endAt === "string" ? e.endAt : startAt,
          label: String(e.title ?? "Calendar event"),
          type: eventType,
          status: typeof e.status === "string" ? e.status : undefined,
          link:
            eventType === "booking"
              ? "/bookings"
              : eventType === "project"
                ? "/projects"
                : eventType === "rental"
                  ? "/equipment/rentals"
                  : undefined,
        };
      });

      setEvents(all);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const cells = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      const date = e.startAt.slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(e);
    }
    return map;
  }, [events]);

  const syncCalendar = async () => {
    setSyncing(true);
    try {
      await apiJson<{ success: boolean }>("/calendar/events/sync", {
        method: "POST",
      });
      await fetchEvents();
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const selectedDateStr = selectedDay
    ? isoDate(year, month, selectedDay)
    : null;
  const selectedEvents = selectedDateStr
    ? (eventsByDate[selectedDateStr] ?? [])
    : [];

  const todayStr = isoDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Schedule"
        title="Calendar"
        summary="View your bookings, project deadlines, and equipment rentals in one place."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Calendar grid */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
            {/* Month nav */}
            <div className="flex items-center justify-between border-b-4 border-black bg-[#fffef8] px-5 py-4">
              <button
                type="button"
                onClick={prevMonth}
                className="border-2 border-black bg-white px-3 py-1 text-sm font-black hover:bg-[#fff8ea]"
              >
                ←
              </button>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                {MONTHS[month]} {year}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="border-2 border-black bg-white px-3 py-1 text-sm font-black hover:bg-[#fff8ea]"
              >
                →
              </button>
            </div>
            <div className="flex justify-end border-b-2 border-black bg-[#fff8ea] px-4 py-2">
              <button
                type="button"
                onClick={syncCalendar}
                className="border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#f2eadf]"
                disabled={syncing}
              >
                {syncing ? "Syncing..." : "Sync from bookings/projects/rentals"}
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b-2 border-black">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-black uppercase tracking-[0.15em] text-slate-500"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm font-black uppercase tracking-[0.2em]">
                  Loading…
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const dateStr = day ? isoDate(year, month, day) : null;
                  const dayEvents = dateStr
                    ? (eventsByDate[dateStr] ?? [])
                    : [];
                  const isToday = dateStr === todayStr;
                  const isSelected = day === selectedDay;

                  return (
                    <div
                      key={i}
                      onClick={() =>
                        day && setSelectedDay(day === selectedDay ? null : day)
                      }
                      className={[
                        "min-h-[72px] border-b border-r border-slate-100 p-1.5 transition",
                        day
                          ? "cursor-pointer hover:bg-[#fffbf0]"
                          : "bg-slate-50",
                        isSelected
                          ? "bg-[#fff8ea] ring-2 ring-inset ring-black"
                          : "",
                      ].join(" ")}
                    >
                      {day && (
                        <>
                          <span
                            className={[
                              "flex h-6 w-6 items-center justify-center text-xs font-black",
                              isToday
                                ? "rounded-full bg-black text-[#f2eadf]"
                                : "",
                            ].join(" ")}
                          >
                            {day}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.slice(0, 2).map((e) => (
                              <div
                                key={e._id}
                                className={`truncate rounded px-1 py-0.5 text-[10px] font-black ${TYPE_COLOR[e.type]}`}
                              >
                                {e.label}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] font-black text-slate-400">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="border-4 border-black bg-[#fffef8] p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Legend
              </p>
              <div className="mt-3 space-y-2">
                {[
                  { type: "booking", label: "Bookings" },
                  { type: "project", label: "Project deadlines" },
                  { type: "rental", label: "Equipment rentals" },
                  { type: "event", label: "Events" },
                ].map((l) => (
                  <div key={l.type} className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-sm border border-black ${TYPE_COLOR[l.type].split(" ")[0]}`}
                    />
                    <span className="text-xs font-black uppercase tracking-[0.1em]">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected day events */}
            <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                {selectedDay
                  ? `${MONTHS[month]} ${selectedDay}, ${year}`
                  : "Select a day"}
              </p>

              {selectedDay && selectedEvents.length === 0 && (
                <p className="mt-3 text-sm text-slate-500">
                  No events on this day.
                </p>
              )}

              {selectedEvents.map((e) => (
                <div key={e._id} className="mt-3 border-2 border-black p-3">
                  <div
                    className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase ${TYPE_COLOR[e.type]}`}
                  >
                    {e.type}
                  </div>
                  <p className="mt-1 text-sm font-black">{e.label}</p>
                  {e.status && (
                    <p className="text-xs text-slate-500 capitalize">
                      {e.status}
                    </p>
                  )}
                  {e.link && (
                    <Link
                      href={e.link}
                      className="mt-2 block text-xs font-black uppercase tracking-[0.15em] underline"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="border-4 border-black bg-[#fff8ea] p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Quick actions
              </p>
              <div className="mt-3 space-y-2">
                <Link
                  href="/bookings/new"
                  className="block border-2 border-black bg-black px-4 py-2 text-center text-xs font-black uppercase tracking-[0.15em] text-[#f2eadf]"
                >
                  + New booking
                </Link>
                <Link
                  href="/bookings"
                  className="block border-2 border-black bg-white px-4 py-2 text-center text-xs font-black uppercase tracking-[0.15em]"
                >
                  All bookings
                </Link>
                <Link
                  href="/projects"
                  className="block border-2 border-black bg-white px-4 py-2 text-center text-xs font-black uppercase tracking-[0.15em]"
                >
                  All projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
