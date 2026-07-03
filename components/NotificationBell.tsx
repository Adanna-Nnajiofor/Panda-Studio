"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiJson } from "../lib/api";

type AppNotification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  booking: "📅",
  payment: "💳",
  message: "💬",
  file_ready: "📁",
  crew_application: "🎬",
  account_approved: "✅",
  project_update: "🗂️",
  reminder: "⏰",
  system: "🔔",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await apiJson<{
          notifications: AppNotification[];
          unreadCount: number;
        }>("/notifications");
        if (!mounted) return;
        setNotifications(res.notifications ?? []);
        setUnread(res.unreadCount ?? 0);
      } catch {
        // silent
      }
    };

    // initial load (async inside effect to avoid synchronous setState)
    void load();

    const interval = setInterval(() => {
      void load();
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markOne = async (id: string) => {
    await apiJson(`/notifications/${id}/read`, { method: "PATCH" }).catch(
      () => null,
    );
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAll = async () => {
    setLoading(true);
    await apiJson("/notifications/read-all", { method: "PATCH" }).catch(
      () => null,
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setLoading(false);
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiJson(`/notifications/${id}`, { method: "DELETE" }).catch(
      () => null,
    );
    const deleted = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (deleted && !deleted.isRead) setUnread((u) => Math.max(0, u - 1));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-lg shadow-[3px_3px_0_0_#000] transition hover:bg-[#fff8ea]"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-black text-[10px] font-black text-[#f2eadf]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 border-4 border-black bg-white shadow-[8px_8px_0_0_#000] sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-black bg-[#fffef8] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Notifications{" "}
              {unread > 0 && (
                <span className="ml-1 text-black">({unread})</span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={loading}
                className="text-xs font-black uppercase tracking-[0.15em] underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-105 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl">🔔</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.2em]">
                  All caught up
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  No notifications yet.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markOne(n._id)}
                  className={[
                    "group relative border-b border-slate-100 px-4 py-3 transition",
                    n.isRead
                      ? "bg-white"
                      : "bg-[#fffbf0] cursor-pointer hover:bg-[#fff8ea]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg leading-none">
                      {TYPE_ICON[n.type] ?? "🔔"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          "text-sm leading-snug",
                          n.isRead ? "font-medium" : "font-black",
                        ].join(" ")}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {timeAgo(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />
                        )}
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black uppercase tracking-[0.15em] underline"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => deleteOne(n._id, e)}
                      className="ml-1 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-black"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t-4 border-black bg-[#fffef8] px-4 py-2 text-center">
              <button
                type="button"
                onClick={async () => {
                  await apiJson("/notifications", { method: "DELETE" }).catch(
                    () => null,
                  );
                  setNotifications([]);
                  setUnread(0);
                }}
                className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 underline hover:text-black"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
