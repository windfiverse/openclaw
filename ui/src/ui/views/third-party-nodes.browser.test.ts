// @vitest-environment jsdom

import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { t } from "../../i18n/index.ts";
import { renderThirdPartyNodes } from "./third-party-nodes.ts";
import type { ThirdPartyNodesViewProps } from "./third-party-nodes.ts";
import type {
  ThirdPartyNodeTemplate,
  ThirdPartyNodesApplyConfirm,
  ThirdPartyNodesVerifyResult,
} from "../types.ts";

function createTemplate(): ThirdPartyNodeTemplate {
  return {
    id: "yunyi",
    label: "Yunyi",
    description: "Yunyi node",
    providerKeyDefault: "yunyi-codex",
    authOptions: ["api-key", "oauth", "token"],
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
  };
}

function createProps(): ThirdPartyNodesViewProps {
  return {
    loading: false,
    saving: false,
    verifying: false,
    dirty: false,
    lastError: null,
    lastErrorReason: null,
    templates: [createTemplate()],
    entries: [],
    selectedTemplateId: "yunyi",
    form: {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "api-key" as const,
      api: "openai-responses" as const,
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: true,
      contextWindow: 128000,
      maxTokens: 32768,
    },
    verifyResult: null as ThirdPartyNodesVerifyResult | null,
    applyConfirm: null as ThirdPartyNodesApplyConfirm | null,
    filterReasoningOnly: false,
    filterImageOnly: false,
    recentModelId: null,
    highlightManualFields: false,
    manualHighlightNoticeDismissed: false,
    focusedSource: null,
    focusedManualGroup: null,
    authAdapterStatuses: {},
    authAdapterProgress: {},
    activeHelpField: null,
    activeHelpPopoverPlacement: "bottom-left" as const,
    onReload: vi.fn(),
    onApply: vi.fn(),
    onVerify: vi.fn(),
    onApplyConfirm: vi.fn(),
    onApplyCancel: vi.fn(),
    onFilterReasoningOnlyChange: vi.fn(),
    onFilterImageOnlyChange: vi.fn(),
    onClearFilters: vi.fn(),
    onApplyTemplateDefaults: vi.fn(),
    onClearRecentModel: vi.fn(),
    onToggleManualHighlights: vi.fn(),
    onDismissManualHighlightNotice: vi.fn(),
    onFocusSource: vi.fn(),
    onFocusManualGroup: vi.fn(),
    onAuthAdapterStatusChange: vi.fn(),
    onAuthAdapterProgressChange: vi.fn(),
    onToggleHelpField: vi.fn(),
    onResetField: vi.fn(),
    onTemplateChange: vi.fn(),
    onFieldChange: vi.fn(),
  };
}

function createVerifyResult(
  overrides: Partial<ThirdPartyNodesVerifyResult> = {},
): ThirdPartyNodesVerifyResult {
  return {
    ok: true,
    status: 200,
    checkedUrl: "https://yunyi.rdzhvip.com/v1/models",
    providerKey: "yunyi-codex",
    models: [],
    modelIds: [],
    message: "Connection OK.",
    ...overrides,
  };
}

function createApplyConfirm(
  overrides: Partial<ThirdPartyNodesApplyConfirm> = {},
): ThirdPartyNodesApplyConfirm {
  return {
    title: "Apply changes",
    message: "Review changes before apply.",
    detail: "Detail",
    severity: "warning",
    statusLabel: "Pending review",
    recommendation: "Verify before apply.",
    ...overrides,
  };
}

describe("third-party nodes view", () => {
  it("renders the panel and configured fields", async () => {
    const container = document.createElement("div");
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Third-Party Nodes");
    expect(text).toContain("Provider key");
    expect(text).toContain("Apply Node");
    expect(text).toContain("Test Connection");
  });

  it("renders the generic auth guide and API key label for api-key mode", async () => {
    const props = createProps();
    props.templates[0]!.docsUrl = "https://example.com/docs";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(container.querySelector('[data-third-party-auth-guide="true"]')).not.toBeNull();
    expect(text).toContain("Credential flow");
    expect(text).toContain("API key flow");
    expect(text).toContain("API key");
    expect(text).toContain("Credential field accepts this api-key");
    expect(text).toContain(t("thirdPartyNodes.authGuide.authAdapters"));
    expect(text).toContain("CLI activator");
    expect(text).toContain("Provider web login");
    expect(text).toContain("Paste issued credential");
    expect(text).toContain("Copy activator command");
    expect(text).toContain("Open provider page");
    expect(text).toContain("I already authenticated");
    const operatorDocsLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-openclaw-docs-link="true"]',
    );
    const templateSpecLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-template-spec-link="true"]',
    );
    const providerDocsLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-provider-docs-link="true"]',
    );
    const summaryOperatorDocsLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-template-summary-operator-docs="true"]',
    );
    const summarySpecDocsLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-template-summary-spec-docs="true"]',
    );
    const summaryProviderDocsLink = container.querySelector<HTMLAnchorElement>(
      '[data-third-party-template-summary-docs="true"]',
    );
    const docsToolbar = container.querySelector<HTMLElement>('[data-third-party-docs-toolbar="true"]');
    const templateSummary = container.querySelector<HTMLElement>('[data-third-party-template-summary="true"]');
    expect(docsToolbar).not.toBeNull();
    expect(templateSummary?.textContent).toContain("Yunyi node");
    expect(
      container.querySelector('[data-third-party-template-summary-auth="true"]')?.textContent,
    ).toContain("API key, OAuth, Token");
    expect(
      container.querySelector('[data-third-party-template-summary-api="true"]')?.textContent,
    ).toContain("OpenAI Responses");
    expect(
      container.querySelector('[data-third-party-template-summary-model="true"]')?.textContent,
    ).toContain("yunyi-codex/gpt-5.2");
    expect(
      container.querySelector('[data-third-party-template-summary-docs-host="true"]')?.textContent,
    ).toContain("example.com");
    expect(
      container.querySelector('[data-third-party-template-apply-baseurl="true"]')?.textContent,
    ).toContain("Use recommended Base URL");
    expect(
      container.querySelector('[data-third-party-template-apply-model="true"]')?.textContent,
    ).toContain("Use default model");
    expect(operatorDocsLink?.href).toBe("https://docs.openclaw.ai/web/third-party-nodes");
    expect(templateSpecLink?.href).toBe("https://docs.openclaw.ai/reference/third-party-node-templates");
    expect(providerDocsLink?.href).toBe("https://example.com/docs");
    expect(summaryOperatorDocsLink?.href).toBe("https://docs.openclaw.ai/web/third-party-nodes");
    expect(summarySpecDocsLink?.href).toBe(
      "https://docs.openclaw.ai/reference/third-party-node-templates",
    );
    expect(summaryProviderDocsLink?.href).toBe("https://example.com/docs");
  });

  it("can apply the recommended base url from the template summary", async () => {
    const props = createProps();
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = container.querySelector<HTMLButtonElement>(
      '[data-third-party-template-apply-baseurl="true"]',
    );
    expect(button).not.toBeNull();
    button?.click();

    expect(props.onFieldChange).toHaveBeenCalledWith("baseUrl", "https://yunyi.rdzhvip.com");
  });

  it("can apply the default model from the template summary", async () => {
    const props = createProps();
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = container.querySelector<HTMLButtonElement>(
      '[data-third-party-template-apply-model="true"]',
    );
    expect(button).not.toBeNull();
    button?.click();

    expect(props.onFieldChange).toHaveBeenCalledWith("modelId", "yunyi-codex/gpt-5.2");
    expect(props.onFieldChange).toHaveBeenCalledWith("modelName", "Yunyi GPT-5.2");
  });

  it("renders a prominent error card when loading third-party nodes fails", async () => {
    const props = createProps();
    props.lastError =
      'Third-party node template "yunyi" is invalid: adapter "Provider web login" must declare url.';
    props.lastErrorReason = "template";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const errorCard = container.querySelector<HTMLElement>('[data-third-party-error-card="true"]');
    expect(errorCard).not.toBeNull();
    expect(errorCard?.textContent).toContain("Template error");
    expect(errorCard?.textContent).toContain('adapter "Provider web login" must declare url');
    const retryButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-error-action="template"]',
    );
    expect(retryButton?.textContent).toContain("Reload templates");
  });

  it("renders a verify error title for verification failures", async () => {
    const props = createProps();
    props.lastError = "Connection test failed: HTTP 401";
    props.lastErrorReason = "verify";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const errorCard = container.querySelector<HTMLElement>('[data-third-party-error-card="true"]');
    expect(errorCard).not.toBeNull();
    expect(errorCard?.textContent).toContain("Verify error");
    expect(errorCard?.textContent).toContain("HTTP 401");
    const retryButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-error-action="verify"]',
    );
    expect(retryButton?.textContent).toContain("Retry connection test");
    retryButton?.click();
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });

  it("renders an apply error title for apply failures", async () => {
    const props = createProps();
    props.lastError = "Apply failed: config changed since last load";
    props.lastErrorReason = "apply";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const errorCard = container.querySelector<HTMLElement>('[data-third-party-error-card="true"]');
    expect(errorCard).not.toBeNull();
    expect(errorCard?.textContent).toContain("Apply error");
    expect(errorCard?.textContent).toContain("config changed since last load");
    const retryButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-error-action="apply"]',
    );
    expect(retryButton?.textContent).toContain("Reload config state");
    retryButton?.click();
    expect(props.onReload).toHaveBeenCalledTimes(1);
  });

  it("hides provider docs button when the template has no provider docs url", async () => {
    const props = createProps();
    props.templates[0]!.docsUrl = undefined;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(container.querySelector('[data-third-party-docs-toolbar="true"]')).not.toBeNull();
    expect(container.querySelector('[data-third-party-openclaw-docs-link="true"]')).not.toBeNull();
    expect(container.querySelector('[data-third-party-template-spec-link="true"]')).not.toBeNull();
    expect(container.querySelector('[data-third-party-provider-docs-link="true"]')).toBeNull();
    expect(container.querySelector('[data-third-party-template-summary-docs="true"]')).toBeNull();
    expect(container.querySelector('[data-third-party-template-summary-docs-host="true"]')).toBeNull();
  });

  it("switches auth guidance and credential label for oauth mode", async () => {
    const props = createProps();
    props.form!.auth = "oauth";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    const credentialLabel = Array.from(container.querySelectorAll("span")).find(
      (entry) => entry.textContent?.trim() === "Credential",
    );
    const credentialInput = container.querySelector<HTMLInputElement>('input[type="password"]');

    expect(text).toContain("OAuth / external login flow");
    expect(text).toContain("The current UI only stores the final credential");
    expect(text).toContain("Credential field accepts this oauth-credential");
    expect(credentialLabel).not.toBeNull();
    expect(credentialInput?.placeholder).toContain("OAuth-derived access token");
  });

  it("switches auth guidance and credential label for token mode", async () => {
    const props = createProps();
    props.form!.auth = "token";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    const accessTokenLabel = Array.from(container.querySelectorAll("span")).find(
      (entry) => entry.textContent?.trim() === "Access token",
    );
    const credentialInput = container.querySelector<HTMLInputElement>('input[type="password"]');

    expect(text).toContain("Token flow");
    expect(text).toContain("bearer/session token");
    expect(text).toContain("Credential field accepts this token");
    expect(accessTokenLabel).not.toBeNull();
    expect(credentialInput?.placeholder).toContain("bearer token");
  });

  it("copies provider auth command from the action card", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    const copyButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-auth-action="copy-command"]',
    );
    expect(copyButton).not.toBeNull();

    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("npx yunyi-activator");
    expect(
      container.querySelector('[data-third-party-auth-action-status="copy-command"]')?.textContent,
    ).toContain("Command copied");
    container.remove();
  });

  it("focuses the credential field from the mark-done action", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    const markDoneButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-auth-action="mark-done"]',
    );
    const credentialInput = container.querySelector<HTMLInputElement>(
      'input[data-third-party-credential-input="true"]',
    );
    expect(markDoneButton).not.toBeNull();
    expect(credentialInput).not.toBeNull();
    const focusSpy = vi.spyOn(credentialInput!, "focus");
    const selectSpy = vi.spyOn(credentialInput!, "select");

    markDoneButton?.click();

    expect(focusSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
    expect(
      container.querySelector('[data-third-party-auth-action-status="mark-done"]')?.textContent,
    ).toContain("Credential field focused");
    container.remove();
  });

  it("opens the provider page from the auth action and updates status", async () => {
    const opened = { opener: {} } as WindowProxy;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(opened);
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    const openButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-auth-action="open-url"]',
    );
    expect(openButton).not.toBeNull();

    openButton?.click();

    expect(openSpy).toHaveBeenCalledWith(
      "https://yunyi.rdzhvip.com/codex",
      "_blank",
      "noopener,noreferrer",
    );
    expect(opened.opener).toBeNull();
    expect(
      container.querySelector('[data-third-party-auth-action-status="open-url"]')?.textContent,
    ).toContain("Provider page opened");
    openSpy.mockRestore();
    container.remove();
  });

  it("renders browser callback adapter metadata", async () => {
    const props = createProps();
    props.form!.auth = "oauth";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(container.querySelector('[data-third-party-auth-adapters="true"]')).not.toBeNull();
    expect(container.querySelector('[data-third-party-auth-adapter-card="browser-callback"]')).not.toBeNull();
    expect(text).toContain("callback: http://localhost:1455/auth/callback");
  });

  it("reports adapter status updates when clicking the command adapter", async () => {
    const props = createProps();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const adapterButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-auth-adapter="command"]',
    );
    expect(adapterButton).not.toBeNull();
    adapterButton?.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(props.onAuthAdapterStatusChange).toHaveBeenCalledWith(
      "yunyi-codex::command",
      "Command copied. Run it locally, then paste the resulting credential below.",
    );
    expect(props.onAuthAdapterProgressChange).toHaveBeenCalledWith(
      "yunyi-codex::command",
      expect.objectContaining({
        phase: "copied",
        detail: "Command copied to clipboard.",
      }),
    );
    container.remove();
  });

  it("can mark the command adapter as executed", async () => {
    const props = createProps();
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const executedButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-auth-adapter-executed="command"]',
    );
    expect(executedButton).not.toBeNull();
    executedButton?.click();

    expect(props.onAuthAdapterStatusChange).toHaveBeenCalledWith(
      "yunyi-codex::command",
      "Command marked as executed. Paste the returned credential when ready.",
    );
    expect(props.onAuthAdapterProgressChange).toHaveBeenCalledWith(
      "yunyi-codex::command",
      expect.objectContaining({
        phase: "executed",
        detail: "Command execution confirmed by the operator.",
      }),
    );
    container.remove();
  });

  it("detects an oauth browser callback and can draft the code into the credential field", async () => {
    const props = createProps();
    props.form!.auth = "oauth";
    const browserAdapter = props.templates[0]!.authAdapters?.find(
      (entry) => entry.kind === "browser-callback",
    );
    if (browserAdapter) {
      browserAdapter.callbackUrl = `${window.location.origin}/auth/callback`;
    }
    window.history.replaceState({}, "", "/auth/callback?code=ac_test_code&state=demo");
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(container.querySelector('[data-third-party-callback-capture="true"]')).not.toBeNull();
    expect(container.textContent ?? "").toContain("Browser callback detected");

    const useButton = container.querySelector<HTMLButtonElement>(
      '[data-third-party-callback-use-code="true"]',
    );
    expect(useButton).not.toBeNull();
    useButton?.click();

    expect(props.onFieldChange).toHaveBeenCalledWith("apiKey", "ac_test_code");
    expect(props.onAuthAdapterStatusChange).toHaveBeenCalledWith(
      "yunyi-codex::browser-callback",
      "Callback code drafted into the credential field.",
    );
    expect(props.onAuthAdapterProgressChange).toHaveBeenCalledWith(
      "yunyi-codex::browser-callback",
      expect.objectContaining({
        phase: "callback_received",
        detail: "Callback code drafted into the credential field.",
      }),
    );
    window.history.replaceState({}, "", "/");
  });

  it("renders structured adapter progress details", async () => {
    const props = createProps();
    props.authAdapterProgress = {
      "yunyi-codex::command": {
        phase: "executed",
        updatedAt: 1710000000000,
        detail: "Command execution confirmed by the operator.",
      },
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const progress = container.querySelector(
      '[data-third-party-auth-adapter-progress="command"]',
    );
    expect(progress?.textContent ?? "").toContain("Executed");
    expect(progress?.textContent ?? "").toContain("Updated:");
    expect(progress?.textContent ?? "").toContain("2024-03-09 16:00:00Z");
  });

  it("shows the empty configured nodes sidebar state", async () => {
    const container = document.createElement("div");
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    expect(container.textContent ?? "").toContain("No provider entries detected in current config.");
  });

  it("renders configured nodes entries in the sidebar", async () => {
    const props = createProps();
    props.entries = [
      {
        providerKey: "yunyi-codex",
        baseUrl: "https://yunyi.rdzhvip.com",
        modelId: "yunyi-codex/gpt-5.2",
        auth: "api-key",
        enabled: true,
        hasApiKey: true,
      },
    ];
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Configured nodes");
    expect(text).toContain("yunyi-codex");
    expect(text).toContain("configured");
  });

  it("renders without verify result panel when no verification has been run", async () => {
    const container = document.createElement("div");
    render(renderThirdPartyNodes(createProps()), container);
    await Promise.resolve();

    expect(container.querySelector('[data-third-party-verify-result="true"]')).toBeNull();
  });

  it("renders fallback content when no template is selected", async () => {
    const props = createProps();
    props.selectedTemplateId = null;
    props.form = null;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(container.textContent ?? "").toContain("No template available.");
  });

  it("wires template change, verify, and apply actions", async () => {
    const props = createProps();
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const select = container.querySelector("select");
    expect(select).not.toBeNull();
    (select as HTMLSelectElement).value = "yunyi";
    select?.dispatchEvent(new Event("change", { bubbles: true }));

    const verifyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Test Connection",
    );
    verifyButton?.click();

    const applyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Apply Node",
    );
    applyButton?.click();

    expect(props.onTemplateChange).toHaveBeenCalledWith("yunyi");
    expect(props.onVerify).toHaveBeenCalled();
    expect(props.onApply).toHaveBeenCalled();
  });

  it("renders classified verify guidance for auth failures", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      ok: false,
      status: 401,
      message: "invalid api key",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Authentication Failed");
    expect(text).toContain("The provider rejected the current credential.");
    expect(text).toContain("Verify the API key or token");
    expect(text).toContain("Provider message: invalid api key");
  });

  it("renders verified model suggestions for the model id input", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const modelIdInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.value === "yunyi-codex/gpt-5.2",
    );
    const modelSelect = container.querySelector<HTMLSelectElement>(
      'select[data-third-party-model-select="true"]',
    );
    const text = container.textContent ?? "";

    expect(modelIdInput).not.toBeNull();
    expect(modelSelect).not.toBeNull();
    expect(modelSelect?.querySelectorAll("option")).toHaveLength(3);
    expect(modelSelect?.value).toBe("yunyi-codex/gpt-5.2");
    expect(modelSelect?.textContent).toContain("Yunyi GPT-5.2 Mini");
    expect(text).toContain("Verified models are available in the selector above");
    expect(text).toContain("Discovered models");
    expect(text).toContain("Input: text, image");
    expect(text).toContain("Context: 128000");
    expect(text).toContain("Max output: 32768");
    expect(text).toContain("Selected model summary");
    expect(text).toContain("Source: recent selection");
    expect(text).toContain("Source legend:");
    expect(text).toContain("Manual overrides: 0");
    expect(text).toContain("Apply template defaults back");
    expect(text).toContain("Clear recent");
    expect(text).toContain("Matches template defaults.");
    expect(text).toContain("Recent");
    expect(text).toContain("Model ID");
    expect(text).toContain("Model name");
    expect(
      container.querySelector('[data-third-party-selected-model-summary="true"]'),
    ).not.toBeNull();
  });

  it("shows template capability differences for the selected verified model", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: false,
          input: ["text"],
          contextWindow: 64000,
          maxTokens: 16000,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Template diff");
    expect(text).toContain("Reasoning disabled vs template enabled");
    expect(text).toContain("Image input disabled vs template enabled");
    expect(text).toContain("Context 64000 vs template 128000");
    expect(text).toContain("Max output 16000 vs template 32768");
    expect(text).toContain("Template");
  });

  it("shows verified metadata as the selected model summary source when no recent selection applies", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(
      container.querySelector('[data-third-party-selected-model-summary="true"]')?.textContent,
    ).toContain("Source: verified metadata");
  });

  it("falls back to template defaults in the selected model summary when verified metadata is thin", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(
      container.querySelector('[data-third-party-selected-model-summary="true"]')?.textContent,
    ).toContain("Source: template defaults (Yunyi)");
  });

  it("shows manual source badges when capability fields diverge from verified and template values", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
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
    props.form = {
      ...props.form!,
      reasoning: false,
      supportsImageInput: false,
      contextWindow: 64000,
      maxTokens: 16000,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Manual");
    expect(text).toContain("Manual overrides: 4");
    expect(text).toContain("Manual override groups:");
    expect(text).toContain("Capabilities: 2");
    expect(text).toContain("Limits: 2");
    const reasoningHelpButton = container.querySelector('[data-third-party-field-help="reasoning"]');
    reasoningHelpButton?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(props.onToggleHelpField).toHaveBeenCalledWith("reasoning", "bottom-left");
    props.activeHelpField = "reasoning";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();
    const reasoningPopover = container.querySelector(
      '[data-third-party-field-help-popover="reasoning"]',
    );
    expect(reasoningPopover?.textContent).toContain(
      "Manually changed; reset targets verified value for reasoning.",
    );
  });

  it("renders distinct source styling for recent, verified, template, and manual badges", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2-mini";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    props.form = {
      ...props.form!,
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      supportsImageInput: false,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const recentPill = container.querySelector('[data-third-party-source-pill="recent"]');
    const verifiedPill = container.querySelector('[data-third-party-source-pill="verified"]');
    const templatePill = container.querySelector('[data-third-party-source-pill="template"]');
    const manualPill = container.querySelector('[data-third-party-source-pill="manual"]');

    expect(recentPill?.getAttribute("style")).toContain("color:#9a6700");
    expect(verifiedPill?.getAttribute("style")).toContain("color:var(--success, #1a7f37)");
    expect(templatePill?.getAttribute("style")).toContain("color:#475467");
    expect(manualPill?.getAttribute("style")).toContain("color:var(--danger, #b42318)");
  });

  it("shows model id and model name as manual when they diverge from recent, verified, and template values", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelId: "custom/model",
      modelName: "Custom Model Name",
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Model ID");
    expect(text).toContain("Model name");
    expect(text).toContain("Manual");
    const resetButtons = Array.from(container.querySelectorAll("button")).filter((entry) =>
      entry.getAttribute("aria-label")?.startsWith("Reset to "),
    );
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it("uses recent reset targets in manual field explanations when the current model matches the recent selection", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          contextWindow: 64000,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      contextWindow: 32000,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    props.activeHelpField = "contextWindow";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(
      container.querySelector('[data-third-party-field-help-popover="contextWindow"]')?.textContent,
    ).toContain("reset targets recent verified value for contextWindow");
  });

  it("uses verified reset targets in manual field explanations without recent selection", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          contextWindow: 64000,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      contextWindow: 32000,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    props.activeHelpField = "contextWindow";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(
      container.querySelector('[data-third-party-field-help-popover="contextWindow"]')?.textContent,
    ).toContain("reset targets verified value for contextWindow");
  });

  it("wires single-field reset actions for manual fields", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelId: "custom/model",
      modelName: "Custom Model Name",
      reasoning: false,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const resetButtons = Array.from(container.querySelectorAll("button")).filter((entry) =>
      entry.getAttribute("aria-label")?.startsWith("Reset to "),
    );
    expect(resetButtons.length).toBeGreaterThan(0);
    expect(resetButtons[0]?.getAttribute("title")).toContain("Reset to");

    resetButtons[0]?.click();

    expect(props.onResetField).toHaveBeenCalled();
  });

  it("routes the model name reset button to the correct field", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.getAttribute("aria-label") === "Reset to verified model name",
    );
    expect(button).not.toBeNull();

    button?.click();

    expect(props.onResetField).toHaveBeenCalledWith("modelName");
  });

  it("routes the context window reset button to the correct field", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        { id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2", contextWindow: 64000 },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      contextWindow: 32000,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.getAttribute("aria-label") === "Reset to verified value",
    );
    expect(button).not.toBeNull();

    button?.click();

    expect(props.onResetField).toHaveBeenCalledWith("contextWindow");
  });

  it("routes the reasoning reset button to the correct field", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2", reasoning: true }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = { ...props.form!, reasoning: false };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.getAttribute("aria-label") === "Reset to verified value",
    );
    expect(button).not.toBeNull();

    button?.click();

    expect(props.onResetField).toHaveBeenCalledWith("reasoning");
  });

  it("routes the image input reset button to the correct field", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2", input: ["text", "image"] }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = { ...props.form!, supportsImageInput: false };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.getAttribute("aria-label") === "Reset to verified value",
    );
    expect(button).not.toBeNull();

    button?.click();

    expect(props.onResetField).toHaveBeenCalledWith("supportsImageInput");
  });

  it("routes the max tokens reset button to the correct field", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2", maxTokens: 16000 }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = { ...props.form!, maxTokens: 8000 };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const buttons = Array.from(container.querySelectorAll("button")).filter(
      (entry) => entry.getAttribute("aria-label") === "Reset to verified value",
    );
    expect(buttons.length).toBeGreaterThan(0);

    buttons.at(-1)?.click();

    expect(props.onResetField).toHaveBeenCalledWith("maxTokens");
  });

  it("toggles manual field highlighting from the summary counter", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
    };
    props.highlightManualFields = true;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const toggleButton = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.textContent?.trim() === "Manual overrides: 1",
    );
    expect(toggleButton).not.toBeNull();
    expect(container.textContent ?? "").toContain("Highlighting manual fields");

    toggleButton?.click();

    expect(props.onToggleManualHighlights).toHaveBeenCalled();
  });

  it("shows and dismisses the manual highlight notice", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
    };
    props.highlightManualFields = true;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(container.textContent ?? "").toContain("Highlighting manual fields");

    const dismissButton = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.getAttribute("aria-label") === "Dismiss manual highlight notice",
    );
    expect(dismissButton).not.toBeNull();

    dismissButton?.click();

    expect(props.onDismissManualHighlightNotice).toHaveBeenCalled();
  });

  it("keeps the manual highlight notice hidden when dismissal is already persisted", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
    };
    props.highlightManualFields = true;
    props.manualHighlightNoticeDismissed = true;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    expect(container.textContent ?? "").not.toContain("Highlighting manual fields");
  });

  it("renders source legend badges with hover hints", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const legend = container.querySelector('[data-third-party-source-legend="true"]');
    expect(legend).not.toBeNull();
    expect(legend?.textContent).toContain("Source legend:");
    expect(legend?.querySelector('[data-third-party-source-pill="recent"]')?.getAttribute("title")).toContain(
      "Recently selected",
    );
    expect(
      container
        .querySelector('[data-third-party-selected-model-summary="true"] .muted')
        ?.getAttribute("title"),
    ).toContain("Summary source explains");
  });

  it("focuses a source from the legend and can clear that focus", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.focusedSource = "verified";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const verifiedLegendButton = container.querySelector(
      '[data-third-party-source-legend-button="verified"]',
    );
    const clearFocusButton = container.querySelector('[data-third-party-source-clear-focus="true"]');
    const banner = container.querySelector('[data-third-party-focus-banner="true"]');
    const focusedField = container.querySelector('[data-third-party-field-source="verified"]');

    expect(verifiedLegendButton).not.toBeNull();
    expect(clearFocusButton).not.toBeNull();
    expect(banner?.textContent).toContain("Focusing verified fields.");
    expect(
      banner
        ?.querySelector(
          '[data-third-party-focus-banner-kind="source"][data-third-party-focus-banner-value="verified"]',
        )
        ?.textContent,
    ).toContain("Verified");
    expect(focusedField?.getAttribute("style")).toContain("box-shadow:inset 3px 0 0");

    verifiedLegendButton?.dispatchEvent(new Event("click", { bubbles: true }));
    clearFocusButton?.dispatchEvent(new Event("click", { bubbles: true }));
    banner
      ?.querySelector(
        '[data-third-party-focus-banner-kind="source"][data-third-party-focus-banner-value="verified"]',
      )
      ?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusSource).toHaveBeenNthCalledWith(1, null);
    expect(props.onFocusSource).toHaveBeenNthCalledWith(2, null);
    expect(props.onFocusSource).toHaveBeenNthCalledWith(3, null);
  });

  it("selects a new source from the legend when it is not already focused", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const recentLegendButton = container.querySelector(
      '[data-third-party-source-legend-button="recent"]',
    );
    expect(recentLegendButton).not.toBeNull();

    recentLegendButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusSource).toHaveBeenCalledWith("recent");
  });

  it("focuses manual fields from the manual override group chips", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
      contextWindow: 64000,
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const groupButton = container.querySelector('[data-third-party-manual-group="identity"]');
    expect(groupButton).not.toBeNull();

    groupButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusManualGroup).toHaveBeenCalledWith("identity");
  });

  it("highlights only the focused manual override group fields", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
      contextWindow: 64000,
    };
    props.focusedSource = "manual";
    props.focusedManualGroup = "identity";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const identityField = container.querySelector(
      '[data-third-party-field-group="identity"][data-third-party-manual-field="true"]',
    );
    const limitsField = container.querySelector(
      '[data-third-party-field-group="limits"][data-third-party-manual-field="true"]',
    );
    const banner = container.querySelector('[data-third-party-focus-banner="true"]');

    expect(banner?.textContent).toContain("Focusing manual identity fields.");
    expect(
      banner
        ?.querySelector(
          '[data-third-party-focus-banner-kind="group"][data-third-party-focus-banner-value="identity"]',
        )
        ?.textContent,
    ).toContain("Identity");
    expect(identityField?.getAttribute("style")).toContain("outline:1px solid");
    expect(limitsField?.getAttribute("style")).not.toContain("outline:1px solid");

    banner
      ?.querySelector(
        '[data-third-party-focus-banner-kind="group"][data-third-party-focus-banner-value="identity"]',
      )
      ?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(props.onFocusManualGroup).toHaveBeenCalledWith(null);
  });

  it("shows per-field explanations for verified and template sources", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    props.activeHelpField = "modelId";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();
    expect(
      container.querySelector('[data-third-party-field-help-popover="modelId"]')?.textContent,
    ).toContain("Matches verified provider metadata for Yunyi GPT-5.2.");
    expect(
      container.querySelector('[data-third-party-field-help-popover="modelId"]')?.getAttribute("style"),
    ).toContain("position:absolute");
    expect(
      container.querySelector('[data-third-party-field-help-popover="modelId"]')?.getAttribute("style"),
    ).toContain("animation:third-party-help-pop");
    props.activeHelpField = "maxTokens";
    props.activeHelpPopoverPlacement = "bottom-right";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();
    expect(
      container.querySelector('[data-third-party-field-help-popover="maxTokens"]')?.getAttribute("style"),
    ).toContain("right:0");
    props.activeHelpField = "modelName";
    props.activeHelpPopoverPlacement = "top-left";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();
    expect(
      container.querySelector('[data-third-party-field-help-popover="modelName"]')?.getAttribute("style"),
    ).toContain("bottom:calc(100% + 6px)");
    props.activeHelpField = "reasoning";
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();
    expect(
      container.querySelector('[data-third-party-field-help-popover="reasoning"]')?.textContent,
    ).toContain("Using defaults from the Yunyi template (yunyi-codex/gpt-5.2).");
  });

  it("computes help popover placement near the right edge", async () => {
    const props = createProps();
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 240 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });

    const helpButton = container.querySelector('[data-third-party-field-help="reasoning"]');
    expect(helpButton).not.toBeNull();
    Object.defineProperty(helpButton!, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 200,
        right: 216,
        top: 100,
        bottom: 118,
        width: 16,
        height: 18,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      }),
    });

    helpButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onToggleHelpField).toHaveBeenCalledWith("reasoning", "bottom-right");

    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
  });

  it("computes help popover placement above the trigger when vertical space is tight", async () => {
    const props = createProps();
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 260 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 180 });

    const helpButton = container.querySelector('[data-third-party-field-help="modelName"]');
    expect(helpButton).not.toBeNull();
    Object.defineProperty(helpButton!, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 220,
        right: 238,
        top: 150,
        bottom: 168,
        width: 18,
        height: 18,
        x: 220,
        y: 150,
        toJSON: () => ({}),
      }),
    });

    helpButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onToggleHelpField).toHaveBeenCalledWith("modelName", "top-right");

    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
  });

  it("clears focus from the focus banner action", async () => {
    const props = createProps();
    props.focusedSource = "template";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const clearButton = container.querySelector('[data-third-party-focus-banner-clear="true"]');
    expect(clearButton).not.toBeNull();

    clearButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusSource).toHaveBeenCalledWith(null);
  });

  it("offers the full source toggle group in the focus banner", async () => {
    const props = createProps();
    props.focusedSource = "manual";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const banner = container.querySelector('[data-third-party-focus-banner="true"]');
    const recentButton = banner?.querySelector(
      '[data-third-party-focus-banner-kind="source"][data-third-party-focus-banner-value="recent"]',
    );
    const templateButton = banner?.querySelector(
      '[data-third-party-focus-banner-kind="source"][data-third-party-focus-banner-value="template"]',
    );
    expect(banner?.textContent).toContain("Source:");

    expect(recentButton).not.toBeNull();
    expect(templateButton).not.toBeNull();

    recentButton?.dispatchEvent(new Event("click", { bubbles: true }));
    templateButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusSource).toHaveBeenNthCalledWith(1, "recent");
    expect(props.onFocusSource).toHaveBeenNthCalledWith(2, "template");
  });

  it("toggles manual override group chips back off when clicking the active chip", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
      contextWindow: 64000,
    };
    props.focusedManualGroup = "identity";
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const groupButton = container.querySelector('[data-third-party-manual-group="identity"]');
    expect(groupButton).not.toBeNull();

    groupButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusManualGroup).toHaveBeenCalledWith(null);
  });

  it("offers the full manual group toggle set in the focus banner", async () => {
    const props = createProps();
    props.focusedSource = "manual";
    props.focusedManualGroup = "capabilities";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const banner = container.querySelector('[data-third-party-focus-banner="true"]');
    const identityButton = banner?.querySelector(
      '[data-third-party-focus-banner-kind="group"][data-third-party-focus-banner-value="identity"]',
    );
    const capabilitiesButton = banner?.querySelector(
      '[data-third-party-focus-banner-kind="group"][data-third-party-focus-banner-value="capabilities"]',
    );
    const limitsButton = banner?.querySelector(
      '[data-third-party-focus-banner-kind="group"][data-third-party-focus-banner-value="limits"]',
    );
    expect(banner?.textContent).toContain("Group:");

    expect(identityButton).not.toBeNull();
    expect(capabilitiesButton).not.toBeNull();
    expect(limitsButton).not.toBeNull();

    identityButton?.dispatchEvent(new Event("click", { bubbles: true }));
    capabilitiesButton?.dispatchEvent(new Event("click", { bubbles: true }));
    limitsButton?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(props.onFocusManualGroup).toHaveBeenNthCalledWith(1, "identity");
    expect(props.onFocusManualGroup).toHaveBeenNthCalledWith(2, null);
    expect(props.onFocusManualGroup).toHaveBeenNthCalledWith(3, "limits");
  });

  it("marks manual fields for highlight targeting", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.form = {
      ...props.form!,
      modelName: "Custom Model Name",
    };
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const manualTargets = container.querySelectorAll("[data-third-party-manual-field='true']");
    expect(manualTargets.length).toBeGreaterThan(0);
  });

  it("wires apply template defaults action from selected model summary", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: false,
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.textContent?.trim() === "Apply template defaults back",
    );
    expect(button).not.toBeNull();

    button?.click();

    expect(props.onApplyTemplateDefaults).toHaveBeenCalled();
  });

  it("wires clear recent action from selected model summary", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [{ id: "yunyi-codex/gpt-5.2", name: "Yunyi GPT-5.2" }],
      modelIds: ["yunyi-codex/gpt-5.2"],
      message: "Connection OK: discovered 1 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const button = Array.from(container.querySelectorAll("button")).find(
      (entry) => entry.textContent?.trim() === "Clear recent",
    );
    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(false);

    button?.click();

    expect(props.onClearRecentModel).toHaveBeenCalled();
  });

  it("wires verified model selection through the real dropdown", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2-mini";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const modelSelect = container.querySelector<HTMLSelectElement>(
      'select[data-third-party-model-select="true"]',
    );
    expect(modelSelect).not.toBeNull();

    modelSelect!.value = "yunyi-codex/gpt-5.2-mini";
    modelSelect!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(modelSelect?.textContent).toContain("Recent");
    expect(props.onFieldChange).toHaveBeenCalledWith("modelId", "yunyi-codex/gpt-5.2-mini");
  });

  it("shows the recent badge on the recent verify result card", async () => {
    const props = createProps();
    props.recentModelId = "yunyi-codex/gpt-5.2-mini";
    props.form!.modelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const recentLabel = Array.from(container.querySelectorAll("div")).find((entry) =>
      entry.textContent?.includes("Yunyi GPT-5.2 Mini"),
    );
    expect(container.querySelectorAll('[data-third-party-source-pill="recent"]').length).toBeGreaterThan(0);
    expect(recentLabel?.textContent).toContain("Recent");
  });

  it("wires verified model selection through the verify result card action", async () => {
    const props = createProps();
    props.form!.modelId = "yunyi-codex/gpt-5.2";
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
          input: ["text"],
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const buttons = Array.from(container.querySelectorAll("button"));
    const actionButton = buttons.find((button) => button.textContent?.trim() === "Use this model");
    expect(actionButton).not.toBeNull();

    actionButton?.click();

    expect(props.onFieldChange).toHaveBeenCalledWith("modelId", "yunyi-codex/gpt-5.2-mini");
    expect(container.textContent ?? "").toContain("Selected");
  });

  it("filters discovered models by reasoning and image support", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text", "image"],
        },
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
          reasoning: false,
          input: ["text"],
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 2 model(s).",
    });
    props.filterReasoningOnly = true;
    props.filterImageOnly = true;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Showing 1 of 2");
    expect(text).toContain("Yunyi GPT-5.2");
    expect(text).not.toContain("Yunyi GPT-5.2 MiniUse this model");

    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    const reasoningFilter = checkboxes.find((input) =>
      input.parentElement?.textContent?.includes("Reasoning only"),
    );
    const imageFilter = checkboxes.find((input) =>
      input.parentElement?.textContent?.includes("Image only"),
    );
    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Clear filters",
    );

    expect(reasoningFilter).not.toBeNull();
    expect(imageFilter).not.toBeNull();
    expect(clearButton).not.toBeNull();
    expect(clearButton?.disabled).toBe(false);

    reasoningFilter?.dispatchEvent(new Event("change", { bubbles: true }));
    imageFilter?.dispatchEvent(new Event("change", { bubbles: true }));
    clearButton?.click();

    expect(props.onFilterReasoningOnlyChange).toHaveBeenCalled();
    expect(props.onFilterImageOnlyChange).toHaveBeenCalled();
    expect(props.onClearFilters).toHaveBeenCalled();
  });

  it("shows the empty filtered state when no discovered model matches the active filters", async () => {
    const props = createProps();
    props.verifyResult = createVerifyResult({
      models: [
        {
          id: "yunyi-codex/gpt-5.2-mini",
          name: "Yunyi GPT-5.2 Mini",
          reasoning: false,
          input: ["text"],
        },
      ],
      modelIds: ["yunyi-codex/gpt-5.2-mini"],
      message: "Connection OK: discovered 1 model(s).",
    });
    props.filterReasoningOnly = true;
    props.filterImageOnly = true;
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Showing 0 of 1");
    expect(text).toContain("No models match the current filters.");
  });

  it("renders and wires the custom apply confirmation card", async () => {
    const props = createProps();
    props.applyConfirm = createApplyConfirm({
      title: t("thirdPartyNodes.applyConfirm.failedTitle"),
      message: t("thirdPartyNodes.applyConfirm.failedMessage", { status: "401" }),
      detail: "invalid api key",
      severity: "danger",
      statusLabel: "HTTP 401",
      recommendation: t("thirdPartyNodes.applyConfirm.failedRecommendation"),
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.failedTitle"));
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.title"));
    expect(text).toContain("HTTP 401");
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.recommendedAction"));
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.testConnection"));
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.applyAnyway"));
    expect(text).toContain(t("thirdPartyNodes.applyConfirm.cancel"));

    const buttons = Array.from(container.querySelectorAll("button"));
    buttons.find((button) => button.textContent?.trim() === t("thirdPartyNodes.applyConfirm.testConnection"))?.click();
    buttons.find((button) => button.textContent?.trim() === t("thirdPartyNodes.applyConfirm.applyAnyway"))?.click();
    buttons.find((button) => button.textContent?.trim() === t("thirdPartyNodes.applyConfirm.cancel"))?.click();

    expect(props.onVerify).toHaveBeenCalled();
    expect(props.onApplyConfirm).toHaveBeenCalled();
    expect(props.onApplyCancel).toHaveBeenCalled();
  });

  it("uses a non-danger confirm action for untested apply", async () => {
    const props = createProps();
    props.applyConfirm = createApplyConfirm({
      title: t("thirdPartyNodes.applyConfirm.untestedTitle"),
      message: t("thirdPartyNodes.applyConfirm.untestedMessage"),
      detail: t("thirdPartyNodes.applyConfirm.untestedDetail"),
      severity: "warning",
      statusLabel: t("thirdPartyNodes.applyConfirm.untestedStatus"),
      recommendation: t("thirdPartyNodes.applyConfirm.untestedRecommendation"),
    });
    const container = document.createElement("div");
    render(renderThirdPartyNodes(props), container);
    await Promise.resolve();

    const confirmButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === t("thirdPartyNodes.applyConfirm.applyWithoutTest"),
    );
    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.className).toContain("primary");
    expect(confirmButton?.className).not.toContain("danger");
  });
});
