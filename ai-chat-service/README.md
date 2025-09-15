# Vivid AI Chat Service

A minimal, production-ready Node/Express proxy for your storefront AI assistant.
Keeps keys server-side, adds CORS allowlist, simple rate-limiting, and brand context.

## Quick Start

```bash
# 1) Install
npm ci

# 2) Configure
cp .env.example .env
# edit .env and set OPENAI_API_KEY and ALLOWED_ORIGINS

# 3) Run in dev
npm run dev

# Health check
curl -s http://127.0.0.1:${PORT:-8089}/healthz
```

## Build & Run (prod)

```bash
npm run build
NODE_ENV=production node dist/server.js
```

## Deploy with systemd

See `deploy/ai-chat-service.service` and adjust paths/users.
```bash
sudo cp deploy/ai-chat-service.service /etc/systemd/system/ai-chat-service.service
sudo systemctl daemon-reload
sudo systemctl enable --now ai-chat-service
```

## Nginx reverse proxy

Add this to your site config and reload nginx:
```
location /api/ai/ {
  proxy_pass http://127.0.0.1:8089/api/ai/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 60s;
}
```

## Endpoints

- `POST /api/ai/chat` — body:
```jsonc
{
  "business": "vividnola",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "Hello!" }
  ]
}
```
Returns: `{ "message": "..." }`

- `GET /healthz` — returns `{ "ok": true }`

## Frontend widget

If you want a lightweight chat bubble for your storefront bundles, see `frontend/` in this repo.
Copy `frontend/src/chat` into your storefront repo and call `mountVividChat()` from your `src/index.ts`.

## Notes

- Rate limit: 40 req/min per IP (tweak in `src/server.ts`).
- CORS: set `ALLOWED_ORIGINS` in `.env` (supports wildcards).
- Brand context: extend `getBrandContext()` in `src/server.ts` or switch to RAG later.
