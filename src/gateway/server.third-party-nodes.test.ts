import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectOk, installGatewayTestHooks, rpcReq, startServerWithClient } from "./test-helpers.js";

installGatewayTestHooks({ scope: "suite" });

let startedServer: Awaited<ReturnType<typeof startServerWithClient>> | null = null;

function requireWs(): Awaited<ReturnType<typeof startServerWithClient>>["ws"] {
  if (!startedServer) {
    throw new Error("gateway test server not started");
  }
  return startedServer.ws;
}

beforeAll(async () => {
  startedServer = await startServerWithClient(undefined, { controlUiEnabled: true });
  await connectOk(requireWs());
});

afterAll(async () => {
  if (!startedServer) {
    return;
  }
  startedServer.ws.close();
  await startedServer.server.close();
  startedServer = null;
});

describe("thirdPartyNodes gateway methods", () => {
  it("returns catalog templates", async () => {
    const res = await rpcReq<{
      templates?: Array<{
        id: string;
        credentialTargets?: Array<{ field: string; label: string; accepts: string[] }>;
        authAdapters?: Array<{ kind: string; label: string; command?: string; callbackUrl?: string }>;
        authFlowActions?: Array<{ kind: string; label: string; value?: string }>;
      }>;
    }>(
      requireWs(),
      "thirdPartyNodes.catalog",
      {},
    );
    expect(res.ok).toBe(true);
    expect(res.payload?.templates?.some((entry) => entry.id === "yunyi")).toBe(true);
    expect(res.payload?.templates?.some((entry) => entry.id === "openrouter")).toBe(true);
    expect(res.payload?.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "yunyi",
          credentialTargets: [
            {
              field: "apiKey",
              label: "Credential field",
              accepts: ["api-key", "token", "oauth-credential"],
            },
          ],
          authAdapters: expect.arrayContaining([
            expect.objectContaining({
              kind: "command",
              label: "CLI activator",
              command: "npx yunyi-activator",
            }),
            expect.objectContaining({
              kind: "browser-callback",
              label: "Provider web login",
              callbackUrl: "http://localhost:1455/auth/callback",
            }),
          ]),
          authFlowActions: expect.arrayContaining([
            expect.objectContaining({
              kind: "copy-command",
              label: "Copy activator command",
              value: "npx yunyi-activator",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "openrouter",
          providerKeyDefault: "openrouter",
          authAdapters: expect.arrayContaining([
            expect.objectContaining({
              kind: "manual-paste",
              label: "Paste OpenRouter key",
            }),
          ]),
        }),
      ]),
    );
  });

  it("applies a provider entry and exposes it in status", async () => {
    const status = await rpcReq<{ baseHash?: string; entries?: Array<{ providerKey: string }> }>(
      requireWs(),
      "thirdPartyNodes.status",
      {},
    );
    expect(status.ok).toBe(true);
    expect(typeof status.payload?.baseHash).toBe("string");

    const apply = await rpcReq<{
      ok?: boolean;
      entry?: { providerKey?: string; enabled?: boolean; baseUrl?: string; modelId?: string };
    }>(requireWs(), "thirdPartyNodes.apply", {
      baseHash: status.payload?.baseHash,
      entry: {
        providerKey: "yunyi-codex",
        label: "Yunyi GPT-5.2",
        baseUrl: "https://yunyi.rdzhvip.com",
        apiKey: "YUNYI_API_KEY",
        auth: "api-key",
        api: "openai-responses",
        modelId: "yunyi-codex/gpt-5.2",
        enabled: true,
      },
    });
    expect(apply.ok).toBe(true);
    expect(apply.payload?.entry?.providerKey).toBe("yunyi-codex");
    expect(apply.payload?.entry?.enabled).toBe(true);

    const nextStatus = await rpcReq<{
      entries?: Array<{ providerKey: string; baseUrl?: string; modelId?: string; hasApiKey?: boolean }>;
    }>(requireWs(), "thirdPartyNodes.status", {});
    expect(nextStatus.ok).toBe(true);
    expect(nextStatus.payload?.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerKey: "yunyi-codex",
          baseUrl: "https://yunyi.rdzhvip.com",
          modelId: "yunyi-codex/gpt-5.2",
          hasApiKey: true,
        }),
      ]),
    );
  });

  it("verifies an OpenAI-compatible provider against /v1/models", async () => {
    let authHeader = "";
    const modelServer = createServer((req, res) => {
      authHeader = String(req.headers.authorization ?? "");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          data: [
            {
              id: "yunyi-codex/gpt-5.2",
              name: "Yunyi GPT-5.2",
              reasoning: true,
              input: ["text", "image"],
              context_window: 128000,
              max_output_tokens: 32768,
            },
          ],
        }),
      );
    });
    await new Promise<void>((resolve) => modelServer.listen(0, "127.0.0.1", () => resolve()));
    const address = modelServer.address();
    if (!address || typeof address === "string") {
      throw new Error("failed to resolve test server address");
    }

    try {
      const verify = await rpcReq<{
        ok?: boolean;
        status?: number;
        checkedUrl?: string;
        providerKey?: string;
        models?: Array<{
          id: string;
          name?: string;
          reasoning?: boolean;
          input?: string[];
          contextWindow?: number;
          maxTokens?: number;
        }>;
        modelIds?: string[];
        message?: string;
      }>(requireWs(), "thirdPartyNodes.verify", {
        entry: {
          providerKey: "yunyi-codex",
          label: "Yunyi GPT-5.2",
          baseUrl: `http://127.0.0.1:${address.port}`,
          apiKey: "YUNYI_API_KEY",
          auth: "api-key",
          api: "openai-responses",
          modelId: "yunyi-codex/gpt-5.2",
          enabled: true,
        },
      });

      expect(authHeader).toBe("Bearer YUNYI_API_KEY");
      expect(verify.ok).toBe(true);
      expect(verify.payload).toEqual(
        expect.objectContaining({
          ok: true,
          status: 200,
          providerKey: "yunyi-codex",
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
        }),
      );
      expect(verify.payload?.checkedUrl).toContain("/v1/models");
      expect(verify.payload?.message).toContain("Connection OK");
    } finally {
      await new Promise<void>((resolve, reject) =>
        modelServer.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
