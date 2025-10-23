import { sendChat } from "./client";
import type { ChatMessage, InitChatOptions } from "./types";

const STYLE_TAG_ID = "vivid-chat-style";
const WIDGET_ID = "vivid-chat-widget";
const HOST_ID = "vivid-chat-host";

const ASSISTANT_BASE = "https://ai-chat-bot-1xm4.onrender.com"; // ← your Render app

// ---- Extended options (non-breaking) ----
type Theme = {
  primary?: string;
  surface?: string;
  text?: string;
  assistantBubble?: string;
  userText?: string;
  headerBg?: string;
  headerText?: string;
  bubbleColor?: string;
};
type ExtraOptions = {
  title?: string;
  iconSVG?: string;
  welcomeMessage?: string;
  welcomeOnce?: boolean;
  autoOpenDelay?: number;
  autoOpenOnce?: boolean;
  persist?: boolean;
  storageKey?: string;
  theme?: Theme;

  /** Base catalog site (must be https://*.vivid-think.com). Example: https://demo.vivid-think.com */
  catalogSite?: string;

  /** Limit product results (1–24, default 6) */
  productLimit?: number;

  /** Disable product query interception */
  disableProductSearch?: boolean;

  /** Debug logging */
  debug?: boolean;
};
type Options = InitChatOptions & ExtraOptions;

// ---- Shadow host ----
let SHADOW: ShadowRoot | null = null;
function getHostAndShadow() {
  let host = document.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.position = "fixed";
    host.style.right = "0";
    host.style.bottom = "0";
    host.style.zIndex = "2147483647";
    document.body.appendChild(host);
  }
  SHADOW = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  return { host, shadow: SHADOW! };
}

// ---- Styles (Shadow DOM, uses CSS vars for theme) ----
function injectStyles(vars: Record<string, string>) {
  const { shadow } = getHostAndShadow();
  const prev = shadow.getElementById(STYLE_TAG_ID);
  if (prev) prev.remove();

  const css = `
  :host, :host * { box-sizing: border-box; }
  :host * { font-family: Verdana, Arial, sans-serif; }

  :host {
    --va-primary: ${vars["--va-primary"]};
    --va-surface: ${vars["--va-surface"]};
    --va-text: ${vars["--va-text"]};
    --va-assistant-bubble: ${vars["--va-assistant-bubble"]};
    --va-user-text: ${vars["--va-user-text"]};
    --va-header-bg: ${vars["--va-header-bg"]};
    --va-header-text: ${vars["--va-header-text"]};
    --va-bubble: ${vars["--va-bubble"]};
  }

  #${WIDGET_ID} { position: fixed; z-index: 2147483647; right: 20px; bottom: 20px; }
  #${WIDGET_ID} .bubble {
    width: 56px; height: 56px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    background: var(--va-bubble); color:#fff;
  }

  #${WIDGET_ID} .panel {
    position: absolute; right: 0; bottom: 72px; width: 340px; max-height: 70vh;
    background: var(--va-surface); color: var(--va-text);
    border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.25);
    display:none; flex-direction:column; overflow:hidden; border:1px solid #e5e7eb;
  }
  #${WIDGET_ID} .panel.open { display:flex; }

  #${WIDGET_ID} header {
    padding: 10px 12px; border-bottom: 1px solid #0b0b0b;
    display:flex; align-items:center; justify-content:space-between;
    background: var(--va-header-bg); color: var(--va-header-text);
  }
  #${WIDGET_ID} header .title { font-weight: 700; }
  #${WIDGET_ID} header button { all: unset; cursor:pointer; padding: 6px 8px; border-radius: 8px; color: inherit; }

  #${WIDGET_ID} .log { padding: 10px 12px; display:flex; gap:8px; flex-direction:column; overflow:auto; background: var(--va-surface); }

  #${WIDGET_ID} .msg { font-size: 13px; line-height: 1.35; padding: 8px 10px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  #${WIDGET_ID} .msg.user { align-self: flex-end; background: var(--va-primary); color: var(--va-user-text); border-top-right-radius: 4px; }
  #${WIDGET_ID} .msg.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; }

  #${WIDGET_ID} .msgHTML.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; padding: 8px 10px; border-radius: 10px; max-width: 100%; }

  #${WIDGET_ID} footer { border-top: 1px solid #f0f0f0; padding: 8px; display:flex; gap:6px; background: var(--va-surface); }
  #${WIDGET_ID} textarea {
    -webkit-appearance:none; appearance:none; resize:none; flex:1; min-height:40px; max-height:140px;
    border:1px solid #ddd; border-radius:10px; padding:8px 10px; font-size:13px; background:#fff; color:#111; outline:none; box-shadow:none;
  }
  #${WIDGET_ID} .send {
    all: unset; display:inline-flex; align-items:center; justify-content:center; background: var(--va-primary); color:#fff;
    border-radius:10px; padding: 8px 12px; font-size:13px; cursor:pointer; line-height:1;
  }
  #${WIDGET_ID} .hint { font-size: 11px; color:#6b7280; padding: 6px 12px 10px; background: var(--va-surface); }

  /* Product cards */
  #${WIDGET_ID} .vivid-product-card { display:flex; align-items:center; margin:8px 0; padding:10px; border:1px solid #eee; border-radius:12px; gap:10px; background:#fff; }
  #${WIDGET_ID} .vivid-product-card img { width:56px; height:56px; object-fit:cover; border-radius:8px; margin-right:10px; }
  #${WIDGET_ID} .vivid-product-card .meta { flex:1; min-width:0; }
  #${WIDGET_ID} .vivid-product-card .name { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #${WIDGET_ID} .vivid-product-card .sub { font-size:12px; color:#666; }
  #${WIDGET_ID} .vivid-product-card .desc { font-size:12px; color:#777; max-height:2.6em; overflow:hidden; text-overflow:ellipsis; }

  #${WIDGET_ID} .vivid-detail { border:1px solid #eee; border-radius:12px; padding:14px; background:#fff; }
  #${WIDGET_ID} .vivid-detail img { width:96px; height:96px; object-fit:cover; border-radius:12px; }

  /* Typing indicator bubble */
  #${WIDGET_ID} .typing { align-self: flex-start; display:flex; align-items:center; gap:6px; padding:8px 12px; margin:2px 0 0 0; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${WIDGET_ID} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${WIDGET_ID} .typing span:nth-child(2) { animation-delay:.2s; }
  #${WIDGET_ID} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }
  `;

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = css;
  shadow.appendChild(style);
}

// ---- Storage helpers ----
function getStoreKey(k?: string) {
  return k || "vivid_chat_session";
}
function loadSession(key: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : null;
  } catch {
    return null;
  }
}
function saveSession(key: string, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(key, JSON.stringify(msgs.slice(-50)));
  } catch {}
}
function onceFlag(flagKey: string): boolean {
  try {
    return localStorage.getItem(flagKey) === "1";
  } catch {
    return false;
  }
}
function setOnceFlag(flagKey: string) {
  try {
    localStorage.setItem(flagKey, "1");
  } catch {}
}

// ---- Small fetch helper (Option A: no custom request headers) ----
async function fetchJSON<T>(
  url: string,
  opts?: RequestInit,
  timeoutMs = 10000
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const finalUrl = url + (url.includes("?") ? "&" : "?") + "__ts=" + Date.now();

  try {
    let res = await fetch(finalUrl, {
      ...opts,
      signal: ctrl.signal,
      credentials: "omit",
      cache: "no-store", // request directive (no extra headers)
    });

    // If a proxy still returns 304, retry once with extra bust
    if (res.status === 304) {
      res = await fetch(finalUrl + "&_=" + Math.random(), {
        ...opts,
        signal: ctrl.signal,
        credentials: "omit",
        cache: "no-store",
      });
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// ---- Product intent detector ----

// NEW: greetings / chit-chat detector
function isGreetingOrSmallTalk(text: string): boolean {
  const t = text.trim().toLowerCase();
  const greetings = [
    "hi",
    "hello",
    "hey",
    "yo",
    "sup",
    "howdy",
    "good morning",
    "good afternoon",
    "good evening",
    "thanks",
    "thank you",
    "ok",
    "okay",
    "test",
    "help",
  ];
  // exact match or startsWith common multi-word greetings
  return (
    greetings.includes(t) ||
    greetings.some((g) => t.startsWith(g + " ")) ||
    t.length <= 2 // super short messages like "yo", "ok"
  );
}

// Keywords-only product intent (no SKU heuristic)
function looksLikeProductQuery(text: string): boolean {
  const q = text.trim().toLowerCase();

  // tune this list anytime — it's the only trigger now
  const productKeywords = [
    "product",
    "price",
    "sku",
    "sign",
    "banner",
    "label",
    "sticker",
    "decal",
    "yard",
    "stake",
    "flag",
    "poster",
    "magnet",
    "vinyl",
    "wrap",
    "business card",
    "brochure",
    "flyer",
    "shirt",
    "apparel",
    "embroidery",
    "decoration",
    "printing",
    "yard sign",
    "menu board",
    "window cling",
    "vehicle wrap",
  ];

  return productKeywords.some((k) => q.includes(k));
}

// ---- Logged-in name detection & persistence ----
function getLoggedInUserNameFromDOM(): string | null {
  // Targets: <td class="login loginWelcome"><span>Welcome, Josh Milton</span></td>
  const el = document.querySelector(".loginWelcome span");
  if (!el) return null;
  const text = el.textContent?.trim() || "";
  const m = text.match(/Welcome,\s*(.+)/i);
  return m ? m[1].trim() : null;
}
function cacheUserName(name: string) {
  try {
    localStorage.setItem("vivid_chat_userName", name);
  } catch {}
}
function readCachedUserName(): string | null {
  try {
    return localStorage.getItem("vivid_chat_userName");
  } catch {
    return null;
  }
}
function detectUserName(): string | null {
  const name = getLoggedInUserNameFromDOM();
  if (name) {
    cacheUserName(name);
    return name;
  }
  return readCachedUserName();
}
let VIVID_USER_NAME: string | null = detectUserName();

// ---- Widget ----
export function initChatWidget(userOpts: Options = {}) {
  const opts: Options = {
    title: "Prisma Assistant",
    welcomeOnce: true,
    autoOpenOnce: true,
    persist: true,
    storageKey: "vivid_chat_session",
    theme: {
      primary: "#111",
      bubbleColor: "#111",
      surface: "#fff",
      text: "#111",
      assistantBubble: "#f6f6f7",
      userText: "#fff",
      headerBg: "#000",
      headerText: "#fff",
    },
    productLimit: 6,
    ...userOpts,
  };

  const apiBase = opts.apiBase ?? "/api/ai";
  const business = opts.business ?? inferBusinessFromHost();
  const siteName = opts.siteName ?? (document.title || "Vivid Store");
  const debug = !!opts.debug;

  const defaultCatalog = location.hostname.endsWith("vivid-think.com")
    ? location.origin
    : "";
  const catalogSite = (opts.catalogSite || defaultCatalog).replace(/\/$/, "");
  const productLimit = Math.max(1, Math.min(24, opts.productLimit || 6));
  const productSearchEnabled = !opts.disableProductSearch;

  // ---- Persist across navigation; clear only on NEW tab session ----
  const KEY = getStoreKey(opts.storageKey);
  const SESSION_FLAG = "vivid_chat_active_session";
  if (!sessionStorage.getItem(SESSION_FLAG)) {
    localStorage.removeItem(KEY);
  }
  sessionStorage.setItem(SESSION_FLAG, "1");

  // theme -> css vars
  const vars = {
    "--va-primary": opts.theme?.primary || "#111",
    "--va-surface": opts.theme?.surface || "#fff",
    "--va-text": opts.theme?.text || "#111",
    "--va-assistant-bubble": opts.theme?.assistantBubble || "#f6f6f7",
    "--va-user-text": opts.theme?.userText || "#fff",
    "--va-header-bg": opts.theme?.headerBg || "#000",
    "--va-header-text": opts.theme?.headerText || "#fff",
    "--va-bubble": opts.theme?.bubbleColor || opts.theme?.primary || "#111",
  };

  const { shadow } = getHostAndShadow();
  injectStyles(vars);

  let open = false;
  const widget = document.createElement("div");
  widget.id = WIDGET_ID;

  const bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.title = "Chat";
  bubble.innerHTML = opts.iconSVG || svgChatIcon();

  const panel = document.createElement("div");
  panel.className = "panel";

  const header = document.createElement("header");
  const hTitle = document.createElement("div");
  hTitle.className = "title";
  hTitle.textContent = opts.title || "Prisma Assistant";
  const hRight = document.createElement("div");
  const closeBtn = document.createElement("button");
  closeBtn.ariaLabel = "Close";
  closeBtn.innerHTML = "✕";
  hRight.appendChild(closeBtn);
  header.appendChild(hTitle);
  header.appendChild(hRight);

  const log = document.createElement("div");
  log.className = "log";

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
  // Updated: clickable, dynamic link
  hint.innerHTML = `Access your order status by logging in and clicking <strong>My Account</strong> (top right), then <strong>View Orders</strong>.<br>
    <a href="https://${window.location.hostname}/account/orders.php" target="_blank" rel="noopener noreferrer">View My Orders</a>`;

  panel.appendChild(header);
  panel.appendChild(log);
  panel.appendChild(footer);
  panel.appendChild(hint);

  widget.appendChild(bubble);
  widget.appendChild(panel);
  shadow.appendChild(widget);

  function setOpen(v: boolean) {
    open = v;
    panel.classList.toggle("open", open);
    if (open) {
      // Prefer explicit welcomeMessage; else personalize if we know a name.
      const computedWelcome =
        opts.welcomeMessage ||
        (VIVID_USER_NAME
          ? `Hey ${VIVID_USER_NAME}, how can I help today?`
          : "");

      if (computedWelcome) {
        const onceKey = "vivid_chat_welcome_shown";
        if (!opts.welcomeOnce || !onceFlag(onceKey)) {
          addMsg("assistant", computedWelcome);
          if (opts.welcomeOnce) setOnceFlag(onceKey);
        }
      }
    }
  }

  bubble.addEventListener("click", () => setOpen(!open));
  closeBtn.addEventListener("click", () => setOpen(false));

  // ---- Messages / persistence ----
  const messages: ChatMessage[] = (opts.persist && loadSession(KEY)) || [
    { role: "system", content: systemPrompt(siteName, business) },
  ];

  if (messages.length && messages[0].role === "system") {
    for (const m of messages.slice(1))
      addMsg(m.role as "user" | "assistant", m.content);
  }

  function snapshot() {
    if (opts.persist) saveSession(KEY, messages);
  }

  // Inline typing indicator helpers
  let typingEl: HTMLDivElement | null = null;
  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(typingEl);
    log.scrollTop = log.scrollHeight;
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode)
      typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  async function doSend() {
    const text = ta.value.trim();
    if (!text) return;

    addMsg("user", text);
    messages.push({ role: "user", content: text });
    snapshot();

    ta.value = "";
    sendBtn.disabled = true;
    showTyping();

    // --- Hard bypass for greetings/small-talk ---
    if (isGreetingOrSmallTalk(text)) {
      try {
        const reply = await sendChat(apiBase, business, messages);
        hideTyping();
        sendBtn.disabled = false;

        messages.push({ role: "assistant", content: reply });
        addAssistantMessageSmart(reply);
        snapshot();
        if (debug) console.log("[chat] greeting → LLM path");
        return; // ← IMPORTANT: stop here so product search never runs
      } catch (err: any) {
        hideTyping();
        sendBtn.disabled = false;
        const m = `Hi${
          VIVID_USER_NAME ? ` ${VIVID_USER_NAME}` : ""
        }! I’m the Prisma Assistant. I can help with store hours, returns, shipping, and orders. What do you need?`;
        messages.push({ role: "assistant", content: m });
        addAssistantMessageSmart(m);
        snapshot();
        if (debug) console.error(err);
        return;
      }
    }

    // --- Product search interception ---
    // NEW: skip if greeting/small-talk, and use stricter product intent
    if (
      productSearchEnabled &&
      catalogSite &&
      !isGreetingOrSmallTalk(text) && // NEW
      looksLikeProductQuery(text) // CHANGED (stricter)
    ) {
      try {
        const url = `${ASSISTANT_BASE}/api/products?site=${encodeURIComponent(
          catalogSite
        )}&q=${encodeURIComponent(text)}&limit=${productLimit}`;
        const data = await fetchJSON<{
          site: string;
          query: string;
          count: number;
          items: Product[];
        }>(url);

        hideTyping();
        sendBtn.disabled = false;

        if (!data.items?.length) {
          addMsg(
            "assistant",
            `I didn’t find any matching products for “${text}”.`
          );
          messages.push({
            role: "assistant",
            content: `No products found for "${text}"`,
          });
          snapshot();
          return;
        }

        const html = renderProductListHTML(data.items);
        addMsgHTML(
          "assistant",
          `
          <div>Here’s what I found for “${escapeHtml(data.query)}”:</div>
          <div>${html}</div>
        `
        );
        bindProductDetailButtons();

        messages.push({
          role: "assistant",
          content: `[${data.items.length} product results for "${data.query}"]`,
        });
        snapshot();
        return;
      } catch (e: any) {
        hideTyping();
        sendBtn.disabled = false;
        if (debug) console.warn("Product search failed:", e);
        addMsg("assistant", "Product search is unavailable right now.");
        messages.push({
          role: "assistant",
          content: "Product search unavailable",
        });
        snapshot();
        return;
      }
    }

    // --- Normal LLM flow ---
    try {
      const reply = await sendChat(apiBase, business, messages);
      hideTyping();
      sendBtn.disabled = false;

      messages.push({ role: "assistant", content: reply });
      addAssistantMessageSmart(reply); // ⬅️ render HTML if present
      snapshot();
      emitAnalytics("vivid_chat_message", { role: "assistant" });
    } catch (err: any) {
      hideTyping();
      sendBtn.disabled = false;

      const m = `Sorry — I had trouble reaching the assistant. (${
        err?.message || "Network error"
      })`;
      messages.push({ role: "assistant", content: m });
      addAssistantMessageSmart(m); // ⬅️ consistent rendering
      snapshot();
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

  function addMsgHTML(role: "assistant", html: string) {
    const el = document.createElement("div");
    el.className = `msgHTML ${role}`;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  // NEW: smart renderer to allow clickable links in assistant replies
  function addAssistantMessageSmart(text: string) {
    // crude but effective: if it contains an HTML tag, treat as HTML
    if (/<[a-z][\s\S]*>/i.test(text)) {
      addMsgHTML("assistant", text);
    } else {
      addMsg("assistant", text);
    }
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
    console.log("Chat widget initialized", {
      apiBase,
      business,
      siteName,
      catalogSite,
      productLimit,
      productSearchEnabled,
      options: opts,
      userName: VIVID_USER_NAME || null,
    });

  // ---- Auto-open support ----
  if (typeof opts.autoOpenDelay === "number") {
    const onceKey = "vivid_chat_auto_open_done";
    if (!opts.autoOpenOnce || !onceFlag(onceKey)) {
      setTimeout(() => {
        setOpen(true);
        if (opts.autoOpenOnce) setOnceFlag(onceKey);
      }, Math.max(0, opts.autoOpenDelay));
    }
  }

  // ---------- Product helpers ----------

  type Product = {
    id: string;
    sku?: string;
    name: string;
    price?: number;
    imageUrl?: string;
    url?: string;
    desc?: string;
  };

  function renderProductListHTML(items: Product[]): string {
    return items
      .map((p) => {
        const price =
          typeof p.price === "number" && p.price > 0
            ? `$${p.price.toFixed(2)}`
            : "";
        const img = p.imageUrl ? `<img src="${p.imageUrl}" alt="" />` : "";
        const view = p.url
          ? `<a href="${p.url}" target="_blank" rel="noopener">View</a>`
          : "";
        return `
          <div class="vivid-product-card">
            ${img}
            <div class="meta">
              <div class="name">${escapeHtml(p.name)}</div>
              <div class="sub">${escapeHtml(p.sku || "")} ${
          price ? `• ${price}` : ""
        }</div>
              ${p.desc ? `<div class="desc">${escapeHtml(p.desc)}</div>` : ""}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;white-space:nowrap;">
              ${view}
              ${
                p.url
                  ? `<button class="vivid-product-detail" data-url="${encodeURIComponent(
                      p.url
                    )}">Details</button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  function bindProductDetailButtons() {
    const btns = SHADOW!.querySelectorAll<HTMLButtonElement>(
      `#${WIDGET_ID} .vivid-product-detail`
    );
    btns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const url = decodeURIComponent(btn.dataset.url || "");
        if (!url) return;
        btn.disabled = true;
        try {
          const detail = await fetchJSON<Product>(
            `${ASSISTANT_BASE}/api/catalog-product?url=${encodeURIComponent(
              url
            )}`
          );
          addMsgHTML("assistant", renderProductDetailHTML(detail));
        } catch (e: any) {
          addMsg("assistant", "Sorry — couldn’t load product details.");
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function renderProductDetailHTML(p: Product): string {
    const price =
      typeof p.price === "number" && p.price > 0
        ? `$${p.price.toFixed(2)}`
        : "";
    const img = p.imageUrl ? `<img src="${p.imageUrl}" alt="" />` : "";
    const desc = p.desc
      ? `<div style="margin-top:6px;">${escapeHtml(p.desc)}</div>`
      : "";
    const link = p.url
      ? `<div style="margin-top:10px;"><a href="${p.url}" target="_blank" rel="noopener">Open product page</a></div>`
      : "";
    return `
      <div class="vivid-detail">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          ${img}
          <div style="flex:1;">
            <div style="font-weight:700;font-size:16px;">${escapeHtml(
              p.name
            )}</div>
            <div style="font-size:12px;color:#666;margin:4px 0;">${escapeHtml(
              p.sku || ""
            )} ${price ? `• ${price}` : ""}</div>
            ${desc}
            ${link}
          </div>
        </div>
      </div>
    `;
  }
}

// ---- Utils ----
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
    "Be helpful, concise, and brand-safe. Do not perform account/order/payment lookups; direct users to My Account > View Orders.",
    `Capabilities: explain products, materials, typical lead times, shipping options, design tips.`,
    `Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.`,
    `If unsure, offer to escalate to customer service: salesbr@poweredbyprisma.com.`,
  ].join("\n");
}
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m]!)
  );
}
