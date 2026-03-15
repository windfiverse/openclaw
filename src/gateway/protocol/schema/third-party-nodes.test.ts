import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import { ThirdPartyNodeTemplateSchema } from "./third-party-nodes.ts";

function createTemplate() {
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

describe("third-party node schema", () => {
  it("accepts a browser-callback adapter with provider url", () => {
    const template = createTemplate();
    template.authAdapters = [
      {
        kind: "browser-callback",
        label: "Web login",
        url: "https://example.com/login",
        callbackUrl: "http://localhost:1455/auth/callback",
      },
    ];

    expect(Value.Check(ThirdPartyNodeTemplateSchema, template)).toBe(true);
  });

  it("rejects a browser-callback adapter without provider url", () => {
    const template = createTemplate();
    template.authAdapters = [
      {
        kind: "browser-callback",
        label: "Web login",
        callbackUrl: "http://localhost:1455/auth/callback",
      },
    ];

    expect(Value.Check(ThirdPartyNodeTemplateSchema, template)).toBe(false);
  });

  it("rejects a copy-command action without value", () => {
    const template = createTemplate();
    template.authFlowActions = [
      {
        kind: "copy-command",
        label: "Copy command",
      },
    ];

    expect(Value.Check(ThirdPartyNodeTemplateSchema, template)).toBe(false);
  });

  it("rejects an open-url action without url", () => {
    const template = createTemplate();
    template.authFlowActions = [
      {
        kind: "open-url",
        label: "Open docs",
      },
    ];

    expect(Value.Check(ThirdPartyNodeTemplateSchema, template)).toBe(false);
  });
});
