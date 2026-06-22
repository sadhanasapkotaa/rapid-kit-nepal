"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/supabase/types";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-sm font-medium text-foreground";

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await createClient()
      .from("tags")
      .select("id, tag_code, name")
      .order("name");
    if (error) setError(error.message);
    else setTags(data as Tag[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setName("");
    setTagCode("");
    setShowForm(true);
  }
  function openEdit(t: Tag) {
    setEditingId(t.id);
    setName(t.name);
    setTagCode(t.tag_code);
    setShowForm(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { name, tag_code: tagCode };
    const res = editingId
      ? await supabase.from("tags").update(payload).eq("id", editingId)
      : await supabase.from("tags").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(t: Tag) {
    if (!confirm(`Delete tag "${t.name}"? It will be removed from all products.`))
      return;
    const { error } = await createClient().from("tags").delete().eq("id", t.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tags
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Add tag
        </button>
      </div>

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
      ) : tags.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No tags yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tags.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.tag_code}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(t)}
                      className="mr-3 font-medium text-primary-dark hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(t)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={save}
            className="my-8 w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-lg sm:p-8"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit tag" : "Add tag"}
            </h2>
            <div className="mt-6 space-y-5">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Pregnancy kit"
                />
              </div>
              <div>
                <label className={labelClass}>Tag code</label>
                <input
                  required
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value)}
                  className={inputClass}
                  placeholder="TAG-PREG"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-70"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
