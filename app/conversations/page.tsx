"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { apiJson } from "../../lib/api";

type ConversationMessage = {
  _id: string;
  body: string;
  sentAt: string;
  attachments?: string[];
  author?: { _id: string; fullName?: string; email?: string };
};

type Conversation = {
  _id: string;
  title?: string;
  isGroup: boolean;
  participants: { _id: string; fullName?: string; email?: string }[];
  messages: ConversationMessage[];
  updatedAt: string;
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [participantId, setParticipantId] = useState("");
  const [draft, setDraft] = useState("");

  const active = useMemo(
    () => conversations.find((c) => c._id === activeId) ?? null,
    [conversations, activeId],
  );

  const load = async () => {
    const res = await apiJson<{ conversations: Conversation[] }>(
      "/conversations",
    );
    const list = res.conversations ?? [];
    setConversations(list);
    if (!activeId && list[0]) setActiveId(list[0]._id);
  };

  useEffect(() => {
    void load();
  }, []);

  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId.trim()) return;
    const created = await apiJson<{ conversation: Conversation }>(
      "/conversations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [participantId.trim()] }),
      },
    );
    setParticipantId("");
    await load();
    if (created.conversation?._id) setActiveId(created.conversation._id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    const res = await apiJson<{ conversation: Conversation }>(
      `/conversations/${active._id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim(), attachments: [] }),
      },
    );
    setDraft("");
    setConversations((prev) =>
      prev.map((c) => (c._id === active._id ? res.conversation : c)),
    );
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Communication"
        title="Conversations"
        summary="Threaded direct and group conversations with persistent history."
      >
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000]">
            <form
              onSubmit={createConversation}
              className="space-y-2 border-b-2 border-black pb-3"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                New conversation
              </p>
              <input
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Participant user ID"
                className="w-full border-2 border-black px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#f2eadf]"
              >
                Create
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {conversations.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveId(c._id)}
                  className={`w-full border-2 border-black px-3 py-2 text-left ${activeId === c._id ? "bg-[#fff2d8]" : "bg-white"}`}
                >
                  <p className="text-xs font-black uppercase">
                    {c.title || "Direct conversation"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {c.messages.at(-1)?.body ?? "No messages yet"}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000]">
            {!active ? (
              <p className="text-sm">
                Select or create a conversation to begin.
              </p>
            ) : (
              <>
                <div className="border-b-2 border-black pb-3">
                  <h2 className="text-lg font-black uppercase">
                    {active.title || "Conversation"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {active.participants.length} participants
                  </p>
                </div>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {active.messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : (
                    active.messages.map((m) => (
                      <article
                        key={m._id}
                        className="border-2 border-black bg-[#f7f0e2] p-3"
                      >
                        <p className="text-xs font-black">
                          {m.author?.fullName || m.author?.email || "User"}
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {m.body}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {new Date(m.sentAt).toLocaleString()}
                        </p>
                      </article>
                    ))
                  )}
                </div>

                <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message"
                    className="min-w-0 flex-1 border-2 border-black px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
