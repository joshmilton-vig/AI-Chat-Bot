// src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import OpenAI from "openai";

// ---------- Config ----------
const PORT = Number(process.env.PORT || 8089);
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_API_KEY) {
  // We don't crash; we return a 500 later with a clear error.
  console.warn("[server] OPENAI_API_KEY is not set.");
}

// CORS allow-list: space or comma separated, supports '*' wildcards in host
// e.g. "https://demo.vivid-think.com https://vividnola.com https://*.vivid-*.com"
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean);

// ---------- Business profile + canned replies ----------
type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type BusinessProfile = {
  key: string;
  name: string;
  timezone: string;
  phone: string;
  email: string;
  hours: Partial<Record<Day, { open: string; close: string } | null>>;
  shippingPolicy: string;
  returnPolicy: string;
  faq?: Record<string, string>;
};

const BUSINESSES: Record<string, BusinessProfile> = {
  vivid: {
    key: "vivid",
    name: "Vivid",
    timezone: "America/Chicago",
    phone: "(225) 751-7297",
    email: "sales@poweredbyprisma.com",
    hours: {
      mon: { open: "09:00", close: "17:00" },
      tue: { open: "09:00", close: "17:00" },
      wed: { open: "09:00", close: "17:00" },
      thu: { open: "09:00", close: "17:00" },
      fri: { open: "09:00", close: "17:00" },
      sat: null,
      sun: null,
    },
    shippingPolicy:
      "Most orders ship within 2–3 business days after approval. Expedited options are available at checkout.",
    returnPolicy:
      "Unopened, non-custom items may be returned within 30 days. Customized or personalized items are final sale.",
    faq: {
      "where is my order":
        "To check your order status, share your order number and shipping ZIP code. I’ll look it up for you.",
    },
  },
};

// Simple canned intent rules
function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function hoursToHuman(biz: BusinessProfile) {
  const map: [string, keyof BusinessProfile["hours"]][] = [
    ["Mon", "mon"],
    ["Tue", "tue"],
    ["Wed", "wed"],
    ["Thu", "thu"],
    ["Fri", "fri"],
    ["Sat", "sat"],
    ["Sun", "sun"],
  ];
  const lines = map.map(([label, key]) => {
    const v = biz.hours[key];
    if (!v) return `${label}: Closed`;
    return `${label}: ${v.open}–${v.close}`;
  });
  return `Our hours (local time ${biz.timezone}):\n` + lines.join("\n");
}
const CANNED_RULES: {
  name: string;
  test: (t: string) => boolean;
  reply: (biz: BusinessProfile) => string;
}[] = [
  {
    name: "greeting",
    test: (t) =>
      /^(hi|hello|hey|yo)\b/.test(t) ||
      /\b(good (morning|afternoon|evening))\b/.test(t),
    reply: (biz) =>
      `Hi! I’m the ${biz.name} assistant. I can help with store hours, returns, shipping, and orders. What do you need?`,
  },
  {
    name: "thanks",
    test: (t) => /\b(thanks|thank you|ty|appreciate)\b/.test(t),
    reply: () => "You’re welcome! Anything else I can help with?",
  },
  {
    name: "goodbye",
    test: (t) => /\b(bye|goodbye|see ya|talk later|ttyl)\b/.test(t),
    reply: () => "Thanks for visiting! Have a great day.",
  },
  {
    name: "hours",
    test: (t) => /\b(hour|open|close|closing|opening|when.*open)\b/.test(t),
    reply: (biz) => hoursToHuman(biz),
  },
  {
    name: "returns",
    test: (t) => /\b(return|refund|exchange|rma)\b/.test(t),
    reply: (biz) =>
      `**Returns & exchanges**\n${biz.returnPolicy}\n\nNeed help starting a return? I can guide you.`,
  },
  {
    name: "shipping",
    test: (t) =>
      /\b(ship|shipping|delivery|deliver|expedite|overnight)\b/.test(t),
    reply: (biz) =>
      `**Shipping**\n${biz.shippingPolicy}\n\nIf you have a deadline, tell me the date and I’ll suggest options.`,
  },
  {
    name: "contact",
    test: (t) => /\b(contact|phone|email|support|help|agent|human)\b/.test(t),
    reply: (biz) =>
      `You can reach us at ${biz.phone} or ${biz.email}. Want me to connect you to a human agent?`,
  },
  {
    name: "order_status",
    test: (t) =>
      /\b(order|tracking|status|where.*(order|package)|track|shipment)\b/.test(
        t
      ),
    reply: () =>
      "I can help with order status. Please share your **order number** and **shipping ZIP code**.",
  },
];
function cannedReply(biz: BusinessProfile, userText: string): string | null {
  const t = norm(userText);
  if (biz.faq) {
    for (const [k, v] of Object.entries(biz.faq)) {
      if (t.includes(norm(k))) return v;
    }
  }
  for (const rule of CANNED_RULES) {
    if (rule.test(t)) return rule.reply(biz);
  }
  return null;
}

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
    const url = new URL(origin);
    const normalized = `${url.protocol}//${url.host}`;
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

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) cb(null, true);
      else cb(new Error("Not allowed by CORS"));
    },
  })
);

// Preflight
app.options("*", cors());

// Health
app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

// Chat
app.post(
  "/api/ai/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize business key
      const businessKey = String(req.body?.business || "vivid").toLowerCase();
      const biz = BUSINESSES[businessKey] ?? BUSINESSES.vivid;

      // Sanitize messages into our ChatMsg union
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
        .slice(-30); // keep it lean

      const lastUser =
        [...history].reverse().find((m) => m.role === "user")?.content || "";

      // 1) Canned fast path
      const canned = cannedReply(biz, lastUser);
      if (canned) {
        return res.json({ message: canned });
      }

      // 2) LLM fallback
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
      // Optional: surface upstream detail during debugging
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
