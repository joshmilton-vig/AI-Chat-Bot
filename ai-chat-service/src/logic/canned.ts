import type { BusinessProfile } from "../data/businesses";

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function hoursToHuman(biz: BusinessProfile) {
  const days: [string, keyof typeof biz.hours][] = [
    ["Mon", "mon"],
    ["Tue", "tue"],
    ["Wed", "wed"],
    ["Thu", "thu"],
    ["Fri", "fri"],
    ["Sat", "sat"],
    ["Sun", "sun"],
  ];
  const lines = days.map(([label, key]) => {
    const v = biz.hours[key];
    if (!v) return `${label}: Closed`;
    return `${label}: ${v.open}–${v.close}`;
    // times are local to business; keep it simple & readable
  });
  return `Our hours (local time ${biz.timezone}):\n` + lines.join("\n");
}

type Rule = {
  name: string;
  test: (text: string) => boolean;
  reply: (biz: BusinessProfile) => string;
};

// simple keyword rules; expand as you like
const RULES: Rule[] = [
  {
    name: "greeting",
    test: (t) =>
      /^(hi|hello|hey|yo)\b/.test(t) ||
      /\b(good (morning|afternoon|evening))\b/.test(t),
    reply: (biz) =>
      `Hi! I’m the ${biz.name} Assistant. I can help with store hours, returns, shipping, and orders. What do you need?`,
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
      `You can reach us at ${biz.phone} or ${biz.email}. Want me to hand you off to a human agent?`,
  },
  {
    name: "order_status",
    test: (t) =>
      /\b(order|tracking|status|where.*(order|package)|track|shipment)\b/i.test(
        t
      ),
    reply: () => {
      const host =
        typeof window !== "undefined"
          ? window.location.hostname
          : "demo.vivid-think.com"; // fallback for server-side rendering
      const url = `https://${host}/account/orders.php`;
      return `You can check your order status by logging in and clicking the <strong>My Account</strong> button in the top right menu, then choosing <strong>View Orders</strong>.<br><br>
<a href="${url}" target="_blank" rel="noopener noreferrer">View My Orders</a>`;
    },
  },
];

export function cannedReply(
  biz: BusinessProfile,
  userText: string
): string | null {
  const t = norm(userText);
  // FAQ first (exact contains)
  if (biz.faq) {
    for (const [k, v] of Object.entries(biz.faq)) {
      if (t.includes(norm(k))) return v;
    }
  }
  // Rules next
  for (const rule of RULES) {
    if (rule.test(t)) return rule.reply(biz);
  }
  return null;
}
