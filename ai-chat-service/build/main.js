"use strict";var VividAssistant=(()=>{var T=Object.defineProperty;var G=Object.getOwnPropertyDescriptor;var W=Object.getOwnPropertyNames;var J=Object.prototype.hasOwnProperty;var Y=(t,e)=>{for(var i in e)T(t,i,{get:e[i],enumerable:!0})},q=(t,e,i,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of W(e))!J.call(t,a)&&a!==i&&T(t,a,{get:()=>e[a],enumerable:!(r=G(e,a))||r.enumerable});return t};var Q=t=>q(T({},"__esModule",{value:!0}),t);var se={};Y(se,{mountVividChat:()=>ae});async function N(t,e,i,r){let a=await fetch(`${t}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({business:e,messages:i}),signal:r});if(!a.ok){let w=await a.text().catch(()=>"");throw new Error(`Chat error ${a.status}: ${w||a.statusText}`)}let b=await a.json();return String(b.message??"Sorry \u2014 I couldn\u2019t get a response.")}var _="vivid-chat-style",n="vivid-chat-widget",H="vivid-chat-host",z=null;function V(){let t=document.getElementById(H);return t||(t=document.createElement("div"),t.id=H,t.style.position="fixed",t.style.right="0",t.style.bottom="0",t.style.zIndex="2147483647",document.body.appendChild(t)),z=t.shadowRoot??t.attachShadow({mode:"open"}),{host:t,shadow:z}}function U(t){let{shadow:e}=V(),i=e.getElementById(_);i&&i.remove();let r=`
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

  #${n} { position: fixed; z-index: 2147483647; right: 20px; bottom: 20px; }
  #${n} .bubble {
    width: 56px; height: 56px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    background: var(--va-bubble); color:#fff;
  }

  #${n} .panel {
    position: absolute; right: 0; bottom: 72px; width: 340px; max-height: 70vh;
    background: var(--va-surface); color: var(--va-text);
    border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.25);
    display:none; flex-direction:column; overflow:hidden; border:1px solid #e5e7eb;
  }
  #${n} .panel.open { display:flex; }

  #${n} header {
    padding: 10px 12px; border-bottom: 1px solid #0b0b0b;
    display:flex; align-items:center; justify-content:space-between;
    background: var(--va-header-bg); color: var(--va-header-text);
  }
  #${n} header .title { font-weight: 700; }
  #${n} header button { all: unset; cursor:pointer; padding: 6px 8px; border-radius: 8px; color: inherit; }

  #${n} .log { padding: 10px 12px; display:flex; gap:8px; flex-direction:column; overflow:auto; background: var(--va-surface); }

  #${n} .msg { font-size: 13px; line-height: 1.35; padding: 8px 10px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  #${n} .msg.user { align-self: flex-end; background: var(--va-primary); color: var(--va-user-text); border-top-right-radius: 4px; }
  #${n} .msg.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; }

  #${n} footer { border-top: 1px solid #f0f0f0; padding: 8px; display:flex; gap:6px; background: var(--va-surface); }
  #${n} textarea {
    -webkit-appearance:none; appearance:none; resize:none; flex:1; min-height:40px; max-height:140px;
    border:1px solid #ddd; border-radius:10px; padding:8px 10px; font-size:13px; background:#fff; color:#111; outline:none; box-shadow:none;
  }
  #${n} .send {
    all: unset; display:inline-flex; align-items:center; justify-content:center; background: var(--va-primary); color:#fff;
    border-radius:10px; padding: 8px 12px; font-size:13px; cursor:pointer; line-height:1;
  }
  #${n} .hint { font-size: 11px; color:#6b7280; padding: 6px 12px 10px; background: var(--va-surface); }

  /* Typing indicator bubble (inline in log, after user msg) */
  #${n} .typing { align-self: flex-start; display:flex; align-items:center; gap:6px; padding:8px 12px; margin:2px 0 0 0; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${n} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${n} .typing span:nth-child(2) { animation-delay:.2s; }
  #${n} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }
  `,a=document.createElement("style");a.id=_,a.textContent=r,e.appendChild(a)}function D(t){return t||"vivid_chat_session"}function X(t){try{let e=localStorage.getItem(t);return e?JSON.parse(e):null}catch{return null}}function Z(t,e){try{localStorage.setItem(t,JSON.stringify(e.slice(-50)))}catch{}}function A(t){try{return localStorage.getItem(t)==="1"}catch{return!1}}function K(t){try{localStorage.setItem(t,"1")}catch{}}function j(t={}){let e={title:"Prisma Assistant",welcomeOnce:!0,autoOpenOnce:!0,persist:!0,storageKey:"vivid_chat_session",theme:{primary:"#111",bubbleColor:"#111",surface:"#fff",text:"#111",assistantBubble:"#f6f6f7",userText:"#fff",headerBg:"#000",headerText:"#fff"},...t},i=e.apiBase??"/api/ai",r=e.business??te(),a=e.siteName??(document.title||"Vivid Store"),b=!!e.debug,w={"--va-primary":e.theme?.primary||"#111","--va-surface":e.theme?.surface||"#fff","--va-text":e.theme?.text||"#111","--va-assistant-bubble":e.theme?.assistantBubble||"#f6f6f7","--va-user-text":e.theme?.userText||"#fff","--va-header-bg":e.theme?.headerBg||"#000","--va-header-text":e.theme?.headerText||"#fff","--va-bubble":e.theme?.bubbleColor||e.theme?.primary||"#111"},{shadow:P}=V();U(w);let x=!1,v=document.createElement("div");v.id=n;let g=document.createElement("button");g.className="bubble",g.title="Chat",g.innerHTML=e.iconSVG||ee();let p=document.createElement("div");p.className="panel";let C=document.createElement("header"),$=document.createElement("div");$.className="title",$.textContent=e.title||"Prisma Assistant";let I=document.createElement("div"),y=document.createElement("button");y.ariaLabel="Close",y.innerHTML="\u2715",I.appendChild(y),C.appendChild($),C.appendChild(I);let d=document.createElement("div");d.className="log";let E=document.createElement("footer"),m=document.createElement("textarea");m.placeholder="Ask about products, lead times, shipping, etc.";let u=document.createElement("button");u.className="send",u.textContent="Send",E.appendChild(m),E.appendChild(u);let O=document.createElement("div");O.className="hint",O.textContent="No order/account lookups. For payments or existing orders, contact support.",p.appendChild(C),p.appendChild(d),p.appendChild(E),p.appendChild(O),v.appendChild(g),v.appendChild(p),P.appendChild(v);function k(s){if(x=s,p.classList.toggle("open",x),x&&e.welcomeMessage){let o="vivid_chat_welcome_shown";(!e.welcomeOnce||!A(o))&&(f("assistant",e.welcomeMessage),e.welcomeOnce&&K(o))}}g.addEventListener("click",()=>k(!x)),y.addEventListener("click",()=>k(!1));let L=D(e.storageKey),c=e.persist&&X(L)||[{role:"system",content:ne(a,r)}];if(c.length&&c[0].role==="system")for(let s of c.slice(1))f(s.role,s.content);function S(){e.persist&&Z(L,c)}let l=null;function R(){l||(l=document.createElement("div"),l.className="typing",l.innerHTML="<span></span><span></span><span></span>",d.appendChild(l),d.scrollTop=d.scrollHeight)}function M(){l&&l.parentNode&&l.parentNode.removeChild(l),l=null}async function B(){let s=m.value.trim();if(s){f("user",s),c.push({role:"user",content:s}),S(),m.value="",u.disabled=!0,R();try{let o=await N(i,r,c);M(),u.disabled=!1,c.push({role:"assistant",content:o}),f("assistant",o),S(),F("vivid_chat_message",{role:"assistant"})}catch(o){M(),u.disabled=!1;let h=`Sorry \u2014 I had trouble reaching the assistant. (${o?.message||"Network error"})`;c.push({role:"assistant",content:h}),f("assistant",h),S(),b&&console.error(o)}}}u.addEventListener("click",B),m.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),B())});function f(s,o){let h=document.createElement("div");h.className=`msg ${s}`,h.textContent=o,d.appendChild(h),d.scrollTop=d.scrollHeight}function F(s,o){window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:s,...o,business:r,siteName:a})}if(b&&console.log("Chat widget initialized",{apiBase:i,business:r,siteName:a,options:e}),typeof e.autoOpenDelay=="number"){let s="vivid_chat_auto_open_done";(!e.autoOpenOnce||!A(s))&&setTimeout(()=>{k(!0),e.autoOpenOnce&&K(s)},Math.max(0,e.autoOpenDelay))}window.addEventListener("beforeunload",()=>{try{localStorage.removeItem(D(e.storageKey))}catch{}})}function ee(){return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>'}function te(){let t=location.hostname.toLowerCase();return t.includes("vividnola")?"vividnola":t.includes("toastedyolk")?"toastedyolk":t.includes("celtic")?"celtic":"vivid"}function ne(t,e){return[`You are Prisma storefront assistant for ${t} (business: ${e}).`,"Be helpful, concise, and brand-safe. You cannot access accounts, orders, or payments.","Capabilities: explain products, materials, typical lead times, shipping options, design tips.","Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.","If unsure, offer to escalate to customer service: sales@vividink.com."].join(`
`)}function ae(t){let e=t?.apiBase??"https://assistant.vivid-think.com/api/ai",i=()=>j({...t,apiBase:e});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i,{once:!0}):i()}return Q(se);})();
