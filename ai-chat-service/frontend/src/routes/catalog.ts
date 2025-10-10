import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// ---------- Types ----------
type Product = {
  id: string; // derived from link or slug
  sku?: string;
  name: string;
  price?: number;
  imageUrl?: string;
  url?: string;
  desc?: string;
};

// ---------- Config ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
});

// Only allow HTTPS and hostnames that end with vivid-think.com
function assertAllowedCatalogUrl(
  input: string,
  requireCatalogPath = true
): URL {
  const u = new URL(input);
  if (u.protocol !== "https:") throw new Error("Only https is allowed");
  const host = u.hostname.toLowerCase();

  // Allow vivid-think.com and any subdomain (*.vivid-think.com)
  const allowed =
    host === "vivid-think.com" || host.endsWith(".vivid-think.com");
  if (!allowed) throw new Error("Host not allowed");

  if (requireCatalogPath && !u.pathname.startsWith("/catalog")) {
    throw new Error("Path must start with /catalog");
  }
  return u;
}

// Normalize absolute URL on same origin
function toAbs(origin: URL, href?: string | null): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, origin).toString();
  } catch {
    return undefined;
  }
}

// Heuristic text helpers
function cleanText(s: string | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function parsePrice(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const m = s.replace(/,/g, "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return m ? Number(m[1]) : undefined;
}

// ---------- Parsing: catalog search results ----------
function extractProductsFromCatalogHTML(origin: URL, html: string): Product[] {
  const $ = cheerio.load(html);

  // Try JSON-LD first (if present)
  const ldjson: Product[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const obj = JSON.parse($(el).text());
      const arr = Array.isArray(obj) ? obj : [obj];
      arr.forEach((o) => {
        if (o["@type"] === "Product" && o.name) {
          ldjson.push({
            id: cleanText(o.sku || o.productID || o.url || o.name),
            sku: cleanText(o.sku),
            name: cleanText(o.name),
            price: parsePrice(
              o?.offers?.price || o?.offers?.priceSpecification?.price
            ),
            imageUrl: toAbs(
              origin,
              Array.isArray(o.image) ? o.image[0] : o.image
            ),
            url: toAbs(origin, o.url),
            desc: cleanText(o.description),
          });
        }
      });
    } catch {}
  });

  // Heuristic DOM selection (covers common Presswise/Netlify grids)
  const domProducts: Product[] = [];
  // Grab card-like elements that contain an anchor to a product page
  const candidates = $(
    'a[href*="/product/"], .product-item a, .productBox a'
  ).toArray();

  const seen = new Set<string>();
  for (const el of candidates) {
    const a = $(el);
    const href = a.attr("href");
    const abs = href ? toAbs(origin, href) : undefined;
    if (!abs || !/\/product\//.test(abs)) continue;

    // Title text (within the link or near it)
    const title =
      cleanText(a.attr("title")) ||
      cleanText(a.find("h2,h3,.product-title,.title").first().text()) ||
      cleanText(a.text());

    if (!title) continue;

    // Image near the link
    const parent = a.closest(".product-item, .productBox, li, div");
    const imgEl = parent.find("img").first();
    const img = toAbs(origin, imgEl.attr("src") || imgEl.attr("data-src"));

    // Price somewhere in the card
    const priceEl = parent
      .find('.price, .product-price, [class*="price"]')
      .first();
    const price = parsePrice(cleanText(priceEl.text()));

    // SKU if present
    const skuMatch = cleanText(parent.text()).match(
      /\bSKU[:\s]*([A-Za-z0-9\-\._]+)\b/i
    );
    const sku = skuMatch?.[1];

    const id = cleanText(sku || abs || title);
    if (seen.has(id)) continue;
    seen.add(id);

    domProducts.push({
      id,
      sku,
      name: title,
      price,
      imageUrl: img,
      url: abs,
      desc: undefined,
    });
  }

  // Prefer JSON-LD if it exists, otherwise DOM
  const items = ldjson.length ? ldjson : domProducts;

  // De-dup by URL or name
  const out: Product[] = [];
  const dedupe = new Set<string>();
  for (const p of items) {
    const key = p.url || `${p.name}|${p.sku}`;
    if (key && !dedupe.has(key)) {
      dedupe.add(key);
      out.push(p);
    }
  }
  return out;
}

// ---------- Parsing: product detail page ----------
function extractProductDetailHTML(origin: URL, html: string): Product {
  const $ = cheerio.load(html);

  // Try JSON-LD first
  let base: Partial<Product> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const obj = JSON.parse($(el).text());
      const arr = Array.isArray(obj) ? obj : [obj];
      const prod = arr.find((o: any) => o["@type"] === "Product");
      if (prod) {
        base = {
          id: cleanText(prod.sku || prod.productID || prod.url || prod.name),
          sku: cleanText(prod.sku),
          name: cleanText(prod.name),
          price: parsePrice(
            prod?.offers?.price || prod?.offers?.priceSpecification?.price
          ),
          imageUrl: toAbs(
            origin,
            Array.isArray(prod.image) ? prod.image[0] : prod.image
          ),
          url: toAbs(origin, prod.url) || origin.toString(),
          desc: cleanText(prod.description),
        };
      }
    } catch {}
  });

  // Heuristic fallbacks
  const name =
    base.name ||
    cleanText($("h1, .product-title, .title").first().text()) ||
    "Untitled";

  const sku =
    base.sku ||
    cleanText(
      $("*:contains('SKU')")
        .filter((_, e) => /sku/i.test($(e).text()))
        .first()
        .text()
    ).replace(/.*sku[:\s]*/i, "") ||
    undefined;

  const price =
    base.price ||
    parsePrice(
      cleanText($('.price, .product-price, [class*="price"]').first().text())
    );

  const desc =
    base.desc ||
    cleanText(
      $("#description, .product-description, .description").first().text()
    );

  const img = base.imageUrl || toAbs(origin, $("img").first().attr("src"));

  const id = cleanText(sku || origin.toString() || name);

  return {
    id,
    sku,
    name,
    price,
    imageUrl: img,
    url: origin.toString(),
    desc,
  };
}

// ---------- Routes ----------
export function mountCatalogRoutes(app: express.Express) {
  app.use("/api", corsMiddleware);

  // Search products on a given vivid-think catalog
  // GET /api/products?site=https://brand.vivid-think.com&q=banner&limit=8
  app.get("/api/products", async (req, res) => {
    try {
      const site = String(req.query.site ?? "");
      const q = String(req.query.q ?? "").trim();
      const limit = Math.min(
        parseInt(String(req.query.limit ?? "8"), 10) || 8,
        24
      );
      if (!site) return res.status(400).json({ error: "Missing site" });
      if (!q) return res.status(400).json({ error: "Missing q" });

      const siteUrl = assertAllowedCatalogUrl(
        `${site.replace(/\/$/, "")}/catalog`,
        true
      );

      // Presswise/your sites commonly support this search pattern:
      const searchUrl = new URL(siteUrl.toString());
      searchUrl.searchParams.set("search", q);
      // Optional: copy your known flags from past work:
      searchUrl.searchParams.set("g", "0");
      searchUrl.searchParams.set("y", "0");
      searchUrl.searchParams.set("p", "0");
      searchUrl.searchParams.set("m", "g");

      const r = await fetch(searchUrl.toString(), {
        headers: { accept: "text/html" },
        // @ts-ignore
        timeout: 10000,
      });
      if (!r.ok)
        return res
          .status(r.status)
          .json({ error: `Upstream error (${r.status})` });

      const html = await r.text();
      const items = extractProductsFromCatalogHTML(new URL(site), html).slice(
        0,
        limit
      );
      res.json({ site: siteUrl.origin, query: q, count: items.length, items });
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  });

  // Fetch details for a single product page (must be on *.vivid-think.com)
  // GET /api/catalog-product?url=https://brand.vivid-think.com/product/slug
  app.get("/api/catalog-product", async (req, res) => {
    try {
      const url = String(req.query.url ?? "");
      if (!url) return res.status(400).json({ error: "Missing url" });

      // For detail pages we relax the /catalog requirement but still enforce vivid-think.com
      const productUrl = assertAllowedCatalogUrl(url, false);

      const r = await fetch(productUrl.toString(), {
        headers: { accept: "text/html" },
        // @ts-ignore
        timeout: 10000,
      });
      if (!r.ok)
        return res
          .status(r.status)
          .json({ error: `Upstream error (${r.status})` });

      const html = await r.text();
      const product = extractProductDetailHTML(productUrl, html);
      res.json(product);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  });
}
