type VerifyDraft = {
  providerKey: string;
  baseUrl: string;
  apiKey?: string;
  auth?: "api-key" | "oauth" | "token" | "aws-sdk";
};

export type ThirdPartyNodeVerifyResult = {
  ok: boolean;
  status: number;
  checkedUrl: string;
  providerKey: string;
  models: Array<{
    id: string;
    name?: string;
    reasoning?: boolean;
    input?: Array<"text" | "image">;
    contextWindow?: number;
    maxTokens?: number;
  }>;
  modelIds: string[];
  message: string;
};

function buildModelsUrl(baseUrl: string): string {
  const url = new URL(baseUrl.trim());
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  url.pathname = normalizedPath.endsWith("/v1")
    ? `${normalizedPath}/models`
    : `${normalizedPath || ""}/v1/models`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function buildHeaders(draft: VerifyDraft): Headers {
  const headers = new Headers({
    Accept: "application/json",
  });
  const apiKey = draft.apiKey?.trim();
  if (apiKey && draft.auth !== "aws-sdk") {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  return headers;
}

function toPositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function toStringArray(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const result = values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return result.length > 0 ? result : undefined;
}

function resolveReasoning(entry: Record<string, unknown>): boolean | undefined {
  if (typeof entry.reasoning === "boolean") {
    return entry.reasoning;
  }
  const capabilities = entry.capabilities;
  if (capabilities && typeof capabilities === "object") {
    const value = (capabilities as Record<string, unknown>).reasoning;
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function resolveInput(entry: Record<string, unknown>): Array<"text" | "image"> | undefined {
  const direct = toStringArray(entry.input);
  if (direct) {
    const filtered = direct.filter((value): value is "text" | "image" => value === "text" || value === "image");
    return filtered.length > 0 ? filtered : undefined;
  }
  const modalities = entry.modalities;
  if (modalities && typeof modalities === "object") {
    const value = toStringArray((modalities as Record<string, unknown>).input);
    if (value) {
      const filtered = value.filter((item): item is "text" | "image" => item === "text" || item === "image");
      return filtered.length > 0 ? filtered : undefined;
    }
  }
  const capabilities = entry.capabilities;
  if (capabilities && typeof capabilities === "object") {
    const image = (capabilities as Record<string, unknown>).image;
    if (typeof image === "boolean") {
      return image ? ["text", "image"] : ["text"];
    }
    const vision = (capabilities as Record<string, unknown>).vision;
    if (typeof vision === "boolean") {
      return vision ? ["text", "image"] : ["text"];
    }
  }
  return undefined;
}

function extractVerifiedModels(payload: unknown): ThirdPartyNodeVerifyResult["models"] {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" && record.id.trim().length > 0 ? record.id : null;
      if (!id) {
        return null;
      }
      const name = typeof record.name === "string" && record.name.trim().length > 0 ? record.name : undefined;
      const contextWindow =
        toPositiveInteger(record.contextWindow) ??
        toPositiveInteger(record.context_window) ??
        toPositiveInteger(record.max_context_tokens);
      const maxTokens =
        toPositiveInteger(record.maxTokens) ??
        toPositiveInteger(record.max_tokens) ??
        toPositiveInteger(record.max_output_tokens) ??
        toPositiveInteger(record.max_completion_tokens);
      return {
        id,
        name,
        reasoning: resolveReasoning(record),
        input: resolveInput(record),
        contextWindow,
        maxTokens,
      };
    })
    .filter(
      (
        model,
      ): model is {
        id: string;
        name?: string;
        reasoning?: boolean;
        input?: Array<"text" | "image">;
        contextWindow?: number;
        maxTokens?: number;
      } => Boolean(model),
    );
}

function resolveMessage(response: Response, payload: unknown, modelIds: string[]): string {
  if (response.ok) {
    return modelIds.length > 0
      ? `Connection OK: discovered ${modelIds.length} model(s).`
      : "Connection OK: provider responded, but no models were listed.";
  }
  const errorMessage =
    (payload as { error?: { message?: unknown } })?.error?.message ??
    (payload as { message?: unknown })?.message;
  if (typeof errorMessage === "string" && errorMessage.trim()) {
    return errorMessage.trim();
  }
  return `Connection failed with HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}.`;
}

export async function verifyThirdPartyNodeConnection(
  draft: VerifyDraft,
): Promise<ThirdPartyNodeVerifyResult> {
  const checkedUrl = buildModelsUrl(draft.baseUrl);
  try {
    const response = await fetch(checkedUrl, {
      method: "GET",
      headers: buildHeaders(draft),
    });
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const models = extractVerifiedModels(payload);
    const modelIds = models.map((entry) => entry.id);
    return {
      ok: response.ok,
      status: response.status,
      checkedUrl,
      providerKey: draft.providerKey,
      models,
      modelIds,
      message: resolveMessage(response, payload, modelIds),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      checkedUrl,
      providerKey: draft.providerKey,
      models: [],
      modelIds: [],
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
