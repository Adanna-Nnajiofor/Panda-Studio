"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type SessionItem = {
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  lastSeenAt?: string;
  createdAt?: string;
  isCurrent?: boolean;
};

type LoginHistoryItem = {
  _id: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  deviceName?: string;
  failureReason?: string;
  createdAt: string;
};

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupOtpUrl, setSetupOtpUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const hasSetupInProgress = useMemo(() => Boolean(setupSecret), [setupSecret]);

  const load = async () => {
    setPending(true);
    setError(null);
    try {
      const [meRes, sessionsRes, historyRes] = await Promise.all([
        apiJson<{ user?: { twoFactorEnabled?: boolean } }>("/auth/me"),
        apiJson<{ sessions?: SessionItem[] }>("/auth/sessions"),
        apiJson<{ history?: LoginHistoryItem[] }>(
          "/auth/login-history?limit=20",
        ),
      ]);

      setTwoFactorEnabled(Boolean(meRes.user?.twoFactorEnabled));
      setSessions(sessionsRes.sessions ?? []);
      setHistory(historyRes.history ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load security settings",
      );
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setupTwoFactor = async () => {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiJson<{
        secret: string;
        otpauthUrl: string;
        backupCodes: string[];
      }>("/auth/2fa/setup", {
        method: "POST",
      });
      setSetupSecret(res.secret);
      setSetupOtpUrl(res.otpauthUrl);
      setBackupCodes(res.backupCodes ?? []);
      setMessage(
        "Two-factor setup initialized. Confirm with a code to enable it.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set up 2FA");
    } finally {
      setPending(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!verifyCode.trim()) {
      setError("Enter the authenticator code.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await apiJson("/auth/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ code: verifyCode.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      setTwoFactorEnabled(true);
      setSetupSecret(null);
      setSetupOtpUrl(null);
      setVerifyCode("");
      setMessage("Two-factor authentication enabled.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enable 2FA");
    } finally {
      setPending(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode.trim()) {
      setError("Enter your authenticator code to disable 2FA.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await apiJson("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ code: disableCode.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      setTwoFactorEnabled(false);
      setDisableCode("");
      setMessage("Two-factor authentication disabled.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable 2FA");
    } finally {
      setPending(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setPending(true);
    setError(null);
    try {
      await apiJson(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke session");
    } finally {
      setPending(false);
    }
  };

  const revokeOthers = async () => {
    setPending(true);
    setError(null);
    try {
      await apiJson("/auth/sessions", { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke sessions");
    } finally {
      setPending(false);
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Account"
        title="Security and sessions"
        summary="Manage two-factor authentication, active devices, and login activity."
      >
        {error ? (
          <p className="border-4 border-black bg-[#ffcfbf] p-3 text-sm font-black">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="border-4 border-black bg-[#d8f0dd] p-3 text-sm font-black">
            {message}
          </p>
        ) : null}

        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-lg font-black uppercase">
            Two-factor authentication
          </h2>
          <p className="mt-2 text-sm">
            Status: {twoFactorEnabled ? "Enabled" : "Disabled"}
          </p>

          {!twoFactorEnabled ? (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={pending}
                onClick={setupTwoFactor}
                className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
              >
                {pending ? "Working..." : "Setup 2FA"}
              </button>

              {hasSetupInProgress ? (
                <div className="space-y-3 border-2 border-black bg-[#fff8ea] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    Setup secret
                  </p>
                  <p className="break-all text-sm">{setupSecret}</p>
                  {setupOtpUrl ? (
                    <a
                      href={setupOtpUrl}
                      className="text-xs font-black uppercase underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open authenticator link
                    </a>
                  ) : null}

                  {backupCodes.length > 0 ? (
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">
                        Backup codes
                      </p>
                      <div className="mt-2 grid gap-1 text-sm">
                        {backupCodes.map((code) => (
                          <span key={code}>{code}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="Enter app code to enable"
                      className="w-full border-2 border-black px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={enableTwoFactor}
                      disabled={pending}
                      className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
                    >
                      Confirm enable
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Authenticator code"
                className="w-full border-2 border-black px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={disableTwoFactor}
                disabled={pending}
                className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-60"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </section>

        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">Active sessions</h2>
            <button
              type="button"
              onClick={revokeOthers}
              disabled={pending}
              className="border-2 border-black px-3 py-2 text-xs font-black uppercase disabled:opacity-60"
            >
              Revoke other sessions
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {sessions.map((session) => (
              <article
                key={session.sessionId}
                className="border-2 border-black p-3 text-sm"
              >
                <p className="font-black">
                  {session.deviceName || "Unknown device"}
                </p>
                <p className="text-xs">IP: {session.ipAddress || "unknown"}</p>
                <p className="text-xs">
                  Last seen:{" "}
                  {session.lastSeenAt
                    ? new Date(session.lastSeenAt).toLocaleString()
                    : "n/a"}
                </p>
                {session.isCurrent ? (
                  <p className="mt-1 text-xs font-black uppercase">
                    Current session
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => revokeSession(session.sessionId)}
                    disabled={pending}
                    className="mt-2 border-2 border-black px-2 py-1 text-xs font-black uppercase disabled:opacity-60"
                  >
                    Revoke
                  </button>
                )}
              </article>
            ))}
            {!pending && sessions.length === 0 ? (
              <p className="text-sm">No active sessions found.</p>
            ) : null}
          </div>
        </section>

        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-lg font-black uppercase">Login history</h2>
          <div className="mt-4 grid gap-2">
            {history.map((item) => (
              <article
                key={item._id}
                className="border-2 border-black p-3 text-sm"
              >
                <p className="font-black">
                  {item.success ? "Successful login" : "Failed login"}
                </p>
                <p className="text-xs">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-xs">
                  Device: {item.deviceName || "Unknown"}
                </p>
                <p className="text-xs">IP: {item.ipAddress || "unknown"}</p>
                {!item.success && item.failureReason ? (
                  <p className="text-xs">Reason: {item.failureReason}</p>
                ) : null}
              </article>
            ))}
            {!pending && history.length === 0 ? (
              <p className="text-sm">No login history yet.</p>
            ) : null}
          </div>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
