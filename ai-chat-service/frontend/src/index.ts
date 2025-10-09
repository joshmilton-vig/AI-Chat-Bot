import { initChatWidget } from "./chat/chatWidget";
import type { InitChatOptions } from "./chat/types";

export function mountVividChat(opts?: InitChatOptions) {
  document.addEventListener("DOMContentLoaded", () => {
    const apiBase = opts?.apiBase ?? "https://assistant.vivid-think.com/api/ai";
    initChatWidget({ ...opts, apiBase });
  });
}
