"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson, apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";

type PortfolioItem = {
  _id: string;
  title: string;
  type: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  views: number;
};
type Portfolio = {
  bio?: string;
  showreelUrl?: string;
  isPublic: boolean;
  specialties?: string[];
  hourlyRate?: number;
  experienceYears?: number;
  location?: string;
  items: PortfolioItem[];
};

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [showreel, setShowreel] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await apiJson<{ portfolio: Portfolio }>("/portfolios/mine");
      setPortfolio(d.portfolio);
      setBio(d.portfolio.bio ?? "");
      setShowreel(d.portfolio.showreelUrl ?? "");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load portfolio."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/portfolios/mine", {
        method: "PUT",
        body: JSON.stringify({ bio, showreelUrl: showreel }),
        headers: { "Content-Type": "application/json" },
      });
      setEditing(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const TYPE_EMOJI: Record<string, string> = {
    video: "🎬",
    photo: "📷",
    audio: "🎙️",
    design: "🎨",
    other: "📁",
  };

  return (
    <RoleGate allowedRoles={["crew", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Crew"
        title="My Portfolio"
        summary="Showcase your work, specialties, and availability to potential clients."
      >
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        {portfolio && (
          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-black uppercase">
                          Bio
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="mt-1 w-full border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm font-black outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase">
                          Showreel URL
                        </label>
                        <input
                          value={showreel}
                          onChange={(e) => setShowreel(e.target.value)}
                          className="mt-1 w-full border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm font-black outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={save}
                          disabled={saving}
                          className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">
                        {portfolio.bio || "No bio yet."}
                      </p>
                      {portfolio.showreelUrl ? (
                        <a
                          href={portfolio.showreelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs font-black underline"
                        >
                          View Showreel →
                        </a>
                      ) : null}
                      {portfolio.specialties?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {portfolio.specialties.map((s) => (
                            <span
                              key={s}
                              className="border-2 border-black px-2 py-0.5 text-[0.6rem] font-black uppercase"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs font-black">
                        {portfolio.hourlyRate ? (
                          <span>
                            ₦{portfolio.hourlyRate.toLocaleString()}/hr
                          </span>
                        ) : null}
                        {portfolio.experienceYears ? (
                          <span>{portfolio.experienceYears} yrs exp</span>
                        ) : null}
                        {portfolio.location ? (
                          <span>📍 {portfolio.location}</span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="border-2 border-black px-3 py-2 text-xs font-black uppercase"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]">
                Portfolio Items ({portfolio.items.length})
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {portfolio.items.map((item) => (
                  <article
                    key={item._id}
                    className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000]"
                  >
                    <div className="flex h-36 items-center justify-center border-b-4 border-black bg-[#f2eadf] relative overflow-hidden">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-4xl">
                          {TYPE_EMOJI[item.type] ?? "📁"}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase">
                        {item.type}
                      </span>
                      <h3 className="mt-1 font-black uppercase">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-1 text-xs line-clamp-2">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[0.65rem] text-gray-500">
                        {item.views} views
                      </p>
                    </div>
                  </article>
                ))}
                {portfolio.items.length === 0 ? (
                  <p className="col-span-full text-sm text-gray-600">
                    No portfolio items yet. Add your work to showcase to
                    clients.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    </RoleGate>
  );
}
