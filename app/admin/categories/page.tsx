"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type Category = {
  _id: string;
  name: string;
  slug: string;
  type: "equipment" | "service" | "blog" | "general";
  description?: string;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("general");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ categories: Category[] }>("/categories");
      setCategories(res.categories ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiJson<{ success: boolean }>("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
        }),
      });
      setName("");
      setDescription("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (category: Category) => {
    await apiJson(`/categories/${category._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    await load();
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="Categories"
        summary="Manage category taxonomy for equipment, services, blog, and general sections."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <form
            onSubmit={create}
            className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Category["type"])}
              className="border-2 border-black px-3 py-2 text-sm"
            >
              <option value="general">general</option>
              <option value="equipment">equipment</option>
              <option value="service">service</option>
              <option value="blog">blog</option>
            </select>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">Loading categories...</p>
            </article>
          ) : categories.length === 0 ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No categories yet.</p>
            </article>
          ) : (
            categories.map((cat) => (
              <article
                key={cat._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]">
                      {cat.type}
                    </p>
                    <h3 className="mt-1 text-lg font-black uppercase">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500">/{cat.slug}</p>
                    {cat.description ? (
                      <p className="mt-2 text-sm">{cat.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(cat)}
                    className="border-2 border-black px-3 py-2 text-xs font-black uppercase"
                  >
                    {cat.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
