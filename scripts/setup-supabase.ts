/**
 * Seeds Supabase with the current catalogue, sale and settings, and creates the admin login.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SECRET_KEY=… \
 *   npx tsx scripts/setup-supabase.ts --admin-email you@example.com --admin-password '…' [--products]
 *
 * --products   also (re)writes the 20 demo products (skipped by default once products exist)
 * Run supabase/schema.sql first.
 */
import { createClient } from "@supabase/supabase-js";
import { productToRow } from "../src/lib/backend/mappers";
import { SEED_PRODUCTS, SEED_SALE, SEED_SETTINGS } from "../src/lib/seed";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const { count, error: cErr } = await sb.from("products").select("id", { count: "exact", head: true });
  if (cErr) throw new Error(`Can't reach the products table. Did you run supabase/schema.sql? (${cErr.message})`);

  if (!count || process.argv.includes("--products")) {
    const rows = SEED_PRODUCTS.map((p, i) => productToRow(p, i));
    const up = await sb.from("products").upsert(rows);
    if (up.error) throw up.error;
    const ids = SEED_PRODUCTS.map((p) => p.id);
    await sb.from("product_images").delete().in("product_id", ids);
    const imgs = SEED_PRODUCTS.flatMap((p) => p.images.map((u, position) => ({ product_id: p.id, url: u, position })));
    const ins = await sb.from("product_images").insert(imgs);
    if (ins.error) throw ins.error;
    console.log(`✓ ${rows.length} products`);
  } else console.log(`• ${count} products already there (use --products to overwrite the demo ones)`);

  for (const [k, value] of [["settings", SEED_SETTINGS], ["sale", SEED_SALE]] as const) {
    const existing = await sb.from("settings").select("key").eq("key", k).maybeSingle();
    if (!existing.data) {
      const r = await sb.from("settings").insert({ key: k, value });
      if (r.error) throw r.error;
      console.log(`✓ ${k}`);
    } else console.log(`• ${k} already set`);
  }

  const email = arg("admin-email");
  const password = arg("admin-password");
  if (email) {
    if (password) {
      const c = await sb.auth.admin.createUser({ email, password, email_confirm: true });
      if (c.error && !/already/i.test(c.error.message)) throw c.error;
      if (c.error) {
        const list = await sb.auth.admin.listUsers({ perPage: 1000 });
        const u = list.data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
        if (u) await sb.auth.admin.updateUserById(u.id, { password });
      }
    }
    const a = await sb.from("admin_users").upsert({ email: email.toLowerCase() });
    if (a.error) throw a.error;
    console.log(`✓ admin ${email}`);
  }
}

main().then(
  () => console.log("Done."),
  (e) => {
    console.error("✗", e.message ?? e);
    process.exit(1);
  },
);
