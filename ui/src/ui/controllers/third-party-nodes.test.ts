// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { t } from "../../i18n/index.ts";
import {
  applyThirdPartyNodes,
  applyThirdPartyNodeTemplateDefaults,
  cancelThirdPartyNodesApplyConfirm,
  confirmThirdPartyNodesApply,
  editThirdPartyNodesFormField,
  loadThirdPartyNodes,
  resetThirdPartyNodeFormField,
  selectThirdPartyNodeTemplate,
  verifyThirdPartyNodes,
  type ThirdPartyNodesState,
} from "./third-party-nodes.ts";

const UNTESTED_CONFIRM = {
  title: t("thirdPartyNodes.applyConfirm.untestedTitle"),
  message: t("thirdPartyNodes.applyConfirm.untestedMessage"),
  detail: t("thirdPartyNodes.applyConfirm.untestedDetail"),
  statusLabel: t("thirdPartyNodes.applyConfirm.untestedStatus"),
  recommendation: t("thirdPartyNodes.applyConfirm.untestedRecommendation"),
};

function createFailedConfirm(status: number) {
  return {
    title: t("thirdPartyNodes.applyConfirm.failedTitle"),
    message: t("thirdPartyNodes.applyConfirm.failedMessage", { status: String(status) }),
    statusLabel: `HTTP ${status}`,
    recommendation: t("thirdPartyNodes.applyConfirm.failedRecommendation"),
  };
}

function createState(): ThirdPartyNodesState {
  return {
    client: null,
    connected: false,
    lastError: null,
    thirdPartyNodesLastErrorReason: null,
    thirdPartyNodesLoading: false,
    thirdPartyNodesSaving: false,
    thirdPartyNodesVerifying: false,
    thirdPartyNodesDirty: false,
    thirdPartyNodesTemplates: [],
    thirdPartyNodesEntries: [],
    thirdPartyNodesBaseHash: null,
    thirdPartyNodesSelectedTemplateId: null,
    thirdPartyNodesForm: null,
    thirdPartyNodesVerifyResult: null,
    thirdPartyNodesApplyConfirm: null,
    thirdPartyNodesRecentModels: {},
  };
}

describe("third-party node controller", () => {
  it("loads catalog and status into state", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.catalog") {
        return {
          templates: [
            {
              id: "yunyi",
              label: "Yunyi",
              description: "Yunyi node",
              providerKeyDefault: "yunyi-codex",
              authOptions: ["api-key"],
              defaultAuth: "api-key",
              defaultApi: "openai-responses",
              baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
              defaultModel: {
                id: "yunyi-codex/gpt-5.2",
                name: "Yunyi GPT-5.2",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 32768,
              },
            },
          ],
        };
      }
      return {
        baseHash: "hash-1",
        entries: [],
      };
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;

    await loadThirdPartyNodes(state);

    expect(state.thirdPartyNodesTemplates).toHaveLength(1);
    expect(state.thirdPartyNodesBaseHash).toBe("hash-1");
    expect(state.thirdPartyNodesForm?.providerKey).toBe("yunyi-codex");
  });

  it("keeps a readable catalog failure message for the frontend", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.catalog") {
        throw new Error(
          'Third-party node template "yunyi" is invalid: adapter "Provider web login" must declare url.',
        );
      }
      return {
        baseHash: "hash-1",
        entries: [],
      };
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;

    await loadThirdPartyNodes(state);

    expect(state.lastError).toContain('Third-party node template "yunyi" is invalid');
    expect(state.lastError).toContain('adapter "Provider web login" must declare url');
    expect(state.thirdPartyNodesLastErrorReason).toBe("template");
    expect(state.thirdPartyNodesLoading).toBe(false);
  });

  it("switches templates and marks edits dirty", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];

    selectThirdPartyNodeTemplate(state, "yunyi");
    editThirdPartyNodesFormField(state, "baseUrl", "https://yunyi.cfd");

    expect(state.thirdPartyNodesSelectedTemplateId).toBe("yunyi");
    expect(state.thirdPartyNodesForm?.baseUrl).toBe("https://yunyi.cfd");
    expect(state.thirdPartyNodesDirty).toBe(true);
  });

  it("restores the recent model when selecting a template", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesRecentModels = {
      "yunyi-codex": "yunyi-codex/gpt-5.2-mini",
    };

    selectThirdPartyNodeTemplate(state, "yunyi");

    expect(state.thirdPartyNodesForm?.modelId).toBe("yunyi-codex/gpt-5.2-mini");
    expect(state.thirdPartyNodesForm?.modelName).toBe("yunyi-codex/gpt-5.2-mini");
  });

  it("syncs model name when selecting a verified model id", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesSelectedTemplateId = "yunyi";
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "",
      modelName: "",
      enabled: true,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 4096,
      maxTokens: 2048,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "modelId", "yunyi-codex/gpt-5.2");

    expect(state.thirdPartyNodesForm?.modelId).toBe("yunyi-codex/gpt-5.2");
    expect(state.thirdPartyNodesForm?.modelName).toBe("Yunyi GPT-5.2");
    expect(state.thirdPartyNodesForm?.reasoning).toBe(true);
    expect(state.thirdPartyNodesForm?.supportsImageInput).toBe(true);
    expect(state.thirdPartyNodesForm?.contextWindow).toBe(128000);
    expect(state.thirdPartyNodesForm?.maxTokens).toBe(32768);
    expect(state.thirdPartyNodesVerifyResult).not.toBeNull();
  });

  it("does not overwrite a custom model name when selecting a verified model id", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesSelectedTemplateId = "yunyi";
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "old-model",
      modelName: "Custom Friendly Name",
      enabled: true,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 4096,
      maxTokens: 2048,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "modelId", "yunyi-codex/gpt-5.2");

    expect(state.thirdPartyNodesForm?.modelId).toBe("yunyi-codex/gpt-5.2");
    expect(state.thirdPartyNodesForm?.modelName).toBe("Custom Friendly Name");
    expect(state.thirdPartyNodesForm?.reasoning).toBe(true);
    expect(state.thirdPartyNodesForm?.supportsImageInput).toBe(true);
    expect(state.thirdPartyNodesForm?.contextWindow).toBe(128000);
    expect(state.thirdPartyNodesForm?.maxTokens).toBe(32768);
    expect(state.thirdPartyNodesVerifyResult).not.toBeNull();
  });

  it("records the recent model by provider when model id changes", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };

    editThirdPartyNodesFormField(state, "modelId", "yunyi-codex/gpt-5.2-mini");

    expect(state.thirdPartyNodesRecentModels).toEqual({
      "yunyi-codex": "yunyi-codex/gpt-5.2-mini",
    });
  });

  it("restores capability fields from the selected template defaults", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesSelectedTemplateId = "yunyi";
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 64000,
      maxTokens: 16000,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2", reasoning: false }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    applyThirdPartyNodeTemplateDefaults(state);

    expect(state.thirdPartyNodesForm?.reasoning).toBe(true);
    expect(state.thirdPartyNodesForm?.supportsImageInput).toBe(true);
    expect(state.thirdPartyNodesForm?.contextWindow).toBe(128000);
    expect(state.thirdPartyNodesForm?.maxTokens).toBe(32768);
    expect(state.thirdPartyNodesDirty).toBe(true);
    expect(state.thirdPartyNodesVerifyResult).not.toBeNull();
  });

  it("resets a single manual field back to the best available source", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesSelectedTemplateId = "yunyi";
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 64000,
      maxTokens: 16000,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    resetThirdPartyNodeFormField(state, "reasoning");
    resetThirdPartyNodeFormField(state, "supportsImageInput");
    resetThirdPartyNodeFormField(state, "contextWindow");
    resetThirdPartyNodeFormField(state, "maxTokens");

    expect(state.thirdPartyNodesForm?.reasoning).toBe(true);
    expect(state.thirdPartyNodesForm?.supportsImageInput).toBe(true);
    expect(state.thirdPartyNodesForm?.contextWindow).toBe(128000);
    expect(state.thirdPartyNodesForm?.maxTokens).toBe(32768);
  });

  it("resets model id back to the recent verified model when available", () => {
    const state = createState();
    state.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["api-key"],
        defaultAuth: "api-key",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      },
    ];
    state.thirdPartyNodesSelectedTemplateId = "yunyi";
    state.thirdPartyNodesRecentModels = {
      "yunyi-codex": "yunyi-codex/gpt-5.2-mini",
    };
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "custom-model",
      modelName: "custom-model",
      enabled: true,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 64000,
      maxTokens: 16000,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
          reasoning: false,
          input: ["text"],
          contextWindow: 64000,
          maxTokens: 16000,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK",
    };

    resetThirdPartyNodeFormField(state, "modelId");

    expect(state.thirdPartyNodesForm?.modelId).toBe("yunyi-codex/gpt-5.2-mini");
    expect(state.thirdPartyNodesForm?.modelName).toBe("Yunyi GPT-5.2 Mini");
    expect(state.thirdPartyNodesForm?.reasoning).toBe(false);
    expect(state.thirdPartyNodesForm?.supportsImageInput).toBe(false);
    expect(state.thirdPartyNodesForm?.contextWindow).toBe(64000);
    expect(state.thirdPartyNodesForm?.maxTokens).toBe(16000);
  });

  it("applies the form and refreshes status", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.apply") {
        return { ok: true };
      }
      if (method === "thirdPartyNodes.status") {
        return {
          baseHash: "hash-2",
          entries: [
            {
              providerKey: "yunyi-codex",
              label: "Yunyi GPT-5.2",
              baseUrl: "https://yunyi.rdzhvip.com",
              auth: "api-key",
              api: "openai-responses",
              modelId: "yunyi-codex/gpt-5.2",
              modelName: "Yunyi GPT-5.2",
              enabled: true,
              hasApiKey: true,
              headerNames: [],
            },
          ],
        };
      }
      return { templates: [] };
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesBaseHash = "hash-1";
    state.thirdPartyNodesDirty = true;
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };

    await applyThirdPartyNodes(state);

    expect(request).not.toHaveBeenCalled();
    expect(state.thirdPartyNodesApplyConfirm).toEqual({
      ...UNTESTED_CONFIRM,
      severity: "warning",
    });
  });

  it("verifies the current form and stores the response", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.verify") {
        return {
          ok: true,
          status: 200,
          checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
          providerKey: "yunyi-codex",
          models: [
            {
              id: "yunyi-codex/gpt-5.2",
              name: "Yunyi GPT-5.2",
              reasoning: true,
              input: ["text", "image"],
              contextWindow: 128000,
              maxTokens: 32768,
            },
          ],
          modelIds: ["yunyi-codex/gpt-5.2"],
          message: "Connection OK: discovered 1 model(s).",
        };
      }
      throw new Error(`unexpected method ${method}`);
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };

    await verifyThirdPartyNodes(state);

    expect(request).toHaveBeenCalledWith("thirdPartyNodes.verify", {
      entry: expect.objectContaining({
        providerKey: "yunyi-codex",
        baseUrl: "https://yunyi.rdzhvip.com",
      }),
    });
    expect(state.thirdPartyNodesVerifyResult?.ok).toBe(true);
    expect(state.thirdPartyNodesVerifyResult?.models[0]?.name).toBe("Yunyi GPT-5.2");
    expect(state.thirdPartyNodesVerifyResult?.modelIds).toEqual(["yunyi-codex/gpt-5.2"]);
    expect(state.thirdPartyNodesVerifying).toBe(false);
  });

  it("closes apply confirmation after a successful verify", async () => {
    const scrollIntoView = vi.fn();
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    const request = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    const resultPanel = document.createElement("div");
    resultPanel.setAttribute("data-third-party-verify-result", "true");
    resultPanel.scrollIntoView = scrollIntoView;
    document.body.appendChild(resultPanel);
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesApplyConfirm = {
      title: UNTESTED_CONFIRM.title,
      message: UNTESTED_CONFIRM.message,
      detail: UNTESTED_CONFIRM.detail,
      severity: "warning",
      statusLabel: UNTESTED_CONFIRM.statusLabel,
      recommendation: UNTESTED_CONFIRM.recommendation,
    };

    await verifyThirdPartyNodes(state);

    expect(state.thirdPartyNodesApplyConfirm).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    resultPanel.remove();
    requestAnimationFrameSpy.mockRestore();
  });

  it("keeps apply confirmation open after a failed verify", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [],
      modelIds: [],
      message: "invalid api key",
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesApplyConfirm = {
      title: createFailedConfirm(401).title,
      message: createFailedConfirm(401).message,
      detail: "invalid api key",
      severity: "danger",
      statusLabel: "HTTP 401",
      recommendation: createFailedConfirm(401).recommendation,
    };

    await verifyThirdPartyNodes(state);

    expect(state.thirdPartyNodesApplyConfirm).not.toBeNull();
    expect(state.thirdPartyNodesApplyConfirm?.statusLabel).toBe("HTTP 401");
  });

  it("applies without confirmation after a successful verify result", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.apply") {
        return { ok: true };
      }
      if (method === "thirdPartyNodes.status") {
        return { baseHash: "hash-2", entries: [] };
      }
      throw new Error(`unexpected method ${method}`);
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesBaseHash = "hash-1";
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    await applyThirdPartyNodes(state);

    expect(request).toHaveBeenCalledWith("thirdPartyNodes.apply", expect.anything());
  });

  it("opens a failed-verify confirmation instead of applying immediately", async () => {
    const request = vi.fn();
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: false,
      status: 401,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [],
      modelIds: [],
      message: "invalid api key",
    };

    await applyThirdPartyNodes(state);

    expect(state.thirdPartyNodesApplyConfirm).toEqual({
      title: createFailedConfirm(401).title,
      message: createFailedConfirm(401).message,
      detail: "invalid api key",
      severity: "danger",
      statusLabel: "HTTP 401",
      recommendation: createFailedConfirm(401).recommendation,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("clears verify state when a connection field changes", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "baseUrl", "https://yunyi.cfd");

    expect(state.thirdPartyNodesVerifyResult).toBeNull();
  });

  it("confirms apply through the custom confirmation state", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.apply") {
        return { ok: true };
      }
      if (method === "thirdPartyNodes.status") {
        return {
          baseHash: "hash-2",
          entries: [
            {
              providerKey: "yunyi-codex",
              label: "Yunyi GPT-5.2",
              baseUrl: "https://yunyi.rdzhvip.com",
              auth: "api-key",
              api: "openai-responses",
              modelId: "yunyi-codex/gpt-5.2",
              modelName: "Yunyi GPT-5.2",
              enabled: true,
              hasApiKey: true,
              headerNames: [],
            },
          ],
        };
      }
      throw new Error(`unexpected method ${method}`);
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;
    state.thirdPartyNodesBaseHash = "hash-1";
    state.thirdPartyNodesDirty = true;
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesApplyConfirm = {
      title: UNTESTED_CONFIRM.title,
      message: UNTESTED_CONFIRM.message,
      detail: UNTESTED_CONFIRM.detail,
      severity: "warning",
      statusLabel: UNTESTED_CONFIRM.statusLabel,
      recommendation: UNTESTED_CONFIRM.recommendation,
    };

    await confirmThirdPartyNodesApply(state);

    expect(state.thirdPartyNodesApplyConfirm).toBeNull();
    expect(request).toHaveBeenCalledWith("thirdPartyNodes.apply", {
      baseHash: "hash-1",
      entry: expect.objectContaining({
        providerKey: "yunyi-codex",
        baseUrl: "https://yunyi.rdzhvip.com",
      }),
    });
    expect(state.thirdPartyNodesEntries[0]?.providerKey).toBe("yunyi-codex");
    expect(state.thirdPartyNodesDirty).toBe(false);
  });

  it("cancels the custom apply confirmation", () => {
    const state = createState();
    state.thirdPartyNodesApplyConfirm = {
      title: createFailedConfirm(401).title,
      message: createFailedConfirm(401).message,
      detail: "invalid api key",
      severity: "danger",
      statusLabel: "HTTP 401",
      recommendation: createFailedConfirm(401).recommendation,
    };

    cancelThirdPartyNodesApplyConfirm(state);

    expect(state.thirdPartyNodesApplyConfirm).toBeNull();
  });

  it("does not load third-party nodes when disconnected", async () => {
    const request = vi.fn();
    const state = createState();
    state.connected = false;
    state.client = { request } as never;

    await loadThirdPartyNodes(state);

    expect(request).not.toHaveBeenCalled();
    expect(state.thirdPartyNodesTemplates).toEqual([]);
  });

  it("clears verify result when auth changes", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "auth", "oauth");

    expect(state.thirdPartyNodesVerifyResult).toBeNull();
  });

  it("clears verify result when api mode changes", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "api", "openai-completions");

    expect(state.thirdPartyNodesVerifyResult).toBeNull();
    expect(state.thirdPartyNodesApplyConfirm).toBeNull();
  });

  it("does not clear verify result when a non-connection field changes", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    state.thirdPartyNodesVerifyResult = {
      ok: true,
      status: 200,
      checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
      providerKey: "yunyi-codex",
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK",
    };

    editThirdPartyNodesFormField(state, "label", "Yunyi Custom Label");

    expect(state.thirdPartyNodesVerifyResult).not.toBeNull();
    expect(state.thirdPartyNodesForm?.label).toBe("Yunyi Custom Label");
  });

  it("records recent model under the updated provider key", () => {
    const state = createState();
    state.thirdPartyNodesForm = {
      providerKey: "custom-provider",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    };

    editThirdPartyNodesFormField(state, "modelId", "custom-provider/gpt-5.2-mini");

    expect(state.thirdPartyNodesRecentModels).toEqual({
      "custom-provider": "custom-provider/gpt-5.2-mini",
    });
  });

  it("restores recent model for the matching provider when loading status entries", async () => {
    const request = vi.fn().mockImplementation(async (method: string) => {
      if (method === "thirdPartyNodes.catalog") {
        return {
          templates: [
            {
              id: "yunyi",
              label: "Yunyi",
              description: "Yunyi node",
              providerKeyDefault: "yunyi-codex",
              authOptions: ["api-key"],
              defaultAuth: "api-key",
              defaultApi: "openai-responses",
              baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
              defaultModel: {
                id: "yunyi-codex/gpt-5.2",
                name: "Yunyi GPT-5.2",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 32768,
              },
            },
          ],
        };
      }
      return {
        baseHash: "hash-1",
        entries: [
          {
            providerKey: "yunyi-codex",
            label: "Yunyi GPT-5.2",
            baseUrl: "https://yunyi.rdzhvip.com",
            auth: "api-key",
            api: "openai-responses",
            modelId: "yunyi-codex/gpt-5.2-mini",
            modelName: "Yunyi GPT-5.2 Mini",
            enabled: true,
            hasApiKey: true,
            headerNames: [],
          },
        ],
      };
    });
    const state = createState();
    state.connected = true;
    state.client = { request } as never;

    await loadThirdPartyNodes(state);

    expect(state.thirdPartyNodesRecentModels["yunyi-codex"]).toBe("yunyi-codex/gpt-5.2-mini");
    expect(state.thirdPartyNodesForm?.modelId).toBe("yunyi-codex/gpt-5.2-mini");
  });
});
