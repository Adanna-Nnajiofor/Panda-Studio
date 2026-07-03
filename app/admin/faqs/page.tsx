"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson } from "../../../lib/api";

type Faq = {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isPublished: boolean;
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson<{ faqs: Faq[] }>("/faqs/admin");
      setFaqs(res.faqs ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await apiJson("/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          isPublished: true,
        }),
      });
      setQuestion("");
      setAnswer("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (faq: Faq) => {
    await apiJson(`/faqs/${faq._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !faq.isPublished }),
    });
    await load();
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="FAQ Manager"
        summary="Create and publish frequently asked questions shown on the public site."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <form onSubmit={create} className="space-y-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Question"
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              rows={4}
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              {saving ? "Saving..." : "Add FAQ"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">Loading FAQs...</p>
            </article>
          ) : faqs.length === 0 ? (
            <article className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
              <p className="text-sm">No FAQs yet.</p>
            </article>
          ) : (
            faqs.map((faq) => (
              <article
                key={faq._id}
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {faq.isPublished ? "Published" : "Draft"}
                </p>
                <h3 className="mt-1 text-lg font-black">{faq.question}</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{faq.answer}</p>
                <button
                  type="button"
                  onClick={() => toggle(faq)}
                  className="mt-3 border-2 border-black px-3 py-2 text-xs font-black uppercase"
                >
                  {faq.isPublished ? "Unpublish" : "Publish"}
                </button>
              </article>
            ))
          )}
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
