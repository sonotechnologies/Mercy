# Mercy Footwears: demo store

A mobile-first online store for Mercy Footwears. Orders go straight to her WhatsApp, and the end-of-year sale (Nov 26–29, 2026) runs on its own timer.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**. No database: the catalogue, sale and settings are seeded from `src/lib/seed.ts`. Admin edits are saved in the browser (localStorage).

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
| `/admin` | Passcode-protected admin: products, sale, settings |

**Admin passcode:** `mercy2026`. Share it on the pitch call. It isn't shown anywhere on the site.

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

## Data layer

`src/lib/data-source.ts` defines a small `DataSource` interface (`load / save / clear / subscribe`). The demo uses the localStorage version. To move to Supabase later, implement the same interface and pass it to `<StoreProvider source={…}>`. The UI won't need to change.

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
