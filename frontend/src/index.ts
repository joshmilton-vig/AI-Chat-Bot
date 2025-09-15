import { initChatWidget } from "./chat/chatWidget";

export function mountVividChat() {
  document.addEventListener("DOMContentLoaded", () => {
    initChatWidget({ apiBase: "/api/ai", debug: false });
  });
}
