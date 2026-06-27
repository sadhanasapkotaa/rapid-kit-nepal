"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { Generation, Supplier, Tag } from "@/lib/supabase/types";
import { ProductForm } from "./ProductForm";

export type AdminProduct = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  generation_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  imageCount: number;
  tags: Tag[];
};

const SELECT =
  "id, product_code, supplier_id, generation_id, title, slug, description, price, " +
  "product_images(id), tags:product_tags(tags(id, tag_code, name))";

type Row = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  generation_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  product_images: { id: string }[] | null;
  tags: { tags: Tag | null }[] | null;
};

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [pRes, sRes, tRes, gRes] = await Promise.all([
      supabase.from("products").select(SELECT).order("created_at", {
        ascending: true,
      }),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("tags").select("id, tag_code, name").order("name"),
      supabase
        .from("generations")
        .select("id, generation_code, name")
        .order("generation_code"),
    ]);
    if (pRes.error || sRes.error || tRes.error || gRes.error) {
      setError(
        pRes.error?.message ??
          sRes.error?.message ??
          tRes.error?.message ??
          gRes.error?.message ??
          "Failed to load.",
      );
      setLoading(false);
      return;
    }
    const rows = (pRes.data as unknown as Row[]).map<AdminProduct>((r) => ({
      id: r.id,
      product_code: r.product_code,
      supplier_id: r.supplier_id,
      generation_id: r.generation_id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      price: Number(r.price),
      imageCount: (r.product_images ?? []).length,
      tags: (r.tags ?? [])
        .map((t) => t.tags)
        .filter((t): t is Tag => t !== null),
    }));
    setProducts(rows);
    setSuppliers(sRes.data as Supplier[]);
    setTags(tRes.data as Tag[]);
    setGenerations(gRes.data as Generation[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch-on-mount from Supabase (external system); state updates occur after await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.title}"? This removes its images, videos and tags.`))
      return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditing(p);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Products
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Add product
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
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No products yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Images</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.product_code}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.tags.map((t) => t.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.imageCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-3 font-medium text-primary-dark hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p)}
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

      {formOpen && (
        <ProductForm
          product={editing}
          suppliers={suppliers}
          tags={tags}
          generations={generations}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
