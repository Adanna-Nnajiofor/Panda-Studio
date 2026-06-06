"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson, apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type Board = {
  _id: string;
  title: string;
  isPublic: boolean;
  items: { type: string; url?: string; color?: string }[];
  updatedAt: string;
};

export default function MoodboardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await apiJson<{ boards: Board[] }>("/moodboards/mine");
      setBoards(d.boards ?? []);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/moodboards", {
        method: "POST",
        body: JSON.stringify({ title }),
        headers: { "Content-Type": "application/json" },
      });
      setTitle("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "crew", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Creative"
        title="Mood Boards"
        summary="Collect visual references, colours, and ideas for your production sessions."
      >
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title..."
            className="flex-1 border-4 border-black bg-[#fff8ea] px-4 py-2 text-sm font-black outline-none"
          />
          <button
            onClick={create}
            disabled={saving || !title.trim()}
            className="border-4 border-black bg-black px-5 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <article
              key={b._id}
              className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-black uppercase">{b.title}</h2>
                <span
                  className={`border-2 border-black px-2 py-0.5 text-[0.65rem] font-black uppercase ${b.isPublic ? "bg-black text-[#f2eadf]" : "bg-white"}`}
                >
                  {b.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.2em]">
                {b.items.length} item{b.items.length !== 1 ? "s" : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {b.items.slice(0, 6).map((item, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 border-2 border-black overflow-hidden relative"
                    style={item.color ? { background: item.color } : {}}
                  >
                    {item.url ? (
                      <Image
                        src={item.url}
                        alt={`Mood item ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[0.65rem] text-gray-500">
                Updated {new Date(b.updatedAt).toLocaleDateString()}
              </p>
            </article>
          ))}
          {!loading && boards.length === 0 ? (
            <p className="col-span-full text-sm text-gray-600">
              No mood boards yet. Create your first one above.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
