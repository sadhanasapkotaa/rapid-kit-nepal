-- =========================================================
-- Rapid Kit House Nepal — schema, RLS, helpers, seed
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

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  generation_code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text unique not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  generation_id uuid references public.generations(id) on delete set null,
  title text not null,
  slug text unique not null,
  description text,
  price numeric not null,
  created_at timestamptz not null default now()
);

-- If products already exists, make sure the new column is present.
alter table public.products
  add column if not exists generation_id uuid references public.generations(id) on delete set null;

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
alter table public.generations enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_videos enable row level security;
alter table public.product_tags enable row level security;
alter table public.contact_messages enable row level security;
alter table public.profiles enable row level security;

-- ---------- Policies: public-readable content ----------
drop policy if exists "public read products" on public.products;
drop policy if exists "public read product_images" on public.product_images;
drop policy if exists "public read product_videos" on public.product_videos;
drop policy if exists "public read product_tags" on public.product_tags;
drop policy if exists "public read tags" on public.tags;
drop policy if exists "public read generations" on public.generations;

create policy "public read products" on public.products for select using (true);
create policy "public read product_images" on public.product_images for select using (true);
create policy "public read product_videos" on public.product_videos for select using (true);
create policy "public read product_tags" on public.product_tags for select using (true);
create policy "public read tags" on public.tags for select using (true);
create policy "public read generations" on public.generations for select using (true);

-- content writes: admin only
drop policy if exists "staff write products" on public.products;
drop policy if exists "staff write product_images" on public.product_images;
drop policy if exists "staff write product_videos" on public.product_videos;
drop policy if exists "staff write product_tags" on public.product_tags;
drop policy if exists "staff write tags" on public.tags;
drop policy if exists "admin write products" on public.products;
drop policy if exists "admin write product_images" on public.product_images;
drop policy if exists "admin write product_videos" on public.product_videos;
drop policy if exists "admin write product_tags" on public.product_tags;
drop policy if exists "admin write tags" on public.tags;
drop policy if exists "admin write generations" on public.generations;

create policy "admin write products" on public.products for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write product_images" on public.product_images for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write product_videos" on public.product_videos for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write product_tags" on public.product_tags for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write tags" on public.tags for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write generations" on public.generations for all
  using (public.is_admin()) with check (public.is_admin());

-- suppliers: internal — admin read + write, no public read
drop policy if exists "staff read suppliers" on public.suppliers;
drop policy if exists "staff write suppliers" on public.suppliers;
drop policy if exists "admin read suppliers" on public.suppliers;
drop policy if exists "admin write suppliers" on public.suppliers;
create policy "admin read suppliers" on public.suppliers for select
  using (public.is_admin());
create policy "admin write suppliers" on public.suppliers for all
  using (public.is_admin()) with check (public.is_admin());

-- contact_messages: anyone may INSERT; admin read & update
drop policy if exists "anyone insert messages" on public.contact_messages;
drop policy if exists "staff read messages" on public.contact_messages;
drop policy if exists "staff update messages" on public.contact_messages;
drop policy if exists "admin read messages" on public.contact_messages;
drop policy if exists "admin update messages" on public.contact_messages;
create policy "anyone insert messages" on public.contact_messages for insert
  with check (true);
create policy "admin read messages" on public.contact_messages for select
  using (public.is_admin());
create policy "admin update messages" on public.contact_messages for update
  using (public.is_admin()) with check (public.is_admin());

-- profiles: self read; admin read/update/delete
drop policy if exists "self read profile" on public.profiles;
drop policy if exists "admin read profiles" on public.profiles;
drop policy if exists "admin update profiles" on public.profiles;
drop policy if exists "admin delete profiles" on public.profiles;
create policy "self read profile" on public.profiles for select
  using (id = auth.uid());
create policy "admin read profiles" on public.profiles for select
  using (public.is_admin());
create policy "admin update profiles" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admin delete profiles" on public.profiles for delete
  using (public.is_admin());

-- ---------- Storage bucket policies ----------
-- Create the buckets `product-images` and `product-videos` (Public) in the
-- Dashboard first, then these policies allow public read + admin-only write.
drop policy if exists "public read product media" on storage.objects;
drop policy if exists "auth write product media" on storage.objects;
drop policy if exists "auth update product media" on storage.objects;
drop policy if exists "auth delete product media" on storage.objects;
drop policy if exists "admin write product media" on storage.objects;
drop policy if exists "admin update product media" on storage.objects;
drop policy if exists "admin delete product media" on storage.objects;
create policy "public read product media" on storage.objects for select
  using (bucket_id in ('product-images','product-videos'));
create policy "admin write product media" on storage.objects for insert
  with check (bucket_id in ('product-images','product-videos') and public.is_admin());
create policy "admin update product media" on storage.objects for update
  using (bucket_id in ('product-images','product-videos') and public.is_admin());
create policy "admin delete product media" on storage.objects for delete
  using (bucket_id in ('product-images','product-videos') and public.is_admin());

-- ---------- Seed: tags + generations + existing 7 products ----------
insert into public.tags (tag_code, name) values
  ('TAG-HIV','HIV Diagnostics'),
  ('TAG-HCV','HCV Diagnostics')
on conflict (tag_code) do nothing;

insert into public.generations (generation_code, name) values
  ('GEN-3','3rd Generation Kit'),
  ('GEN-4','4th Generation Kit')
on conflict (generation_code) do nothing;

insert into public.products (product_code, title, slug, description, price) values
  ('PRD-001','HIV-Tri-Dot','hiv-tri-dot','Rapid visual immunoassay for the qualitative detection of antibodies to HIV-1 and HIV-2 in human serum, plasma, or whole blood.',899),
  ('PRD-002','Tridot-HCV','tridot-hcv','Rapid, sensitive immunoassay for the qualitative detection of antibodies to Hepatitis C virus in human serum or plasma.',949),
  ('PRD-003','Abbott-hcv','abbott-hcv','Abbott rapid HCV antibody test for reliable point-of-care screening with clear visual results in minutes.',1199),
  ('PRD-004','All-test-hcv','all-test-hcv','All-Test HCV one-step antibody cassette for qualitative detection in serum, plasma, or whole blood samples.',849),
  ('PRD-005','Cg-hcv','cg-hcv','CG rapid HCV antibody test strip — economical screening tool suitable for clinics, camps, and outreach programs.',799),
  ('PRD-006','Elisa-hcv','elisa-hcv','ELISA-based HCV antibody detection kit for laboratory use, delivering quantitative results with high sensitivity and specificity.',2499),
  ('PRD-007','newscan-hcv','newscan-hcv','Newscan rapid HCV antibody cassette designed for fast, reliable screening in resource-limited settings.',879)
on conflict (product_code) do nothing;

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
where not exists (
  select 1 from public.product_images pi where pi.product_id = p.id and pi.url = i.url
);

insert into public.product_tags (product_id, tag_id)
select p.id, t.id from public.products p, public.tags t
where (p.slug = 'hiv-tri-dot' and t.tag_code = 'TAG-HIV')
   or (p.slug <> 'hiv-tri-dot' and t.tag_code = 'TAG-HCV')
on conflict do nothing;

-- ---------- Designate the sole admin ----------
-- Writes are admin-only (see policies above). New Auth signups default to
-- 'staff' via handle_new_user(), which now grants NO write access.
-- 1) Create the login: Dashboard → Authentication → Users → Add user
--    (Auto Confirm), or the Admin API (POST /auth/v1/admin/users).
-- 2) Promote exactly that user and demote everyone else:
update public.profiles set role = 'staff';
update public.profiles set role = 'admin'
where email = 'rapidkithouseofficial@gmail.com';   -- <-- the admin's email
