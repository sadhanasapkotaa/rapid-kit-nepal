"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/lib/supabase/types";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-sm font-medium text-foreground";

export function GenerationsManager() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [generationCode, setGenerationCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("generations")
      .select("id, generation_code, name")
      .order("generation_code");
    if (error) setError(error.message);
    else {
      setGenerations(data as Generation[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch-on-mount from Supabase (external system); state updates occur after await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setName("");
    setGenerationCode("");
    setShowForm(true);
  }
  function openEdit(g: Generation) {
    setEditingId(g.id);
    setName(g.name);
    setGenerationCode(g.generation_code);
    setShowForm(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { name, generation_code: generationCode };
    const res = editingId
      ? await supabase.from("generations").update(payload).eq("id", editingId)
      : await supabase.from("generations").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(g: Generation) {
    if (
      !confirm(
        `Delete generation "${g.name}"? It will be unset from any products using it.`,
      )
    )
      return;
    const { error } = await createClient()
      .from("generations")
      .delete()
      .eq("id", g.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Generations
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Add generation
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
      ) : generations.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No generations yet.</p>
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
              {generations.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {g.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {g.generation_code}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(g)}
                      className="mr-3 font-medium text-primary-dark hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(g)}
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
              {editingId ? "Edit generation" : "Add generation"}
            </h2>
            <div className="mt-6 space-y-5">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="4th Generation Kit"
                />
              </div>
              <div>
                <label className={labelClass}>Generation code</label>
                <input
                  required
                  value={generationCode}
                  onChange={(e) => setGenerationCode(e.target.value)}
                  className={inputClass}
                  placeholder="GEN-4"
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
