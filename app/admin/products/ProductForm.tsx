"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Generation, Supplier, Tag } from "@/lib/supabase/types";
import type { AdminProduct } from "./ProductsManager";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-sm font-medium text-foreground";

async function uploadFiles(
  bucket: string,
  files: File[],
  slug: string,
): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];
  for (const file of files) {
    const path = `${slug}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export function ProductForm({
  product,
  suppliers,
  tags,
  generations,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  suppliers: Supplier[];
  tags: Tag[];
  generations: Generation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [productCode, setProductCode] = useState(product?.product_code ?? "");
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? String(product.price) : "",
  );
  const [supplierId, setSupplierId] = useState(product?.supplier_id ?? "");
  const [generationId, setGenerationId] = useState(
    product?.generation_id ?? "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    product?.tags.map((t) => t.id) ?? [],
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const slug = slugify(title);

    try {
      if (!slug) throw new Error("Title is required.");
      const priceNum = Number(price);
      if (Number.isNaN(priceNum)) throw new Error("Price must be a number.");

      // 1. Upload new media.
      const imageUrls = await uploadFiles("product-images", imageFiles, slug);
      const videoUrls = await uploadFiles("product-videos", videoFiles, slug);
      if (videoUrl.trim()) videoUrls.push(videoUrl.trim());

      const scalars = {
        product_code: productCode,
        title,
        slug,
        description: description || null,
        price: priceNum,
        supplier_id: supplierId || null,
        generation_id: generationId || null,
      };

      let productId: string;
      if (isEdit && product) {
        productId = product.id;
        const { error: upErr } = await supabase
          .from("products")
          .update(scalars)
          .eq("id", productId);
        if (upErr) throw upErr;
        // Replace tags wholesale.
        await supabase.from("product_tags").delete().eq("product_id", productId);
        // If new media was provided, replace existing media too.
        if (imageUrls.length > 0) {
          await supabase
            .from("product_images")
            .delete()
            .eq("product_id", productId);
        }
        if (videoUrls.length > 0) {
          await supabase
            .from("product_videos")
            .delete()
            .eq("product_id", productId);
        }
      } else {
        const { data, error: insErr } = await supabase
          .from("products")
          .insert(scalars)
          .select("id")
          .single();
        if (insErr) throw insErr;
        productId = (data as { id: string }).id;
      }

      // 2. Insert media rows.
      if (imageUrls.length > 0) {
        const { error: imgErr } = await supabase.from("product_images").insert(
          imageUrls.map((url, i) => ({
            product_id: productId,
            url,
            sort_order: i,
          })),
        );
        if (imgErr) throw imgErr;
      }
      if (videoUrls.length > 0) {
        const { error: vidErr } = await supabase.from("product_videos").insert(
          videoUrls.map((url, i) => ({
            product_id: productId,
            url,
            sort_order: i,
          })),
        );
        if (vidErr) throw vidErr;
      }

      // 3. Insert tag links.
      if (selectedTags.length > 0) {
        const { error: tagErr } = await supabase.from("product_tags").insert(
          selectedTags.map((tagId) => ({
            product_id: productId,
            tag_id: tagId,
          })),
        );
        if (tagErr) throw tagErr;
      }

      onSaved();
    } catch (err) {
      console.error("Save product failed", err);
      setError(err instanceof Error ? err.message : "Failed to save product.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-lg sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Product code</label>
            <input
              required
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className={inputClass}
              placeholder="PRD-008"
            />
          </div>
          <div>
            <label className={labelClass}>Price (INR)</label>
            <input
              required
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              placeholder="899"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="HIV Rapid Test Kit"
          />
          {title && (
            <p className="mt-1 text-xs text-slate-500">
              Slug: <span className="font-mono">{slugify(title)}</span>
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className={labelClass}>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Describe the kit…"
          />
        </div>

        <div className="mt-5">
          <label className={labelClass}>Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.supplier_code})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Generation</label>
          <select
            value={generationId}
            onChange={(e) => setGenerationId(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {generations.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Tags</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length === 0 && (
              <p className="text-xs text-slate-500">
                No tags yet — create some on the Tags page.
              </p>
            )}
            {tags.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  selectedTags.includes(t.id)
                    ? "border-primary bg-primary/5 text-primary-dark"
                    : "border-border text-foreground hover:border-primary/60"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selectedTags.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Images {isEdit && <span className="text-slate-400">(replace)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-dark"
            />
          </div>
          <div>
            <label className={labelClass}>
              Videos {isEdit && <span className="text-slate-400">(replace)</span>}
            </label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []))}
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-dark"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Or video URL (optional)</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        {isEdit && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-slate-500">
            Leave the image/video pickers empty to keep existing media.
            Selecting new files replaces all current media of that type.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-70"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
