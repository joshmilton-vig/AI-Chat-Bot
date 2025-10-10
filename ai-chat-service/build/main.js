"use strict";var VividAssistant=(()=>{var T=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var W=Object.getOwnPropertyNames;var Y=Object.prototype.hasOwnProperty;var J=(e,t)=>{for(var i in t)T(e,i,{get:t[i],enumerable:!0})},q=(e,t,i,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of W(t))!Y.call(e,a)&&a!==i&&T(e,a,{get:()=>t[a],enumerable:!(r=R(t,a))||r.enumerable});return e};var Q=e=>q(T({},"__esModule",{value:!0}),e);var ie={};J(ie,{mountVividChat:()=>se});async function N(e,t,i,r){let a=await fetch(`${e}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({business:t,messages:i}),signal:r});if(!a.ok){let g=await a.text().catch(()=>"");throw new Error(`Chat error ${a.status}: ${g||a.statusText}`)}let x=await a.json();return String(x.message??"Sorry \u2014 I couldn\u2019t get a response.")}var B="vivid-chat-style",n="vivid-chat-widget",H="vivid-chat-host";var z=null;function K(){let e=document.getElementById(H);return e||(e=document.createElement("div"),e.id=H,e.style.position="fixed",e.style.right="0",e.style.bottom="0",e.style.zIndex="2147483647",document.body.appendChild(e)),z=e.shadowRoot??e.attachShadow({mode:"open"}),{host:e,shadow:z}}function U(e){let{shadow:t}=K(),i=t.getElementById(B);i&&i.remove();let r=`
  :host, :host * { box-sizing: border-box; }
  :host * { font-family: Verdana, Arial, sans-serif; }

  :host {
    --va-primary: ${e["--va-primary"]};
    --va-surface: ${e["--va-surface"]};
    --va-text: ${e["--va-text"]};
    --va-assistant-bubble: ${e["--va-assistant-bubble"]};
    --va-user-text: ${e["--va-user-text"]};
    --va-header-bg: ${e["--va-header-bg"]};
    --va-header-text: ${e["--va-header-text"]};
    --va-bubble: ${e["--va-bubble"]};
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
  `,a=document.createElement("style");a.id=B,a.textContent=r,t.appendChild(a)}function X(e){return e||"vivid_chat_session"}function Z(e){try{let t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}function ee(e,t){try{localStorage.setItem(e,JSON.stringify(t.slice(-50)))}catch{}}function A(e){try{return localStorage.getItem(e)==="1"}catch{return!1}}function D(e){try{localStorage.setItem(e,"1")}catch{}}function V(e={}){let t={title:"Prisma Assistant",welcomeOnce:!0,autoOpenOnce:!0,persist:!0,storageKey:"vivid_chat_session",theme:{primary:"#111",bubbleColor:"#111",surface:"#fff",text:"#111",assistantBubble:"#f6f6f7",userText:"#fff",headerBg:"#000",headerText:"#fff"},...e},i=t.apiBase??"/api/ai",r=t.business??ne(),a=t.siteName??(document.title||"Vivid Store"),x=!!t.debug,g=X(t.storageKey),I="vivid_chat_active_session";sessionStorage.getItem(I)||localStorage.removeItem(g),sessionStorage.setItem(I,"1");let j={"--va-primary":t.theme?.primary||"#111","--va-surface":t.theme?.surface||"#fff","--va-text":t.theme?.text||"#111","--va-assistant-bubble":t.theme?.assistantBubble||"#f6f6f7","--va-user-text":t.theme?.userText||"#fff","--va-header-bg":t.theme?.headerBg||"#000","--va-header-text":t.theme?.headerText||"#fff","--va-bubble":t.theme?.bubbleColor||t.theme?.primary||"#111"},{shadow:P}=K();U(j);let v=!1,y=document.createElement("div");y.id=n;let m=document.createElement("button");m.className="bubble",m.title="Chat",m.innerHTML=t.iconSVG||te();let p=document.createElement("div");p.className="panel";let C=document.createElement("header"),S=document.createElement("div");S.className="title",S.textContent=t.title||"Prisma Assistant";let _=document.createElement("div"),w=document.createElement("button");w.ariaLabel="Close",w.innerHTML="\u2715",_.appendChild(w),C.appendChild(S),C.appendChild(_);let c=document.createElement("div");c.className="log";let E=document.createElement("footer"),f=document.createElement("textarea");f.placeholder="Ask about products, lead times, shipping, etc.";let u=document.createElement("button");u.className="send",u.textContent="Send",E.appendChild(f),E.appendChild(u);let O=document.createElement("div");O.className="hint",O.textContent="No order/account lookups. For payments or existing orders, contact support.",p.appendChild(C),p.appendChild(c),p.appendChild(E),p.appendChild(O),y.appendChild(m),y.appendChild(p),P.appendChild(y);function $(s){if(v=s,p.classList.toggle("open",v),v&&t.welcomeMessage){let o="vivid_chat_welcome_shown";(!t.welcomeOnce||!A(o))&&(b("assistant",t.welcomeMessage),t.welcomeOnce&&D(o))}}m.addEventListener("click",()=>$(!v)),w.addEventListener("click",()=>$(!1));let d=t.persist&&Z(g)||[{role:"system",content:ae(a,r)}];if(d.length&&d[0].role==="system")for(let s of d.slice(1))b(s.role,s.content);function k(){t.persist&&ee(g,d)}let l=null;function F(){l||(l=document.createElement("div"),l.className="typing",l.innerHTML="<span></span><span></span><span></span>",c.appendChild(l),c.scrollTop=c.scrollHeight)}function L(){l&&l.parentNode&&l.parentNode.removeChild(l),l=null}async function M(){let s=f.value.trim();if(s){b("user",s),d.push({role:"user",content:s}),k(),f.value="",u.disabled=!0,F();try{let o=await N(i,r,d);L(),u.disabled=!1,d.push({role:"assistant",content:o}),b("assistant",o),k(),G("vivid_chat_message",{role:"assistant"})}catch(o){L(),u.disabled=!1;let h=`Sorry \u2014 I had trouble reaching the assistant. (${o?.message||"Network error"})`;d.push({role:"assistant",content:h}),b("assistant",h),k(),x&&console.error(o)}}}u.addEventListener("click",M),f.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),M())});function b(s,o){let h=document.createElement("div");h.className=`msg ${s}`,h.textContent=o,c.appendChild(h),c.scrollTop=c.scrollHeight}function G(s,o){window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:s,...o,business:r,siteName:a})}if(x&&console.log("Chat widget initialized",{apiBase:i,business:r,siteName:a,options:t}),typeof t.autoOpenDelay=="number"){let s="vivid_chat_auto_open_done";(!t.autoOpenOnce||!A(s))&&setTimeout(()=>{$(!0),t.autoOpenOnce&&D(s)},Math.max(0,t.autoOpenDelay))}}function te(){return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>'}function ne(){let e=location.hostname.toLowerCase();return e.includes("vividnola")?"vividnola":e.includes("toastedyolk")?"toastedyolk":e.includes("celtic")?"celtic":"vivid"}function ae(e,t){return[`You are Prisma storefront assistant for ${e} (business: ${t}).`,"Be helpful, concise, and brand-safe. You cannot access accounts, orders, or payments.","Capabilities: explain products, materials, typical lead times, shipping options, design tips.","Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.","If unsure, offer to escalate to customer service: sales@vividink.com."].join(`
`)}function se(e){let t=e?.apiBase??"https://assistant.vivid-think.com/api/ai",i=()=>V({...e,apiBase:t});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i,{once:!0}):i()}return Q(ie);})();
