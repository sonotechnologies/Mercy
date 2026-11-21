-- Mercy Footwears: database schema.
-- Run once in the Supabase SQL editor (or psql). Safe to re-run.

-- Admins (by email). Only these signed-in users can edit the store or see orders.
create table if not exists public.admin_users (
  email text primary key
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Catalogue
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  gender text not null check (gender in ('women', 'men-unisex')),
  style text not null,
  price integer not null check (price >= 0),
  sale_price integer check (sale_price >= 0),
  colours jsonb not null default '[]',
  sizes integer[] not null default '{}',
  sold_out_sizes integer[] not null default '{}',
  in_stock boolean not null default true,
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  description text not null default '',
  focus text,
  order_type text check (order_type in ('made-to-order', 'ready-stock')),
  production_time text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  position integer not null default 0
);
create index if not exists product_images_product_idx on public.product_images(product_id, position);

-- Store settings and sale config, one JSON row each ('settings', 'sale').
create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

-- Orders
create table if not exists public.orders (
  ref text primary key check (ref ~ '^MF-[0-9]{5}$'),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  fulfilment text not null check (fulfilment in ('pickup', 'delivery')),
  address text not null default '',
  city text not null default '',
  state text not null default '',
  note text not null default '',
  subtotal integer not null,
  full_total integer not null,
  gift_unlocked boolean not null default false,
  status text not null default 'received'
    check (status in ('received', 'confirmed', 'in-production', 'ready', 'out-for-delivery', 'completed', 'cancelled')),
  expected_ready date not null
);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(ref) on delete cascade,
  product_id text,
  name text not null,
  colour text not null default '',
  size integer not null,
  qty integer not null check (qty > 0),
  unit_price integer not null,
  total integer not null,
  image text
);
create index if not exists order_items_order_idx on public.order_items(order_ref);

-- Row-level security
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public can read the catalogue and settings; only admins write.
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read images" on public.product_images;
create policy "public read images" on public.product_images for select using (true);
drop policy if exists "admin write images" on public.product_images;
create policy "admin write images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
drop policy if exists "admin write settings" on public.settings;
create policy "admin write settings" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders: customers create and track them through the server routes (secret key);
-- in the browser, only admins can read or update them.
drop policy if exists "admin orders" on public.orders;
create policy "admin orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin order items" on public.order_items;
create policy "admin order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read admins" on public.admin_users;
create policy "admin read admins" on public.admin_users for select to authenticated using (public.is_admin());

-- Photo storage: public bucket, admin-only uploads.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
