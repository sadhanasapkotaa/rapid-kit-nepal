# Supabase Setup

One-time setup to make the dynamic products, contact persistence, and admin
panel work. The app reads `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env` (already configured).

## 1. Run the schema

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → **New query**.
3. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.

This creates all tables, row-level-security policies, the `is_admin()` /
`is_staff_or_admin()` helpers, the new-user → `profiles` trigger, storage
policies, and seeds the 7 existing products + their tags.

> Sanity check (run in SQL Editor):
> `select count(*) from public.products;` → **7**
> `select * from public.tags;` → **2 rows** (HIV / HCV Diagnostics)

## 2. Create the storage buckets

1. Go to **Storage** → **New bucket**.
2. Create **`product-images`** — toggle **Public bucket** ON.
3. Create **`product-videos`** — toggle **Public bucket** ON.

The read/write policies for these buckets are already created by `schema.sql`
(public read, authenticated write). Create the buckets *after* running the SQL,
or re-run the storage-policy block if you create them later.

## 3. Disable public sign-ups (invite-only)

1. Go to **Authentication** → **Sign In / Providers** (or **Settings**).
2. **Disable** "Allow new users to sign up".

This keeps the admin panel invite-only — only users you create can log in.

## 4. Create the first admin user

1. Go to **Authentication** → **Users** → **Add user** → enter an email +
   password (this is the admin login).
2. The trigger auto-creates a `profiles` row with role `staff`. Promote it to
   admin in the **SQL Editor**:

   ```sql
   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
   ```

3. Log in at `/admin/login`.

## Roles

- **admin** — full access, including the **Users** page (assign/revoke roles).
- **staff** — manage all content (products, suppliers, tags) and read/mark
  contact messages, but cannot manage users.

New users always start as `staff`; an admin promotes them on the Users page.

## Notes

- The 7 seeded products reference images already in `public/images/...`.
  Products you add through the admin panel upload their images/videos to the
  Storage buckets and store the public URLs.
- Suppliers hold internal contact data and are never exposed on the public site
  (RLS blocks public reads).
