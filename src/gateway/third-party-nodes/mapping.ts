import type { ModelDefinitionConfig, ModelProviderConfig, OpenClawConfig } from "../../config/config.js";

export type ThirdPartyNodeDraft = {
  providerKey: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
  auth?: ModelProviderConfig["auth"];
  api?: ModelProviderConfig["api"];
  modelId: string;
  modelName?: string;
  enabled: boolean;
  headers?: Record<string, string>;
  reasoning?: boolean;
  supportsImageInput?: boolean;
  contextWindow?: number;
  maxTokens?: number;
};

export type ThirdPartyNodeStatusEntry = {
  providerKey: string;
  label: string;
  baseUrl: string;
  auth?: ModelProviderConfig["auth"];
  api?: ModelProviderConfig["api"];
  modelId?: string;
  modelName?: string;
  enabled: boolean;
  hasApiKey: boolean;
  headerNames: string[];
};

function cleanString(value: string | undefined, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeProviderKey(value: string): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildModelDefinition(draft: ThirdPartyNodeDraft): ModelDefinitionConfig {
  const modelName = cleanString(draft.modelName) || cleanString(draft.label) || draft.modelId;
  return {
    id: cleanString(draft.modelId),
    name: modelName,
    api: draft.api,
    reasoning: draft.reasoning ?? true,
    input: draft.supportsImageInput === false ? ["text"] : ["text", "image"],
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
    contextWindow: draft.contextWindow ?? 128000,
    maxTokens: draft.maxTokens ?? 32768,
  };
}

export function toProviderConfig(draft: ThirdPartyNodeDraft): ModelProviderConfig {
  const provider: ModelProviderConfig = {
    baseUrl: cleanString(draft.baseUrl),
    auth: draft.auth ?? "api-key",
    api: draft.api ?? "openai-responses",
    models: [buildModelDefinition(draft)],
  };
  const apiKey = cleanString(draft.apiKey);
  if (apiKey) {
    provider.apiKey = apiKey;
  }
  if (draft.headers && Object.keys(draft.headers).length > 0) {
    provider.headers = { ...draft.headers };
  }
  return provider;
}

export function listThirdPartyNodeStatusEntries(config: OpenClawConfig): ThirdPartyNodeStatusEntry[] {
  const providers = config.models?.providers;
  if (!providers) {
    return [];
  }
  const entries: ThirdPartyNodeStatusEntry[] = [];
  for (const [providerKey, provider] of Object.entries(providers)) {
    if (!provider || typeof provider !== "object") {
      continue;
    }
    const baseUrl = cleanString(provider.baseUrl);
    if (!baseUrl) {
      continue;
    }
    const firstModel = Array.isArray(provider.models) ? provider.models[0] : undefined;
    const label =
      cleanString(firstModel?.name) || cleanString(firstModel?.id) || cleanString(providerKey);
    entries.push({
      providerKey,
      label,
      baseUrl,
      auth: provider.auth,
      api: provider.api,
      modelId: cleanString(firstModel?.id) || undefined,
      modelName: cleanString(firstModel?.name) || undefined,
      enabled: true,
      hasApiKey: Boolean(cleanString(typeof provider.apiKey === "string" ? provider.apiKey : undefined)),
      headerNames: provider.headers ? Object.keys(provider.headers).sort() : [],
    });
  }
  return entries.sort((a, b) => a.providerKey.localeCompare(b.providerKey));
}

export function applyThirdPartyNodeDraftToConfig(
  config: OpenClawConfig,
  draft: ThirdPartyNodeDraft,
): OpenClawConfig {
  const providerKey = normalizeProviderKey(draft.providerKey);
  if (!providerKey) {
    throw new Error("providerKey is required");
  }
  const nextModels = { ...(config.models ?? {}) };
  const nextProviders = { ...(nextModels.providers ?? {}) };
  if (draft.enabled) {
    nextProviders[providerKey] = toProviderConfig({
      ...draft,
      providerKey,
    });
  } else {
    delete nextProviders[providerKey];
  }
  nextModels.providers = nextProviders;
  return {
    ...config,
    models: nextModels,
  };
}
