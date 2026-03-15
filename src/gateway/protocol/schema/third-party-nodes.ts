import { Type } from "@sinclair/typebox";
import { NonEmptyString } from "./primitives.js";

const ThirdPartyNodeBaseUrlPresetSchema = Type.Object(
  {
    label: NonEmptyString,
    url: NonEmptyString,
  },
  { additionalProperties: false },
);

const ThirdPartyNodeTemplateModelSchema = Type.Object(
  {
    id: NonEmptyString,
    name: NonEmptyString,
    reasoning: Type.Boolean(),
    input: Type.Array(Type.Union([Type.Literal("text"), Type.Literal("image")])),
    contextWindow: Type.Integer({ minimum: 1 }),
    maxTokens: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);

const ThirdPartyNodeTemplateAuthSharedSchema = {
  label: NonEmptyString,
  detail: Type.Optional(Type.String()),
  authModes: Type.Optional(
    Type.Array(Type.Union([Type.Literal("api-key"), Type.Literal("oauth"), Type.Literal("token")])),
  ),
} as const;

const ThirdPartyNodeTemplateAuthFlowActionSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("copy-command"),
      value: NonEmptyString,
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("open-url"),
      url: NonEmptyString,
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("mark-done"),
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
]);

const ThirdPartyNodeTemplateCredentialTargetSchema = Type.Object(
  {
    field: Type.Literal("apiKey"),
    label: NonEmptyString,
    accepts: Type.Array(
      Type.Union([
        Type.Literal("api-key"),
        Type.Literal("token"),
        Type.Literal("oauth-credential"),
      ]),
    ),
  },
  { additionalProperties: false },
);

const ThirdPartyNodeTemplateAuthAdapterSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("command"),
      command: NonEmptyString,
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("browser-callback"),
      url: NonEmptyString,
      callbackUrl: Type.Optional(NonEmptyString),
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("manual-paste"),
      ...ThirdPartyNodeTemplateAuthSharedSchema,
    },
    { additionalProperties: false },
  ),
]);

const ThirdPartyNodeVerifiedModelSchema = Type.Object(
  {
    id: NonEmptyString,
    name: Type.Optional(NonEmptyString),
    reasoning: Type.Optional(Type.Boolean()),
    input: Type.Optional(Type.Array(Type.Union([Type.Literal("text"), Type.Literal("image")]))),
    contextWindow: Type.Optional(Type.Integer({ minimum: 1 })),
    maxTokens: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesCatalogParamsSchema = Type.Object({}, { additionalProperties: false });
export const ThirdPartyNodesStatusParamsSchema = Type.Object({}, { additionalProperties: false });

export const ThirdPartyNodeTemplateSchema = Type.Object(
  {
    id: NonEmptyString,
    label: NonEmptyString,
    description: Type.String(),
    providerKeyDefault: NonEmptyString,
    authOptions: Type.Array(
      Type.Union([Type.Literal("api-key"), Type.Literal("oauth"), Type.Literal("token")]),
    ),
    defaultAuth: Type.Union([Type.Literal("api-key"), Type.Literal("oauth"), Type.Literal("token")]),
    defaultApi: Type.Union([
      Type.Literal("openai-completions"),
      Type.Literal("openai-responses"),
      Type.Literal("openai-codex-responses"),
      Type.Literal("anthropic-messages"),
      Type.Literal("google-generative-ai"),
      Type.Literal("github-copilot"),
      Type.Literal("bedrock-converse-stream"),
      Type.Literal("ollama"),
    ]),
    baseUrlPresets: Type.Array(ThirdPartyNodeBaseUrlPresetSchema),
    defaultModel: ThirdPartyNodeTemplateModelSchema,
    docsUrl: Type.Optional(Type.String()),
    credentialTargets: Type.Optional(Type.Array(ThirdPartyNodeTemplateCredentialTargetSchema)),
    authAdapters: Type.Optional(Type.Array(ThirdPartyNodeTemplateAuthAdapterSchema)),
    authFlowActions: Type.Optional(Type.Array(ThirdPartyNodeTemplateAuthFlowActionSchema)),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesCatalogResultSchema = Type.Object(
  {
    templates: Type.Array(ThirdPartyNodeTemplateSchema),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodeStatusEntrySchema = Type.Object(
  {
    providerKey: NonEmptyString,
    label: NonEmptyString,
    baseUrl: NonEmptyString,
    auth: Type.Optional(
      Type.Union([Type.Literal("api-key"), Type.Literal("aws-sdk"), Type.Literal("oauth"), Type.Literal("token")]),
    ),
    api: Type.Optional(
      Type.Union([
        Type.Literal("openai-completions"),
        Type.Literal("openai-responses"),
        Type.Literal("openai-codex-responses"),
        Type.Literal("anthropic-messages"),
        Type.Literal("google-generative-ai"),
        Type.Literal("github-copilot"),
        Type.Literal("bedrock-converse-stream"),
        Type.Literal("ollama"),
      ]),
    ),
    modelId: Type.Optional(NonEmptyString),
    modelName: Type.Optional(NonEmptyString),
    enabled: Type.Boolean(),
    hasApiKey: Type.Boolean(),
    headerNames: Type.Array(NonEmptyString),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesStatusResultSchema = Type.Object(
  {
    path: NonEmptyString,
    baseHash: Type.Optional(NonEmptyString),
    entries: Type.Array(ThirdPartyNodeStatusEntrySchema),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesApplyEntrySchema = Type.Object(
  {
    providerKey: NonEmptyString,
    label: NonEmptyString,
    baseUrl: NonEmptyString,
    apiKey: Type.Optional(Type.String()),
    auth: Type.Optional(
      Type.Union([Type.Literal("api-key"), Type.Literal("aws-sdk"), Type.Literal("oauth"), Type.Literal("token")]),
    ),
    api: Type.Optional(
      Type.Union([
        Type.Literal("openai-completions"),
        Type.Literal("openai-responses"),
        Type.Literal("openai-codex-responses"),
        Type.Literal("anthropic-messages"),
        Type.Literal("google-generative-ai"),
        Type.Literal("github-copilot"),
        Type.Literal("bedrock-converse-stream"),
        Type.Literal("ollama"),
      ]),
    ),
    modelId: NonEmptyString,
    modelName: Type.Optional(Type.String()),
    enabled: Type.Boolean(),
    headers: Type.Optional(Type.Record(NonEmptyString, Type.String())),
    reasoning: Type.Optional(Type.Boolean()),
    supportsImageInput: Type.Optional(Type.Boolean()),
    contextWindow: Type.Optional(Type.Integer({ minimum: 1 })),
    maxTokens: Type.Optional(Type.Integer({ minimum: 1 })),
    sessionKey: Type.Optional(Type.String()),
    note: Type.Optional(Type.String()),
    restartDelayMs: Type.Optional(Type.Integer({ minimum: 0 })),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesApplyParamsSchema = Type.Object(
  {
    baseHash: Type.Optional(NonEmptyString),
    entry: ThirdPartyNodesApplyEntrySchema,
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesVerifyParamsSchema = Type.Object(
  {
    entry: ThirdPartyNodesApplyEntrySchema,
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesApplyResultSchema = Type.Object(
  {
    ok: Type.Literal(true),
    path: NonEmptyString,
    entry: ThirdPartyNodeStatusEntrySchema,
    restart: Type.Unknown(),
    sentinel: Type.Object(
      {
        path: Type.Union([Type.String(), Type.Null()]),
        payload: Type.Unknown(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ThirdPartyNodesVerifyResultSchema = Type.Object(
  {
    ok: Type.Boolean(),
    status: Type.Integer({ minimum: 0 }),
    checkedUrl: NonEmptyString,
    providerKey: NonEmptyString,
    models: Type.Array(ThirdPartyNodeVerifiedModelSchema),
    modelIds: Type.Array(NonEmptyString),
    message: Type.String(),
  },
  { additionalProperties: false },
);
