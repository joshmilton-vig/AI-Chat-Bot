// src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import OpenAI from "openai";

import { BUSINESSES } from "./data/businesses";
import { cannedReply } from "./logic/canned";

// ---------- Config ----------
const PORT = Number(process.env.PORT || 8089);
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean);

// ---------- Types ----------
export type ChatMsg = {
  role: "system" | "user" | "assistant";
  content: string;
};

// ---------- Helpers ----------
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wildcardToRegex(pattern: string) {
  // supports '*' anywhere; anchors whole string
  const p = "^" + escapeRegex(pattern).replace(/\\\*/g, ".*") + "$";
  return new RegExp(p);
}
const originRegexes = ALLOWED_ORIGINS.map(wildcardToRegex);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // allow non-CORS requests (curl, same-origin)
  try {
    const u = new URL(origin);
    const normalized = `${u.protocol}//${u.host}`;
    return originRegexes.length === 0
      ? true
      : originRegexes.some((rx) => rx.test(normalized));
  } catch {
    return false;
  }
}

// ---------- App ----------
const app = express();
app.disable("x-powered-by");
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
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
  maxAge: 86400, // cache preflight for a day
};

app.use(cors(corsOptions));
// Important: handle preflight explicitly so OPTIONS gets a 204 with CORS headers
app.options("*", cors(corsOptions));

// Handle CORS errors as JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS", origin: req.headers.origin });
  }
  return next(err);
});

// ---------- Routes ----------
app.get("/api/health", (_req, res) => {
  // Good cache hygiene with CORS
  res.set("Vary", "Origin").set("Cache-Control", "no-store").json({ ok: true });
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

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

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`AI chat service listening on :${PORT}`);
});
