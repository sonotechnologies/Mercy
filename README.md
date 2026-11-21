# Mercy Footwears: online store

A mobile-first store for Mercy Footwears. **Every pair is made to order**: customers order online, get an order reference, Mercy confirms on WhatsApp, makes the pairs, and the customer picks up (or gets delivery) when they're ready. Customers follow progress on `/track`; Mercy manages everything in `/admin`.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, with **Supabase** (Postgres, Auth, Storage) for products, orders and photos.

### Two modes

| | Demo mode | Supabase mode |
| --- | --- | --- |
| Switched on by | no Supabase env vars | `NEXT_PUBLIC_SUPABASE_URL` + publishable key + secret key |
| Products & settings | seed data, admin edits saved in this browser | database, live for everyone |
| Orders & tracking | this browser only | database, any device |
| Admin login | passcode `mercy2026` | email + password (Supabase Auth) |
| Photos | small data URLs in the browser | Supabase Storage bucket `product-images` |

## Connecting Supabase

Only the project URL and the **publishable** key are used. Customers place and track orders through two database functions (`place_order`, `track_order`) that recalculate prices from the catalogue and check the phone number, so no secret key is needed anywhere.

1. In the Supabase dashboard → **SQL Editor**, paste all of `supabase/setup.sql` and click **Run**. It creates the tables, security rules, photo bucket and functions, loads the 20 current products and settings, and makes `mercy@gmail.com` the admin. It's safe to run again; it never overwrites products edited in the admin.
   (To regenerate it: `npx tsx scripts/build-setup-sql.ts --admin-email someone@example.com`.)
2. **Authentication → Users → Add user → Create new user**: email `mercy@gmail.com`, a password, tick **Auto Confirm User**.
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
4. In **Vercel → Project → Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`), then **Redeploy**.

Security: row-level security lets anyone read products and settings; only signed-in admins (emails in `admin_users`) can change them, upload photos, or read and update orders.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: sale bar + countdown, hero, shop by style, bestsellers, men & unisex, why Mercy, Instagram strip, about |
| `/shop` | All products. Women / Men & Unisex tabs, filters (style, colour, price, size, on sale), sort |
| `/shop/[slug]` | Product page: gallery, colour + size pickers, quantity, size guide, WhatsApp order, "You may also like" |
| `/cart` | Full-page bag + checkout (the bag also opens as a drawer from the header) |
| `/track` | Order tracking: reference + phone → status timeline, ready date, pickup details |
| `/admin` | Orders (status, one-tap WhatsApp updates), products (multi-photo upload), sale, settings |

## Made to order

- Store-wide switch plus a per-product override (`orderType`), and a production time ("5–7 working days") with per-product override, all in Admin.
- Cards show a "Made to order" tag; product pages show "Ready in …" and a How it works row. Sizes are never "sold out" for made-to-order pairs.
- Checkout: name, WhatsApp number, **Pickup or Delivery** (each can be turned off), note. Shows production time and the payment note.
- Placing an order creates a reference like `MF-24817`, opens WhatsApp with the full order, saves it, and shows a confirmation with **Track order**. Ready dates count working days (Mon–Fri); orders placed during the sale count from the sale's production date.
- Statuses: Received → Confirmed → In production → Ready for pickup / Out for delivery → Completed (or Cancelled). Admin → Orders changes the status and **Notify** opens WhatsApp to the customer with a ready-made update.

## Quality checks

Lighthouse (mobile, production build): Home 91 · Shop 92 · Product 95 performance, with 100 for accessibility, best practices and SEO on all three. No layout shift: the sale state is rendered on the server, and static pages regenerate hourly so the sale bar is right on first paint.

SEO: per-product metadata and `Product` structured data, plus `/sitemap.xml` and `/robots.txt` (admin and bag are excluded).

## The sale

Everything comes from one `sale` object (`src/lib/seed.ts`, editable in Admin → Sale):

- **Before** the start: "Starts in …" countdown and a "Get notified on WhatsApp" button. Prices are normal.
- **During**: "Ends in …" countdown, the discount on every price, `-10%` badges, and "Delivery starts Dec 5".
- **After**: the bar and badges disappear and prices go back to normal.
- **Free gift** at `freeGiftMinPairs` (4, i.e. "above 3 pairs"). The bag shows progress, plays a one-time confetti burst when it unlocks, and the gift status goes into the WhatsApp message.

**Preview any stage** without changing dates: add `?preview=upcoming`, `?preview=live` or `?preview=ended` to any URL. It sticks for that browser tab, and `?preview=off` goes back to real time. Admin → Sale has the same links.

## WhatsApp checkout

The number is set in Admin → Settings (default `2349098964885`, from the flyer). "Send order on WhatsApp" opens `wa.me` with the message pre-filled:

```
Hello Mercy Footwears 👋 I'd like to order:

1. Ada Bow Slide – Caramel · Size 39 · x1 · ₦7,200
...
Subtotal: ₦21,600 (10% sale discount applied)
🎁 Free gift: not yet (add 1 more pair)
🚚 Delivery starts Dec 5

Name: …
Phone: …
Delivery: address, city, State
Note: …
```

`src/lib/whatsapp.ts` builds the message. Admin shows a "WhatsApp clicks" counter for the current device.

## Code map

- `src/lib/backend/` — Supabase config, server loader, browser API (`client.ts`) with the demo-mode fallback, row mappers
- `src/app/api/` — `orders` (create), `track` (lookup), `revalidate` (refresh pages after admin edits)
- `src/lib/order-build.ts` — builds an order from the catalogue (shared by server and demo mode)
- `src/lib/orders.ts` — made-to-order helpers, ready dates, statuses, WhatsApp update templates
- `supabase/schema.sql`, `scripts/setup-supabase.ts` — database setup

## Assets

- `public/products/`: product stills from her status video with a light warm grade applied. Stills showing other brands' logos or lookalike designer hardware were left out. Two products (Ruby H-Slide, Zara Two-Tone H-Slide) are crops of the shelf-lineup photo. **These are low-res placeholders. Ask her for the original photos.**
- `public/og.jpg`: the 1200×630 WhatsApp link preview. Regenerate it with `node scripts/render-og.mjs` (needs Playwright) after editing `scripts/og.html`.
- `src/app/icon.svg`, `src/app/apple-icon.png`: favicon and home-screen icon from her "M" mark.

## Deploy

Import the repo into Vercel (framework preset: Next.js, no environment variables needed). Optionally set `NEXT_PUBLIC_SITE_URL` to the final domain so link previews use absolute URLs. Otherwise Vercel's production URL is used.

## Notes and placeholders

- Product names, prices (₦6,500–₦18,000) and descriptions are placeholders. Swap in her real list.
- The logo is a simplified redraw of her mark, without the footprint. A clean vector from her would be better.
- WhatsApp buttons use a generic chat-bubble icon. The button text is Cocoa on WhatsApp green, because white on #25D366 doesn't meet AA contrast.
