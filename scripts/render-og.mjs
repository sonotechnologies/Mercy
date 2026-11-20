// Renders public/og.jpg (link preview) and src/app/apple-icon.png from scripts/og.html.
// Run: node scripts/render-og.mjs  (needs Playwright + Chromium)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? "playwright");
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
await page.goto("file://" + path.join(root, "scripts/og.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.locator("#og").screenshot({ path: path.join(root, "public/og.jpg"), type: "jpeg", quality: 88 });
await page.locator("#apple").screenshot({ path: path.join(root, "src/app/apple-icon.png") });
await browser.close();
