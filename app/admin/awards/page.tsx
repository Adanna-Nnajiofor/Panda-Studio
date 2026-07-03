"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type Award = {
  _id: string;
  title: string;
  issuer: string;
  year: number;
  category?: string;
  projectName?: string;
  externalUrl?: string;
  isPublished: boolean;
  sortOrder: number;
};

export default function AdminAwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ awards: Award[] }>("/awards/admin");
      setAwards(res.awards ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !issuer.trim()) return;

    setSaving(true);
    try {
      await apiJson("/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          issuer: issuer.trim(),
          year: Number(year),
          category: category.trim() || undefined,
          projectName: projectName.trim() || undefined,
          isPublished: true,
        }),
      });
      setTitle("");
      setIssuer("");
      setCategory("");
      setProjectName("");
      setYear(String(new Date().getFullYear()));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (award: Award) => {
    await apiJson(`/awards/${award._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !award.isPublished }),
    });
    await load();
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="Awards"
        summary="Manage public awards and recognition shown on the showcase page."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Award title"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Issuing body"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project (optional)"
              className="border-2 border-black px-3 py-2 text-sm md:col-span-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-fit border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              {saving ? "Saving..." : "Add award"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">Loading awards...</p>
            </article>
          ) : awards.length === 0 ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No awards yet.</p>
            </article>
          ) : (
            awards.map((award) => (
              <article
                key={award._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {award.year} · {award.isPublished ? "Published" : "Draft"}
                </p>
                <h3 className="mt-1 text-lg font-black uppercase">
                  {award.title}
                </h3>
                <p className="text-sm text-slate-600">{award.issuer}</p>
                {award.category ? (
                  <p className="mt-1 text-xs">Category: {award.category}</p>
                ) : null}
                {award.projectName ? (
                  <p className="mt-1 text-xs">Project: {award.projectName}</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => togglePublished(award)}
                  className="mt-3 border-2 border-black px-3 py-2 text-xs font-black uppercase"
                >
                  {award.isPublished ? "Unpublish" : "Publish"}
                </button>
              </article>
            ))
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
