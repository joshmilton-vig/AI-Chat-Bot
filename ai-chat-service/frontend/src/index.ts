import { initChatWidget } from "./chat/chatWidget";
import type { InitChatOptions } from "./chat/types";

export function mountVividChat(opts?: InitChatOptions) {
  const apiBase = opts?.apiBase ?? "https://assistant.vivid-think.com/api/ai";
  const run = () => initChatWidget({ ...opts, apiBase });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    // DOM is already ready (e.g., when called from console or after page load)
    run();
  }
}
