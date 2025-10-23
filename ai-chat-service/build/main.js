"use strict";
var VividAssistant = (() => {
  var P = Object.defineProperty;
  var ie = Object.getOwnPropertyDescriptor;
  var se = Object.getOwnPropertyNames;
  var oe = Object.prototype.hasOwnProperty;
  var re = (t, e) => {
      for (var r in e) P(t, r, { get: e[r], enumerable: !0 });
    },
    de = (t, e, r, d) => {
      if ((e && typeof e == "object") || typeof e == "function")
        for (let o of se(e))
          !oe.call(t, o) &&
            o !== r &&
            P(t, o, {
              get: () => e[o],
              enumerable: !(d = ie(e, o)) || d.enumerable,
            });
      return t;
    };
  var ce = (t) => de(P({}, "__esModule", { value: !0 }), t);
  var xe = {};
  re(xe, { mountVividChat: () => be });

  // --- UPDATED: include siteHost in body ---
  async function U(t, e, r, d) {
    let o = await fetch(`${t}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: e,
        messages: r,
        siteHost: window.location.hostname, // NEW
      }),
      signal: d,
    });
    if (!o.ok) {
      let u = await o.text().catch(() => "");
      throw new Error(`Chat error ${o.status}: ${u || o.statusText}`);
    }
    let m = await o.json();
    return String(m.message ?? "Sorry \u2014 I couldn\u2019t get a response.");
  }

  var q = "vivid-chat-style",
    i = "vivid-chat-widget",
    V = "vivid-chat-host",
    K = "https://ai-chat-bot-1xm4.onrender.com",
    N = null;

  // ---- Logged-in name detection & persistence (NEW) ----
  function __va_getUserNameFromDOM() {
    try {
      var el = document.querySelector(".loginWelcome span");
      if (!el) return null;
      var t = (el.textContent || "").trim();
      var m = t.match(/Welcome,\s*(.+)/i);
      return m ? m[1].trim() : null;
    } catch {
      return null;
    }
  }
  function __va_cacheUserName(n) {
    try {
      localStorage.setItem("vivid_chat_userName", n);
    } catch {}
  }
  function __va_readCachedUserName() {
    try {
      return localStorage.getItem("vivid_chat_userName");
    } catch {
      return null;
    }
  }
  function __va_detectUserName() {
    var n = __va_getUserNameFromDOM();
    if (n) {
      __va_cacheUserName(n);
      return n;
    }
    return __va_readCachedUserName();
  }
  var VIVID_USER_NAME = __va_detectUserName();

  // Ensure name detection runs after DOM is ready too
  document.addEventListener("DOMContentLoaded", function () {
    VIVID_USER_NAME = __va_detectUserName();
  });

  function J() {
    let t = document.getElementById(V);
    return (
      t ||
        ((t = document.createElement("div")),
        (t.id = V),
        (t.style.position = "fixed"),
        (t.style.right = "0"),
        (t.style.bottom = "0"),
        (t.style.zIndex = "2147483647"),
        document.body.appendChild(t)),
      (N = t.shadowRoot ?? t.attachShadow({ mode: "open" })),
      { host: t, shadow: N }
    );
  }

  function le(t) {
    let { shadow: e } = J(),
      r = e.getElementById(q);
    r && r.remove();
    let d = `
  :host, :host * { box-sizing: border-box; }
  :host * { font-family: Verdana, Arial, sans-serif; }

  :host {
    --va-primary: ${t["--va-primary"]};
    --va-surface: ${t["--va-surface"]};
    --va-text: ${t["--va-text"]};
    --va-assistant-bubble: ${t["--va-assistant-bubble"]};
    --va-user-text: ${t["--va-user-text"]};
    --va-header-bg: ${t["--va-header-bg"]};
    --va-header-text: ${t["--va-header-text"]};
    --va-bubble: ${t["--va-bubble"]};
  }

  #${i} { position: fixed; z-index: 2147483647; right: 20px; bottom: 20px; }
  #${i} .bubble {
    width: 56px; height: 56px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    background: var(--va-bubble); color:#fff;
  }

  #${i} .panel {
    position: absolute; right: 0; bottom: 72px; width: 340px; max-height: 70vh;
    background: var(--va-surface); color: var(--va-text);
    border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.25);
    display:none; flex-direction:column; overflow:hidden; border:1px solid #e5e7eb;
  }
  #${i} .panel.open { display:flex; }

  #${i} header {
    padding: 10px 12px; border-bottom: 1px solid #0b0b0b;
    display:flex; align-items:center; justify-content:space-between;
    background: var(--va-header-bg); color: var(--va-header-text);
  }
  #${i} header .title { font-weight: 700; }
  #${i} header button { all: unset; cursor:pointer; padding: 6px 8px; border-radius: 8px; color: inherit; }

  #${i} .log { padding: 10px 12px; display:flex; gap:8px; flex-direction:column; overflow:auto; background: var(--va-surface); }

  #${i} .msg { font-size: 13px; line-height: 1.35; padding: 8px 10px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  #${i} .msg.user { align-self: flex-end; background: var(--va-primary); color: var(--va-user-text); border-top-right-radius: 4px; }
  #${i} .msg.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; }

  #${i} .msgHTML.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; padding: 8px 10px; border-radius: 10px; max-width: 100%; }

  #${i} footer { border-top: 1px solid #f0f0f0; padding: 8px; display:flex; gap:6px; background: var(--va-surface); }
  #${i} textarea {
    -webkit-appearance:none; appearance:none; resize:none; flex:1; min-height:40px; max-height:140px;
    border:1px solid #ddd; border-radius:10px; padding:8px 10px; font-size:13px; background:#fff; color:#111; outline:none; box-shadow:none;
  }
  #${i} .send {
    all: unset; display:inline-flex; align-items:center; justify-content:center; background: var(--va-primary); color:#fff;
    border-radius:10px; padding: 8px 12px; font-size:13px; cursor:pointer; line-height:1;
  }
  #${i} .hint { font-size: 11px; color:#6b7280; padding: 6px 12px 10px; background: var(--va-surface); }

  /* Product cards */
  #${i} .vivid-product-card { display:flex; align-items:center; margin:8px 0; padding:10px; border:1px solid #eee; border-radius:12px; gap:10px; background:#fff; }
  #${i} .vivid-product-card img { width:56px; height:56px; object-fit:cover; border-radius:8px; margin-right:10px; }
  #${i} .vivid-product-card .meta { flex:1; min-width:0; }
  #${i} .vivid-product-card .name { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #${i} .vivid-product-card .sub { font-size:12px; color:#666; }
  #${i} .vivid-product-card .desc { font-size:12px; color:#777; max-height:2.6em; overflow:hidden; text-overflow:ellipsis; }

  #${i} .vivid-detail { border:1px solid #eee; border-radius:12px; padding:14px; background:#fff; }
  #${i} .vivid-detail img { width:96px; height:96px; object-fit:cover; border-radius:12px; }

  /* Typing indicator bubble */
  #${i} .typing { align-self: flex-start; display:flex; align-items:center; gap:6px; padding:8px 12px; margin:2px 0 0 0; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${i} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${i} .typing span:nth-child(2) { animation-delay:.2s; }
  #${i} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }
  `,
      o = document.createElement("style");
    (o.id = q), (o.textContent = d), e.appendChild(o);
  }

  function pe(t) {
    return t || "vivid_chat_session";
  }
  function ue(t) {
    try {
      let e = localStorage.getItem(t);
      return e ? JSON.parse(e) : null;
    } catch {
      return null;
    }
  }
  function ge(t, e) {
    try {
      localStorage.setItem(t, JSON.stringify(e.slice(-50)));
    } catch {}
  }
  function F(t) {
    try {
      return localStorage.getItem(t) === "1";
    } catch {
      return !1;
    }
  }
  function G(t) {
    try {
      localStorage.setItem(t, "1");
    } catch {}
  }
  async function W(t, e, r = 1e4) {
    let d = new AbortController(),
      o = setTimeout(() => d.abort(), r),
      m = t + (t.includes("?") ? "&" : "?") + "__ts=" + Date.now();
    try {
      let u = await fetch(m, {
        ...e,
        signal: d.signal,
        credentials: "omit",
        cache: "no-store",
      });
      if (
        (u.status === 304 &&
          (u = await fetch(m + "&_=" + Math.random(), {
            ...e,
            signal: d.signal,
            credentials: "omit",
            cache: "no-store",
          })),
        !u.ok)
      )
        throw new Error(`HTTP ${u.status}`);
      return await u.json();
    } finally {
      clearTimeout(o);
    }
  }
  function me(t) {
    const e = t.trim().toLowerCase();
    // word-boundary match; multi-word phrases ok
    const pattern =
      /\b(product|price|sku|sign|banner|label|sticker|decal|yard|stake|flag|poster|magnet|vinyl|wrap|business\ card|brochure|flyer|shirt|apparel|embroidery|decoration|printing|yard\ sign|menu\ board|window\ cling|vehicle\ wrap)\b/i;
    return pattern.test(e);
  }

  function ye(t) {
    const q = t.trim().toLowerCase();
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
    return (
      greetings.includes(q) ||
      greetings.some((g) => q.startsWith(g + " ")) ||
      q.length <= 2
    );
  }

  function Y(t = {}) {
    let e = {
        title: "Prisma Assistant",
        welcomeOnce: !0,
        autoOpenOnce: !0,
        persist: !0,
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
        ...t,
      },
      r = e.apiBase ?? "/api/ai",
      d = e.business ?? fe(),
      o = e.siteName ?? (document.title || "Vivid Store"),
      m = !!e.debug,
      u = location.hostname.endsWith("vivid-think.com") ? location.origin : "",
      T = (e.catalogSite || u).replace(/\/$/, ""),
      B = Math.max(1, Math.min(24, e.productLimit || 6)),
      z = !e.disableProductSearch,
      E = pe(e.storageKey),
      A = "vivid_chat_active_session";
    sessionStorage.getItem(A) || localStorage.removeItem(E),
      sessionStorage.setItem(A, "1");
    let Q = {
        "--va-primary": e.theme?.primary || "#111",
        "--va-surface": e.theme?.surface || "#fff",
        "--va-text": e.theme?.text || "#111",
        "--va-assistant-bubble": e.theme?.assistantBubble || "#f6f6f7",
        "--va-user-text": e.theme?.userText || "#fff",
        "--va-header-bg": e.theme?.headerBg || "#000",
        "--va-header-text": e.theme?.headerText || "#fff",
        "--va-bubble": e.theme?.bubbleColor || e.theme?.primary || "#111",
      },
      { shadow: X } = J();
    le(Q);
    let $ = !1,
      C = document.createElement("div");
    C.id = i;
    let y = document.createElement("button");
    (y.className = "bubble"),
      (y.title = "Chat"),
      (y.innerHTML = e.iconSVG || he());
    let v = document.createElement("div");
    v.className = "panel";
    let O = document.createElement("header"),
      L = document.createElement("div");
    (L.className = "title"), (L.textContent = e.title || "Prisma Assistant");
    let D = document.createElement("div"),
      k = document.createElement("button");
    (k.ariaLabel = "Close"),
      (k.innerHTML = "\u2715"),
      D.appendChild(k),
      O.appendChild(L),
      O.appendChild(D);
    let c = document.createElement("div");
    c.className = "log";
    let I = document.createElement("footer"),
      w = document.createElement("textarea");
    w.placeholder = "Ask about products, lead times, shipping, etc.";
    let g = document.createElement("button");
    (g.className = "send"),
      (g.textContent = "Send"),
      I.appendChild(w),
      I.appendChild(g);
    let M = document.createElement("div");
    M.className = "hint";
    // already clickable orders link
    M.innerHTML = `Access your order status by logging in and clicking <strong>My Account</strong> (top right), then <strong>View Orders</strong>.<br>
  <a href="https://${window.location.hostname}/account/orders.php" target="_blank" rel="noopener noreferrer">View My Orders</a>`;
    v.appendChild(O),
      v.appendChild(c),
      v.appendChild(I),
      v.appendChild(M),
      C.appendChild(y),
      C.appendChild(v),
      X.appendChild(C);

    // --- UPDATED: Personalized welcome on open
    function _(n) {
      $ = n;
      v.classList.toggle("open", $);
      if ($) {
        // Re-detect in case the DOM wasn't ready earlier
        VIVID_USER_NAME = __va_detectUserName();

        var computedWelcome =
          e.welcomeMessage ||
          (VIVID_USER_NAME
            ? "Hey " + VIVID_USER_NAME + ", how can I help today?"
            : "");
        if (computedWelcome) {
          let a = "vivid_chat_welcome_shown";
          if (!e.welcomeOnce || !F(a)) {
            h("assistant", computedWelcome);
            if (e.welcomeOnce) G(a);
          }
        }
      }
    }

    y.addEventListener("click", () => _(!$)),
      k.addEventListener("click", () => _(!1));
    let l = (e.persist && ue(E)) || [{ role: "system", content: ve(o, d) }];
    if (l.length && l[0].role === "system")
      for (let n of l.slice(1)) h(n.role, n.content);
    function x() {
      e.persist && ge(E, l);
    }
    let p = null;
    function Z() {
      p ||
        ((p = document.createElement("div")),
        (p.className = "typing"),
        (p.innerHTML = "<span></span><span></span><span></span>"),
        c.appendChild(p),
        (c.scrollTop = c.scrollHeight));
    }
    function S() {
      p && p.parentNode && p.parentNode.removeChild(p), (p = null);
    }
    async function j() {
      let n = w.value.trim();
      if (n) {
        if (
          (h("user", n),
          l.push({ role: "user", content: n }),
          x(),
          (w.value = ""),
          (g.disabled = !0),
          Z(),
          z && T && me(n) && !ye(n))
        )
          try {
            let a = `${K}/api/products?site=${encodeURIComponent(
                T
              )}&q=${encodeURIComponent(n)}&limit=${B}`,
              s = await W(a);
            if ((S(), (g.disabled = !1), !s.items?.length)) {
              h(
                "assistant",
                `I didn\u2019t find any matching products for \u201C${n}\u201D.`
              ),
                l.push({
                  role: "assistant",
                  content: `No products found for "${n}"`,
                }),
                x();
              return;
            }
            let f = te(s.items);
            R(
              "assistant",
              `
          <div>Here\u2019s what I found for \u201C${b(s.query)}\u201D:</div>
          <div>${f}</div>
        `
            ),
              ne(),
              l.push({
                role: "assistant",
                content: `[${s.items.length} product results for "${s.query}"]`,
              }),
              x();
            return;
          } catch (a) {
            S(),
              (g.disabled = !1),
              m && console.warn("Product search failed:", a),
              h("assistant", "Product search is unavailable right now."),
              l.push({
                role: "assistant",
                content: "Product search unavailable",
              }),
              x();
            return;
          }

        // --- NEW: If it's a greeting, handle gracefully. On failure, send a friendly personalized greeting.
        // --- Clean, single-line greeting (no LLM call for "hello"/"hi" etc.)
        if (ye(n)) {
          S(); // hide typing
          g.disabled = false;
          var msg = VIVID_USER_NAME
            ? "Hi " + VIVID_USER_NAME + "\u2014how can I help today?"
            : "Hi! How can I help today?";
          l.push({ role: "assistant", content: msg });
          /<[a-z][\s\S]*>/i.test(msg)
            ? R("assistant", msg)
            : h("assistant", msg);
          x();
          ee("vivid_chat_message", { role: "assistant", kind: "greeting" });
          return;
        }

        // --- Normal LLM flow ---
        try {
          let a = await U(r, d, l);
          S(),
            (g.disabled = !1),
            l.push({ role: "assistant", content: a }),
            // --- UPDATED: render HTML replies as HTML ---
            /<[a-z][\s\S]*>/i.test(a) ? R("assistant", a) : h("assistant", a),
            x(),
            ee("vivid_chat_message", { role: "assistant" });
        } catch (a) {
          S(), (g.disabled = !1);
          let s = `Sorry \u2014 I had trouble reaching the assistant. (${
            a?.message || "Network error"
          })`;
          l.push({ role: "assistant", content: s }),
            // keep consistent rendering
            /<[a-z][\s\S]*>/i.test(s) ? R("assistant", s) : h("assistant", s),
            x(),
            m && console.error(a);
        }
      }
    }
    g.addEventListener("click", j),
      w.addEventListener("keydown", (n) => {
        n.key === "Enter" && !n.shiftKey && (n.preventDefault(), j());
      });

    function h(n, a) {
      let s = document.createElement("div");
      (s.className = `msg ${n}`),
        (s.textContent = a),
        c.appendChild(s),
        (c.scrollTop = c.scrollHeight);
    }
    function R(n, a) {
      let s = document.createElement("div");
      (s.className = `msgHTML ${n}`),
        (s.innerHTML = a),
        c.appendChild(s),
        (c.scrollTop = c.scrollHeight);
    }
    function ee(n, a) {
      (window.dataLayer = window.dataLayer || []),
        window.dataLayer.push({ event: n, ...a, business: d, siteName: o });
    }
    if (
      (m &&
        console.log("Chat widget initialized", {
          apiBase: r,
          business: d,
          siteName: o,
          catalogSite: T,
          productLimit: B,
          productSearchEnabled: z,
          options: e,
          userName: VIVID_USER_NAME || null, // NEW
        }),
      typeof e.autoOpenDelay == "number")
    ) {
      let n = "vivid_chat_auto_open_done";
      (!e.autoOpenOnce || !F(n)) &&
        setTimeout(() => {
          _(!0), e.autoOpenOnce && G(n);
        }, Math.max(0, e.autoOpenDelay));
    }
    function te(n) {
      return n
        .map((a) => {
          let s =
              typeof a.price == "number" && a.price > 0
                ? `$${a.price.toFixed(2)}`
                : "",
            f = a.imageUrl ? `<img src="${a.imageUrl}" alt="" />` : "",
            H = a.url
              ? `<a href="${a.url}" target="_blank" rel="noopener">View</a>`
              : "";
          return `
          <div class="vivid-product-card">
            ${f}
            <div class="meta">
              <div class="name">${b(a.name)}</div>
              <div class="sub">${b(a.sku || "")} ${s ? `\u2022 ${s}` : ""}</div>
              ${a.desc ? `<div class="desc">${b(a.desc)}</div>` : ""}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;white-space:nowrap;">
              ${H}
              ${
                a.url
                  ? `<button class="vivid-product-detail" data-url="${encodeURIComponent(
                      a.url
                    )}">Details</button>`
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");
    }
    function ne() {
      N.querySelectorAll(`#${i} .vivid-product-detail`).forEach((a) => {
        a.addEventListener("click", async () => {
          let s = decodeURIComponent(a.dataset.url || "");
          if (s) {
            a.disabled = !0;
            try {
              let f = await W(
                `${K}/api/catalog-product?url=${encodeURIComponent(s)}`
              );
              R("assistant", ae(f));
            } catch {
              h(
                "assistant",
                "Sorry \u2014 couldn\u2019t load product details."
              );
            } finally {
              a.disabled = !1;
            }
          }
        });
      });
    }
    function ae(n) {
      let a =
          typeof n.price == "number" && n.price > 0
            ? `$${n.price.toFixed(2)}`
            : "",
        s = n.imageUrl ? `<img src="${n.imageUrl}" alt="" />` : "",
        f = n.desc ? `<div style="margin-top:6px;">${b(n.desc)}</div>` : "",
        H = n.url
          ? `<div style="margin-top:10px;"><a href="${n.url}" target="_blank" rel="noopener">Open product page</a></div>`
          : "";
      return `
      <div class="vivid-detail">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          ${s}
          <div style="flex:1;">
            <div style="font-weight:700;font-size:16px;">${b(n.name)}</div>
            <div style="font-size:12px;color:#666;margin:4px 0;">${b(
              n.sku || ""
            )} ${a ? `\u2022 ${a}` : ""}</div>
            ${f}
            ${H}
          </div>
        </div>
      </div>
    `;
    }
  }
  function he() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>';
  }
  function fe() {
    let t = location.hostname.toLowerCase();
    return t.includes("vividnola")
      ? "vividnola"
      : t.includes("toastedyolk")
      ? "toastedyolk"
      : t.includes("celtic")
      ? "celtic"
      : "vivid";
  }
  function ve(t, e) {
    return [
      `You are Prisma storefront assistant for ${t} (business: ${e}).`,
      "Be helpful, concise, and brand-safe. Do not perform account/order/payment lookups; direct users to My Account > View Orders.",
      "Capabilities: explain products, materials, typical lead times, shipping options, design tips.",
      "Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.",
      "If unsure, offer to escalate to customer service: salesbr@poweredbyprisma.com.",
    ].join(`
`);
  }
  function b(t) {
    return t.replace(
      /[&<>"']/g,
      (e) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[e])
    );
  }
  function be(t) {
    let e = t?.apiBase ?? "https://assistant.vivid-think.com/api/ai",
      r = () => Y({ ...t, apiBase: e });
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", r, { once: !0 })
      : r();
  }
  return ce(xe);
})();
