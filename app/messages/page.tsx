"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import {
  apiFetch,
  apiJson,
  apiUpload,
  API_BASE_URL,
  getStoredToken,
} from "../../lib/api";
import { useAuthContext } from "../../components/AuthProvider";
import { getErrorMessage } from "../../lib/errors";

type Message = {
  _id: string;
  message: string;
  attachments?: {
    url: string;
    fileName?: string;
    mimeType?: string;
  }[];
  sender: { _id: string; fullName?: string; avatar?: string };
  receiver: { _id: string; fullName?: string };
  isRead: boolean;
  createdAt: string;
};

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unread?: number;
};

function timeStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const { user } = useAuthContext();
  const myId = (user as any)?._id ?? (user as any)?.id ?? "";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachments, setAttachments] = useState<
    { url: string; fileName?: string; mimeType?: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newContactId, setNewContactId] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ── SSE connection ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const token = getStoredToken();
    const url = `${API_BASE_URL}/messages/stream${token ? `?token=${token}` : ""}`;
    const es = new EventSource(url);
    sseRef.current = es;

    es.addEventListener("new_message", (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        // If the message is from the active contact, append it
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          if (
            msg.sender._id === activeContact?.id ||
            msg.receiver._id === activeContact?.id
          ) {
            return [...prev, msg];
          }
          return prev;
        });
        // Update contacts list unread count
        setContacts((prev) =>
          prev.map((c) =>
            c.id === msg.sender._id
              ? { ...c, lastMessage: msg.message, unread: (c.unread ?? 0) + 1 }
              : c,
          ),
        );
      } catch {
        // ignore parse errors
      }
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [myId, activeContact?.id]);

  // ── Load conversation ───────────────────────────────────────────────────────
  const loadConversation = useCallback(async (contact: Contact) => {
    setActiveContact(contact);
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await apiJson<{ messages: Message[] }>(
        `/messages?otherUserId=${contact.id}`,
      );
      setMessages(res.messages ?? []);
      // Mark as read
      await apiFetch("/messages/read", {
        method: "PATCH",
        body: JSON.stringify({ otherUserId: contact.id }),
        headers: { "Content-Type": "application/json" },
      }).catch(() => null);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)),
      );
    } catch {
      // silent
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || !activeContact) return;
    setSending(true);
    setError("");
    try {
      const res = await apiJson<{ msg: Message }>("/messages", {
        method: "POST",
        body: JSON.stringify({
          receiverId: activeContact.id,
          message: text.trim() || "[Attachment]",
          attachments,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setMessages((prev) => [...prev, res.msg]);
      setText("");
      setAttachments([]);
      setAttachmentUrl("");
      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeContact.id
            ? {
                ...c,
                lastMessage:
                  text.trim() ||
                  (attachments.length > 0
                    ? `${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`
                    : ""),
              }
            : c,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send message."));
    } finally {
      setSending(false);
    }
  };

  const addAttachment = () => {
    const url = attachmentUrl.trim();
    if (!url) return;
    const isValid = /^https?:\/\//i.test(url);
    if (!isValid) {
      setError("Attachment URL must start with http:// or https://");
      return;
    }

    setAttachments((prev) => {
      if (prev.some((a) => a.url === url)) return prev;
      return [...prev, { url }].slice(0, 10);
    });
    setAttachmentUrl("");
    setError("");
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeContact) return;

    const picked = Array.from(files).slice(0, 10);
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("receiverId", activeContact.id);
      picked.forEach((file) => formData.append("files", file));

      const res = await apiUpload<{
        attachments: {
          url: string;
          fileName?: string;
          mimeType?: string;
          size?: number;
        }[];
      }>("/messages/attachments", formData);

      setAttachments((prev) => {
        const merged = [...prev];
        for (const attachment of res.attachments ?? []) {
          if (merged.some((a) => a.url === attachment.url)) continue;
          merged.push({
            url: attachment.url,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          });
        }
        return merged.slice(0, 10);
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload attachments."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ── Start new conversation ──────────────────────────────────────────────────
  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactId.trim()) return;
    const exists = contacts.find((c) => c.id === newContactId.trim());
    if (exists) {
      loadConversation(exists);
      setNewContactId("");
      return;
    }
    const contact: Contact = {
      id: newContactId.trim(),
      name: newContactId.trim(),
    };
    setContacts((prev) => [contact, ...prev]);
    loadConversation(contact);
    setNewContactId("");
  };

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Communication"
        title="Messages"
        summary="Real-time messaging with your team, crew, and clients."
      >
        <div className="grid h-150 grid-cols-1 overflow-hidden border-4 border-black shadow-[8px_8px_0_0_#000] md:grid-cols-[280px_1fr]">
          {/* ── Sidebar ── */}
          <div className="flex flex-col border-r-4 border-black bg-[#fffef8]">
            <div className="border-b-4 border-black p-3">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Conversations
              </p>
              <form onSubmit={startConversation} className="mt-2 flex gap-1">
                <input
                  type="text"
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value)}
                  placeholder="User ID to message"
                  className="min-w-0 flex-1 border-2 border-black bg-white px-2 py-1.5 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="border-2 border-black bg-black px-2 py-1.5 text-xs font-black text-[#f2eadf]"
                >
                  +
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="p-4 text-xs text-slate-400">
                  No conversations yet. Enter a user ID above to start.
                </p>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => loadConversation(c)}
                    className={[
                      "w-full border-b border-slate-100 px-3 py-3 text-left transition hover:bg-[#fff8ea]",
                      activeContact?.id === c.id ? "bg-[#fff8ea]" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black truncate">{c.name}</p>
                      {(c.unread ?? 0) > 0 && (
                        <span className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-black text-[#f2eadf]">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    {c.lastMessage && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {c.lastMessage}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className="flex flex-col bg-white">
            {!activeContact ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-4xl">💬</p>
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  Select a conversation
                </p>
                <p className="text-sm text-slate-500">
                  Choose a contact from the sidebar or start a new conversation.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b-4 border-black bg-[#fffef8] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-[#fff8ea] text-sm font-black">
                    {activeContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black">{activeContact.name}</p>
                    <p className="text-xs text-slate-400">
                      Real-time messaging
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <p className="text-center text-xs font-black uppercase tracking-[0.2em]">
                      Loading…
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-slate-400">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender._id === myId;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={[
                              "max-w-[75%] rounded px-3 py-2 text-sm",
                              isMine
                                ? "border-2 border-black bg-black text-[#f2eadf]"
                                : "border-2 border-black bg-[#fff8ea] text-black",
                            ].join(" ")}
                          >
                            <p>{msg.message}</p>
                            {msg.attachments?.length ? (
                              <div className="mt-2 grid gap-1">
                                {msg.attachments.map((attachment) => {
                                  const fileName =
                                    attachment.fileName ||
                                    attachment.url.split("/").pop() ||
                                    "Attachment";
                                  return (
                                    <a
                                      key={attachment.url}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline text-xs"
                                    >
                                      {fileName}
                                    </a>
                                  );
                                })}
                              </div>
                            ) : null}
                            <p
                              className={`mt-1 text-[10px] ${isMine ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {timeStr(msg.createdAt)}
                              {isMine && (msg.isRead ? " · Read" : " · Sent")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={sendMessage}
                  className="border-t-4 border-black p-3"
                >
                  {error && (
                    <p className="mb-2 text-xs font-black text-red-600">
                      {error}
                    </p>
                  )}
                  <div className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="Paste attachment URL (optional)"
                      className="flex-1 border-2 border-black bg-white px-3 py-2 text-xs outline-none"
                      disabled={sending}
                    />
                    <button
                      type="button"
                      onClick={addAttachment}
                      disabled={sending || uploading}
                      className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase"
                    >
                      Add
                    </button>
                    <label className="cursor-pointer border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase">
                      {uploading ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileSelected}
                        disabled={sending || uploading || !activeContact}
                      />
                    </label>
                  </div>
                  {attachments.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {attachments.map((attachment) => (
                        <button
                          key={attachment.url}
                          type="button"
                          onClick={() => removeAttachment(attachment.url)}
                          className="border-2 border-black bg-[#fff8ea] px-2 py-1 text-[10px]"
                          title="Remove attachment"
                        >
                          {(attachment.fileName || attachment.url).slice(0, 36)}
                          {(attachment.fileName || attachment.url).length > 36
                            ? "..."
                            : ""}{" "}
                          ✕
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message…"
                      className="flex-1 border-4 border-black bg-[#fff8ea] px-3 py-2 text-sm outline-none"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={
                        (!text.trim() && attachments.length === 0) || sending
                      }
                      className="border-4 border-black bg-black px-4 py-2 text-sm font-black text-[#f2eadf] disabled:opacity-60"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
