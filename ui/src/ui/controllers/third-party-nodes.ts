import type {
  ThirdPartyNodesApplyConfirm,
  ThirdPartyNodeVerifiedModel,
  ThirdPartyNodeStatusEntry,
  ThirdPartyNodeTemplate,
  ThirdPartyNodesCatalogResult,
  ThirdPartyNodesStatusResult,
  ThirdPartyNodesVerifyResult,
} from "../types.ts";
import type { GatewayBrowserClient } from "../gateway.ts";
import { t } from "../../i18n/index.ts";

export type ThirdPartyNodeFormState = {
  providerKey: string;
  label: string;
  baseUrl: string;
  apiKey: string;
  auth: "api-key" | "oauth" | "token";
  api:
    | "openai-completions"
    | "openai-responses"
    | "openai-codex-responses"
    | "anthropic-messages"
    | "google-generative-ai"
    | "github-copilot"
    | "bedrock-converse-stream"
    | "ollama";
  modelId: string;
  modelName: string;
  enabled: boolean;
  reasoning: boolean;
  supportsImageInput: boolean;
  contextWindow: number;
  maxTokens: number;
};

export type ThirdPartyNodesState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  lastError: string | null;
  thirdPartyNodesLastErrorReason: "template" | "verify" | "apply" | null;
  thirdPartyNodesLoading: boolean;
  thirdPartyNodesSaving: boolean;
  thirdPartyNodesVerifying: boolean;
  thirdPartyNodesDirty: boolean;
  thirdPartyNodesTemplates: ThirdPartyNodeTemplate[];
  thirdPartyNodesEntries: ThirdPartyNodeStatusEntry[];
  thirdPartyNodesBaseHash: string | null;
  thirdPartyNodesSelectedTemplateId: string | null;
  thirdPartyNodesForm: ThirdPartyNodeFormState | null;
  thirdPartyNodesVerifyResult: ThirdPartyNodesVerifyResult | null;
  thirdPartyNodesApplyConfirm: ThirdPartyNodesApplyConfirm | null;
  thirdPartyNodesRecentModels: Record<string, string>;
};

function resolveRecentModelId(state: ThirdPartyNodesState, providerKey: string): string | null {
  const recent = state.thirdPartyNodesRecentModels[providerKey]?.trim();
  return recent || null;
}

function cloneTemplateForm(
  template: ThirdPartyNodeTemplate,
  recentModelId: string | null = null,
): ThirdPartyNodeFormState {
  const modelId = recentModelId ?? template.defaultModel.id;
  const modelName = recentModelId && recentModelId !== template.defaultModel.id
    ? recentModelId
    : template.defaultModel.name;
  return {
    providerKey: template.providerKeyDefault,
    label: template.defaultModel.name,
    baseUrl: template.baseUrlPresets[0]?.url ?? "",
    apiKey: "",
    auth: template.defaultAuth,
    api: template.defaultApi,
    modelId,
    modelName,
    enabled: true,
    reasoning: template.defaultModel.reasoning,
    supportsImageInput: template.defaultModel.input.includes("image"),
    contextWindow: template.defaultModel.contextWindow,
    maxTokens: template.defaultModel.maxTokens,
  };
}

function buildFormFromEntry(entry: ThirdPartyNodeStatusEntry): ThirdPartyNodeFormState {
  return {
    providerKey: entry.providerKey,
    label: entry.label,
    baseUrl: entry.baseUrl,
    apiKey: "",
    auth: entry.auth === "token" || entry.auth === "oauth" ? entry.auth : "api-key",
    api: entry.api ?? "openai-responses",
    modelId: entry.modelId ?? "",
    modelName: entry.modelName ?? entry.label,
    enabled: entry.enabled,
    reasoning: true,
    supportsImageInput: true,
    contextWindow: 128000,
    maxTokens: 32768,
  };
}

function inferTemplateId(
  templates: ThirdPartyNodeTemplate[],
  entries: ThirdPartyNodeStatusEntry[],
  selectedTemplateId: string | null,
): string | null {
  if (selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)) {
    return selectedTemplateId;
  }
  const firstEntry = entries[0];
  if (firstEntry) {
    const matched = templates.find(
      (template) =>
        template.providerKeyDefault === firstEntry.providerKey ||
        firstEntry.providerKey.startsWith(template.providerKeyDefault),
    );
    if (matched) {
      return matched.id;
    }
  }
  return templates[0]?.id ?? null;
}

function syncFormState(state: ThirdPartyNodesState) {
  const selectedTemplateId = inferTemplateId(
    state.thirdPartyNodesTemplates,
    state.thirdPartyNodesEntries,
    state.thirdPartyNodesSelectedTemplateId,
  );
  state.thirdPartyNodesSelectedTemplateId = selectedTemplateId;
  if (state.thirdPartyNodesDirty) {
    return;
  }
  const firstEntry = state.thirdPartyNodesEntries[0];
  if (firstEntry) {
    if (firstEntry.providerKey && firstEntry.modelId) {
      state.thirdPartyNodesRecentModels = {
        ...state.thirdPartyNodesRecentModels,
        [firstEntry.providerKey]: firstEntry.modelId,
      };
    }
    state.thirdPartyNodesForm = buildFormFromEntry(firstEntry);
    return;
  }
  const template = state.thirdPartyNodesTemplates.find((entry) => entry.id === selectedTemplateId);
  state.thirdPartyNodesForm = template
    ? cloneTemplateForm(template, resolveRecentModelId(state, template.providerKeyDefault))
    : null;
}

function getSelectedTemplate(state: ThirdPartyNodesState): ThirdPartyNodeTemplate | null {
  const selectedTemplateId = inferTemplateId(
    state.thirdPartyNodesTemplates,
    state.thirdPartyNodesEntries,
    state.thirdPartyNodesSelectedTemplateId,
  );
  return state.thirdPartyNodesTemplates.find((entry) => entry.id === selectedTemplateId) ?? null;
}

function getVerifiedModel(state: ThirdPartyNodesState, modelId: string): ThirdPartyNodeVerifiedModel | null {
  const models = state.thirdPartyNodesVerifyResult?.models ?? [];
  return models.find((entry) => entry.id === modelId) ?? null;
}

function isVerificationInvalidatingField(key: keyof ThirdPartyNodeFormState): boolean {
  return key === "providerKey" || key === "baseUrl" || key === "apiKey" || key === "auth" || key === "api";
}

export async function loadThirdPartyNodesCatalog(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected) {
    return;
  }
  const res = await state.client.request<ThirdPartyNodesCatalogResult>("thirdPartyNodes.catalog", {});
  state.thirdPartyNodesTemplates = Array.isArray(res.templates) ? res.templates : [];
}

export async function loadThirdPartyNodesStatus(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected) {
    return;
  }
  const res = await state.client.request<ThirdPartyNodesStatusResult>("thirdPartyNodes.status", {});
  state.thirdPartyNodesEntries = Array.isArray(res.entries) ? res.entries : [];
  state.thirdPartyNodesBaseHash = typeof res.baseHash === "string" ? res.baseHash : null;
}

export async function loadThirdPartyNodes(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected) {
    return;
  }
  state.thirdPartyNodesLoading = true;
  state.lastError = null;
  state.thirdPartyNodesLastErrorReason = null;
  try {
    await Promise.all([loadThirdPartyNodesCatalog(state), loadThirdPartyNodesStatus(state)]);
    syncFormState(state);
    state.thirdPartyNodesVerifyResult = null;
    state.thirdPartyNodesApplyConfirm = null;
  } catch (err) {
    state.lastError = String(err);
    state.thirdPartyNodesLastErrorReason = "template";
  } finally {
    state.thirdPartyNodesLoading = false;
  }
}

export function selectThirdPartyNodeTemplate(state: ThirdPartyNodesState, templateId: string) {
  state.thirdPartyNodesSelectedTemplateId = templateId;
  const template = state.thirdPartyNodesTemplates.find((entry) => entry.id === templateId);
  if (!template) {
    return;
  }
  state.thirdPartyNodesForm = cloneTemplateForm(
    template,
    resolveRecentModelId(state, template.providerKeyDefault),
  );
  state.thirdPartyNodesDirty = false;
  state.thirdPartyNodesVerifyResult = null;
  state.thirdPartyNodesApplyConfirm = null;
}

export function editThirdPartyNodesFormField<K extends keyof ThirdPartyNodeFormState>(
  state: ThirdPartyNodesState,
  key: K,
  value: ThirdPartyNodeFormState[K],
) {
  if (!state.thirdPartyNodesForm) {
    return;
  }
  const nextForm: ThirdPartyNodeFormState = {
    ...state.thirdPartyNodesForm,
    [key]: value,
  };
  if (key === "modelId" && typeof value === "string") {
    const nextModelId = value.trim();
    const verifiedModelIds = state.thirdPartyNodesVerifyResult?.modelIds ?? [];
    const currentModelName = state.thirdPartyNodesForm.modelName.trim();
    const previousModelId = state.thirdPartyNodesForm.modelId.trim();
    const selectedTemplate = getSelectedTemplate(state);
    const verifiedModel = getVerifiedModel(state, nextModelId);
    const shouldSyncModelName =
      verifiedModelIds.includes(nextModelId) &&
      (!currentModelName || currentModelName === previousModelId || currentModelName === previousModelId.trim());
    if (shouldSyncModelName) {
      nextForm.modelName = verifiedModel?.name?.trim() || nextModelId;
    }
    if (verifiedModelIds.includes(nextModelId)) {
      nextForm.reasoning = verifiedModel?.reasoning ?? selectedTemplate?.defaultModel.reasoning ?? nextForm.reasoning;
      nextForm.supportsImageInput =
        verifiedModel?.input?.includes("image") ??
        selectedTemplate?.defaultModel.input.includes("image") ??
        nextForm.supportsImageInput;
      nextForm.contextWindow =
        verifiedModel?.contextWindow ?? selectedTemplate?.defaultModel.contextWindow ?? nextForm.contextWindow;
      nextForm.maxTokens =
        verifiedModel?.maxTokens ?? selectedTemplate?.defaultModel.maxTokens ?? nextForm.maxTokens;
    }
    const providerKey = nextForm.providerKey.trim();
    if (providerKey && nextModelId) {
      state.thirdPartyNodesRecentModels = {
        ...state.thirdPartyNodesRecentModels,
        [providerKey]: nextModelId,
      };
    }
  }
  state.thirdPartyNodesForm = nextForm;
  state.thirdPartyNodesDirty = true;
  if (isVerificationInvalidatingField(key)) {
    state.thirdPartyNodesVerifyResult = null;
    state.thirdPartyNodesApplyConfirm = null;
  }
}

export function applyThirdPartyNodeTemplateDefaults(state: ThirdPartyNodesState) {
  if (!state.thirdPartyNodesForm) {
    return;
  }
  const selectedTemplate = getSelectedTemplate(state);
  if (!selectedTemplate) {
    return;
  }
  state.thirdPartyNodesForm = {
    ...state.thirdPartyNodesForm,
    reasoning: selectedTemplate.defaultModel.reasoning,
    supportsImageInput: selectedTemplate.defaultModel.input.includes("image"),
    contextWindow: selectedTemplate.defaultModel.contextWindow,
    maxTokens: selectedTemplate.defaultModel.maxTokens,
  };
  state.thirdPartyNodesDirty = true;
}

export function resetThirdPartyNodeFormField(
  state: ThirdPartyNodesState,
  key:
    | "modelId"
    | "modelName"
    | "reasoning"
    | "supportsImageInput"
    | "contextWindow"
    | "maxTokens",
) {
  if (!state.thirdPartyNodesForm) {
    return;
  }
  const selectedTemplate = getSelectedTemplate(state);
  const recentModelId = state.thirdPartyNodesRecentModels[state.thirdPartyNodesForm.providerKey] ?? null;
  const selectedVerifiedModel =
    getVerifiedModel(state, state.thirdPartyNodesForm.modelId.trim()) ??
    (recentModelId ? getVerifiedModel(state, recentModelId) : null);

  if (key === "modelId") {
    const nextModelId = recentModelId?.trim() || selectedTemplate?.defaultModel.id;
    if (nextModelId) {
      editThirdPartyNodesFormField(state, "modelId", nextModelId);
    }
    return;
  }

  if (key === "modelName") {
    const nextModelName =
      selectedVerifiedModel?.name?.trim() ||
      (selectedTemplate?.defaultModel.id === state.thirdPartyNodesForm.modelId
        ? selectedTemplate.defaultModel.name
        : state.thirdPartyNodesForm.modelId.trim());
    if (nextModelName) {
      editThirdPartyNodesFormField(state, "modelName", nextModelName);
    }
    return;
  }

  if (key === "reasoning") {
    editThirdPartyNodesFormField(
      state,
      "reasoning",
      selectedVerifiedModel?.reasoning ?? selectedTemplate?.defaultModel.reasoning ?? false,
    );
    return;
  }

  if (key === "supportsImageInput") {
    editThirdPartyNodesFormField(
      state,
      "supportsImageInput",
      selectedVerifiedModel?.input?.includes("image") ??
        selectedTemplate?.defaultModel.input.includes("image") ??
        false,
    );
    return;
  }

  if (key === "contextWindow") {
    editThirdPartyNodesFormField(
      state,
      "contextWindow",
      selectedVerifiedModel?.contextWindow ?? selectedTemplate?.defaultModel.contextWindow ?? 0,
    );
    return;
  }

  editThirdPartyNodesFormField(
    state,
    "maxTokens",
    selectedVerifiedModel?.maxTokens ?? selectedTemplate?.defaultModel.maxTokens ?? 0,
  );
}

function buildApplyConfirmation(state: ThirdPartyNodesState) {
  const result = state.thirdPartyNodesVerifyResult;
  if (result?.ok) {
    return null;
  }
  if (!result) {
    return {
      title: t("thirdPartyNodes.applyConfirm.untestedTitle"),
      message: t("thirdPartyNodes.applyConfirm.untestedMessage"),
      detail: t("thirdPartyNodes.applyConfirm.untestedDetail"),
      severity: "warning",
      statusLabel: t("thirdPartyNodes.applyConfirm.untestedStatus"),
      recommendation: t("thirdPartyNodes.applyConfirm.untestedRecommendation"),
    };
  }
  return {
    title: t("thirdPartyNodes.applyConfirm.failedTitle"),
    message: t("thirdPartyNodes.applyConfirm.failedMessage", { status: String(result.status) }),
    detail: result.message,
    severity: "danger",
    statusLabel: `HTTP ${result.status}`,
    recommendation: t("thirdPartyNodes.applyConfirm.failedRecommendation"),
  };
}

function scrollThirdPartyNodesVerifyResultIntoView() {
  requestAnimationFrame(() => {
    const resultPanel = document.querySelector<HTMLElement>("[data-third-party-verify-result='true']");
    if (resultPanel && typeof resultPanel.scrollIntoView === "function") {
      resultPanel.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}

async function executeApplyThirdPartyNodes(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected || !state.thirdPartyNodesForm) {
    return;
  }
  state.thirdPartyNodesApplyConfirm = null;
  state.thirdPartyNodesSaving = true;
  state.lastError = null;
  state.thirdPartyNodesLastErrorReason = null;
  try {
    await state.client.request("thirdPartyNodes.apply", {
      baseHash: state.thirdPartyNodesBaseHash ?? undefined,
      entry: {
        ...state.thirdPartyNodesForm,
        apiKey: state.thirdPartyNodesForm.apiKey.trim() || undefined,
      },
    });
    state.thirdPartyNodesDirty = false;
    await loadThirdPartyNodesStatus(state);
    syncFormState(state);
  } catch (err) {
    state.lastError = String(err);
    state.thirdPartyNodesLastErrorReason = "apply";
  } finally {
    state.thirdPartyNodesSaving = false;
  }
}

export async function applyThirdPartyNodes(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected || !state.thirdPartyNodesForm) {
    return;
  }
  const confirmation = buildApplyConfirmation(state);
  if (confirmation) {
    state.thirdPartyNodesApplyConfirm = confirmation;
    return;
  }
  await executeApplyThirdPartyNodes(state);
}

export function cancelThirdPartyNodesApplyConfirm(state: ThirdPartyNodesState) {
  state.thirdPartyNodesApplyConfirm = null;
}

export async function confirmThirdPartyNodesApply(state: ThirdPartyNodesState) {
  await executeApplyThirdPartyNodes(state);
}

export async function verifyThirdPartyNodes(state: ThirdPartyNodesState) {
  if (!state.client || !state.connected || !state.thirdPartyNodesForm) {
    return;
  }
  state.thirdPartyNodesVerifying = true;
  state.lastError = null;
  state.thirdPartyNodesLastErrorReason = null;
  state.thirdPartyNodesVerifyResult = null;
  try {
    state.thirdPartyNodesVerifyResult =
      await state.client.request<ThirdPartyNodesVerifyResult>("thirdPartyNodes.verify", {
        entry: {
          ...state.thirdPartyNodesForm,
          apiKey: state.thirdPartyNodesForm.apiKey.trim() || undefined,
        },
      });
    if (state.thirdPartyNodesVerifyResult.ok) {
      state.thirdPartyNodesApplyConfirm = null;
      scrollThirdPartyNodesVerifyResultIntoView();
    }
  } catch (err) {
    state.lastError = String(err);
    state.thirdPartyNodesLastErrorReason = "verify";
  } finally {
    state.thirdPartyNodesVerifying = false;
  }
}
