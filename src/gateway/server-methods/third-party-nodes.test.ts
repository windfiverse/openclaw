import { beforeEach, describe, expect, it, vi } from "vitest";

const listThirdPartyNodeTemplatesMock = vi.fn();
const readConfigFileSnapshotForWriteMock = vi.fn();
const readConfigFileSnapshotMock = vi.fn();
const applyThirdPartyNodeDraftToConfigMock = vi.fn();

vi.mock("../third-party-nodes/catalog.js", () => ({
  listThirdPartyNodeTemplates: listThirdPartyNodeTemplatesMock,
}));

vi.mock("../protocol/index.js", () => ({
  ErrorCodes: {
    INVALID_REQUEST: "invalid_request",
  },
  errorShape: (code: string, message: string) => ({ code, message }),
  validateThirdPartyNodesApplyParams: () => true,
  validateThirdPartyNodesCatalogParams: () => true,
  validateThirdPartyNodesStatusParams: () => true,
  validateThirdPartyNodesVerifyParams: () => true,
}));

vi.mock("./validation.js", () => ({
  assertValidParams: () => true,
}));

vi.mock("../../config/config.js", () => ({
  createConfigIO: () => ({ configPath: "/tmp/openclaw.json" }),
  readConfigFileSnapshot: readConfigFileSnapshotMock,
  readConfigFileSnapshotForWrite: readConfigFileSnapshotForWriteMock,
  resolveConfigSnapshotHash: vi.fn(),
  validateConfigObjectWithPlugins: vi.fn(),
  writeConfigFile: vi.fn(),
}));

vi.mock("../../config/sessions.js", () => ({
  extractDeliveryInfo: () => ({ deliveryContext: undefined, threadId: undefined }),
}));

vi.mock("../config-reload.js", () => ({
  diffConfigPaths: () => [],
}));

vi.mock("../control-plane-audit.js", () => ({
  formatControlPlaneActor: () => "test",
  resolveControlPlaneActor: () => ({ actor: "test", deviceId: null, clientIp: null }),
  summarizeChangedPaths: () => "",
}));

vi.mock("../../infra/restart-sentinel.js", () => ({
  formatDoctorNonInteractiveHint: () => "",
  writeRestartSentinel: vi.fn(),
}));

vi.mock("../../infra/restart.js", () => ({
  scheduleGatewaySigusr1Restart: vi.fn(),
}));

vi.mock("../third-party-nodes/mapping.js", () => ({
  applyThirdPartyNodeDraftToConfig: applyThirdPartyNodeDraftToConfigMock,
  listThirdPartyNodeStatusEntries: vi.fn(() => []),
  normalizeProviderKey: (value: string) => value.trim(),
}));

vi.mock("../third-party-nodes/verify.js", () => ({
  verifyThirdPartyNodeConnection: vi.fn(),
}));

vi.mock("./restart-request.js", () => ({
  parseRestartRequestParams: () => ({
    sessionKey: undefined,
    note: undefined,
    restartDelayMs: undefined,
  }),
}));

describe("thirdPartyNodes server methods", () => {
  beforeEach(() => {
    listThirdPartyNodeTemplatesMock.mockReset();
    readConfigFileSnapshotMock.mockReset();
    readConfigFileSnapshotForWriteMock.mockReset();
    applyThirdPartyNodeDraftToConfigMock.mockReset();
    readConfigFileSnapshotMock.mockResolvedValue({ config: {}, exists: false, valid: true });
    readConfigFileSnapshotForWriteMock.mockResolvedValue({
      snapshot: { exists: false, valid: true, config: {} },
      writeOptions: {},
    });
  });

  it("returns readable template lint failures from thirdPartyNodes.catalog", async () => {
    listThirdPartyNodeTemplatesMock.mockImplementation(() => {
      throw new Error(
        'Third-party node template "yunyi" is invalid: adapter "Provider web login" must declare url.',
      );
    });

    const { thirdPartyNodesHandlers } = await import("./third-party-nodes.js");
    const respond = vi.fn();

    thirdPartyNodesHandlers["thirdPartyNodes.catalog"]({
      params: {},
      respond: respond as never,
    } as never);

    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({
        code: "invalid_request",
        message:
          'Third-party node template "yunyi" is invalid: adapter "Provider web login" must declare url.',
      }),
    );
  });

  it("returns readable draft-apply failures from thirdPartyNodes.apply", async () => {
    applyThirdPartyNodeDraftToConfigMock.mockImplementation(() => {
      throw new Error("providerKey collides with an existing managed provider");
    });

    const { thirdPartyNodesHandlers } = await import("./third-party-nodes.js");
    const respond = vi.fn();

    await thirdPartyNodesHandlers["thirdPartyNodes.apply"]({
      params: {
        entry: {
          providerKey: "yunyi-codex",
          label: "Yunyi GPT-5.2",
          baseUrl: "https://yunyi.rdzhvip.com",
          modelId: "yunyi-codex/gpt-5.2",
          enabled: true,
        },
      },
      respond: respond as never,
      client: undefined,
      context: undefined,
    } as never);

    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({
        code: "invalid_request",
        message: "providerKey collides with an existing managed provider",
      }),
    );
  });

  it("returns readable validation failures from thirdPartyNodes.verify", async () => {
    const { thirdPartyNodesHandlers } = await import("./third-party-nodes.js");
    const respond = vi.fn();

    await thirdPartyNodesHandlers["thirdPartyNodes.verify"]({
      params: {
        entry: {
          providerKey: "yunyi-codex",
          baseUrl: "ftp://invalid.example.com",
        },
      },
      respond: respond as never,
    } as never);

    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({
        code: "invalid_request",
        message: "baseUrl must use http or https",
      }),
    );
  });

  it("returns readable status-load failures from thirdPartyNodes.status", async () => {
    readConfigFileSnapshotMock.mockImplementation(() => {
      throw new Error("failed to read gateway config snapshot");
    });

    const { thirdPartyNodesHandlers } = await import("./third-party-nodes.js");
    const respond = vi.fn();

    await thirdPartyNodesHandlers["thirdPartyNodes.status"]({
      params: {},
      respond: respond as never,
    } as never);

    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({
        code: "invalid_request",
        message: "failed to read gateway config snapshot",
      }),
    );
  });
});
