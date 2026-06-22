"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/supabase/types";

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await createClient()
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setProfiles(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(p: Profile, role: Role) {
    if (role === p.role) return;
    setSavingId(p.id);
    setError(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ role })
      .eq("id", p.id);
    setSavingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setProfiles((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, role } : x)),
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Users
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        New users are created in the Supabase dashboard (Authentication → Users).
        They start as <span className="font-medium">staff</span>; promote to
        admin here.
      </p>

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
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p) => {
                const isSelf = p.id === currentUserId;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.email ?? "—"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-slate-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.role}
                        disabled={isSelf || savingId === p.id}
                        onChange={(e) => changeRole(p, e.target.value as Role)}
                        className="rounded-md border border-border bg-white px-2 py-1 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                      {isSelf && (
                        <span className="ml-2 text-xs text-slate-400">
                          can&apos;t change your own role
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.created_at).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
