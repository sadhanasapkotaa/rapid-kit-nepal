"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/supabase/types";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-sm font-medium text-foreground";

type FormState = {
  supplier_code: string;
  name: string;
  country_of_origin: string;
  contact_person_name: string;
  contact_phone: string;
  contact_email: string;
};

const empty: FormState = {
  supplier_code: "",
  name: "",
  country_of_origin: "",
  contact_person_name: "",
  contact_phone: "",
  contact_email: "",
};

function toForm(s: Supplier): FormState {
  return {
    supplier_code: s.supplier_code,
    name: s.name,
    country_of_origin: s.country_of_origin ?? "",
    contact_person_name: s.contact_person_name ?? "",
    contact_phone: s.contact_phone ?? "",
    contact_email: s.contact_email ?? "",
  };
}

export function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("suppliers")
      .select("*")
      .order("name");
    if (error) setError(error.message);
    else {
      setSuppliers(data as Supplier[]);
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
    setForm(empty);
    setShowForm(true);
  }
  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm(toForm(s));
    setShowForm(true);
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      supplier_code: form.supplier_code,
      name: form.name,
      country_of_origin: form.country_of_origin || null,
      contact_person_name: form.contact_person_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
    };
    const res = editingId
      ? await supabase.from("suppliers").update(payload).eq("id", editingId)
      : await supabase.from("suppliers").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(s: Supplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    const { error } = await createClient()
      .from("suppliers")
      .delete()
      .eq("id", s.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Suppliers
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Add supplier
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
      ) : suppliers.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No suppliers yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.supplier_code}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.country_of_origin ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.contact_person_name ?? "—"}
                    {s.contact_email ? (
                      <span className="block text-xs text-slate-400">
                        {s.contact_email}
                      </span>
                    ) : null}
                    {s.contact_phone ? (
                      <span className="block text-xs text-slate-400">
                        {s.contact_phone}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="mr-3 font-medium text-primary-dark hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s)}
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
            className="my-8 w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-lg sm:p-8"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit supplier" : "Add supplier"}
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Supplier code</label>
                <input required className={inputClass} {...field("supplier_code")} />
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input required className={inputClass} {...field("name")} />
              </div>
              <div>
                <label className={labelClass}>Country of origin</label>
                <input className={inputClass} {...field("country_of_origin")} />
              </div>
              <div>
                <label className={labelClass}>Contact person</label>
                <input className={inputClass} {...field("contact_person_name")} />
              </div>
              <div>
                <label className={labelClass}>Contact phone</label>
                <input className={inputClass} {...field("contact_phone")} />
              </div>
              <div>
                <label className={labelClass}>Contact email</label>
                <input
                  type="email"
                  className={inputClass}
                  {...field("contact_email")}
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
