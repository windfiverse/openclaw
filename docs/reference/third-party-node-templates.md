---
summary: "Authoring reference for Control UI third-party node templates"
read_when:
  - You are adding a new third-party node provider template
  - You need a stable checklist for auth adapters, credential landing fields, and verification behavior
title: "Third-Party Node Templates"
---

# Third-Party Node Templates

This page is for provider integrators and maintainers adding entries to `src/gateway/third-party-nodes/catalog.ts`.

For operator-facing behavior, see [Third-Party Nodes](/web/third-party-nodes).

## Goal

A template should describe a provider's stable integration surface without baking fragile, provider-site-specific UI logic into OpenClaw.

Good templates do three things well:

- prefill sensible defaults
- guide the operator toward the right credential field / credential landing point
- keep auth orchestration generic enough to survive provider workflow changes

## Built-in example index

Use the existing catalog as the first design reference before adding a new template:

| Template | Integration pattern | Why it exists |
| --- | --- | --- |
| `openai-compatible` | generic manual credential landing | baseline for any OpenAI-compatible endpoint |
| `yunyi` | command + browser callback + manual paste | example of a provider-specific external auth portal |
| `openrouter` | docs-led manual key issuance | example of a simple non-callback provider |
| `groq` | docs-led manual key issuance with a concrete `/openai/v1` preset | example of a low-latency provider template |

Practical rule:

- start by extending `openai-compatible` if only defaults differ
- fork toward a dedicated template only when auth orchestration or docs guidance materially differ

## Required fields

Each template must define:

- `id`
- `label`
- `description`
- `providerKeyDefault`
- `authOptions`
- `defaultAuth`
- `defaultApi`
- `baseUrlPresets`
- `defaultModel`

Practical rules:

- `id` should be stable and machine-friendly
- `providerKeyDefault` should be a safe config key seed, not a display string
- `defaultApi` should match the real provider protocol surface, not the marketing name
- `defaultModel` should be a believable default, not just the latest headline model

## Auth model

Use `authOptions` to declare which top-level auth modes the template supports:

- `api-key`
- `token`
- `oauth`

Set `defaultAuth` to the operator path that is most likely to work first try.
`defaultAuth` must also be listed in `authOptions`.

Do not advertise `oauth` unless the provider actually yields a credential that the operator can paste back into OpenClaw.

## Credential landing

Use `credentialTargets` to tell the UI which credential field receives the final credential.

Current target field:

- `apiKey`

Supported accepted types:

- `api-key`
- `token`
- `oauth-credential`

Guideline:

- if the provider returns one final bearer-style secret, land it in `apiKey`
- if multiple intermediate steps exist, still model only the final operator-visible credential landing point

## Auth adapters

Use `authAdapters` for the operator's real credential acquisition path.

Supported kinds:

- `command`
- `browser-callback`
- `manual-paste`

### `command`

Use when the provider instructs the operator to run a local command such as:

```bash
npx provider-activator
```

Requirements:

- set `command`
- write `detail` so the operator knows what result to paste back
- limit visibility with `authModes` if only some auth types use it
- any `authModes` values must be a subset of the template's `authOptions`

### `browser-callback`

Use when the provider has a browser login or portal flow.

Optional but important fields:

- `url`
- `callbackUrl`

Use `callbackUrl` only if the provider actually redirects back to a stable local URL that OpenClaw can recognize by path.
`browser-callback` must declare `url`. `callbackUrl` is optional.
Any `authModes` values must be a subset of the template's `authOptions`.

Do not assume OpenClaw will exchange callback codes for tokens. Today it only detects and drafts callback `code` values.

### `manual-paste`

Use when the provider flow is mostly self-explanatory and the UI only needs to focus the credential field.

This is the safest fallback adapter.

## Flow actions

Use `authFlowActions` for lightweight auth flow prompts that complement the adapters.

Supported kinds:

- `copy-command`
- `open-url`
- `mark-done`

Validation rules:

- `copy-command` must declare `value`
- `open-url` must declare `url`
- `mark-done` should be used only for local UI completion steps
- any `authModes` values must be a subset of the template's `authOptions`

Use them when:

- you want a quick action outside the fuller adapter card flow
- the provider flow is simple enough that a full adapter would be redundant

## Provider docs links

If the provider has a stable guide page, set `docsUrl`.

Use it for:

- provider-specific login notes
- model catalog notes
- access policy notes

Do not rely on `docsUrl` as the only explanation. The template still needs enough local metadata for the operator to complete the auth flow from the Control UI.

## Default model guidance

`defaultModel` should bias toward a model that is:

- actually available on the provider by default
- compatible with the chosen `defaultApi`
- safe to verify through `/models`

Avoid:

- speculative model IDs
- region-specific IDs unless the template itself is region-specific
- optimistic capability claims that are not reflected by the provider endpoint

## Compatibility checklist

Before merging a new template, verify:

1. The base URL really exposes the selected API surface.
2. The auth mode matches what the provider actually accepts on requests.
3. The operator can obtain a final pasteable credential.
4. `Test Connection` can validate the provider through `/models`.
5. The template remains usable if the provider slightly rewrites its login page copy.

## Terminology checklist

Keep authoring terms aligned with the Control UI so operators do not need to translate concepts mentally:

1. Use `credential field` for the final paste target in the form.
2. Use `credential landing` only when describing where the final credential should end up.
3. Use `auth adapter` for executable/operator-facing acquisition steps.
4. Use `auth flow action` for lighter supporting prompts beside adapters.
5. Use `callback capture` when describing browser-detected callback `code` drafting.

Avoid mixing in nearby but different wording such as:

- "secret field" when you really mean `credential field`
- generic "action" when you specifically mean `auth flow action`
- generic "login result" when the UI is actually drafting a callback `code`

## Quick checklist

- `defaultAuth` is present in `authOptions`
- every adapter `authModes` entry is also present in `authOptions`
- every action `authModes` entry is also present in `authOptions`
- every `browser-callback` adapter has a provider `url`
- only `browser-callback` adapters use `callbackUrl`
- every `copy-command` action has `value`
- every `open-url` action has `url`
- `docsUrl` is stable and operator-facing, not an ephemeral login redirect

## Post-change sync checklist

After changing a template shape, auth flow semantics, or operator wording, sync the surrounding surfaces too:

1. Update `src/gateway/third-party-nodes/catalog.ts` and the matching schema in `src/gateway/protocol/schema/third-party-nodes.ts`.
2. Update Control UI copy in `ui/src/ui/views/third-party-nodes.ts` and locale keys in `ui/src/i18n/locales/*.ts`.
3. Update operator docs in `docs/web/third-party-nodes.md` if the flow visible in Control UI changed.
4. Update this reference page if authoring rules, supported adapter kinds, or examples changed.
5. Run `corepack pnpm run test:third-party-nodes` before merge.

## Minimal example

```ts
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
    { field: "apiKey", label: "Credential field", accepts: ["api-key", "token"] },
  ],
  authAdapters: [
    {
      kind: "manual-paste",
      label: "Paste credential manually",
      detail: "Paste the provider-issued key or token into the credential field below.",
      authModes: ["api-key", "token"],
    },
  ],
}
```

## Callback example

```ts
{
  id: "yunyi",
  label: "Yunyi",
  providerKeyDefault: "yunyi-codex",
  authOptions: ["api-key", "token", "oauth"],
  defaultAuth: "api-key",
  docsUrl: "https://yunyi.rdzhvip.com/codex",
  authAdapters: [
    {
      kind: "command",
      label: "CLI activator",
      command: "npx yunyi-activator",
      authModes: ["api-key", "token", "oauth"],
    },
    {
      kind: "browser-callback",
      label: "Provider web login",
      url: "https://yunyi.rdzhvip.com/codex",
      callbackUrl: "http://localhost:1455/auth/callback",
      authModes: ["oauth", "api-key", "token"],
    },
  ],
  authFlowActions: [
    {
      kind: "copy-command",
      label: "Copy activator command",
      value: "npx yunyi-activator",
    },
    {
      kind: "open-url",
      label: "Open provider page",
      url: "https://yunyi.rdzhvip.com/codex",
    },
    {
      kind: "mark-done",
      label: "I already authenticated",
    },
  ],
}
```

## Non-callback example

```ts
{
  id: "openrouter",
  label: "OpenRouter",
  description: "OpenRouter OpenAI-compatible routing endpoint for multi-provider model access.",
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
    { field: "apiKey", label: "Credential field", accepts: ["api-key"] },
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
      url: "https://openrouter.ai/docs/api-reference/overview",
    },
    {
      kind: "mark-done",
      label: "I already have a key",
    },
  ],
}
```

## Design boundaries

Keep these boundaries strict:

- provider login execution stays outside OpenClaw
- the template describes orchestration, not secret exchange
- browser callback detection is path-plus-code capture, not OAuth completion

If a provider needs token exchange, PKCE, or secure secret brokering, that should be a separate backend feature, not encoded into a template.

## Regression tests

After template or UI flow changes, run:

```bash
corepack pnpm run test:third-party-nodes
```
