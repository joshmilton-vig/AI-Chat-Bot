// src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // ← added
import * as cheerio from "cheerio"; // ← added

import { BUSINESSES } from "./data/businesses";
import { cannedReply } from "./logic/canned";

// ---------- Config ----------
const PORT = Number(process.env.PORT || 8089);
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/**
 * Comma/space separated allow-list.
 * Examples:
 *   ALLOWED_ORIGINS="https://assistant.vivid-think.com,https://storefront.printreach.com"
 *   ALLOWED_ORIGINS="https://*.vivid-think.com"
 *   ALLOWED_ORIGINS="*"
 */
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean);

// ---------- Types ----------
export type ChatMsg = {
  role: "system" | "user" | "assistant";
  content: string;
};

// For catalog endpoints
type Product = {
  id: string;
  sku?: string;
  name: string;
  price?: number;
  imageUrl?: string;
  url?: string;
  desc?: string;
};

// ---------- Helpers (CORS) ----------
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wildcardToRegex(pattern: string) {
  const p = "^" + escapeRegex(pattern).replace(/\\\*/g, ".*") + "$";
  return new RegExp(p);
}
const originRegexes = ALLOWED_ORIGINS.map(wildcardToRegex);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // non-CORS (curl/server-to-server)
  try {
    const u = new URL(origin);
    const normalized = `${u.protocol}//${u.host}`;
    if (originRegexes.length === 0) return true;
    if (ALLOWED_ORIGINS.includes("*")) return true;
    return originRegexes.some((rx) => rx.test(normalized));
  } catch {
    return false;
  }
}

// ---------- App ----------
const app = express();
app.disable("x-powered-by");

// Health check endpoint
app.get("/api/test", (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ts: Date.now(),
  });
});

// Log early (before other middleware)
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// JSON body parsing
app.use(express.json({ limit: "1mb" }));

// ----- CORS (global + explicit preflight) -----
const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Handle CORS errors as JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS", origin: req.headers.origin });
  }
  return next(err);
});

// ---------- Health ----------
app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store").json({ ok: true });
});
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// ===================================================================
//                      CATALOG SCRAPE ENDPOINTS
//   /api/products?site=...&q=...&limit=8
//   /api/catalog-product?url=...
// ===================================================================

// Only allow HTTPS and hostnames that end with vivid-think.com
function assertAllowedCatalogUrl(
  input: string,
  requireCatalogPath = true
): URL {
  const u = new URL(input);
  if (u.protocol !== "https:") throw new Error("Only https is allowed");
  const host = u.hostname.toLowerCase();

  const allowed =
    host === "vivid-think.com" || host.endsWith(".vivid-think.com");
  if (!allowed) throw new Error("Host not allowed");

  if (requireCatalogPath && !u.pathname.startsWith("/catalog")) {
    throw new Error("Path must start with /catalog");
  }
  return u;
}

function toAbs(origin: URL, href?: string | null): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, origin).toString();
  } catch {
    return undefined;
  }
}

function cleanText(s?: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function parsePrice(s?: string): number | undefined {
  if (!s) return undefined;
  const m = s.replace(/,/g, "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return m ? Number(m[1]) : undefined;
}

// Parse catalog search HTML → Product[]
function extractProductsFromCatalogHTML(origin: URL, html: string): Product[] {
  const $ = cheerio.load(html);

  // 1) Prefer JSON-LD Product
  const ldjson: Product[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const obj = JSON.parse($(el).text());
      const arr = Array.isArray(obj) ? obj : [obj];
      arr.forEach((o: any) => {
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

  // 2) Heuristic DOM selection
  const domProducts: Product[] = [];
  const candidates = $(
    'a[href*="/product/"], .product-item a, .productBox a'
  ).toArray();
  const seen = new Set<string>();

  for (const el of candidates) {
    const a = $(el);
    const href = a.attr("href");
    const abs = href ? toAbs(origin, href) : undefined;
    if (!abs || !/\/product\//.test(abs)) continue;

    const title =
      cleanText(a.attr("title")) ||
      cleanText(a.find("h2,h3,.product-title,.title").first().text()) ||
      cleanText(a.text());

    if (!title) continue;

    const parent = a.closest(".product-item, .productBox, li, div");
    const imgEl = parent.find("img").first();
    const img = toAbs(origin, imgEl.attr("src") || imgEl.attr("data-src"));

    const priceEl = parent
      .find('.price, .product-price, [class*="price"]')
      .first();
    const price = parsePrice(cleanText(priceEl.text()));

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

  const items = ldjson.length ? ldjson : domProducts;

  // de-dupe
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

// Parse product detail HTML → Product
function extractProductDetailHTML(origin: URL, html: string): Product {
  const $ = cheerio.load(html);

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

  return { id, sku, name, price, imageUrl: img, url: origin.toString(), desc };
}

// --- Routes: Search products on a vivid-think catalog
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

    const searchUrl = new URL(siteUrl.toString());
    searchUrl.searchParams.set("search", q);
    // mirrors your typical storefront params
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

// --- Routes: Product detail (must still be on *.vivid-think.com)
// GET /api/catalog-product?url=https://brand.vivid-think.com/product/...
app.get("/api/catalog-product", async (req, res) => {
  try {
    const url = String(req.query.url ?? "");
    if (!url) return res.status(400).json({ error: "Missing url" });

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

// ---------- Chat Route ----------
app.post(
  "/api/ai/chat",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    try {
      // Business selection
      const businessKey = String(req.body?.business || "vivid").toLowerCase();
      const biz = BUSINESSES[businessKey] ?? BUSINESSES.vivid;

      // Sanitize messages
      const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const history: ChatMsg[] = raw
        .map((m: any) => {
          const role: ChatMsg["role"] =
            m?.role === "system" ||
            m?.role === "assistant" ||
            m?.role === "user"
              ? m.role
              : "user";
          const content = String(m?.content ?? "").trim();
          return { role, content };
        })
        .filter((m: ChatMsg) => m.content.length > 0)
        .slice(-30);

      const lastUser =
        [...history].reverse().find((m) => m.role === "user")?.content || "";

      // 1) CANNED FAST PATH
      const canned = cannedReply(biz, lastUser);
      if (canned) return res.json({ message: canned });

      // 2) LLM FALLBACK
      if (!OPENAI_API_KEY) {
        return res
          .status(500)
          .json({ error: "LLM upstream failed", detail: "Missing API key" });
      }

      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

      const systemPrompt = [
        `You are a friendly, concise assistant for ${biz.name}.`,
        `Never invent policies. Use ONLY the business info provided below.`,
        `If unsure, ask a brief follow-up or offer to connect to a human at ${biz.email} or ${biz.phone}.`,
        `Business profile:`,
        `- Timezone: ${biz.timezone}`,
        `- Hours: ${Object.entries(biz.hours)
          .map(([d, h]) => `${d}:${h ? `${h.open}-${h.close}` : "closed"}`)
          .join(", ")}`,
        `- Shipping: ${biz.shippingPolicy}`,
        `- Returns: ${biz.returnPolicy}`,
        biz.faq && Object.keys(biz.faq).length
          ? `- FAQ keys: ${Object.keys(biz.faq).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const llmMessages: ChatMsg[] = [
        { role: "system", content: systemPrompt },
        ...history.filter((m) => m.role !== "system"),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: llmMessages,
        temperature: 0.3,
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        "Sorry — I couldn’t find that.";
      return res.json({ message: reply });
    } catch (err: any) {
      const detail =
        err?.response?.data ??
        err?.message ??
        (typeof err === "string" ? err : undefined);
      console.error("Chat error:", detail || err);
      return res.status(500).json({ error: "LLM upstream failed" });
    }
  }
);

// ---------- Serve widget bundle at /widget ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// At runtime dist/server.js sits in /dist, while the widget is in ../frontend/dist
const widgetDir = path.join(__dirname, "../frontend/dist");
console.log("[Vivid] Serving widget from:", widgetDir);
app.use("/widget", express.static(widgetDir));

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`AI chat service listening on :${PORT}`);
});
