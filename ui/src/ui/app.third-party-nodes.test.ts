// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { mountApp, registerAppMountHooks } from "./test-helpers/app-mount.ts";

registerAppMountHooks();

describe("third-party nodes app interactions", () => {
  it("clears help state and placement on Escape", async () => {
    const app = mountApp("/aiAgents");
    app.thirdPartyNodesActiveHelpField = "reasoning";
    app.thirdPartyNodesActiveHelpPopoverPlacement = "top-right";
    await app.updateComplete;

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await app.updateComplete;

    expect(app.thirdPartyNodesActiveHelpField).toBeNull();
    expect(app.thirdPartyNodesActiveHelpPopoverPlacement).toBe("bottom-left");
  });

  it("clears help state and placement on outside pointerdown but preserves inside clicks", async () => {
    const app = mountApp("/aiAgents");
    app.thirdPartyNodesActiveHelpField = "modelName";
    app.thirdPartyNodesActiveHelpPopoverPlacement = "top-left";
    await app.updateComplete;

    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await app.updateComplete;

    expect(app.thirdPartyNodesActiveHelpField).toBeNull();
    expect(app.thirdPartyNodesActiveHelpPopoverPlacement).toBe("bottom-left");

    app.thirdPartyNodesActiveHelpField = "modelName";
    app.thirdPartyNodesActiveHelpPopoverPlacement = "top-left";
    await app.updateComplete;

    const insideTarget = document.createElement("div");
    insideTarget.dataset.thirdPartyFieldHelpContainer = "true";
    const insideEvent = new Event("pointerdown", { bubbles: true }) as Event & {
      composedPath?: () => EventTarget[];
    };
    insideEvent.composedPath = () => [insideTarget];
    document.dispatchEvent(insideEvent);
    await app.updateComplete;

    expect(app.thirdPartyNodesActiveHelpField).toBe("modelName");
    expect(app.thirdPartyNodesActiveHelpPopoverPlacement).toBe("top-left");
  });

  it("records browser callback progress when auto-drafting oauth code", async () => {
    window.history.replaceState({}, "", "/ai-agents?code=ac_test_code&state=demo");
    const app = mountApp("/ai-agents?code=ac_test_code&state=demo");
    await app.updateComplete;
    app.thirdPartyNodesSelectedTemplateId = "yunyi";
    app.thirdPartyNodesTemplates = [
      {
        id: "yunyi",
        label: "Yunyi",
        description: "Yunyi node",
        providerKeyDefault: "yunyi-codex",
        authOptions: ["oauth"],
        defaultAuth: "oauth",
        defaultApi: "openai-responses",
        baseUrlPresets: [{ label: "yunyi", url: "https://yunyi.rdzhvip.com" }],
        defaultModel: {
          id: "yunyi-codex/gpt-5.2",
          name: "Yunyi GPT-5.2",
          reasoning: true,
          input: ["text"],
          contextWindow: 128000,
          maxTokens: 32768,
        },
        authAdapters: [
          {
            kind: "browser-callback",
            label: "Provider web login",
            detail: "Login in browser",
            url: "https://yunyi.rdzhvip.com/codex",
            callbackUrl: `${window.location.origin}/ai-agents`,
            authModes: ["oauth"],
          },
        ],
      },
    ] as typeof app.thirdPartyNodesTemplates;
    app.thirdPartyNodesForm = {
      providerKey: "yunyi-codex",
      label: "Yunyi",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "",
      auth: "oauth",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      modelName: "Yunyi GPT-5.2",
      enabled: true,
      reasoning: true,
      supportsImageInput: false,
      contextWindow: 128000,
      maxTokens: 32768,
    };
    app.requestUpdate();
    await app.updateComplete;
    await Promise.resolve();
    await app.updateComplete;

    expect(app.thirdPartyNodesHandledCallbacks["yunyi-codex::browser-callback"]).toBe("ac_test_code");
    expect(app.thirdPartyNodesAuthAdapterProgress["yunyi-codex::browser-callback"]).toMatchObject({
      phase: "callback_received",
      detail: t("thirdPartyNodes.authGuide.callbackAutoDraftedDetail"),
    });
    expect(app.thirdPartyNodesForm?.apiKey).toBe("ac_test_code");
  });
});
