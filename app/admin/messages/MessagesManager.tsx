"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContactMessage } from "@/lib/supabase/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await createClient()
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setMessages(data as ContactMessage[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRead(m: ContactMessage) {
    const { error } = await createClient()
      .from("contact_messages")
      .update({ is_read: !m.is_read })
      .eq("id", m.id);
    if (error) {
      setError(error.message);
      return;
    }
    setMessages((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, is_read: !x.is_read } : x)),
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Contact messages
      </h1>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No messages yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {messages.map((m) => (
            <article
              key={m.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                m.is_read ? "border-border" : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {m.name}{" "}
                    {!m.is_read && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    <a
                      href={`mailto:${m.email}`}
                      className="hover:text-primary-dark hover:underline"
                    >
                      {m.email}
                    </a>
                    {m.phone ? ` · ${m.phone}` : ""}
                    {m.organization ? ` · ${m.organization}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    {formatDate(m.created_at)}
                  </p>
                  <button
                    onClick={() => toggleRead(m)}
                    className="mt-2 rounded-md border border-border bg-white px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary-dark"
                  >
                    {m.is_read ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary-dark">
                {m.topic}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {m.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
