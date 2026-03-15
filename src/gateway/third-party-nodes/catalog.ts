export type ThirdPartyNodeTemplate = {
  id: string;
  label: string;
  description: string;
  providerKeyDefault: string;
  authOptions: Array<"api-key" | "oauth" | "token">;
  defaultAuth: "api-key" | "oauth" | "token";
  defaultApi:
    | "openai-completions"
    | "openai-responses"
    | "openai-codex-responses"
    | "anthropic-messages"
    | "google-generative-ai"
    | "github-copilot"
    | "bedrock-converse-stream"
    | "ollama";
  baseUrlPresets: Array<{ label: string; url: string }>;
  defaultModel: {
    id: string;
    name: string;
    reasoning: boolean;
    input: Array<"text" | "image">;
    contextWindow: number;
    maxTokens: number;
  };
  docsUrl?: string;
  credentialTargets?: Array<{
    field: "apiKey";
    label: string;
    accepts: Array<"api-key" | "token" | "oauth-credential">;
  }>;
  authAdapters?: ThirdPartyNodeTemplateAuthAdapter[];
  authFlowActions?: ThirdPartyNodeTemplateAuthFlowAction[];
};

type ThirdPartyNodeTemplateAuthShared = {
  label: string;
  detail?: string;
  authModes?: Array<"api-key" | "oauth" | "token">;
};

export type ThirdPartyNodeTemplateAuthAdapter =
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "command";
      command: string;
    })
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "browser-callback";
      url: string;
      callbackUrl?: string;
    })
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "manual-paste";
    });

export type ThirdPartyNodeTemplateAuthFlowAction =
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "copy-command";
      value: string;
    })
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "open-url";
      url: string;
    })
  | (ThirdPartyNodeTemplateAuthShared & {
      kind: "mark-done";
    });

// Template authoring notes:
// - Keep provider login execution outside OpenClaw; model only the operator-facing orchestration.
// - Use browser-callback only for flows that really start from a provider URL and may return with a code.
// - Prefer stable provider facts here; avoid encoding fragile page-copy or click-by-click website behavior.
export const THIRD_PARTY_NODE_TEMPLATES: ThirdPartyNodeTemplate[] = [
  {
    id: "openai-compatible",
    label: "OpenAI-Compatible",
    description: "Generic OpenAI-compatible third-party node using an API key.",
    providerKeyDefault: "openai-compatible",
    authOptions: ["api-key", "token"],
    defaultAuth: "api-key",
    defaultApi: "openai-responses",
    baseUrlPresets: [],
    defaultModel: {
      id: "gpt-5.2",
      name: "GPT-5.2",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 128000,
      maxTokens: 32768,
    },
    credentialTargets: [
      {
        field: "apiKey",
        label: "Credential field",
        accepts: ["api-key", "token"],
      },
    ],
    authAdapters: [
      {
        kind: "manual-paste",
        label: "Paste credential manually",
        detail: "Paste the provider-issued key or token into the credential field below.",
        authModes: ["api-key", "token"],
      },
    ],
  },
  {
    id: "yunyi",
    label: "Yunyi",
    description: "Yunyi third-party node for OpenAI-compatible coding models.",
    providerKeyDefault: "yunyi-codex",
    authOptions: ["api-key", "token", "oauth"],
    defaultAuth: "api-key",
    defaultApi: "openai-responses",
    baseUrlPresets: [
      { label: "yunyi.rdzhvip.com", url: "https://yunyi.rdzhvip.com" },
      { label: "yunyi.cfd", url: "https://yunyi.cfd" },
      { label: "cdn1.yunyi.cfd", url: "https://cdn1.yunyi.cfd" },
      { label: "cdn2.yunyi.cfd", url: "https://cdn2.yunyi.cfd" },
    ],
    defaultModel: {
      id: "yunyi-codex/gpt-5.2",
      name: "Yunyi GPT-5.2",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 128000,
      maxTokens: 32768,
    },
    docsUrl: "https://yunyi.rdzhvip.com/codex",
    credentialTargets: [
      {
        field: "apiKey",
        label: "Credential field",
        accepts: ["api-key", "token", "oauth-credential"],
      },
    ],
    authAdapters: [
      {
        kind: "command",
        label: "CLI activator",
        detail: "Run the Yunyi activator locally, then paste the issued credential below.",
        command: "npx yunyi-activator",
        authModes: ["api-key", "token", "oauth"],
      },
      {
        kind: "browser-callback",
        label: "Provider web login",
        detail: "Open the Yunyi codex page and complete their current sign-in flow.",
        url: "https://yunyi.rdzhvip.com/codex",
        callbackUrl: "http://localhost:1455/auth/callback",
        authModes: ["oauth", "api-key", "token"],
      },
      {
        kind: "manual-paste",
        label: "Paste issued credential",
        detail: "After authentication, paste the final provider credential into the field below.",
        authModes: ["api-key", "token", "oauth"],
      },
    ],
    authFlowActions: [
      {
        kind: "copy-command",
        label: "Copy activator command",
        detail: "Run the provider activator in a terminal, then paste the resulting credential here.",
        value: "npx yunyi-activator",
      },
      {
        kind: "open-url",
        label: "Open provider page",
        detail: "Review the provider's current access flow and model notes.",
        url: "https://yunyi.rdzhvip.com/codex",
      },
      {
        kind: "mark-done",
        label: "I already authenticated",
        detail: "Jump back to the credential field and paste the issued key or token.",
      },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description:
      "OpenRouter OpenAI-compatible routing endpoint for multi-provider model access. Use provider/model slugs such as openai/gpt-4o-mini and verify against the live catalog before applying.",
    providerKeyDefault: "openrouter",
    authOptions: ["api-key"],
    defaultAuth: "api-key",
    defaultApi: "openai-responses",
    baseUrlPresets: [{ label: "openrouter.ai/api", url: "https://openrouter.ai/api" }],
    defaultModel: {
      id: "openai/gpt-4o-mini",
      name: "OpenAI GPT-4o Mini",
      reasoning: false,
      input: ["text", "image"],
      contextWindow: 128000,
      maxTokens: 16384,
    },
    docsUrl: "https://openrouter.ai/docs/api-reference/overview",
    credentialTargets: [
      {
        field: "apiKey",
        label: "Credential field",
        accepts: ["api-key"],
      },
    ],
    authAdapters: [
      {
        kind: "manual-paste",
        label: "Paste OpenRouter key",
        detail: "Create an API key in the OpenRouter dashboard and paste it into the credential field.",
        authModes: ["api-key"],
      },
    ],
    authFlowActions: [
      {
        kind: "open-url",
        label: "Open OpenRouter docs",
        detail: "Review authentication, provider routing, and model naming details.",
        url: "https://openrouter.ai/docs/api-reference/overview",
      },
      {
        kind: "mark-done",
        label: "I already have a key",
        detail: "Jump to the credential field and paste the OpenRouter API key.",
      },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    description:
      "Groq OpenAI-compatible endpoint for low-latency responses. Verify the target model against Groq's live catalog before applying.",
    providerKeyDefault: "groq",
    authOptions: ["api-key"],
    defaultAuth: "api-key",
    defaultApi: "openai-responses",
    baseUrlPresets: [{ label: "api.groq.com/openai/v1", url: "https://api.groq.com/openai/v1" }],
    defaultModel: {
      id: "openai/gpt-oss-20b",
      name: "OpenAI GPT-OSS 20B",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 131072,
      maxTokens: 8192,
    },
    docsUrl: "https://console.groq.com/docs/openai",
    credentialTargets: [
      {
        field: "apiKey",
        label: "Credential field",
        accepts: ["api-key"],
      },
    ],
    authAdapters: [
      {
        kind: "manual-paste",
        label: "Paste Groq key",
        detail: "Create a Groq API key in the console and paste it into the credential field.",
        authModes: ["api-key"],
      },
    ],
    authFlowActions: [
      {
        kind: "open-url",
        label: "Open Groq compatibility docs",
        detail: "Review the OpenAI compatibility notes, base URL, and supported model naming.",
        url: "https://console.groq.com/docs/openai",
      },
      {
        kind: "mark-done",
        label: "I already have a key",
        detail: "Jump to the credential field and paste the Groq API key.",
      },
    ],
  },
];

function cloneTemplate(entry: ThirdPartyNodeTemplate): ThirdPartyNodeTemplate {
  return {
    ...entry,
    authOptions: [...entry.authOptions],
    baseUrlPresets: entry.baseUrlPresets.map((preset) => ({ ...preset })),
    defaultModel: {
      ...entry.defaultModel,
      input: [...entry.defaultModel.input],
    },
    credentialTargets: entry.credentialTargets?.map((target) => ({
      ...target,
      accepts: [...target.accepts],
    })),
    authAdapters: entry.authAdapters?.map((adapter) => ({
      ...adapter,
      authModes: adapter.authModes ? [...adapter.authModes] : undefined,
    })),
    authFlowActions: entry.authFlowActions?.map((action) => ({
      ...action,
      authModes: action.authModes ? [...action.authModes] : undefined,
    })),
  };
}

function describeTemplateIssue(entry: ThirdPartyNodeTemplate, message: string): Error {
  return new Error(`Third-party node template "${entry.id}" is invalid: ${message}`);
}

export function validateThirdPartyNodeTemplate(entry: ThirdPartyNodeTemplate): ThirdPartyNodeTemplate {
  if (!entry.authOptions.includes(entry.defaultAuth)) {
    throw describeTemplateIssue(
      entry,
      `defaultAuth "${entry.defaultAuth}" must also appear in authOptions (${entry.authOptions.join(", ")}).`,
    );
  }
  for (const adapter of entry.authAdapters ?? []) {
    for (const mode of adapter.authModes ?? []) {
      if (!entry.authOptions.includes(mode)) {
        throw describeTemplateIssue(
          entry,
          `adapter "${adapter.label}" uses auth mode "${mode}" outside authOptions (${entry.authOptions.join(", ")}).`,
        );
      }
    }
    if (adapter.kind === "browser-callback") {
      if (!adapter.url?.trim()) {
        throw describeTemplateIssue(entry, `browser-callback adapter "${adapter.label}" must declare url.`);
      }
      if (adapter.callbackUrl && !adapter.callbackUrl.trim()) {
        throw describeTemplateIssue(
          entry,
          `browser-callback adapter "${adapter.label}" has an empty callbackUrl.`,
        );
      }
    }
    if (adapter.kind !== "browser-callback" && adapter.callbackUrl) {
      throw describeTemplateIssue(
        entry,
        `adapter "${adapter.label}" declares callbackUrl but only browser-callback adapters may use it.`,
      );
    }
  }
  for (const action of entry.authFlowActions ?? []) {
    for (const mode of action.authModes ?? []) {
      if (!entry.authOptions.includes(mode)) {
        throw describeTemplateIssue(
          entry,
          `action "${action.label}" uses auth mode "${mode}" outside authOptions (${entry.authOptions.join(", ")}).`,
        );
      }
    }
    if (action.kind === "copy-command" && !action.value?.trim()) {
      throw describeTemplateIssue(entry, `copy-command action "${action.label}" must declare value.`);
    }
    if (action.kind === "open-url" && !action.url?.trim()) {
      throw describeTemplateIssue(entry, `open-url action "${action.label}" must declare url.`);
    }
  }
  return entry;
}

export function listThirdPartyNodeTemplates(): ThirdPartyNodeTemplate[] {
  return THIRD_PARTY_NODE_TEMPLATES.map((entry) => cloneTemplate(validateThirdPartyNodeTemplate(entry)));
}
