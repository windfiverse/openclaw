import { describe, expect, it } from "vitest";
import { applyThirdPartyNodeDraftToConfig, listThirdPartyNodeStatusEntries, toProviderConfig } from "./mapping.js";

describe("third-party node mapping", () => {
  it("builds a provider config from a dashboard draft", () => {
    const provider = toProviderConfig({
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      apiKey: "YUNYI_API_KEY",
      auth: "api-key",
      api: "openai-responses",
      modelId: "yunyi-codex/gpt-5.2",
      enabled: true,
    });

    expect(provider.baseUrl).toBe("https://yunyi.rdzhvip.com");
    expect(provider.apiKey).toBe("YUNYI_API_KEY");
    expect(provider.api).toBe("openai-responses");
    expect(provider.models[0]?.id).toBe("yunyi-codex/gpt-5.2");
  });

  it("adds and removes providers in config", () => {
    const enabledConfig = applyThirdPartyNodeDraftToConfig(
      {},
      {
        providerKey: "yunyi-codex",
        label: "Yunyi GPT-5.2",
        baseUrl: "https://yunyi.rdzhvip.com",
        apiKey: "YUNYI_API_KEY",
        auth: "api-key",
        api: "openai-responses",
        modelId: "yunyi-codex/gpt-5.2",
        enabled: true,
      },
    );
    const entries = listThirdPartyNodeStatusEntries(enabledConfig);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.providerKey).toBe("yunyi-codex");

    const disabledConfig = applyThirdPartyNodeDraftToConfig(enabledConfig, {
      providerKey: "yunyi-codex",
      label: "Yunyi GPT-5.2",
      baseUrl: "https://yunyi.rdzhvip.com",
      modelId: "yunyi-codex/gpt-5.2",
      enabled: false,
    });
    expect(listThirdPartyNodeStatusEntries(disabledConfig)).toEqual([]);
  });
});
