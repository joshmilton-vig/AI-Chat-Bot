"use strict";var VividAssistant=(()=>{var I=Object.defineProperty;var Y=Object.getOwnPropertyDescriptor;var J=Object.getOwnPropertyNames;var q=Object.prototype.hasOwnProperty;var Q=(t,e)=>{for(var o in e)I(t,o,{get:e[o],enumerable:!0})},U=(t,e,o,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of J(e))!q.call(t,s)&&s!==o&&I(t,s,{get:()=>e[s],enumerable:!(r=Y(e,s))||r.enumerable});return t};var X=t=>U(I({},"__esModule",{value:!0}),t);var ie={};Q(ie,{mountVividChat:()=>oe});async function H(t,e,o,r){let s=await fetch(`${t}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({business:e,messages:o}),signal:r});if(!s.ok){let w=await s.text().catch(()=>"");throw new Error(`Chat error ${s.status}: ${w||s.statusText}`)}let b=await s.json();return String(b.message??"Sorry \u2014 I couldn\u2019t get a response.")}var z="vivid-chat-style",a="vivid-chat-widget",D="vivid-chat-host",K=null;function V(){let t=document.getElementById(D);return t||(t=document.createElement("div"),t.id=D,t.style.position="fixed",t.style.right="0",t.style.bottom="0",t.style.zIndex="2147483647",document.body.appendChild(t)),K=t.shadowRoot??t.attachShadow({mode:"open"}),{host:t,shadow:K}}function Z(t){let{shadow:e}=V(),o=e.getElementById(z);o&&o.remove();let r=`
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

  #${a} { position: fixed; z-index: 2147483647; right: 20px; bottom: 20px; }
  #${a} .bubble {
    width: 56px; height: 56px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    background: var(--va-bubble); color:#fff;
  }

  #${a} .panel {
    position: absolute; right: 0; bottom: 72px; width: 340px; max-height: 70vh;
    background: var(--va-surface); color: var(--va-text);
    border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.25);
    display:none; flex-direction:column; overflow:hidden; border:1px solid #e5e7eb;
  }
  #${a} .panel.open { display:flex; }

  #${a} header {
    padding: 10px 12px; border-bottom: 1px solid #0b0b0b;
    display:flex; align-items:center; justify-content:space-between;
    background: var(--va-header-bg); color: var(--va-header-text);
  }
  #${a} header .title { font-weight: 700; }
  #${a} header button { all: unset; cursor:pointer; padding: 6px 8px; border-radius: 8px; color: inherit; }

  #${a} .log { padding: 10px 12px; display:flex; gap:8px; flex-direction:column; overflow:auto; background: var(--va-surface); }

  #${a} .msg { font-size: 13px; line-height: 1.35; padding: 8px 10px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  #${a} .msg.user { align-self: flex-end; background: var(--va-primary); color: var(--va-user-text); border-top-right-radius: 4px; }
  #${a} .msg.assistant { align-self: flex-start; background: var(--va-assistant-bubble); color: var(--va-text); border-top-left-radius: 4px; }

  #${a} footer { border-top: 1px solid #f0f0f0; padding: 8px; display:flex; gap:6px; background: var(--va-surface); }
  #${a} textarea {
    -webkit-appearance:none; appearance:none; resize:none; flex:1; min-height:40px; max-height:140px;
    border:1px solid #ddd; border-radius:10px; padding:8px 10px; font-size:13px; background:#fff; color:#111; outline:none; box-shadow:none;
  }
  #${a} .send {
    all: unset; display:inline-flex; align-items:center; justify-content:center; background: var(--va-primary); color:#fff;
    border-radius:10px; padding: 8px 12px; font-size:13px; cursor:pointer; line-height:1;
  }
  #${a} .hint { font-size: 11px; color:#6b7280; padding: 6px 12px 10px; background: var(--va-surface); }

  /* Typing indicator bubble (inline in log, after user msg) */
  #${a} .typing { align-self: flex-start; display:flex; align-items:center; gap:6px; padding:8px 12px; margin:2px 0 0 0; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${a} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${a} .typing span:nth-child(2) { animation-delay:.2s; }
  #${a} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }
  `,s=document.createElement("style");s.id=z,s.textContent=r,e.appendChild(s)}function _(t){return t||"vivid_chat_session"}function ee(t){try{let e=localStorage.getItem(t);return e?JSON.parse(e):null}catch{return null}}function te(t,e){try{localStorage.setItem(t,JSON.stringify(e.slice(-50)))}catch{}}function A(t){try{return localStorage.getItem(t)==="1"}catch{return!1}}function P(t){try{localStorage.setItem(t,"1")}catch{}}function j(t={}){let e={title:"Prisma Assistant",welcomeOnce:!0,autoOpenOnce:!0,persist:!0,storageKey:"vivid_chat_session",theme:{primary:"#111",bubbleColor:"#111",surface:"#fff",text:"#111",assistantBubble:"#f6f6f7",userText:"#fff",headerBg:"#000",headerText:"#fff"},...t},o=e.apiBase??"/api/ai",r=e.business??ae(),s=e.siteName??(document.title||"Vivid Store"),b=!!e.debug,w={"--va-primary":e.theme?.primary||"#111","--va-surface":e.theme?.surface||"#fff","--va-text":e.theme?.text||"#111","--va-assistant-bubble":e.theme?.assistantBubble||"#f6f6f7","--va-user-text":e.theme?.userText||"#fff","--va-header-bg":e.theme?.headerBg||"#000","--va-header-text":e.theme?.headerText||"#fff","--va-bubble":e.theme?.bubbleColor||e.theme?.primary||"#111"},{shadow:F}=V();Z(w);let v=!1,x=document.createElement("div");x.id=a;let g=document.createElement("button");g.className="bubble",g.title="Chat",g.innerHTML=e.iconSVG||ne();let u=document.createElement("div");u.className="panel";let C=document.createElement("header"),E=document.createElement("div");E.className="title",E.textContent=e.title||"Prisma Assistant";let L=document.createElement("div"),y=document.createElement("button");y.ariaLabel="Close",y.innerHTML="\u2715",L.appendChild(y),C.appendChild(E),C.appendChild(L);let l=document.createElement("div");l.className="log";let S=document.createElement("footer"),m=document.createElement("textarea");m.placeholder="Ask about products, lead times, shipping, etc.";let h=document.createElement("button");h.className="send",h.textContent="Send",S.appendChild(m),S.appendChild(h);let O=document.createElement("div");O.className="hint",O.textContent="No order/account lookups. For payments or existing orders, contact support.",u.appendChild(C),u.appendChild(l),u.appendChild(S),u.appendChild(O),x.appendChild(g),x.appendChild(u),F.appendChild(x);function $(n){if(v=n,u.classList.toggle("open",v),v&&e.welcomeMessage){let i="vivid_chat_welcome_shown";(!e.welcomeOnce||!A(i))&&(f("assistant",e.welcomeMessage),e.welcomeOnce&&P(i))}}g.addEventListener("click",()=>$(!v)),y.addEventListener("click",()=>$(!1));let M=_(e.storageKey),p=e.persist&&ee(M)||[{role:"system",content:se(s,r)}];if(p.length&&p[0].role==="system")for(let n of p.slice(1))f(n.role,n.content);function k(){e.persist&&te(M,p)}let d=null;function G(){d||(d=document.createElement("div"),d.className="typing",d.innerHTML="<span></span><span></span><span></span>",l.appendChild(d),l.scrollTop=l.scrollHeight)}function N(){d&&d.parentNode&&d.parentNode.removeChild(d),d=null}async function B(){let n=m.value.trim();if(n){f("user",n),p.push({role:"user",content:n}),k(),m.value="",h.disabled=!0,G();try{let i=await H(o,r,p);N(),h.disabled=!1,p.push({role:"assistant",content:i}),f("assistant",i),k(),R("vivid_chat_message",{role:"assistant"})}catch(i){N(),h.disabled=!1;let c=`Sorry \u2014 I had trouble reaching the assistant. (${i?.message||"Network error"})`;p.push({role:"assistant",content:c}),f("assistant",c),k(),b&&console.error(i)}}}h.addEventListener("click",B),m.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),B())});function f(n,i){let c=document.createElement("div");c.className=`msg ${n}`,c.textContent=i,l.appendChild(c),l.scrollTop=l.scrollHeight}function R(n,i){window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:n,...i,business:r,siteName:s})}if(b&&console.log("Chat widget initialized",{apiBase:o,business:r,siteName:s,options:e}),typeof e.autoOpenDelay=="number"){let n="vivid_chat_auto_open_done";(!e.autoOpenOnce||!A(n))&&setTimeout(()=>{$(!0),e.autoOpenOnce&&P(n)},Math.max(0,e.autoOpenDelay))}try{let c=function(){return performance.getEntriesByType("navigation")[0]?.type};var re=c;let n=_(e.storageKey),i="vivid_chat_active_session";sessionStorage.setItem(i,"1"),window.addEventListener("pagehide",W=>{let T=c();T==="reload"||T==="back_forward"||T!=="navigate"&&(sessionStorage.removeItem(i),localStorage.removeItem(n))})}catch(n){e.debug&&console.warn("Session cleanup logic failed:",n)}window.addEventListener("beforeunload",()=>{try{localStorage.removeItem(_(e.storageKey))}catch{}})}function ne(){return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>'}function ae(){let t=location.hostname.toLowerCase();return t.includes("vividnola")?"vividnola":t.includes("toastedyolk")?"toastedyolk":t.includes("celtic")?"celtic":"vivid"}function se(t,e){return[`You are Prisma storefront assistant for ${t} (business: ${e}).`,"Be helpful, concise, and brand-safe. You cannot access accounts, orders, or payments.","Capabilities: explain products, materials, typical lead times, shipping options, design tips.","Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.","If unsure, offer to escalate to customer service: sales@vividink.com."].join(`
`)}function oe(t){let e=t?.apiBase??"https://assistant.vivid-think.com/api/ai",o=()=>j({...t,apiBase:e});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o,{once:!0}):o()}return X(ie);})();
