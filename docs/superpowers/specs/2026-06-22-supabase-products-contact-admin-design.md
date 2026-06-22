# Design: Dynamic Products, Contact Persistence & Admin Panel

**Date:** 2026-06-22
**Status:** Approved

## Goal

Make the product catalogue dynamic via Supabase, persist contact-form
submissions to Supabase (without breaking the existing EmailJS flow), and add an
authenticated admin panel where admins can add products and read contact
messages.

## Context

- Next.js 16.2.6 (App Router), React 19, Tailwind v4.
- `@supabase/ssr` and `@supabase/supabase-js` already installed.
- `.env` already contains `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Products are currently hard-coded in `app/products/products.ts`, consumed by
  both `app/products/page.tsx` and the homepage `app/page.tsx` (featured = first 3).
- Contact form `app/contact/ContactForm.tsx` is a client component using EmailJS.

> **AGENTS.md constraint:** This Next.js version has breaking changes. The
> relevant guides in `node_modules/next/dist/docs/` MUST be read before writing
> middleware, server components, or route handlers.

## Decisions (from brainstorming)

1. **Admin access:** Manual / invite-only. No public signup. Admin accounts are
   created in the Supabase dashboard. Every authenticated user is an admin — no
   separate role table.
2. **Product images:** Uploaded to a Supabase Storage bucket; the public URL is
   saved on the product row.
3. **Contact flow:** Keep EmailJS send exactly as-is **and additionally** insert
   the message into Supabase. Email remains the source of truth for the existing
   success/error UX.

## Architecture

### 1. Supabase schema

**`products`**
- `id` uuid pk default `gen_random_uuid()`
- `created_at` timestamptz default `now()`
- `slug` text unique not null
- `name` text not null
- `category` text not null
- `price` numeric not null
- `description` text not null
- `image` text not null (public Storage URL)

**`contact_messages`**
- `id` uuid pk default `gen_random_uuid()`
- `created_at` timestamptz default `now()`
- `name` text not null
- `email` text not null
- `organization` text (nullable)
- `phone` text (nullable)
- `topic` text not null
- `message` text not null
- `is_read` boolean not null default false

**Storage bucket** `product-images` — public read, authenticated write.

### 2. RLS policies

- `products`: public `SELECT`; authenticated `INSERT`/`UPDATE`/`DELETE`.
- `contact_messages`: anon + authenticated `INSERT`; authenticated
  `SELECT`/`UPDATE` only.
- Storage `product-images`: public `SELECT`; authenticated
  `INSERT`/`UPDATE`/`DELETE`.

Public signups disabled in Supabase Auth settings (documented toggle). Because
signup is disabled, the set of authenticated users == the set of admins.

A seed SQL statement migrates the 7 existing hard-coded products into the table.

### 3. Supabase client wiring (`@supabase/ssr`)

- `lib/supabase/client.ts` — browser client (contact form + admin client
  interactions).
- `lib/supabase/server.ts` — cookie-based server client (Server Components
  reading products, auth checks).
- `middleware.ts` — refreshes the auth session cookie on each request (required
  by `@supabase/ssr`) and guards `/admin/*`.

### 4. Dynamic products

- `app/products/products.ts`: keep the `Product` type and `formatPrice`; remove
  the hard-coded array; add `getProducts()` and `getFeaturedProducts()` that read
  from Supabase via the server client.
- `app/products/page.tsx` and `app/page.tsx` become `async` Server Components
  calling those functions. UI markup unchanged. Categories derived from the
  fetched rows.

### 5. Contact form — additive only

`app/contact/ContactForm.tsx`: EmailJS `sendForm` stays exactly as-is. After
(and independent of) the email send, also insert the field values into
`contact_messages` via the browser client. A DB-insert failure is logged but
does not block the user's success state; email remains the source of truth.

### 6. Auth + admin panel (`app/admin/`)

- `/admin/login` — email + password login (Supabase Auth). No signup link.
- `middleware.ts` guards `/admin/*` except `/admin/login`; unauthenticated →
  redirect to login.
- `/admin` — dashboard: nav to Products + Messages, logout button.
- `/admin/products` — product table with add / edit / delete. Add/edit form
  includes an image file upload to `product-images`, then saves the row.
- `/admin/messages` — contact messages, newest first, mark-as-read.

Admin write operations go through the authenticated browser client; RLS permits
the writes.

### 7. Docs

`SUPABASE_SETUP.md` documenting: the SQL (tables + RLS + seed), bucket creation,
disabling public signups, and creating the first admin user.

## Data flow

- **Public product view:** Server Component → server Supabase client →
  `SELECT` (public RLS) → render.
- **Contact submit:** Client → EmailJS `sendForm` (unchanged) + browser Supabase
  client `INSERT` into `contact_messages` (anon RLS).
- **Admin:** middleware verifies session → admin pages use browser client with
  authenticated session → reads/writes allowed by RLS.

## Error handling

- Product reads failing → render empty/zero-state catalogue (no crash).
- Contact DB insert failing → log, do not affect EmailJS-driven success UX.
- Admin actions failing → inline error message; no optimistic data loss.
- Unauthenticated `/admin/*` access → redirect to `/admin/login`.

## Testing / verification

- Products page and homepage render rows from Supabase.
- Contact submit sends email AND creates a `contact_messages` row.
- `/admin/*` redirects to login when logged out.
- Logged-in admin can add a product (with image upload) that then appears on the
  public site, and can view/mark messages.

## Out of scope (YAGNI)

- Product detail (`[slug]`) pages — none exist today.
- Multi-role permissions / per-admin scoping.
- Editing the decorative marketing copy/stats.
- Order/checkout functionality.
