# Dynamic Products, Suppliers, Tags, Contact Persistence & Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the catalogue dynamic from Supabase (suppliers, tags, multi image/video), persist contact submissions without breaking EmailJS, and add a role-gated admin panel (admin/staff) for managing content and reading messages.

**Architecture:** Public pages are async Server Components reading via a server Supabase client (RLS allows public SELECT). The contact form keeps its EmailJS send and additionally inserts a row via the browser client. Auth uses Supabase Auth via `@supabase/ssr`; `proxy.ts` refreshes the session and guards `/admin/*`. A `profiles` table holds each user's role; RLS + `is_admin()`/`is_staff_or_admin()` SQL helpers enforce permissions; the admin UI gates the Users area for admins only.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, Tailwind v4, `@supabase/ssr` 0.12, `@supabase/supabase-js`, EmailJS (existing).

## Global Constraints

- **Next.js 16 specifics (breaking vs. older docs):**
  - Middleware is now **`proxy.ts`** at project root, exporting a `proxy(request)` function (Node.js runtime). There is no `middleware.ts`.
  - Dynamic route `params` and `searchParams` are **Promises** `params: Promise<{ slug: string }>`, then `await params`.
  - `cookies()` from `next/headers` is **async** `await cookies()`.
- Path alias: `@/*` → repo root (e.g. `@/lib/supabase/server`).
- Env vars (already in `.env`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus existing `NEXT_PUBLIC_EMAILJS_*`.
- No unit-test framework is installed. Per-task verification = `npx tsc --noEmit` + `npm run lint` + `npm run build` succeed, plus the stated manual check. Do NOT add a test runner.
- Match existing Tailwind design language (tokens: `primary`, `primary-dark`, `border`, `muted`, `surface`, `foreground`, `accent`; rounded cards, `max-w-6xl` containers). Reuse the visual patterns already in `app/products/page.tsx` and `app/contact/ContactForm.tsx`.
- EmailJS contact flow must remain functionally unchanged (email is the source of truth for the user's success/error UX).
- Commit after each task.

## File Structure

**Create:**
- `supabase/schema.sql` tables, RLS, helpers, trigger, storage policies, seed.
- `SUPABASE_SETUP.md` how to apply SQL, create buckets, disable signups, create first admin.
- `lib/supabase/client.ts` browser client.
- `lib/supabase/server.ts` cookie-bound server client (async).
- `lib/supabase/proxy.ts` `updateSession(request)` used by `proxy.ts`.
- `lib/supabase/types.ts` shared row/domain types (`Supplier`, `Tag`, `Product`, `ContactMessage`, `Profile`, `Role`).
- `lib/auth.ts` `getSessionUser()`, `getCurrentProfile()`, `requireUser()`, `requireAdmin()` (server-side).
- `proxy.ts` session refresh + `/admin/*` guard.
- `app/components/SiteFrame.tsx` client; hides public Navbar/Footer on `/admin/*`.
- `app/products/[slug]/page.tsx` public product detail.
- `app/admin/layout.tsx` server; auth + role, renders admin shell.
- `app/admin/AdminNav.tsx` client nav (shows Users only for admin) + logout.
- `app/admin/login/page.tsx` login (client).
- `app/admin/page.tsx` dashboard.
- `app/admin/products/page.tsx` + `app/admin/products/ProductsManager.tsx` product CRUD.
- `app/admin/products/ProductForm.tsx` add/edit form with uploads.
- `app/admin/suppliers/page.tsx` + `SuppliersManager.tsx`.
- `app/admin/tags/page.tsx` + `TagsManager.tsx`.
- `app/admin/messages/page.tsx` + `MessagesManager.tsx`.
- `app/admin/users/page.tsx` (server gate) + `UsersManager.tsx`.

**Modify:**
- `app/products/products.ts` keep `formatPrice`; remove array; add async data accessors + re-export types.
- `app/products/page.tsx` async Server Component reading Supabase; cards link to `/products/[slug]`; tag chips.
- `app/page.tsx` async; featured from Supabase.
- `app/layout.tsx` wrap body content in `<SiteFrame>`.
- `.env` (no secret changes needed; document only).

---

## Task 1: Database schema, RLS, helpers, seed + setup docs

**Files:**
- Create: `supabase/schema.sql`
- Create: `SUPABASE_SETUP.md`

**Interfaces:**
- Produces: tables `suppliers`, `tags`, `products`, `product_images`, `product_videos`, `product_tags`, `contact_messages`, `profiles`; functions `public.is_admin()`, `public.is_staff_or_admin()`; trigger creating a `profiles` row per new auth user; storage buckets `product-images`, `product-videos`. These names are consumed by every later task.

- [ ] **Step 1: Write `supabase/schema.sql`** with the exact content below.

```sql
-- =========================================================
-- Rapid Kit House Nepal schema, RLS, helpers, seed
-- Apply in Supabase Dashboard → SQL Editor.
-- =========================================================

-- ---------- Tables ----------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text unique not null,
  name text not null,
  country_of_origin text,
  contact_person_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  tag_code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text unique not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  title text not null,
  slug text unique not null,
  description text,
  price numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  phone text,
  topic text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

-- ---------- Role helpers (security definer avoids RLS recursion) ----------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.is_staff_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

-- ---------- Auto-create profile on new auth user ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Enable RLS ----------
alter table public.suppliers enable row level security;
alter table public.tags enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_videos enable row level security;
alter table public.product_tags enable row level security;
alter table public.contact_messages enable row level security;
alter table public.profiles enable row level security;

-- ---------- Policies: public-readable content ----------
-- products / images / videos / product_tags / tags: anyone can SELECT
create policy "public read products" on public.products for select using (true);
create policy "public read product_images" on public.product_images for select using (true);
create policy "public read product_videos" on public.product_videos for select using (true);
create policy "public read product_tags" on public.product_tags for select using (true);
create policy "public read tags" on public.tags for select using (true);

-- content writes: staff or admin
create policy "staff write products" on public.products for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff write product_images" on public.product_images for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff write product_videos" on public.product_videos for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff write product_tags" on public.product_tags for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff write tags" on public.tags for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- suppliers: internal staff/admin read + write, no public read
create policy "staff read suppliers" on public.suppliers for select
  using (public.is_staff_or_admin());
create policy "staff write suppliers" on public.suppliers for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- contact_messages: anyone may INSERT; staff/admin read & update
create policy "anyone insert messages" on public.contact_messages for insert
  with check (true);
create policy "staff read messages" on public.contact_messages for select
  using (public.is_staff_or_admin());
create policy "staff update messages" on public.contact_messages for update
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- profiles: self read; admin read/update/delete
create policy "self read profile" on public.profiles for select
  using (id = auth.uid());
create policy "admin read profiles" on public.profiles for select
  using (public.is_admin());
create policy "admin update profiles" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admin delete profiles" on public.profiles for delete
  using (public.is_admin());

-- ---------- Seed: tags + existing 7 products ----------
insert into public.tags (tag_code, name) values
  ('TAG-HIV','HIV Diagnostics'),
  ('TAG-HCV','HCV Diagnostics')
on conflict (tag_code) do nothing;

-- products (slug == existing slug; product_code generated)
insert into public.products (product_code, title, slug, description, price) values
  ('PRD-001','HIV-Tri-Dot','hiv-tri-dot','Rapid visual immunoassay for the qualitative detection of antibodies to HIV-1 and HIV-2 in human serum, plasma, or whole blood.',899),
  ('PRD-002','Tridot-HCV','tridot-hcv','Rapid, sensitive immunoassay for the qualitative detection of antibodies to Hepatitis C virus in human serum or plasma.',949),
  ('PRD-003','Abbott-hcv','abbott-hcv','Abbott rapid HCV antibody test for reliable point-of-care screening with clear visual results in minutes.',1199),
  ('PRD-004','All-test-hcv','all-test-hcv','All-Test HCV one-step antibody cassette for qualitative detection in serum, plasma, or whole blood samples.',849),
  ('PRD-005','Cg-hcv','cg-hcv','CG rapid HCV antibody test strip economical screening tool suitable for clinics, camps, and outreach programs.',799),
  ('PRD-006','Elisa-hcv','elisa-hcv','ELISA-based HCV antibody detection kit for laboratory use, delivering quantitative results with high sensitivity and specificity.',2499),
  ('PRD-007','newscan-hcv','newscan-hcv','Newscan rapid HCV antibody cassette designed for fast, reliable screening in resource-limited settings.',879)
on conflict (product_code) do nothing;

-- images: reference existing /public/images files (served from the site origin)
insert into public.product_images (product_id, url, sort_order)
select p.id, i.url, 0 from public.products p
join (values
  ('hiv-tri-dot','/images/HIV-Tri-Dot.webp'),
  ('tridot-hcv','/images/Tridot-HCV.jpg'),
  ('abbott-hcv','/images/Abbott-hcv.webp'),
  ('all-test-hcv','/images/All-test-hcv.webp'),
  ('cg-hcv','/images/Cg-hcv.webp'),
  ('elisa-hcv','/images/Elisa-hcv.webp'),
  ('newscan-hcv','/images/newscan-hcv.webp')
) as i(slug,url) on i.slug = p.slug
on conflict do nothing;

-- tag links: PRD-001 → HIV; rest → HCV
insert into public.product_tags (product_id, tag_id)
select p.id, t.id from public.products p, public.tags t
where (p.slug = 'hiv-tri-dot' and t.tag_code = 'TAG-HIV')
   or (p.slug <> 'hiv-tri-dot' and t.tag_code = 'TAG-HCV')
on conflict do nothing;
```

- [ ] **Step 2: Write `SUPABASE_SETUP.md`** documenting, in order:
  1. Open Supabase Dashboard → SQL Editor → paste & run `supabase/schema.sql`.
  2. Storage → create buckets `product-images` and `product-videos`, both **Public**. Add policies: public `SELECT`; authenticated `INSERT`/`UPDATE`/`DELETE` (UI: "Allow access to authenticated users" templates, or SQL on `storage.objects` filtered by `bucket_id`).
  3. Authentication → Providers/Settings → **disable** "Allow new users to sign up".
  4. Create the first user: Authentication → Users → Add user (email + password). Then in SQL Editor run: `update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';`
  5. Note: image URLs for the 7 seeded products point at `/images/...` already in `public/`; newly uploaded images use Storage public URLs.

- [ ] **Step 3: Verify** the SQL parses by running it in Supabase. Expected: no errors; `select count(*) from public.products;` returns 7; `select * from public.tags;` returns 2 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql SUPABASE_SETUP.md
git commit -m "feat: supabase schema, RLS, role helpers, seed + setup docs"
```

---

## Task 2: Supabase client wiring + proxy (session refresh & admin guard)

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts`

**Interfaces:**
- Produces:
  - `createClient()` (browser) from `lib/supabase/client.ts`.
  - `async createClient()` (server, cookie-bound) from `lib/supabase/server.ts`.
  - `async updateSession(request: NextRequest): Promise<NextResponse>` from `lib/supabase/proxy.ts`.

- [ ] **Step 1: `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 2: `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; safe to ignore proxy refreshes cookies.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: `lib/supabase/proxy.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: refresh the session (do not run logic between client creation and getUser).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin");
  const isLogin = path === "/admin/login";

  if (isAdminArea && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 4: `proxy.ts`** (project root NOT `middleware.ts`)

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 6: Commit**

```bash
git add lib/supabase proxy.ts
git commit -m "feat: supabase browser/server clients + proxy session refresh & admin guard"
```

---

## Task 3: Domain types + product data-access layer

**Files:**
- Create: `lib/supabase/types.ts`
- Modify: `app/products/products.ts`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/server.ts`.
- Produces (from `app/products/products.ts`):
  - `type Product` (re-exported) with `id, product_code, title, slug, description, price, images: string[], videos: string[], tags: Tag[]`.
  - `async getProducts(): Promise<Product[]>`
  - `async getFeaturedProducts(limit?: number): Promise<Product[]>`
  - `async getProductBySlug(slug: string): Promise<Product | null>`
  - `formatPrice(amount: number): string` (unchanged).
- Produces (from `lib/supabase/types.ts`): `Role`, `Tag`, `Supplier`, `Product`, `ContactMessage`, `Profile`.

- [ ] **Step 1: `lib/supabase/types.ts`**

```ts
export type Role = "admin" | "staff";

export type Tag = { id: string; tag_code: string; name: string };

export type Supplier = {
  id: string;
  supplier_code: string;
  name: string;
  country_of_origin: string | null;
  contact_person_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  videos: string[];
  tags: Tag[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Profile = { id: string; email: string | null; role: Role; created_at: string };
```

- [ ] **Step 2: Rewrite `app/products/products.ts`** remove the hard-coded array; keep `formatPrice`; add accessors. Use one nested select and map media/tags to flat arrays sorted by `sort_order`.

```ts
import { createClient } from "@/lib/supabase/server";
import type { Product, Tag } from "@/lib/supabase/types";

export type { Product, Tag } from "@/lib/supabase/types";

const SELECT =
  "id, product_code, supplier_id, title, slug, description, price, " +
  "product_images(url, sort_order), product_videos(url, sort_order), " +
  "tags:product_tags(tags(id, tag_code, name))";

type Row = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  product_images: { url: string; sort_order: number }[] | null;
  product_videos: { url: string; sort_order: number }[] | null;
  tags: { tags: Tag | null }[] | null;
};

function mapRow(r: Row): Product {
  const bySort = (a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order;
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

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

- [ ] **Step 3: Verify** `npx tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts app/products/products.ts
git commit -m "feat: domain types + supabase product data-access layer"
```

---

## Task 4: Public chrome wrapper + make products list & homepage dynamic

**Files:**
- Create: `app/components/SiteFrame.tsx`
- Modify: `app/layout.tsx`, `app/products/page.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `getProducts`, `getFeaturedProducts`, `formatPrice` (Task 3); `Navbar`, `Footer`.
- Produces: `SiteFrame` client component hiding public chrome on `/admin/*`.

- [ ] **Step 1: `app/components/SiteFrame.tsx`** (client; Footer passed as prop since it's a server component)

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function SiteFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
```

- [ ] **Step 2: Modify `app/layout.tsx`** body to use `SiteFrame` (remove direct Navbar/main/Footer):

```tsx
import { SiteFrame } from "./components/SiteFrame";
import { Footer } from "./components/Footer";
// ...keep Inter + metadata...
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteFrame footer={<Footer />}>{children}</SiteFrame>
      </body>
```

(Remove the now-unused `Navbar` import from layout.)

- [ ] **Step 3: Modify `app/products/page.tsx`** make it `async`, fetch products, derive categories from tags, link cards to `/products/[slug]`, show first image + tag chips. Keep the existing hero/markup/classes; only swap the data source. Key changes:

```tsx
import { getProducts, formatPrice } from "./products";
// remove: const categories = ... (module scope)

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = Array.from(
    new Set(products.flatMap((p) => p.tags.map((t) => t.name))),
  );
  // ...existing hero section using {categories}...
  // product grid:
  // {products.map((p) => ( <article ...>
  //   <Link href={`/products/${p.slug}`}> image (p.images[0] ?? "/images/placeholder.png") </Link>
  //   tag chips: p.tags.map(t => t.name)
  //   <h2>{p.title}</h2> <p>{p.description}</p> {formatPrice(p.price)}
  //   <Link href={`/products/${p.slug}`}>View details →</Link>
  // ))}
}
```

Guard the image: `src={p.images[0] ?? "/images/HIV-Tri-Dot.webp"}` (any existing asset as fallback) so a product with no image still renders.

- [ ] **Step 4: Modify `app/page.tsx`** make `Home` `async`; replace `const featured = products.slice(0,3)` with `const featured = await getFeaturedProducts(3);`; update the featured card fields to `p.title`, `p.images[0]`, `formatPrice(p.price)`, link to `/products/${p.slug}`. Keep `features` array and all other markup.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds. With Supabase reachable, `/` and `/products` render the 7 seeded products. (If offline, accessors return `[]` and pages render empty grids without crashing.)

- [ ] **Step 6: Commit**

```bash
git add app/components/SiteFrame.tsx app/layout.tsx app/products/page.tsx app/page.tsx
git commit -m "feat: dynamic products list + homepage from supabase; admin-aware chrome"
```

---

## Task 5: Public product detail page

**Files:**
- Create: `app/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProductBySlug`, `formatPrice` (Task 3).

- [ ] **Step 1: `app/products/[slug]/page.tsx`** Server Component; async `params`; `notFound()` on miss. Renders image gallery (all `images`), embedded videos (HTML5 `<video controls>` for each `videos` URL), title, tag chips, full description, price, and an "Enquire" `Link` to `/contact`. No supplier shown. Use `max-w-6xl` container + existing tokens.

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, formatPrice } from "../products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.title} Rapid Kit House Nepal`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const hero = product.images[0] ?? "/images/HIV-Tri-Dot.webp";
  // Layout: gallery (hero + thumbnails of product.images), details column
  // (tag chips, title, price, description, Enquire link), then a videos
  // section mapping product.videos to <video src controls className="rounded-lg w-full" />.
  // Match Tailwind tokens/spacing used in app/products/page.tsx.
  return (/* ...JSX per above... */);
}
```

- [ ] **Step 2: Verify** `npx tsc --noEmit && npm run build` → PASS. Manually: `/products/hiv-tri-dot` renders; `/products/does-not-exist` → 404.

- [ ] **Step 3: Commit**

```bash
git add app/products/[slug]/page.tsx
git commit -m "feat: public product detail page with gallery + videos"
```

---

## Task 6: Contact form additive Supabase persistence

**Files:**
- Modify: `app/contact/ContactForm.tsx`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/client.ts`.

- [ ] **Step 1: Modify `handleSubmit`** in `app/contact/ContactForm.tsx`. Keep the EmailJS branch exactly as-is. Read the field values from the form and insert into `contact_messages` independently; never let a DB error flip the EmailJS-driven status. Insert this block right after `await emailjs.sendForm(...)` succeeds (or in parallel, but isolated):

```tsx
// existing import block + add:
import { createClient } from "@/lib/supabase/client";

// inside handleSubmit, after the emailjs.sendForm await resolves:
try {
  const fd = new FormData(form);
  const supabase = createClient();
  await supabase.from("contact_messages").insert({
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    organization: (fd.get("organization") as string) || null,
    phone: (fd.get("phone") as string) || null,
    topic: String(fd.get("topic") ?? ""),
    message: String(fd.get("message") ?? ""),
  });
} catch (dbErr) {
  console.error("Failed to persist contact message (email already sent)", dbErr);
}
```

Note: read `fd` from `form` BEFORE `form.reset()` runs. Reorder so the DB read/insert captures values before reset, but keep `setStatus("success")` + `form.reset()` behavior unchanged.

- [ ] **Step 2: Verify** `npx tsc --noEmit && npm run build` → PASS. Manually submit the form: success UI shows AND a row appears in `contact_messages`.

- [ ] **Step 3: Commit**

```bash
git add app/contact/ContactForm.tsx
git commit -m "feat: persist contact submissions to supabase alongside emailjs"
```

---

## Task 7: Auth server helpers, admin layout, login & logout

**Files:**
- Create: `lib/auth.ts`, `app/admin/layout.tsx`, `app/admin/AdminNav.tsx`, `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `createClient` (server + browser).
- Produces:
  - `lib/auth.ts`: `async getCurrentProfile(): Promise<Profile | null>`, `async requireUser(): Promise<Profile>` (redirects to `/admin/login` if none), `async requireAdmin(): Promise<Profile>` (redirects to `/admin` if not admin).

- [ ] **Step 1: `lib/auth.ts`**

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/admin");
  return profile;
}
```

- [ ] **Step 2: `app/admin/AdminNav.tsx`** (client) links to `/admin`, `/admin/products`, `/admin/suppliers`, `/admin/tags`, `/admin/messages`; conditionally `/admin/users` when `role === "admin"`. Logout button calls `createClient().auth.signOut()` then `router.push("/admin/login"); router.refresh();`. Props: `{ role: Role; email: string | null }`.

```tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/types";

const base = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav({ role, email }: { role: Role; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? [...base, { href: "/admin/users", label: "Users" }] : base;
  async function logout() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  // render sidebar/topbar with links (active = pathname === href, or startsWith for non-root),
  // show email + role, and a Logout button calling logout().
  return (/* ...JSX with existing Tailwind tokens... */);
}
```

- [ ] **Step 3: `app/admin/layout.tsx`** (server) if pathname is the login page the layout still renders, but login has no nav. Simplest: layout fetches profile; if none, render children bare (login page handles its own UI and proxy already blocks other routes). If profile exists, render the admin shell with `AdminNav`.

```tsx
import { getCurrentProfile } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    // Unauthenticated: only /admin/login is reachable (proxy guards the rest).
    return <div className="min-h-screen bg-muted">{children}</div>;
  }
  return (
    <div className="min-h-screen bg-muted">
      <AdminNav role={profile.role} email={profile.email} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: `app/admin/login/page.tsx`** (client) email+password form; `createClient().auth.signInWithPassword(...)`; on success `router.push("/admin"); router.refresh();`; show inline error on failure. No signup link. Match the contact-form input styling.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setPending(false);
    if (error) { setError(error.message); return; }
    router.push("/admin");
    router.refresh();
  }
  // centered card with email+password inputs, submit (disabled while pending), error alert.
  return (/* ...JSX... */);
}
```

- [ ] **Step 5: Verify** `npx tsc --noEmit && npm run build` → PASS. Manually: visiting `/admin` while logged out → redirect to `/admin/login`; logging in with the seeded admin → lands on `/admin`; logout returns to login.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/admin/layout.tsx app/admin/AdminNav.tsx app/admin/login/page.tsx
git commit -m "feat: admin auth server helpers, layout, login, logout"
```

---

## Task 8: Admin dashboard

**Files:**
- Create: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireUser`, server `createClient` for counts.

- [ ] **Step 1: `app/admin/page.tsx`** (server) `const profile = await requireUser();` then fetch counts (`products`, `suppliers`, `tags`, unread `contact_messages`) using `select("*", { count: "exact", head: true })`, render summary cards linking to each section. Use existing card styling.

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireUser();
  const supabase = await createClient();
  const [products, suppliers, tags, unread] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("is_read", false),
  ]);
  // render 4 stat cards (products.count, suppliers.count, tags.count, unread.count) linking to sections.
  return (/* ...JSX... */);
}
```

- [ ] **Step 2: Verify** `npm run build` → PASS; dashboard shows counts.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: admin dashboard with section counts"
```

---

## Task 9: Admin products CRUD + media upload

**Files:**
- Create: `app/admin/products/page.tsx`, `app/admin/products/ProductsManager.tsx`, `app/admin/products/ProductForm.tsx`

**Interfaces:**
- Consumes: browser `createClient`, `Supplier`, `Tag`, `Product` types, `formatPrice`.
- Produces: full product create/edit/delete incl. image+video uploads to Storage.

- [ ] **Step 1: `app/admin/products/page.tsx`** (server) `await requireUser();` then render `<ProductsManager />`. Data loads client-side in the manager.

- [ ] **Step 2: `app/admin/products/ProductsManager.tsx`** (client) on mount, load products (reuse the nested select shape from Task 3 via the browser client), suppliers, and tags. Render a table (title, product_code, price, tags, image count). Buttons: Add (opens `ProductForm` empty), Edit (opens with values), Delete (deletes the `products` row cascade removes media/junction; then reload). Keep a `loading`/`error` state.

- [ ] **Step 3: `app/admin/products/ProductForm.tsx`** (client) fields: `product_code`, `title` (slug auto = lowercase, spaces/non-alnum → `-`, collapse repeats, trim), `description`, `price` (number), `supplier_id` (`<select>` from suppliers, optional/"None"), tags (multi-select checkboxes from tags), image files (`<input type="file" multiple accept="image/*">`), video files (`<input type="file" multiple accept="video/*">`) plus optional video URL text inputs.

  Save sequence (create):
  1. Upload each image file to bucket `product-images` at `${slug}/${crypto.randomUUID()}-${file.name}`; get public URL via `supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl`.
  2. Upload each video file to bucket `product-videos` similarly (collect public URLs); include any typed video URLs.
  3. Insert `products` row (`product_code, title, slug, description, price, supplier_id`); `.select("id").single()` → `productId`.
  4. Insert `product_images` rows `{ product_id, url, sort_order: index }`.
  5. Insert `product_videos` rows similarly.
  6. Insert `product_tags` rows `{ product_id, tag_id }` for checked tags.
  7. On any step error: surface inline message; do not close the form. (No partial-success UI required beyond the error.)

  Edit: same but for media, replace strategy = delete existing `product_images`/`product_videos`/`product_tags` for the product, then re-insert from current form state (simplest correct approach); update scalar fields on `products`.

  Provide an explicit helper:

```ts
function slugify(input: string) {
  return input.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
```

- [ ] **Step 4: Verify** `npx tsc --noEmit && npm run build` → PASS. Manually (logged in): create a product with supplier + 2 tags + 2 images + 1 video → appears on `/products` and `/products/[slug]`; edit changes persist; delete removes it.

- [ ] **Step 5: Commit**

```bash
git add app/admin/products
git commit -m "feat: admin product CRUD with image/video upload"
```

---

## Task 10: Admin suppliers CRUD

**Files:**
- Create: `app/admin/suppliers/page.tsx`, `app/admin/suppliers/SuppliersManager.tsx`

**Interfaces:**
- Consumes: browser `createClient`, `Supplier` type.

- [ ] **Step 1: `app/admin/suppliers/page.tsx`** (server) `await requireUser();` render `<SuppliersManager />`.

- [ ] **Step 2: `SuppliersManager.tsx`** (client) load suppliers; table (name, supplier_code, country, contact_person, phone, email, created_at). Add/Edit inline form with fields `supplier_code, name, country_of_origin, contact_person_name, contact_phone, contact_email`. Create/update/delete against `suppliers`; reload after each. Inline error state.

- [ ] **Step 3: Verify** `npm run build` → PASS; create/edit/delete a supplier; it appears in the product form's supplier dropdown.

- [ ] **Step 4: Commit**

```bash
git add app/admin/suppliers
git commit -m "feat: admin suppliers CRUD"
```

---

## Task 11: Admin tags CRUD

**Files:**
- Create: `app/admin/tags/page.tsx`, `app/admin/tags/TagsManager.tsx`

**Interfaces:**
- Consumes: browser `createClient`, `Tag` type.

- [ ] **Step 1: `app/admin/tags/page.tsx`** (server) `await requireUser();` render `<TagsManager />`.

- [ ] **Step 2: `TagsManager.tsx`** (client) load tags; table (name, tag_code); add/edit/delete with fields `name`, `tag_code`. Inline error state.

- [ ] **Step 3: Verify** `npm run build` → PASS; create a tag (e.g. "Pregnancy kit" / `TAG-PREG`); it appears in the product form tag list.

- [ ] **Step 4: Commit**

```bash
git add app/admin/tags
git commit -m "feat: admin tags CRUD"
```

---

## Task 12: Admin messages (read + mark-as-read)

**Files:**
- Create: `app/admin/messages/page.tsx`, `app/admin/messages/MessagesManager.tsx`

**Interfaces:**
- Consumes: browser `createClient`, `ContactMessage` type.

- [ ] **Step 1: `app/admin/messages/page.tsx`** (server) `await requireUser();` render `<MessagesManager />`.

- [ ] **Step 2: `MessagesManager.tsx`** (client) load `contact_messages` ordered `created_at desc`. List each (name, email, topic, org/phone if present, message, created_at, read/unread badge). "Mark as read"/"Mark as unread" toggles `is_read` via update, then updates local state. Unread visually highlighted.

- [ ] **Step 3: Verify** `npm run build` → PASS; the row created in Task 6 appears; toggling read updates the badge and the dashboard unread count.

- [ ] **Step 4: Commit**

```bash
git add app/admin/messages
git commit -m "feat: admin contact messages view + mark-as-read"
```

---

## Task 13: Admin users (role management, admin-only)

**Files:**
- Create: `app/admin/users/page.tsx`, `app/admin/users/UsersManager.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 7), browser `createClient`, `Profile`/`Role` types.

- [ ] **Step 1: `app/admin/users/page.tsx`** (server) `const me = await requireAdmin();` (redirects non-admins to `/admin`). Render `<UsersManager currentUserId={me.id} />`.

- [ ] **Step 2: `UsersManager.tsx`** (client, props `{ currentUserId: string }`) load `profiles` (email, role, created_at). Table with a role `<select>` (`admin`/`staff`) per row; changing it updates `profiles.role` for that id. Disable changing your own role (prevent self-lockout) by comparing to `currentUserId`. Inline error state. (New users are still created in the Supabase dashboard; note this in a small helper text.)

- [ ] **Step 3: Verify** `npm run build` → PASS. Manually: as admin, the Users link shows and the page lists profiles; change a staff user to admin and back; as a `staff` user, `/admin/users` redirects to `/admin` and the Users link is absent.

- [ ] **Step 4: Commit**

```bash
git add app/admin/users
git commit -m "feat: admin user role management (admin-only)"
```

---

## Final verification

- [ ] `npx tsc --noEmit` → no errors.
- [ ] `npm run lint` → clean.
- [ ] `npm run build` → succeeds.
- [ ] Manual end-to-end against Supabase: public list/detail render; contact submit emails + persists; login/logout; admin CRUD for products/suppliers/tags; messages read-toggle; admin-only users page with role gating.

## Self-review notes (spec coverage)

- Suppliers / tags / multi image+video / FK decoupling → Tasks 1, 3, 9, 10, 11. ✓
- Public dynamic list + homepage + detail page → Tasks 4, 5. ✓
- Contact EmailJS-preserving persistence → Task 6. ✓
- Auth invite-only + roles (admin/staff) + RLS helpers + admin-only users → Tasks 1, 7, 13. ✓
- Admin panel (dashboard, products, suppliers, tags, messages, users) → Tasks 8–13. ✓
- Next 16 proxy/async-params constraints captured in Global Constraints + Tasks 2, 5. ✓
