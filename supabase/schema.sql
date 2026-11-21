-- Mercy Footwears: database schema.
-- Run once in the Supabase SQL editor (or psql). Safe to re-run.
-- No secret key is needed by the website: customers place and track orders through the
-- two security-definer functions at the end (place_order, track_order), which re-check prices.

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

-- Table access for the API roles (row-level security below decides which rows).
grant usage on schema public to anon, authenticated;
grant select on public.products, public.product_images, public.settings to anon, authenticated;
grant insert, update, delete on public.products, public.product_images, public.settings to authenticated;
grant select, insert, update, delete on public.orders, public.order_items to authenticated;
grant select on public.admin_users to authenticated;

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

-- Orders: customers create and track them only through place_order / track_order below;
-- reading or changing orders directly is admin-only.
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

-- ---------------------------------------------------------------------------
-- Customer order functions (callable with the public key).
-- ---------------------------------------------------------------------------

-- Places an order. Prices (each product's own sale price while the sale is on), totals,
-- the free gift and status are worked out here from the catalogue and sale settings; only choices (items, sizes, colours, contact) come from the caller.
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ref text := coalesce(p->>'ref', '');
  v_sale jsonb;
  v_live boolean := false;
  v_upcoming boolean := false;
  v_gift_min int;
  it jsonb;
  pr public.products%rowtype;
  v_unit int;
  v_qty int;
  v_size int;
  v_colour text;
  v_sub int := 0;
  v_full int := 0;
  v_pairs int := 0;
  v_items jsonb := '[]'::jsonb;
  v_ready date;
  v_digits text := regexp_replace(coalesce(p->>'phone', ''), '\D', '', 'g');
  v_ful text := p->>'fulfilment';
  v_settings jsonb;
  i int;
begin
  if length(trim(coalesce(p->>'name', ''))) = 0 then raise exception 'Please add your name.'; end if;
  if length(v_digits) not between 10 and 14 then raise exception 'Please add a valid WhatsApp number.'; end if;
  if v_ful not in ('pickup', 'delivery') then raise exception 'Choose pickup or delivery.'; end if;
  if v_ful = 'delivery' and length(trim(coalesce(p->>'address', ''))) < 6 then raise exception 'Please add your delivery address.'; end if;
  if jsonb_typeof(p->'items') is distinct from 'array' or jsonb_array_length(p->'items') not between 1 and 50 then
    raise exception 'Your bag is empty.';
  end if;

  select value into v_settings from public.settings where key = 'settings';
  if v_settings is not null and not coalesce((v_settings #>> array['fulfilment', v_ful])::boolean, true) then
    raise exception '% is not available right now.', initcap(v_ful);
  end if;

  -- Sale: on/off switch with optional start and end dates (empty = no limit).
  select value into v_sale from public.settings where key = 'sale';
  if v_sale is not null and coalesce((v_sale->>'active')::boolean, false) then
    if nullif(v_sale->>'startsAt', '') is not null and now() < (v_sale->>'startsAt')::timestamptz then
      v_upcoming := true;
    elsif nullif(v_sale->>'endsAt', '') is null or now() <= (v_sale->>'endsAt')::timestamptz then
      v_live := true;
    end if;
    v_gift_min := greatest(1, coalesce((v_sale->>'freeGiftMinPairs')::int, 4));
  end if;

  for it in select * from jsonb_array_elements(p->'items') loop
    select * into pr from public.products where id = it->>'productId' and in_stock;
    if not found then raise exception 'One of the items is no longer available. Please refresh and try again.'; end if;
    v_size := (it->>'size')::int;
    if not (v_size = any (pr.sizes)) then raise exception 'Size % is not available for %.', v_size, pr.name; end if;
    v_qty := greatest(1, least(20, coalesce((it->>'qty')::int, 1)));
    select c->>'name' into v_colour from jsonb_array_elements(pr.colours) c where c->>'name' = it->>'colour' limit 1;
    if v_colour is null then v_colour := pr.colours -> 0 ->> 'name'; end if;
    -- Each product has its own sale price; without one it stays at the normal price.
    v_unit := pr.price;
    if v_live and pr.sale_price is not null and pr.sale_price > 0 and pr.sale_price < pr.price then
      v_unit := pr.sale_price;
    end if;
    v_sub := v_sub + v_unit * v_qty;
    v_full := v_full + pr.price * v_qty;
    v_pairs := v_pairs + v_qty;
    v_items := v_items || jsonb_build_object(
      'product_id', pr.id, 'name', pr.name, 'colour', coalesce(v_colour, ''), 'size', v_size, 'qty', v_qty,
      'unit_price', v_unit, 'total', v_unit * v_qty, 'image', nullif(left(coalesce(it->>'image', ''), 500), ''));
  end loop;

  -- Ready date is worked out by the site (working days + sale production date); keep it sensible.
  v_ready := coalesce(nullif(p->>'expectedReady', '')::date, current_date + 10);
  if v_ready < current_date or v_ready > current_date + 180 then v_ready := current_date + 10; end if;

  if v_ref !~ '^MF-[0-9]{5}$' then v_ref := 'MF-' || (10000 + floor(random() * 90000))::int; end if;
  for i in 1..8 loop
    begin
      insert into public.orders (ref, customer_name, phone, fulfilment, address, city, state, note, subtotal, full_total, gift_unlocked, status, expected_ready)
      values (
        v_ref, left(trim(p->>'name'), 120), left(trim(p->>'phone'), 40), v_ful,
        case when v_ful = 'delivery' then left(trim(coalesce(p->>'address', '')), 300) else '' end,
        case when v_ful = 'delivery' then left(trim(coalesce(p->>'city', '')), 80) else '' end,
        case when v_ful = 'delivery' then left(trim(coalesce(p->>'state', '')), 80) else '' end,
        left(trim(coalesce(p->>'note', '')), 500),
        v_sub, v_full, (v_live or v_upcoming) and v_pairs >= coalesce(v_gift_min, 999999), 'received', v_ready);
      exit;
    exception when unique_violation then
      v_ref := 'MF-' || (10000 + floor(random() * 90000))::int;
      if i = 8 then raise; end if;
    end;
  end loop;

  insert into public.order_items (order_ref, product_id, name, colour, size, qty, unit_price, total, image)
  select v_ref, x->>'product_id', x->>'name', x->>'colour', (x->>'size')::int, (x->>'qty')::int, (x->>'unit_price')::int, (x->>'total')::int, x->>'image'
  from jsonb_array_elements(v_items) x;

  return (select to_jsonb(o) || jsonb_build_object('order_items', v_items) from public.orders o where o.ref = v_ref);
end;
$$;

-- Looks up an order by reference + phone (last 10 digits must match). Returns null if not found.
create or replace function public.track_order(p_ref text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(o) || jsonb_build_object('order_items', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from public.order_items i where i.order_ref = o.ref), '[]'::jsonb))
  from public.orders o
  where o.ref = upper(trim(p_ref))
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
    and right(regexp_replace(o.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
