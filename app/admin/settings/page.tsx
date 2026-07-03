"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type Setting = {
  _id: string;
  key: string;
  value: unknown;
  scope: "public" | "admin" | "system";
  description?: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [scope, setScope] = useState<Setting["scope"]>("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ settings: Setting[] }>("/settings");
      setSettings(res.settings ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      let parsed: unknown = valueInput;
      try {
        parsed = JSON.parse(valueInput);
      } catch {
        parsed = valueInput;
      }
      await apiJson("/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput.trim(), value: parsed, scope }),
      });
      setKeyInput("");
      setValueInput("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <DashboardShell
        kicker="Super Admin"
        title="System Settings"
        summary="Configure public, admin, and system-level settings for Panda Studio."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <form
            onSubmit={save}
            className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]"
          >
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="setting.key"
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Setting["scope"])}
              className="border-2 border-black px-3 py-2 text-sm"
            >
              <option value="public">public</option>
              <option value="admin">admin</option>
              <option value="system">system</option>
            </select>
            <input
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder='Value (JSON or string), e.g. {"enabled": true}'
              className="border-2 border-black px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">Loading settings...</p>
            </article>
          ) : settings.length === 0 ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No settings yet.</p>
            </article>
          ) : (
            settings.map((setting) => (
              <article
                key={setting._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {setting.scope}
                </p>
                <h3 className="mt-1 text-lg font-black">{setting.key}</h3>
                <pre className="mt-2 overflow-x-auto border-2 border-black bg-[#f7f0e2] p-3 text-xs">
                  {JSON.stringify(setting.value, null, 2)}
                </pre>
              </article>
            ))
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
