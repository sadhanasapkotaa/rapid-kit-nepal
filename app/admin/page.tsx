import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [products, suppliers, tags, unread] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  const cards = [
    { label: "Products", count: products.count ?? 0, href: "/admin/products" },
    { label: "Suppliers", count: suppliers.count ?? 0, href: "/admin/suppliers" },
    { label: "Tags", count: tags.count ?? 0, href: "/admin/tags" },
    {
      label: "Unread messages",
      count: unread.count ?? 0,
      href: "/admin/messages",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as {profile.email} ({profile.role}).
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {c.count}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
