---
summary: "Template-driven third-party node auth flow in the Control UI"
read_when:
  - You want to add an OpenAI-compatible third-party node from the browser
  - You want a reusable auth flow for external provider portals, activators, or callback-based login
title: "Third-Party Nodes"
---

# Third-Party Nodes

The Control UI can guide operators through a reusable third-party node setup flow under **AI Agents**.

This flow is designed for providers that do not authenticate entirely inside OpenClaw. Typical examples:

- a provider portal that issues an API key
- a CLI activator such as `npx <provider>-activator`
- a browser login that redirects back with a temporary callback code

OpenClaw does not currently execute provider login flows itself. Instead, it orchestrates the steps, stores progress in the browser, and helps the operator land the final credential in the right field before running verification.

For provider authors, see [Third-Party Node Templates](/reference/third-party-node-templates).

## Included provider examples

The built-in catalog already covers more than one integration shape:

| Template | Typical use | Auth shape | Docs |
| --- | --- | --- | --- |
| `yunyi` | third-party node portal with activator + callback-oriented guidance | `api-key`, `token`, `oauth` | [Yunyi](https://yunyi.rdzhvip.com/codex) |
| `openrouter` | OpenAI-compatible routed provider with manual key paste | `api-key` | [OpenRouter](https://openrouter.ai/docs/api-reference/overview) |
| `groq` | low-latency OpenAI-compatible endpoint with manual key paste | `api-key` | [Groq](https://console.groq.com/docs/openai) |
| `openai-compatible` | generic fallback template for any compatible provider | `api-key`, `token` | author locally |

Use these as operator examples first, then branch into your own provider-specific template only when the auth flow or defaults materially differ.

## Where it lives

Open the Control UI, then go to the **AI Agents** tab.

The third-party node panel lets you:

- choose a provider template
- choose auth mode (`api-key`, `token`, or `oauth` when supported)
- fill or paste the final credential into the credential field
- test the provider `/models` endpoint before applying
- write the provider entry back to the gateway config

For general browser UI behavior, see [Control UI](/web/control-ui).

## Generic flow

The intended operator flow is:

1. Pick a template and confirm the base URL, provider key, model, and auth mode.
2. Use one of the template's auth adapters or auth flow actions.
3. Complete the external provider step outside OpenClaw.
4. Paste the resulting key, token, or OAuth-derived credential into the credential field.
5. Run **Test Connection** to verify the derived `/models` endpoint.
6. Apply the config update.

This keeps OpenClaw generic: the browser UI does not need provider-specific embedded OAuth logic for every third-party node.

## Template fields

Templates are defined in `src/gateway/third-party-nodes/catalog.ts`.

The UI contract is validated by `src/gateway/protocol/schema/third-party-nodes.ts`.

### `credentialTargets`

`credentialTargets` tells the UI which credential field should receive the final credential and which credential types that field accepts.

Current use:

- `field: "apiKey"` points operators to the credential field in the form
- `accepts` declares which outputs can land there:
  - `api-key`
  - `token`
  - `oauth-credential`

The UI uses this to show credential landing hints such as "this field accepts the current token mode".

### `authAdapters`

`authAdapters` describes the external mechanism the operator uses to obtain a credential.

Supported adapter kinds:

- `command`: copy a command, then mark that it was executed
- `browser-callback`: open a provider page and optionally watch for a callback URL
- `manual-paste`: focus the credential field for direct paste flows

Adapters are filtered by `authModes`, so one template can support multiple auth strategies without rendering irrelevant controls.

### `authFlowActions`

`authFlowActions` are lighter-weight guidance actions shown alongside adapters.

Supported action kinds:

- `copy-command`
- `open-url`
- `mark-done`

Use these when you want guided operator steps even if the provider does not need a full adapter card.

## Callback capture

If a template includes a `browser-callback` adapter with `callbackUrl`, the Control UI inspects the current browser URL for a matching callback path and a `code` query parameter.

When a match is found:

- the UI shows a callback capture panel
- the operator can click **Use callback code**
- the callback code is drafted into the credential field
- adapter progress is updated to `callback_received`

This is intentionally conservative:

- OpenClaw does not exchange the callback code for tokens
- OpenClaw does not embed a provider login browser
- the operator still decides whether the callback code itself is the final credential or just an intermediate artifact

## Progress tracking

Auth adapter progress is persisted in browser storage and rendered back into the adapter card.

Current phases:

- `copied`
- `executed`
- `credential_received`
- `callback_received`

This allows the UI to survive refreshes while keeping a lightweight audit trail for multi-step auth flows.

The relevant browser state is stored from `ui/src/ui/storage.ts` and surfaced through:

- `ui/src/ui/app-settings.ts`
- `ui/src/ui/app-view-state.ts`
- `ui/src/ui/views/third-party-nodes.ts`

## Adding a new provider

To add another third-party node provider:

1. Add a new template entry in `src/gateway/third-party-nodes/catalog.ts`.
2. Reuse existing `authOptions`, `credentialTargets`, `authAdapters`, and `authFlowActions` where possible.
3. Set `authModes` on adapters/actions so the UI only shows relevant steps.
4. If the provider returns to a local callback URL, add a `browser-callback` adapter with `callbackUrl`.
5. Keep the template generic enough that it still works if the provider changes minor UI details on their site.

Good template design rule:

- model/provider facts belong in the template
- operator-specific secrets belong in the form
- provider login execution stays outside OpenClaw unless a future gateway/backend feature explicitly supports it

## Verification and apply behavior

**Test Connection** uses the OpenAI-compatible models endpoint derived from the configured Base URL.

Run verification before applying because it catches:

- bad credentials
- wrong base URLs
- missing `/models` compatibility
- template defaults that do not match the actual provider deployment

Apply writes the provider entry into the gateway config with the normal base-hash guard used by the Control UI.

## Regression checks

When changing this flow, run:

```bash
corepack pnpm run test:third-party-nodes
```

Relevant coverage includes:

- `ui/src/ui/views/third-party-nodes.browser.test.ts`
- `ui/src/ui/app.third-party-nodes.test.ts`
- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `src/gateway/server.third-party-nodes.test.ts`
