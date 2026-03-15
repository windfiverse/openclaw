import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UiSettings } from "./storage.ts";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

function setTestLocation(params: { protocol: string; host: string; pathname: string }) {
  if (typeof window !== "undefined" && window.history?.replaceState) {
    window.history.replaceState({}, "", params.pathname);
    return;
  }
  vi.stubGlobal("location", {
    protocol: params.protocol,
    host: params.host,
    pathname: params.pathname,
  } as Location);
}

function setControlUiBasePath(value: string | undefined) {
  if (typeof window === "undefined") {
    vi.stubGlobal(
      "window",
      value == null
        ? ({} as Window & typeof globalThis)
        : ({ __OPENCLAW_CONTROL_UI_BASE_PATH__: value } as Window & typeof globalThis),
    );
    return;
  }
  if (value == null) {
    delete window.__OPENCLAW_CONTROL_UI_BASE_PATH__;
    return;
  }
  Object.defineProperty(window, "__OPENCLAW_CONTROL_UI_BASE_PATH__", {
    value,
    writable: true,
    configurable: true,
  });
}

function expectedGatewayUrl(basePath: string): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${basePath}`;
}

function createSettings(overrides: Partial<UiSettings> = {}): UiSettings {
  return {
    gatewayUrl: "wss://gateway.example:8443/openclaw",
    token: "",
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "claw",
    themeMode: "system",
    chatFocusMode: false,
    chatShowThinking: true,
    splitRatio: 0.6,
    navCollapsed: false,
    navWidth: 220,
    navGroupsCollapsed: {},
    thirdPartyNodesFilterReasoningOnly: false,
    thirdPartyNodesFilterImageOnly: false,
    thirdPartyNodesRecentModels: {},
    thirdPartyNodesHighlightManualFields: false,
    thirdPartyNodesManualHighlightNoticeDismissed: false,
    thirdPartyNodesFocusedSource: null,
    thirdPartyNodesFocusedManualGroup: null,
    thirdPartyNodesAuthAdapterStatuses: {},
    thirdPartyNodesHandledCallbacks: {},
    thirdPartyNodesAuthAdapterProgress: {},
    ...overrides,
  };
}

function createPersistedSettings(overrides: Partial<UiSettings> = {}) {
  const { token: _token, ...persisted } = createSettings(overrides);
  return persisted;
}

describe("loadSettings default gateway URL derivation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("sessionStorage", createStorageMock());
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
    localStorage.clear();
    sessionStorage.clear();
    setControlUiBasePath(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setControlUiBasePath(undefined);
    vi.unstubAllGlobals();
  });

  it("uses configured base path and normalizes trailing slash", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/ignored/path",
    });
    setControlUiBasePath(" /openclaw/ ");

    const { loadSettings } = await import("./storage.ts");
    expect(loadSettings().gatewayUrl).toBe(expectedGatewayUrl("/openclaw"));
  });

  it("infers base path from nested pathname when configured base path is not set", async () => {
    setTestLocation({
      protocol: "http:",
      host: "gateway.example:18789",
      pathname: "/apps/openclaw/chat",
    });

    const { loadSettings } = await import("./storage.ts");
    expect(loadSettings().gatewayUrl).toBe(expectedGatewayUrl("/apps/openclaw"));
  });

  it("ignores and scrubs legacy persisted tokens", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });
    sessionStorage.setItem("openclaw.control.token.v1", "legacy-session-token");
    localStorage.setItem(
      "openclaw.control.settings.v1",
      JSON.stringify({
        gatewayUrl: "wss://gateway.example:8443/openclaw",
        token: "persisted-token",
        sessionKey: "agent",
      }),
    );

    const { loadSettings } = await import("./storage.ts");
    expect(loadSettings()).toMatchObject({
      gatewayUrl: "wss://gateway.example:8443/openclaw",
      token: "",
      sessionKey: "agent",
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toEqual(
      createPersistedSettings({
        sessionKey: "agent",
        lastActiveSessionKey: "agent",
      }),
    );
    expect(sessionStorage.length).toBe(0);
  });

  it("loads the current-tab token from sessionStorage", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(createSettings({ token: "session-token" }));

    expect(loadSettings()).toMatchObject({
      gatewayUrl: "wss://gateway.example:8443/openclaw",
      token: "session-token",
    });
  });

  it("does not reuse a session token for a different gatewayUrl", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(createSettings({ token: "gateway-a-token" }));

    localStorage.setItem(
      "openclaw.control.settings.v1",
      JSON.stringify(
        createSettings({
          gatewayUrl: "wss://other-gateway.example:8443/openclaw",
        }),
      ),
    );

    expect(loadSettings()).toMatchObject({
      gatewayUrl: "wss://other-gateway.example:8443/openclaw",
      token: "",
    });
  });

  it("does not persist gateway tokens when saving settings", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(createSettings({ token: "memory-only-token" }));

    expect(loadSettings()).toMatchObject({
      gatewayUrl: "wss://gateway.example:8443/openclaw",
      token: "memory-only-token",
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toEqual(
      createPersistedSettings(),
    );
    expect(sessionStorage.length).toBe(1);
  });

  it("clears the current-tab token when saving an empty token", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(createSettings({ token: "stale-token" }));
    saveSettings(createSettings());

    expect(loadSettings().token).toBe("");
    expect(sessionStorage.length).toBe(0);
  });

  it("persists themeMode and navWidth alongside the selected theme", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        theme: "dash",
        themeMode: "light",
        navWidth: 320,
      }),
    );

    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        theme: "dash",
        themeMode: "light",
        navWidth: 320,
      },
    );
  });

  it("persists third-party node model filters", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesFilterReasoningOnly: true,
        thirdPartyNodesFilterImageOnly: true,
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesFilterReasoningOnly: true,
      thirdPartyNodesFilterImageOnly: true,
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesFilterReasoningOnly: true,
        thirdPartyNodesFilterImageOnly: true,
      },
    );
  });

  it("persists recent third-party node models", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesRecentModels: { "yunyi-codex": "yunyi-codex/gpt-5.2-mini" },
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesRecentModels: { "yunyi-codex": "yunyi-codex/gpt-5.2-mini" },
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesRecentModels: { "yunyi-codex": "yunyi-codex/gpt-5.2-mini" },
      },
    );
  });

  it("persists manual field highlight preference for third-party nodes", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesHighlightManualFields: true,
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesHighlightManualFields: true,
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesHighlightManualFields: true,
      },
    );
  });

  it("persists manual highlight notice dismissal for third-party nodes", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesManualHighlightNoticeDismissed: true,
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesManualHighlightNoticeDismissed: true,
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesManualHighlightNoticeDismissed: true,
      },
    );
  });

  it("persists third-party node source focus state", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesFocusedSource: "manual",
        thirdPartyNodesFocusedManualGroup: "capabilities",
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesFocusedSource: "manual",
      thirdPartyNodesFocusedManualGroup: "capabilities",
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesFocusedSource: "manual",
        thirdPartyNodesFocusedManualGroup: "capabilities",
      },
    );
  });

  it("persists third-party auth adapter statuses", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesAuthAdapterStatuses: {
          "yunyi-codex::command": "Command copied",
        },
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesAuthAdapterStatuses: {
        "yunyi-codex::command": "Command copied",
      },
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesAuthAdapterStatuses: {
          "yunyi-codex::command": "Command copied",
        },
      },
    );
  });

  it("persists handled browser callback markers", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesHandledCallbacks: {
          "yunyi-codex::browser-callback": "ac_test_code",
        },
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesHandledCallbacks: {
        "yunyi-codex::browser-callback": "ac_test_code",
      },
    });
    expect(JSON.parse(localStorage.getItem("openclaw.control.settings.v1") ?? "{}")).toMatchObject(
      {
        thirdPartyNodesHandledCallbacks: {
          "yunyi-codex::browser-callback": "ac_test_code",
        },
      },
    );
  });

  it("persists structured auth adapter progress", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });

    const { loadSettings, saveSettings } = await import("./storage.ts");
    saveSettings(
      createSettings({
        thirdPartyNodesAuthAdapterProgress: {
          "yunyi-codex::command": {
            phase: "executed",
            updatedAt: 1710000000000,
            detail: "Command execution confirmed by the operator.",
          },
        },
      }),
    );

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesAuthAdapterProgress: {
        "yunyi-codex::command": {
          phase: "executed",
          updatedAt: 1710000000000,
          detail: "Command execution confirmed by the operator.",
        },
      },
    });
  });

  it("sanitizes invalid third-party node persisted values back to defaults", async () => {
    setTestLocation({
      protocol: "https:",
      host: "gateway.example:8443",
      pathname: "/",
    });
    localStorage.setItem(
      "openclaw.control.settings.v1",
      JSON.stringify({
        gatewayUrl: "wss://gateway.example:8443/openclaw",
        thirdPartyNodesRecentModels: {
          ok: "model-a",
          bad: 123,
        },
        thirdPartyNodesFocusedSource: "invalid",
        thirdPartyNodesFocusedManualGroup: "invalid",
        thirdPartyNodesAuthAdapterStatuses: {
          ok: "Ready",
          bad: 123,
        },
        thirdPartyNodesHandledCallbacks: {
          ok: "ac_test_code",
          bad: 123,
        },
        thirdPartyNodesAuthAdapterProgress: {
          ok: {
            phase: "copied",
            updatedAt: 1710000000000,
            detail: "Copied",
          },
          badPhase: {
            phase: "invalid",
            updatedAt: 1710000000000,
            detail: "bad",
          },
          badTime: {
            phase: "copied",
            updatedAt: "bad",
            detail: "bad",
          },
          badDetail: {
            phase: "copied",
            updatedAt: 1710000000000,
            detail: 123,
          },
        },
      }),
    );

    const { loadSettings } = await import("./storage.ts");

    expect(loadSettings()).toMatchObject({
      thirdPartyNodesRecentModels: { ok: "model-a" },
      thirdPartyNodesFocusedSource: null,
      thirdPartyNodesFocusedManualGroup: null,
      thirdPartyNodesAuthAdapterStatuses: { ok: "Ready" },
      thirdPartyNodesHandledCallbacks: { ok: "ac_test_code" },
      thirdPartyNodesAuthAdapterProgress: {
        ok: {
          phase: "copied",
          updatedAt: 1710000000000,
          detail: "Copied",
        },
      },
    });
  });
});
