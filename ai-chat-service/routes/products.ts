import express from "express";
import cors from "cors";
import fetch from "node-fetch";

type Product = {
  id: string;
  sku?: string;
  name: string;
  price?: number;
  imageUrl?: string;
  url?: string;
  desc?: string;
  [k: string]: any;
};

const PRODUCT_API_BASE =
  process.env.PRODUCT_API_BASE ?? "https://storefront.example.com";
const PRODUCT_API_KEY = process.env.PRODUCT_API_KEY ?? "";

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

export function mountProductRoutes(app: express.Express) {
  app.use("/api", corsMiddleware);

  // Health
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, service: "assistant-products" })
  );

  // Search
  app.get("/api/products", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limit = Math.min(
        parseInt(String(req.query.limit ?? "8"), 10) || 8,
        24
      );
      if (!q) return res.status(400).json({ error: "Missing q" });

      // 🔁 Replace with YOUR upstream search endpoint
      const upstreamUrl = `${PRODUCT_API_BASE}/api/products?search=${encodeURIComponent(
        q
      )}&limit=${limit}`;

      const r = await fetch(upstreamUrl, {
        headers: {
          accept: "application/json",
          ...(PRODUCT_API_KEY ? { "x-api-key": PRODUCT_API_KEY } : {}),
        },
        // @ts-ignore
        timeout: 10000,
      });
      if (!r.ok)
        return res
          .status(r.status)
          .json({ error: `Upstream error (${r.status})` });

      const raw = await r.json();
      const items: Product[] = (raw.items ?? raw.results ?? raw ?? []).map(
        (p: any) => ({
          id: String(p.id ?? p.productId ?? p.slug ?? p.sku ?? ""),
          sku: p.sku ?? p.productSku,
          name: p.name ?? p.title ?? "Untitled",
          price:
            Number(p.price ?? p.salePrice ?? p.wholesale ?? 0) || undefined,
          imageUrl: p.imageUrl ?? p.image ?? p.thumbnail,
          url:
            p.url ??
            p.link ??
            (p.slug ? `${PRODUCT_API_BASE}/product/${p.slug}` : undefined),
          desc: p.desc ?? p.description,
        })
      );

      res.json({ query: q, count: items.length, items });
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? "Server error" });
    }
  });

  // Detail
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      // 🔁 Replace with YOUR upstream detail endpoint
      const upstreamUrl = `${PRODUCT_API_BASE}/api/products/${encodeURIComponent(
        id
      )}`;

      const r = await fetch(upstreamUrl, {
        headers: {
          accept: "application/json",
          ...(PRODUCT_API_KEY ? { "x-api-key": PRODUCT_API_KEY } : {}),
        },
        // @ts-ignore
        timeout: 10000,
      });
      if (!r.ok)
        return res
          .status(r.status)
          .json({ error: `Upstream error (${r.status})` });

      const p = await r.json();
      const product: Product = {
        id: String(p.id ?? p.productId ?? id),
        sku: p.sku,
        name: p.name ?? p.title ?? "Untitled",
        price: Number(p.price ?? p.salePrice ?? p.wholesale ?? 0) || undefined,
        imageUrl: p.imageUrl ?? p.image ?? p.thumbnail,
        url:
          p.url ??
          p.link ??
          (p.slug ? `${PRODUCT_API_BASE}/product/${p.slug}` : undefined),
        desc: p.desc ?? p.description,
        ...p,
      };
      res.json(product);
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? "Server error" });
    }
  });
}

// 🔻 After you create `app`, mount the routes:
const app = express();
// ... your existing middleware ...
mountProductRoutes(app);
