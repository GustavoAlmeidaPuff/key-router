import { insertOpenRouterKeySimple } from "@/lib/firestore-data";

export interface CreateKeyOptions {
  name: string;
  limit?: number;
}

interface OpenRouterCreateKeyResponse {
  data?: { key: string; id: string };
  key?: string;
  id?: string;
}

export async function createOpenRouterKey(
  masterKey: string,
  options: CreateKeyOptions,
): Promise<{ key: string; id: string }> {
  const response = await fetch("https://openrouter.ai/api/v1/keys", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${masterKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: options.name,
      limit: options.limit ?? 0,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao criar key no OpenRouter: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as OpenRouterCreateKeyResponse;
  const key = payload.data?.key ?? payload.key;
  const id = payload.data?.id ?? payload.id ?? crypto.randomUUID();

  if (!key) throw new Error("OpenRouter não retornou a key criada.");

  await insertOpenRouterKeySimple({ name: options.name, key });

  return { key, id };
}
