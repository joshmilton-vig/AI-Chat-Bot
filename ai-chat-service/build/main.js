"use strict";var VividAssistant=(()=>{var T=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var G=Object.prototype.hasOwnProperty;var W=(e,t)=>{for(var i in t)T(e,i,{get:t[i],enumerable:!0})},J=(e,t,i,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of F(t))!G.call(e,n)&&n!==i&&T(e,n,{get:()=>t[n],enumerable:!(r=R(t,n))||r.enumerable});return e};var Y=e=>J(T({},"__esModule",{value:!0}),e);var ae={};W(ae,{mountVividChat:()=>ne});async function _(e,t,i,r){let n=await fetch(`${e}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({business:t,messages:i}),signal:r});if(!n.ok){let C=await n.text().catch(()=>"");throw new Error(`Chat error ${n.status}: ${C||n.statusText}`)}let b=await n.json();return String(b.message??"Sorry \u2014 I couldn\u2019t get a response.")}var N="vivid-chat-style",a="vivid-chat-widget",z="vivid-chat-host",H=null;function A(){let e=document.getElementById(z);return e||(e=document.createElement("div"),e.id=z,e.style.position="fixed",e.style.right="0",e.style.bottom="0",e.style.zIndex="2147483647",document.body.appendChild(e)),H=e.shadowRoot??e.attachShadow({mode:"open"}),{host:e,shadow:H}}function q(e){let{shadow:t}=A(),i=t.getElementById(N);i&&i.remove();let r=`
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
    padding: 10px 12px; border-bottom: 1px solid #f0f0f0;
    display:flex; align-items:center; justify-content:space-between;
    background: var(--va-header-bg); color: var(--va-header-text);
  }
  #${a} header .brand { font-size: 13px; opacity:.85 }
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

  #${a} .typing { display:flex; align-items:center; gap:6px; padding:8px 12px; margin:6px 10px; background:#f3f4f6; border-radius:16px; width:fit-content; }
  #${a} .typing span { width:8px; height:8px; background:#6b7280; border-radius:50%; display:inline-block; opacity:.4; animation: vivid-blink 1.2s infinite both; }
  #${a} .typing span:nth-child(2) { animation-delay:.2s; }
  #${a} .typing span:nth-child(3) { animation-delay:.4s; }
  @keyframes vivid-blink { 0%{opacity:.4;} 20%{opacity:1;} 100%{opacity:.4;} }
  `,n=document.createElement("style");n.id=N,n.textContent=r,t.appendChild(n)}function Q(e){return e||"vivid_chat_session"}function U(e){try{let t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}function X(e,t){try{localStorage.setItem(e,JSON.stringify(t.slice(-50)))}catch{}}function D(e){try{return localStorage.getItem(e)==="1"}catch{return!1}}function V(e){try{localStorage.setItem(e,"1")}catch{}}function K(e={}){let t={title:"Vivid Assistant",welcomeOnce:!0,autoOpenOnce:!0,persist:!0,storageKey:"vivid_chat_session",theme:{primary:"#111",bubbleColor:"#111",surface:"#fff",text:"#111",assistantBubble:"#f6f6f7",userText:"#fff",headerBg:"#fff",headerText:"#111"},...e},i=t.apiBase??"/api/ai",r=t.business??ee(),n=t.siteName??(document.title||"Vivid Store"),b=!!t.debug,C={"--va-primary":t.theme?.primary||"#111","--va-surface":t.theme?.surface||"#fff","--va-text":t.theme?.text||"#111","--va-assistant-bubble":t.theme?.assistantBubble||"#f6f6f7","--va-user-text":t.theme?.userText||"#fff","--va-header-bg":t.theme?.headerBg||"#fff","--va-header-text":t.theme?.headerText||"#111","--va-bubble":t.theme?.bubbleColor||t.theme?.primary||"#111"},{shadow:j}=A();q(C);let x=!1,v=document.createElement("div");v.id=a;let f=document.createElement("button");f.className="bubble",f.title="Chat",f.innerHTML=t.iconSVG||Z();let l=document.createElement("div");l.className="panel";let y=document.createElement("header"),I=document.createElement("div");I.textContent=t.title||"Vivid Assistant";let $=document.createElement("div");$.className="brand",$.textContent=n;let M=document.createElement("div"),w=document.createElement("button");w.ariaLabel="Close",w.innerHTML="\u2715",M.appendChild(w),y.appendChild(I),y.appendChild($),y.appendChild(M);let u=document.createElement("div");u.className="log";let p=document.createElement("div");p.className="typing",p.style.display="none",p.innerHTML="<span></span><span></span><span></span>",u.appendChild(p);let O=document.createElement("footer"),g=document.createElement("textarea");g.placeholder="Ask about products, lead times, shipping, etc.";let d=document.createElement("button");d.className="send",d.textContent="Send",O.appendChild(g),O.appendChild(d);let E=document.createElement("div");E.className="hint",E.textContent="No order/account lookups. For payments or existing orders, contact support.",l.appendChild(y),l.appendChild(u),l.appendChild(O),l.appendChild(E),v.appendChild(f),v.appendChild(l),j.appendChild(v);function k(s){if(x=s,l.classList.toggle("open",x),x&&t.welcomeMessage){let o="vivid_chat_welcome_shown";(!t.welcomeOnce||!D(o))&&(m("assistant",t.welcomeMessage),t.welcomeOnce&&V(o))}}f.addEventListener("click",()=>k(!x)),w.addEventListener("click",()=>k(!1));let B=Q(t.storageKey),c=t.persist&&U(B)||[{role:"system",content:te(n,r)}];if(c.length&&c[0].role==="system")for(let s of c.slice(1))m(s.role,s.content);function S(){t.persist&&X(B,c)}async function L(){let s=g.value.trim();if(s){m("user",s),c.push({role:"user",content:s}),S(),g.value="",d&&(d.disabled=!0),p.style.display="flex";try{let o=await _(i,r,c);p.style.display="none",d&&(d.disabled=!1),c.push({role:"assistant",content:o}),m("assistant",o),S(),P("vivid_chat_message",{role:"assistant"})}catch(o){p.style.display="none",d&&(d.disabled=!1);let h=`Sorry \u2014 I had trouble reaching the assistant. (${o?.message||"Network error"})`;c.push({role:"assistant",content:h}),m("assistant",h),S(),b&&console.error(o)}}}d.addEventListener("click",L),g.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),L())});function m(s,o){let h=document.createElement("div");h.className=`msg ${s}`,h.textContent=o,u.appendChild(h),u.scrollTop=u.scrollHeight}function P(s,o){window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:s,...o,business:r,siteName:n})}if(b&&console.log("Chat widget initialized",{apiBase:i,business:r,siteName:n,options:t}),typeof t.autoOpenDelay=="number"){let s="vivid_chat_auto_open_done";(!t.autoOpenOnce||!D(s))&&setTimeout(()=>{k(!0),t.autoOpenOnce&&V(s)},Math.max(0,t.autoOpenDelay))}}function Z(){return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm0-4h12v2H6V5zm0 8h8v2H6v-2z"/></svg>'}function ee(){let e=location.hostname.toLowerCase();return e.includes("vividnola")?"vividnola":e.includes("toastedyolk")?"toastedyolk":e.includes("celtic")?"celtic":"vivid"}function te(e,t){return[`You are Prisma storefront assistant for ${e} (business: ${t}).`,"Be helpful, concise, and brand-safe. You cannot access accounts, orders, or payments.","Capabilities: explain products, materials, typical lead times, shipping options, design tips.","Limitations: no PII, no quoting specific prices unless plainly shown on page, no legal/medical advice.","If unsure, offer to escalate to customer service: sales@vividink.com."].join(`
`)}function ne(e){let t=e?.apiBase??"https://assistant.vivid-think.com/api/ai",i=()=>K({...e,apiBase:t});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i,{once:!0}):i()}return Y(ae);})();
