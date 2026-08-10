// Azure OpenAI Service — deployment-based Chat Completions endpoint.
// The model is fixed by the deployment (AZURE_OPENAI_DEPLOYMENT), not the
// request body, unlike OpenAI's direct API.
const API_VERSION = "2024-10-21";

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string | ChatContentPart[];
};

/** A data: URI (base64-inlined image) — used for vision calls. */
export function imageDataUri(base64: string, contentType: string): string {
  return `data:${contentType};base64,${base64}`;
}

function buildUrl(): string {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!endpoint || !deployment) {
    throw new Error("AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_DEPLOYMENT is not configured");
  }
  const base = endpoint.replace(/\/$/, "");
  return `${base}/openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;
}

function requireApiKey(): string {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AZURE_OPENAI_API_KEY is not configured");
  }
  return apiKey;
}

export async function askOpenAI(params: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = requireApiKey();

  const response = await fetch(buildUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      max_tokens: params.maxTokens ?? 300,
      messages: [{ role: "system", content: params.system }, ...params.messages],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("Unexpected Azure OpenAI response shape");
  }
  return text;
}

/**
 * Forces schema-constrained JSON output via Azure OpenAI Structured Outputs
 * (strict json_schema mode). If the model refuses (safety refusal), that's
 * surfaced as an explicit `refusal` result rather than thrown as a generic
 * error, so callers can show a retry state instead of treating it as a
 * transient failure.
 */
export async function askOpenAIStructured<T>(params: {
  system: string;
  messages: ChatMessage[];
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<{ result: T } | { refusal: string }> {
  const apiKey = requireApiKey();

  const response = await fetch(buildUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      max_tokens: params.maxTokens ?? 4000,
      messages: [{ role: "system", content: params.system }, ...params.messages],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.toolName,
          description: params.toolDescription,
          schema: params.inputSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;

  if (message?.refusal) {
    return { refusal: message.refusal as string };
  }

  if (typeof message?.content !== "string") {
    return { refusal: "Model did not return the requested structured output." };
  }

  return { result: JSON.parse(message.content) as T };
}
