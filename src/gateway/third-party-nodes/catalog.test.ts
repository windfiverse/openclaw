import { describe, expect, it } from "vitest";
import {
  listThirdPartyNodeTemplates,
  validateThirdPartyNodeTemplate,
  type ThirdPartyNodeTemplate,
} from "./catalog.ts";

function createTemplate(): ThirdPartyNodeTemplate {
  return {
    id: "test-provider",
    label: "Test Provider",
    description: "Test template",
    providerKeyDefault: "test-provider",
    authOptions: ["api-key", "oauth"],
    defaultAuth: "api-key",
    defaultApi: "openai-responses",
    baseUrlPresets: [{ label: "Default", url: "https://example.com" }],
    defaultModel: {
      id: "test-model",
      name: "Test Model",
      reasoning: true,
      input: ["text"],
      contextWindow: 1024,
      maxTokens: 512,
    },
  };
}

describe("third-party node catalog", () => {
  it("returns cloned validated templates", () => {
    const templates = listThirdPartyNodeTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).not.toBeUndefined();
    if (!templates[0]) {
      return;
    }
    const originalAuthOptions = templates[0].authOptions;
    originalAuthOptions.push("oauth");
    const freshTemplates = listThirdPartyNodeTemplates();
    expect(freshTemplates[0]?.authOptions).not.toBe(originalAuthOptions);
  });

  it("includes the groq manual-paste template", () => {
    const groq = listThirdPartyNodeTemplates().find((entry) => entry.id === "groq");

    expect(groq).toBeDefined();
    expect(groq?.baseUrlPresets[0]?.url).toBe("https://api.groq.com/openai/v1");
    expect(groq?.docsUrl).toBe("https://console.groq.com/docs/openai");
    expect(groq?.authAdapters?.[0]?.kind).toBe("manual-paste");
  });

  it("rejects browser-callback adapters without provider url", () => {
    const template = createTemplate();
    template.authAdapters = [
      {
        kind: "browser-callback",
        label: "Web login",
        callbackUrl: "http://localhost:1455/auth/callback",
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/must declare url/i);
  });

  it("rejects callbackUrl on non browser-callback adapters", () => {
    const template = createTemplate();
    template.authAdapters = [
      {
        kind: "manual-paste",
        label: "Paste credential",
        callbackUrl: "http://localhost:1455/auth/callback",
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/only browser-callback adapters/i);
  });

  it("rejects copy-command actions without a value", () => {
    const template = createTemplate();
    template.authFlowActions = [
      {
        kind: "copy-command",
        label: "Copy activator",
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/must declare value/i);
  });

  it("rejects open-url actions without a url", () => {
    const template = createTemplate();
    template.authFlowActions = [
      {
        kind: "open-url",
        label: "Open docs",
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/must declare url/i);
  });

  it("rejects defaultAuth values that are not present in authOptions", () => {
    const template = createTemplate();
    template.authOptions = ["api-key"];
    template.defaultAuth = "oauth";

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/defaultAuth .* must also appear/i);
  });

  it("rejects adapter authModes outside template authOptions", () => {
    const template = createTemplate();
    template.authOptions = ["api-key"];
    template.authAdapters = [
      {
        kind: "manual-paste",
        label: "Paste credential",
        authModes: ["oauth"],
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/uses auth mode .* outside authOptions/i);
  });

  it("rejects action authModes outside template authOptions", () => {
    const template = createTemplate();
    template.authOptions = ["api-key"];
    template.authFlowActions = [
      {
        kind: "mark-done",
        label: "Done",
        authModes: ["oauth"],
      },
    ];

    expect(() => validateThirdPartyNodeTemplate(template)).toThrow(/uses auth mode .* outside authOptions/i);
  });
});
