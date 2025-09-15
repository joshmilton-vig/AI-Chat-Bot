[README.md](https://github.com/user-attachments/files/22350622/README.md)
# Frontend Chat Widget (Optional)

This is a framework-free TypeScript chat bubble you can copy into your storefront bundle.

**How to use in your storefront repo:**
1. Copy `src/chat/` into your storefront `src/`.
2. Add `src/index.ts`'s `mountVividChat()` call into your storefront boot file (or import and call it).
3. Ensure your Nginx proxies `/api/ai/` to the ai-chat-service.
