# OpenRouter Key Router — Plano de Construção

## Visão Geral

Um proxy OpenAI-compatível que gerencia múltiplas API keys do OpenRouter, rotacionando automaticamente quando rate limits são atingidos. Expõe uma API própria (com suas próprias keys) que qualquer produto pode usar no lugar da OpenAI API.

```
Produto (ex: Claudio) ──► Proxy (sua API key) ──► OpenRouter (key rotativa) ──► Modelo
```

---

## Arquitetura

### Componentes

| Componente | Tech | Responsabilidade |
|---|---|---|
| **Proxy Server** | Next.js API Routes | Recebe requisições OpenAI-format, rotaciona keys, faz forward |
| **Frontend** | Next.js App Router | Dashboard: gerenciar keys, testar modelos |
| **Banco de dados** | SQLite (Prisma) | Keys do OpenRouter, keys do proxy, status de rate limit |
| **Key Rotator** | Módulo Node.js | Lógica de troca de key ao detectar 429 |

### Fluxo de uma requisição

```
1. Cliente envia POST /v1/chat/completions com { Authorization: Bearer <proxy-key> }
2. Proxy autentica a proxy-key no banco
3. Proxy escolhe a OpenRouter key ativa (não em rate limit)
4. Proxy faz forward para https://openrouter.ai/api/v1/chat/completions
5. Se resposta = 429 → marca key como em rate limit → troca key → retry
6. Retorna resposta ao cliente (streaming ou não)
```

---

## Fases e Tarefas

---

### FASE 1 — Setup do Projeto

#### Tarefa 1.1 — Scaffold do projeto Next.js
- Criar projeto com `npx create-next-app@latest` (App Router, TypeScript, Tailwind)
- Configurar estrutura de pastas:
  ```
  /app                  → frontend pages
  /app/api              → proxy API routes
  /lib                  → módulos compartilhados
  /prisma               → schema do banco
  ```
- Instalar dependências: `prisma`, `@prisma/client`, `zod`, `nanoid`

#### Tarefa 1.2 — Setup do banco de dados (Prisma + SQLite)
- Criar `prisma/schema.prisma` com os modelos:

```prisma
model ProxyKey {
  id          String   @id @default(cuid())
  name        String
  key         String   @unique   // "sk-proxy-xxxx"
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?
}

model OpenRouterKey {
  id              String    @id @default(cuid())
  name            String
  key             String    @unique   // "sk-or-xxxx"
  rateLimitedUntil DateTime? // null = disponível
  createdAt       DateTime  @default(now())
  lastUsedAt      DateTime?
  requestCount    Int       @default(0)
  isActive        Boolean   @default(true)
}
```

- Rodar `prisma migrate dev`
- Gerar `prisma generate`

---

### FASE 2 — Motor de Rotação de Keys (Key Rotator)

#### Tarefa 2.1 — Módulo `lib/keyRotator.ts`

Responsável por:
- `getAvailableKey()` — retorna a OpenRouter key disponível (não em rate limit)
- `markAsRateLimited(keyId, retryAfterSeconds?)` — marca key como indisponível
- Lógica de seleção: pegar a key com `rateLimitedUntil = null` ou `rateLimitedUntil < now()`
- Round-robin entre keys disponíveis para distribuir carga

```typescript
// Interface esperada
export async function getAvailableKey(): Promise<OpenRouterKey | null>
export async function markAsRateLimited(keyId: string, retryAfterSeconds?: number): Promise<void>
export async function releaseExpiredRateLimits(): Promise<void>
```

#### Tarefa 2.2 — Detecção de rate limit do OpenRouter

OpenRouter retorna 429 com headers:
- `X-RateLimit-Remaining`
- `Retry-After` (segundos até resetar)

Criar `lib/rateLimitDetector.ts`:
- Função `isRateLimitError(response: Response): boolean`
- Função `extractRetryAfter(response: Response): number | null`
- Também detectar rate limit no corpo JSON: `{ error: { code: 429 } }`

---

### FASE 3 — Proxy OpenAI-Compatível

#### Tarefa 3.1 — Autenticação das proxy keys

Criar `lib/proxyAuth.ts`:
- `validateProxyKey(key: string): Promise<boolean>` — busca no banco
- `generateProxyKey(): string` — gera `sk-proxy-` + nanoid(32)
- Middleware que lê `Authorization: Bearer <key>` e valida

#### Tarefa 3.2 — Rota principal do proxy: `/api/v1/chat/completions`

Arquivo: `app/api/v1/chat/completions/route.ts`

Fluxo:
```
1. Ler Authorization header → validar proxy key
2. Ler body (model, messages, stream, etc.)
3. getAvailableKey()
4. Fazer fetch para OpenRouter com a key
5. Se 429 → markAsRateLimited() → retry com próxima key (máx 3 tentativas)
6. Se streaming → pipe a resposta de volta com ReadableStream
7. Se não streaming → retornar JSON
```

Headers a enviar pro OpenRouter:
```
Authorization: Bearer <openrouter-key>
HTTP-Referer: https://github.com/seu-projeto  (exigido pelo OpenRouter)
X-Title: OpenRouter Key Router
Content-Type: application/json
```

#### Tarefa 3.3 — Suporte a streaming (SSE)

OpenRouter suporta streaming igual à OpenAI (Server-Sent Events).
- Detectar `stream: true` no body
- Usar `TransformStream` para fazer pipe do response
- Propagar `data: [DONE]` corretamente
- Manter headers corretos: `Content-Type: text/event-stream`

#### Tarefa 3.4 — Rota de listagem de modelos: `/api/v1/models`

OpenRouter expõe `/api/v1/models` com todos os modelos disponíveis.
- Fazer proxy dessa rota também
- Cache de 5 minutos pra não desperdiçar requests
- Filtrar só modelos gratuitos quando solicitado

---

### FASE 4 — Criação Automática de Keys no OpenRouter

> OpenRouter permite criar keys via API: `POST https://openrouter.ai/api/v1/keys`

#### Tarefa 4.1 — Módulo `lib/openrouterKeyCreator.ts`

```typescript
interface CreateKeyOptions {
  name: string
  limit?: number // crédito máximo em USD (0 = sem limite)
}

export async function createOpenRouterKey(
  masterKey: string, // key pessoal com permissão de criar keys
  options: CreateKeyOptions
): Promise<{ key: string; id: string }>
```

- Usar a "master key" configurada em variável de ambiente: `OPENROUTER_MASTER_KEY`
- Salvar a nova key no banco automaticamente após criar

#### Tarefa 4.2 — Rota de API interna: `POST /api/internal/openrouter-keys/create`

- Protegida por autenticação de sessão do dashboard
- Chama `createOpenRouterKey()` e salva no banco
- Retorna a key criada (mostrar só uma vez!)

---

### FASE 5 — API de Gerenciamento Interno

Rotas protegidas usadas pelo frontend (Next.js Server Actions ou API Routes).

#### Tarefa 5.1 — CRUD de OpenRouter Keys

```
GET    /api/internal/openrouter-keys          → listar todas (sem mostrar a key completa)
POST   /api/internal/openrouter-keys          → adicionar key manualmente
POST   /api/internal/openrouter-keys/create   → criar nova via OpenRouter API
DELETE /api/internal/openrouter-keys/:id      → remover
PATCH  /api/internal/openrouter-keys/:id      → editar nome, ativar/desativar
```

#### Tarefa 5.2 — CRUD de Proxy Keys

```
GET    /api/internal/proxy-keys          → listar
POST   /api/internal/proxy-keys          → criar nova (gera sk-proxy-xxx)
DELETE /api/internal/proxy-keys/:id      → revogar
```

#### Tarefa 5.3 — Rota de teste de key

```
POST /api/internal/openrouter-keys/:id/test
```
- Faz uma requisição simples ao OpenRouter com a key informada
- Modelo gratuito: `meta-llama/llama-3.1-8b-instruct:free`
- Prompt: "Say 'OK' and nothing else."
- Retorna `{ success: true, latencyMs: number }` ou `{ success: false, error: string }`

---

### FASE 6 — Frontend (Next.js Dashboard)

#### Tarefa 6.1 — Layout e navegação

- Sidebar com: Dashboard, OpenRouter Keys, Proxy Keys
- Design simples com Tailwind + shadcn/ui
- Sem autenticação por enquanto (roda local) — pode adicionar depois com senha simples em env

#### Tarefa 6.2 — Página: OpenRouter Keys (`/dashboard/openrouter-keys`)

Funcionalidades:
- **Tabela** com: nome, últimos 4 chars da key, status (disponível / rate limited até X), requests feitos, ações
- **Botão "Adicionar Key"** → modal com campo de texto para colar a key + nome
- **Botão "Criar nova key no OpenRouter"** → modal que chama a API de criação automática
  - Campo: nome da key
  - Campo: limite de crédito (opcional)
  - Mostra a key gerada uma única vez com botão de copiar
- **Botão "Testar"** por key → mostra resultado do teste (latência ou erro)
- **Toggle ativo/inativo** por key
- Badge de status: verde (disponível), amarelo (rate limited, mostra tempo restante), cinza (inativa)

#### Tarefa 6.3 — Página: Proxy Keys (`/dashboard/proxy-keys`)

Funcionalidades:
- **Tabela** com: nome, key (mascarada), data de criação, último uso
- **Botão "Criar nova Proxy Key"** → modal com campo nome → gera e mostra a key UMA VEZ com botão copiar
- **Botão "Revogar"** por key
- Instruções de uso abaixo da tabela:
  ```
  Base URL: http://localhost:3000/v1
  API Key: sk-proxy-xxxx
  Qualquer produto que aceita OpenAI API funciona aqui.
  ```

#### Tarefa 6.4 — Página: Dashboard (`/dashboard`)

- Card: total de OpenRouter keys / quantas disponíveis agora
- Card: total de requisições hoje
- Card: keys em rate limit (com tempo de reset)
- Chat de teste rápido:
  - Dropdown para escolher modelo (lista de gratuitos do OpenRouter)
  - Campo de mensagem
  - Resposta em streaming
  - Usa o próprio proxy internamente

---

### FASE 7 — Configuração e Deploy

#### Tarefa 7.1 — Variáveis de ambiente

Criar `.env.example`:
```env
# Key pessoal do OpenRouter com permissão de criar sub-keys
# Crie em https://openrouter.ai/settings/keys
OPENROUTER_MASTER_KEY=sk-or-v1-xxxx

# Referrer enviado nas requisições ao OpenRouter (obrigatório)
OPENROUTER_HTTP_REFERER=http://localhost:3000

# Senha para acessar o dashboard (opcional, deixar vazio = sem senha)
DASHBOARD_PASSWORD=

# URL pública do proxy (usada nas instruções do dashboard)
NEXT_PUBLIC_PROXY_URL=http://localhost:3000
```

#### Tarefa 7.2 — Script de setup inicial

`scripts/setup.ts` (rodar com `npx tsx scripts/setup.ts`):
- Roda migrations do Prisma
- Gera uma proxy key inicial e printa no terminal
- Valida variáveis de ambiente necessárias

#### Tarefa 7.3 — Docker Compose (opcional mas recomendado)

`docker-compose.yml`:
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # SQLite persiste aqui
    env_file:
      - .env
```

`Dockerfile`:
- Multi-stage build (builder + runner)
- Next.js standalone output

#### Tarefa 7.4 — README.md

- Como instalar e rodar localmente
- Como configurar no Claudio / qualquer produto OpenAI-compatível:
  ```
  OPENAI_BASE_URL=http://localhost:3000/v1
  OPENAI_API_KEY=sk-proxy-xxxx
  ```
- Como configurar no Claude Code (Claudio):
  - Setar `OPENAI_BASE_URL` e `OPENAI_API_KEY` nas configs
  - Escolher um modelo do OpenRouter no campo de modelo

---

## Ordem de Implementação Recomendada

```
Fase 1 → Fase 2 → Fase 3 (sem streaming) → Fase 5 → Fase 6.2 + 6.3 → Fase 3 (streaming) → Fase 4 → Fase 6.1 + 6.4 → Fase 7
```

Dá pra testar o proxy com curl antes de qualquer frontend existir:
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-proxy-xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "messages": [{ "role": "user", "content": "oi" }]
  }'
```

---

## Notas Técnicas

### Rate limits do OpenRouter (modelos gratuitos)
- Geralmente: 20 requests/minuto ou 200 requests/dia por key
- Header de reset: `X-RateLimit-Reset` (Unix timestamp)
- Corpo do erro 429: `{ "error": { "message": "...", "code": 429 } }`

### Compatibilidade com Claudio (Claude Code)
O Claudio usa o `openaiShim.ts` para providers OpenAI-compatíveis. Para apontar pro proxy:
- Setar `OPENAI_BASE_URL=http://localhost:3000/v1`
- Setar `OPENAI_API_KEY=sk-proxy-xxxx`
- O campo `model` no Claudio passa direto pro OpenRouter (ex: `google/gemini-flash-1.5:free`)

### Criação de keys no OpenRouter
A API de criação de keys requer uma key "provisionada" (conta com créditos ou plano pago).
Keys gratuitas podem não ter permissão de criar sub-keys — documentar isso claramente.

---

## Tarefas Rápidas para Subagents

| ID | Tarefa | Dependências | Complexidade |
|---|---|---|---|
| T1.1 | Scaffold Next.js + estrutura de pastas | — | Baixa |
| T1.2 | Schema Prisma + migrations | T1.1 | Baixa |
| T2.1 | `lib/keyRotator.ts` | T1.2 | Média |
| T2.2 | `lib/rateLimitDetector.ts` | — | Baixa |
| T3.1 | `lib/proxyAuth.ts` + middleware | T1.2 | Baixa |
| T3.2 | Rota `/api/v1/chat/completions` (sem streaming) | T2.1, T2.2, T3.1 | Alta |
| T3.3 | Adicionar streaming à rota do proxy | T3.2 | Média |
| T3.4 | Rota `/api/v1/models` com cache | T3.1 | Baixa |
| T4.1 | `lib/openrouterKeyCreator.ts` | T1.2 | Média |
| T4.2 | Rota `POST /api/internal/.../create` | T4.1 | Baixa |
| T5.1 | CRUD API de OpenRouter Keys | T1.2 | Média |
| T5.2 | CRUD API de Proxy Keys | T1.2 | Baixa |
| T5.3 | Rota de teste de key | T5.1 | Baixa |
| T6.1 | Layout + navegação do dashboard | T1.1 | Baixa |
| T6.2 | Página OpenRouter Keys | T5.1, T5.3, T6.1 | Alta |
| T6.3 | Página Proxy Keys | T5.2, T6.1 | Média |
| T6.4 | Dashboard + chat de teste | T3.2, T6.1 | Alta |
| T7.1 | `.env.example` + documentação de envs | — | Baixa |
| T7.2 | Script de setup inicial | T1.2 | Baixa |
| T7.3 | Dockerfile + docker-compose | T7.1 | Média |
| T7.4 | README.md | Tudo | Baixa |
