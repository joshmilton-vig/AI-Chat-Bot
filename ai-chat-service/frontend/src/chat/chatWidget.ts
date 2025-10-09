import { sendChat } from "./client";
import type { ChatMessage, InitChatOptions } from "./types";

const STYLE_TAG_ID = "vivid-chat-style";
const WIDGET_ID = "vivid-chat-widget";

function injectStyles() {
  if (document.getElementById(STYLE_TAG_ID)) return;
  const css = `
  #${WIDGET_ID} { position: fixed; z-index: 99999; right: 20px; bottom: 20px; font-family: Verdana, Arial, sans-serif; }
  #${WIDGET_ID} .bubble { width: 56px; height: 56px; border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,.18); display:flex; align-items:center; justify-content:center; cursor:pointer; background: #111; color:#fff; }
  #${WIDGET_ID} .panel { position: absolute; right: 0; bottom: 72px; width: 340px; max-height: 70vh; background: #fff; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.25); display:none; flex-direction:column; overflow:hidden; border:1px solid #e5e7eb; }
  #${WIDGET_ID} .panel.open { display:flex; }
  #${WIDGET_ID} header { padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #f0f0f0; display:flex; align-items:center; justify-content:space-between; }
  #${WIDGET_ID} header .brand { font-size: 13px; opacity:.85 }
  #${WIDGET_ID} header button { all: unset; cursor:pointer; padding: 6px 8px; border-radius: 8px; }
  #${WIDGET_ID} .log { padding: 10px 12px; display:flex; gap:8px; flex-direction:column; overflow:auto; }
  #${WIDGET_ID} .msg { font-size: 13px; line-height: 1.35; padding: 8px 10px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  #${WIDGET_ID} .msg.user { align-self: flex-end; background:#111; color:#fff; border-top-right-radius: 4px; }
  #${WIDGET_ID} .msg.assistant { align-self: flex-start; background:#f6f6f7; color:#111; border-top-left-radius: 4px; }
  #${WIDGET_ID} footer { border-top: 1px solid #f0f0f0; padding: 8px; display:flex; gap:6px; }
  #${WIDGET_ID} textarea { resize:none; flex:1; min-height:40px; max-height:140px; border:1px solid #ddd; border-radius:10px; padding:8px 10px; font-size:13px; }
  #${WIDGET_ID} .send { background:#111; color:#fff; border:none; border-radius:10px; padding: 0 12px; font-size:13px; cursor:pointer; }
  #${WIDGET_ID} .hint { font-size: 11px; color:#6b7280; padding: 6px 12px 10px; }
  #${WIDGET_ID} .typing { display:flex; align-items:center; gap:6px; padding:8px 12px; margin:6px 10px; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${WIDGET_ID} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${WIDGET_ID} .typing span:nth-child(2) { animation-delay:.2s; }
  #${WIDGET_ID} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }

  `;
  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

export function initChatWidget(opts: InitChatOptions = {}) {
  const apiBase = opts.apiBase ?? "/api/ai";
  const business = opts.business ?? inferBusinessFromHost();
  const siteName = opts.siteName ?? (document.title || "Vivid Store");
  const debug = !!opts.debug;

  injectStyles();

  let open = false;
  const widget = document.createElement("div");
  widget.id = WIDGET_ID;

  const bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.title = "Chat";
  bubble.innerHTML = svgChatIcon();

  const panel = document.createElement("div");
  panel.className = "panel";

  const header = document.createElement("header");
  const hTitle = document.createElement("div");
  hTitle.textContent = "Prisma Assistant";
  const hBrand = document.createElement("div");
  hBrand.className = "brand";
  hBrand.textContent = siteName;
  const hRight = document.createElement("div");
  const closeBtn = document.createElement("button");
  closeBtn.ariaLabel = "Close";
  closeBtn.innerHTML = "✕";
  hRight.appendChild(closeBtn);
  header.appendChild(hTitle);
  header.appendChild(hBrand);
  header.appendChild(hRight);

  const log = document.createElement("div");
  log.className = "log";
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.style.display = "none";
  typing.innerHTML = "<span></span><span></span><span></span>";
  log.appendChild(typing);

  const footer = document.createElement("footer");
  const ta = document.createElement("textarea");
  ta.placeholder = "Ask about products, lead times, shipping, etc.";
  const sendBtn = document.createElement("button");
  sendBtn.className = "send";
  sendBtn.textContent = "Send";
  footer.appendChild(ta);
  footer.appendChild(sendBtn);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent =
    "No order/account lookups. For payments or existing orders, contact support.";

  panel.appendChild(header);
  panel.appendChild(log);
  panel.appendChild(footer);
  panel.appendChild(hint);

  widget.appendChild(bubble);
  widget.appendChild(panel);
  document.body.appendChild(widget);

  function setOpen(v: boolean) {
    open = v;
    panel.classList.toggle("open", open);
  }

  bubble.addEventListener("click", () => setOpen(!open));
  closeBtn.addEventListener("click", () => setOpen(false));

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(siteName, business) },
  ];

  async function doSend() {
    const text = ta.value.trim();
    if (!text) return;
    addMsg("user", text);
    ta.value = "";
    if (sendBtn) sendBtn.disabled = true;
    typing.style.display = "flex";
    try {
      const reply = await sendChat(
        apiBase,
        business,
        messages.concat({ role: "user", content: text })
      );
      typing.style.display = "none";
      if (sendBtn) sendBtn.disabled = false;
      messages.push({ role: "user", content: text });
      messages.push({ role: "assistant", content: reply });
      addMsg("assistant", reply);
      emitAnalytics("vivid_chat_message", { role: "assistant" });
    } catch (err: any) {
      const m = `Sorry — I had trouble reaching the assistant. (${
        err?.message || "Network error"
      })`;
      addMsg("assistant", m);
      if (debug) console.error(err);
    }
  }

  sendBtn.addEventListener("click", doSend);
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });

  function addMsg(role: "user" | "assistant", text: string) {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function emitAnalytics(eventName: string, payload: Record<string, any>) {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: eventName,
      ...payload,
      business,
      siteName,
    });
  }

  if (debug)
    console.log("Chat widget initialized", { apiBase, business, siteName });
}

function svgChatIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>`;
}

function inferBusinessFromHost(): string {
  const h = location.hostname.toLowerCase();
  if (h.includes("vividnola")) return "vividnola";
  if (h.includes("toastedyolk")) return "toastedyolk";
  if (h.includes("celtic")) return "celtic";
  return "vivid";
}

function systemPrompt(siteName: string, business: string) {
  return [
    `You are Prisma storefront assistant for ${siteName} (business: ${business}).`,
    `Be helpful, concise, and brand-safe. You cannot access accounts, orders, or payments.`,
    `Capabilities: explain products, materials, typical lead times, shipping options, design tips.`,
    `Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.`,
    `If unsure, offer to escalate to customer service: sales@vividink.com.`,
  ].join("\n");
}
