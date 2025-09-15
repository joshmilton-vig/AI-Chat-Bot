// ai-chat-service/src/server.ts
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { z } from "zod";
import OpenAI, { type ChatCompletionMessageParam } from "openai";

const app = express();
app.use(express.json({ limit: "1mb" }));

/* ------------------------- CORS (allowlist + wildcards) ------------------------- */

const allowlist = (process.env.ALLOWED_ORIGINS || "")
  .split(/[, \n\r\t]+/)
  .map(s => s.trim())
  .filter(Boolean);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function originAllowed(origin: string): boolean {
  return allowlist.some(pat => {
    // Support exact match or wildcard patterns like https://*.vivid-*.com
    if (pat.includes("*")) {
      const re = new RegExp(
        "^" + pat.split("*").map(escapeRegex).join(".*") + "$",
        "i"
      );
      return re.test(origin);
    }
    return origin.toLowerCase() === pat.toLowerCase();
  });
}

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / health checks
    const ok = originAllowed(origin);
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
};
app.use(cors(corsOptions));

/* ------------------------------ Rate Limiting ------------------------------ */

const limiter = new RateLimiterMemory({ points: 40, duration: 60 }); // 40 req/min/IP
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await limiter.consume(req.ip || "global");
    next();
  } catch {
    res.status(429).json({ error: "Too many requests" });
  }
});

/* -------------------------------- Validation -------------------------------- */

const ChatSchema = z.object({
  business: z.string().min(1).max(60),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .min(1),
});

/* --------------------------------- OpenAI --------------------------------- */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad request" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "LLM key not configured" });
  }

  const { business, messages } = parsed.data;

  const brandContext = getBrandContext(business);

  // Build the final chat history (cap to last N to control token usage)
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: brandContext },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ].slice(-20);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: chatMessages,
    });

    const message =
      completion.choices?.[0]?.message?.content?.toString() ||
      "Sorry — no response.";
    res.json({ message });
  } catch (err) {
    console.error("AI chat error", err);
    res.status(500).json({ error: "LLM upstream failed" });
  }
});

/* -------------------------------- Utilities -------------------------------- */

function getBrandContext(business: string) {
  const common =
    "\nGeneral rules:\n" +
    "- You cannot access orders/accounts or process payments.\n" +
    "- Be brief and friendly. If unsure, offer to escalate to sales@vividink.com.\n" +
    "- When shipping is asked, describe general options (USPS/UPS/FedEx) and that costs are shown at checkout.";

  switch (business.toLowerCase()) {
    case "vividnola":
      return (
        "You are the assistant for Vivid Ink NOLA storefront. Typical in-house lead times: 3–5 business days on standard digital print; apparel varies by stock and decoration method." +
        common
      );
    case "toastedyolk":
    case "toasted-yolk":
      return (
        "You are the assistant for Toasted Yolk Café brand portal managed by Vivid Ink. Follow brand voice: helpful, concise, professional." +
        common
      );
    case "celtic":
      return (
        "You are the assistant for Celtic Group storefront. Prioritize safety/compliance messaging as appropriate." +
        common
      );
    default:
      return "You are the assistant for a Vivid Ink storefront. Be helpful and concise." + common;
  }
}

/* --------------------------------- Healthz --------------------------------- */

app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* --------------------------------- Server ---------------------------------- */

const port = Number(process.env.PORT || 8089);
app.listen(port, () => {
  console.log(`AI chat service listening on :${port}`);
});
