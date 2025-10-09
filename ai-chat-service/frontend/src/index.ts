import { initChatWidget } from "./chat/chatWidget";
import type { InitChatOptions } from "./chat/types";

export function mountVividChat(opts?: InitChatOptions) {
  const apiBase = opts?.apiBase ?? "https://assistant.vivid-think.com/api/ai";
  const run = () => initChatWidget({ ...opts, apiBase });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run(); // DOM is already loaded
  }
}
