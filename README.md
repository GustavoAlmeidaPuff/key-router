# OpenRouter Key Rotator

Proxy OpenAI-compatível com múltiplas keys do OpenRouter, rotação automática em rate limit e dashboard de gerenciamento.

## Instalação

1. Copie `.env.example` para `.env`.
2. Instale dependências com `npm install`.
3. Rode setup inicial com `npx tsx scripts/setup.ts`.
4. Inicie com `npm run dev`.

## Uso com qualquer cliente OpenAI-compatível

```env
OPENAI_BASE_URL=http://localhost:3000/v1
OPENAI_API_KEY=sk-proxy-xxxx
```

## Uso no Claude Code (Claudio)

- Configure `OPENAI_BASE_URL=http://localhost:3000/v1`
- Configure `OPENAI_API_KEY=sk-proxy-xxxx`
- Escolha um modelo do OpenRouter em `model` (ex: `meta-llama/llama-3.1-8b-instruct:free`)

## Rotas principais

- `POST /v1/chat/completions`
- `GET /v1/models?free=true`
- `GET/POST /api/internal/openrouter-keys`
- `POST /api/internal/openrouter-keys/create`
- `PATCH/DELETE /api/internal/openrouter-keys/:id`
- `POST /api/internal/openrouter-keys/:id/test`
- `GET/POST /api/internal/proxy-keys`
- `DELETE /api/internal/proxy-keys/:id`
