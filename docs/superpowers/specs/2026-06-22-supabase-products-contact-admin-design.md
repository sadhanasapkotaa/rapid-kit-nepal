  # Design: Dynamic Products, Suppliers, Tags, Contact Persistence & Admin Panel

  **Date:** 2026-06-22
  **Status:** Approved (revised after richer data-model requirements)

  ## Goal

  Make the product catalogue dynamic via Supabase with a normalized,
  loosely-coupled schema (suppliers, tags, multiple images/videos per product),
  persist contact-form submissions to Supabase without breaking the existing
  EmailJS flow, and add an authenticated admin panel where admins manage products,
  suppliers, tags, and read contact messages. The schema must be extensible so
  future supplies/inventory features attach without rework.

  ## Context

  - Next.js 16.2.6 (App Router), React 19, Tailwind v4.
  - `@supabase/ssr` and `@supabase/supabase-js` already installed.
  - `.env` contains `NEXT_PUBLIC_SUPABASE_URL` and
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon). SQL is applied via the Supabase
    dashboard SQL editor; no DB password needed there.
  - Products currently hard-coded in `app/products/products.ts`, consumed by
    `app/products/page.tsx` and homepage `app/page.tsx` (featured = first 3).
  - Contact form `app/contact/ContactForm.tsx` is a client component using EmailJS.

  > **AGENTS.md constraint:** This Next.js version has breaking changes. The
  > relevant guides in `node_modules/next/dist/docs/` MUST be read before writing
  > middleware, server components, route handlers, or dynamic route params.

  ## Decisions (from brainstorming)

  1. **Admin access & roles:** Manual / invite-only. No public signup. User
    accounts created in the Supabase dashboard. A `profiles` table assigns each
    user a **role**: `admin` (full access incl. managing users/roles) or `staff`
    (manage all content products, suppliers, tags, messages but NOT users).
    New users default to `staff`; an admin promotes them. The first admin is set
    by an `UPDATE` documented in setup.
  2. **Product images & videos:** Uploaded to Supabase Storage buckets; public
    URLs saved as rows. A product can have 1+ images and 1+ videos.
  3. **Tags:** Many-to-many. Tags (e.g. "HIV kit", "Pregnancy kit") have a
    `tag_code`. A product can carry multiple tags.
  4. **Suppliers:** Each product may be associated with one supplier (FK).
    Supplier data is internal visible only in the admin panel.
  5. **Contact flow:** Keep EmailJS send as-is AND additionally insert into
    Supabase. Email stays the source of truth for the success/error UX.
  6. **Public detail page:** Add `/products/[slug]` showing the image gallery,
    videos, full description, and tags. Listing cards link to it.
  7. **URL identifier:** Auto-generated slug from product title. `product_code`
    remains an internal field.

  ## Architecture

  ### 1. Supabase schema (normalized & decoupled)

  **`suppliers`**
  - `id` uuid pk default `gen_random_uuid()`
  - `supplier_code` text unique not null
  - `name` text not null
  - `country_of_origin` text
  - `contact_person_name` text
  - `contact_phone` text
  - `contact_email` text
  - `created_at` timestamptz not null default `now()` (supplier addition date)
  - Supplier's product list is **derived** via the FK on `products`, not stored.

  **`tags`**
  - `id` uuid pk default `gen_random_uuid()`
  - `tag_code` text unique not null
  - `name` text not null
  - `created_at` timestamptz not null default `now()`

  **`products`**
  - `id` uuid pk default `gen_random_uuid()`
  - `product_code` text unique not null
  - `supplier_id` uuid null references `suppliers(id)` on delete set null
  - `title` text not null
  - `slug` text unique not null
  - `description` text
  - `price` numeric not null
  - `created_at` timestamptz not null default `now()`

  **`product_images`**
  - `id` uuid pk, `product_id` uuid references `products(id)` on delete cascade
  - `url` text not null, `sort_order` int not null default 0
  - `created_at` timestamptz default `now()`

  **`product_videos`**
  - `id` uuid pk, `product_id` uuid references `products(id)` on delete cascade
  - `url` text not null, `sort_order` int not null default 0
  - `created_at` timestamptz default `now()`

  **`product_tags`** (junction, many-to-many)
  - `product_id` uuid references `products(id)` on delete cascade
  - `tag_id` uuid references `tags(id)` on delete cascade
  - primary key `(product_id, tag_id)`

  **`profiles`** (one row per auth user; holds the role)
  - `id` uuid pk references `auth.users(id)` on delete cascade
  - `email` text
  - `role` text not null default `'staff'` check (`role in ('admin','staff')`)
  - `created_at` timestamptz not null default `now()`
  - A trigger on `auth.users` insert creates a matching `profiles` row with the
    default `staff` role. Role list is a simple `check` constraint so adding a
    future role (e.g. `viewer`) is a one-line change.

  **Role helper functions** (`security definer`, to avoid RLS recursion on
  `profiles`):
  - `is_admin()` → true if the caller's profile role is `admin`.
  - `is_staff_or_admin()` → true if the caller has any profile (staff or admin).

  **Storage buckets** `product-images` and `product-videos` public read,
  authenticated write.

  **Decoupling notes:** all relationships are explicit FKs with deliberate
  on-delete behavior (cascade for owned media/junctions, `set null` for the
  supplier association so deleting a supplier never destroys products). No derived
  data is stored. Future `supplies` / `inventory` tables can FK to `products` and
  `suppliers` without touching existing tables.

  ### 2. RLS policies

  - Public `SELECT`: `products`, `product_images`, `product_videos`,
    `product_tags`, `tags`.
  - Internal `SELECT`: `suppliers` `is_staff_or_admin()` only (no public read).
  - Content writes (`INSERT`/`UPDATE`/`DELETE`) on `products`, `product_images`,
    `product_videos`, `product_tags`, `tags`, `suppliers`: `is_staff_or_admin()`
    (both roles manage content).
  - `contact_messages`: anon + authenticated `INSERT`; `SELECT`/`UPDATE` for
    `is_staff_or_admin()`.
  - `profiles`: a user may `SELECT` their own row; `is_admin()` may
    `SELECT`/`UPDATE`/`DELETE` any row (role assignment is admin-only). Inserts
    happen via the `security definer` trigger.
  - Storage `product-images` / `product-videos`: public `SELECT`; authenticated
    write.

  **`contact_messages`** (unchanged from prior revision)
  - `id` uuid pk, `created_at` timestamptz default `now()`
  - `name`, `email` (not null), `organization` (null), `phone` (null),
    `topic` (not null), `message` (not null), `is_read` bool default false.

  Public signups disabled in Supabase Auth settings (documented). Users are
  created in the dashboard; their role lives in `profiles`.

  **Seed:** migrate the 7 existing products create tags from their current
  categories (HIV/HCV Diagnostics), insert each product with a generated
  `product_code`, a slug, its single existing image as one `product_images` row,
  and the matching tag. No supplier (nullable).

  ### 3. Supabase client wiring (`@supabase/ssr`)

  - `lib/supabase/client.ts` browser client (contact form + admin interactions).
  - `lib/supabase/server.ts` cookie-based server client (Server Components,
    auth checks).
  - `middleware.ts` refreshes the auth session cookie (required by
    `@supabase/ssr`) and guards `/admin/*`.

  ### 4. Dynamic products + data access layer

  `app/products/products.ts` keeps `formatPrice`; the hard-coded array is removed.
  New types and async accessors (via the server client):

  - `Product` (with `images: string[]`, `videos: string[]`, `tags: Tag[]`,
    optional `supplier`).
  - `getProducts()` listing data (joins images, tags).
  - `getFeaturedProducts()` first N for the homepage.
  - `getProductBySlug(slug)` full detail incl. videos.

  `app/products/page.tsx` and `app/page.tsx` become `async` Server Components.
  Listing card UI: first image (lowest `sort_order`), title, tag chips, price,
  link to `/products/[slug]`. Top-of-page category chips derive from tags.

  ### 5. Product detail page `app/products/[slug]/page.tsx`

  Server Component reading `getProductBySlug`. Renders image gallery, embedded
  videos, full description, tag chips, price, and an "Enquire" link to `/contact`.
  No supplier info shown. Returns `notFound()` for unknown slugs.

  ### 6. Contact form additive only

  `app/contact/ContactForm.tsx`: EmailJS `sendForm` stays exactly as-is. After
  (and independent of) the email send, insert the field values into
  `contact_messages` via the browser client. A DB-insert failure is logged but
  does not affect the EmailJS-driven success/error UX.

  ### 7. Auth + admin panel (`app/admin/`)

  - `/admin/login` email + password login. No signup link.
  - `middleware.ts` guards `/admin/*` except `/admin/login`; unauthenticated →
    redirect to login.
  - `/admin` dashboard. Nav shows Products, Suppliers, Tags, Messages for all
    users; **Users** appears only for admins. Logout button.
  - `/admin/products` list + add/edit/delete. Form fields: `product_code`,
    `title` (slug auto-derived), `description`, `price`, supplier (select from
    suppliers), tags (multi-select from tags), images (multi-upload), videos
    (multi-upload or URL).
  - `/admin/suppliers` CRUD suppliers (all fields incl. contact details).
  - `/admin/tags` CRUD tags (`name`, `tag_code`).
  - `/admin/messages` contact messages, newest first, mark-as-read.
  - `/admin/users` **admin-only**. Lists profiles (email, role); admin can
    change a user's role between `admin` and `staff`. Non-admins hitting this
    route are redirected to `/admin`.

  The admin layout fetches the current user's role (server-side) to gate the
  Users nav/route. Content writes go through the authenticated browser client;
  RLS enforces role permissions regardless of UI.

  ### 8. Docs

  `SUPABASE_SETUP.md`: full SQL (tables + RLS + seed), bucket creation, disabling
  public signups, and creating the first admin user.

  ## Data flow

  - **Public listing/detail:** Server Component → server Supabase client →
    `SELECT` (public RLS) → render. Suppliers excluded.
  - **Contact submit:** Client → EmailJS `sendForm` (unchanged) + browser client
    `INSERT` into `contact_messages` (anon RLS).
  - **Admin:** middleware verifies session → admin pages use authenticated browser
    client → reads/writes allowed by RLS, including suppliers.

  ## Error handling

  - Product reads failing → empty/zero-state catalogue (no crash).
  - Unknown slug → `notFound()`.
  - Contact DB insert failing → log only; EmailJS UX unaffected.
  - Admin actions failing → inline error; no optimistic data loss.
  - Media upload failing → surface error, do not save a half-broken product.
  - Unauthenticated `/admin/*` → redirect to `/admin/login`.

  ## Testing / verification

  - Listing + detail pages render products, images, videos, and tags from Supabase.
  - Contact submit sends email AND creates a `contact_messages` row.
  - `/admin/*` redirects to login when logged out.
  - Logged-in user can: create a supplier; create a tag; create a product with a
    supplier, multiple tags, multiple images, and a video and it appears on the
    public listing + detail page; view/mark messages.
  - Supplier data never appears on public pages.
  - An `admin` sees the Users page and can change another user's role; a `staff`
    user cannot reach `/admin/users` (redirected) and the RLS blocks role writes.

  ## Out of scope (YAGNI, deferred to later phases)

  - Supplies / inventory tables (schema is designed to accept them later).
  - Per-record / per-supplier scoping beyond the admin/staff split.
  - Editing decorative marketing copy/stats.
  - Orders / checkout.
