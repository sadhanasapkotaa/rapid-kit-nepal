import { createClient } from "@/lib/supabase/server";
import type { Product, Tag } from "@/lib/supabase/types";

export type { Product, Tag } from "@/lib/supabase/types";
export { formatPrice } from "@/lib/format";

const SELECT =
  "id, product_code, supplier_id, title, slug, description, price, " +
  "product_images(url, sort_order), product_videos(url, sort_order), " +
  "tags:product_tags(tags(id, tag_code, name))";

type MediaRow = { url: string; sort_order: number };

type Row = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  product_images: MediaRow[] | null;
  product_videos: MediaRow[] | null;
  tags: { tags: Tag | null }[] | null;
};

function mapRow(r: Row): Product {
  const bySort = (a: MediaRow, b: MediaRow) => a.sort_order - b.sort_order;
  return {
    id: r.id,
    product_code: r.product_code,
    supplier_id: r.supplier_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    price: Number(r.price),
    images: (r.product_images ?? []).slice().sort(bySort).map((m) => m.url),
    videos: (r.product_videos ?? []).slice().sort(bySort).map((m) => m.url),
    tags: (r.tags ?? []).map((t) => t.tags).filter((t): t is Tag => t !== null),
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getProducts failed", error);
    return [];
  }
  return (data as unknown as Row[]).map(mapRow);
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  return (await getProducts()).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getProductBySlug failed", error);
    return null;
  }
  return mapRow(data as unknown as Row);
}
