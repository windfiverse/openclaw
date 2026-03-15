import { createServer, type IncomingMessage } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { verifyThirdPartyNodeConnection } from "./verify.js";

const servers = new Set<ReturnType<typeof createServer>>();

async function startJsonServer(
  handler: (req: IncomingMessage) => {
    status?: number;
    body: unknown;
  },
) {
  const server = createServer((req, res) => {
    const result = handler(req);
    res.writeHead(result.status ?? 200, { "content-type": "application/json" });
    res.end(JSON.stringify(result.body));
  });
  servers.add(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve test server address");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
      servers.delete(server);
    },
  };
}

afterEach(async () => {
  await Promise.all(
    [...servers].map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((err) => (err ? reject(err) : resolve())),
        ),
    ),
  );
  servers.clear();
});

describe("verifyThirdPartyNodeConnection", () => {
  it("checks /v1/models for OpenAI-compatible endpoints", async () => {
    const seen = { url: "", auth: "" };
    const server = await startJsonServer((req) => {
      seen.url = req.url ?? "";
      seen.auth = String(req.headers.authorization ?? "");
      return {
        body: {
          data: [
            {
              id: "yunyi-codex/gpt-5.2",
              name: "Yunyi GPT-5.2",
              reasoning: true,
              input: ["text", "image"],
              context_window: 128000,
              max_output_tokens: 32768,
            },
            { id: "yunyi-codex/gpt-5.2-mini" },
          ],
        },
      };
    });

    const result = await verifyThirdPartyNodeConnection({
      providerKey: "yunyi-codex",
      baseUrl: server.baseUrl,
      apiKey: "secret-key",
      auth: "api-key",
    });

    expect(seen.url).toBe("/v1/models");
    expect(seen.auth).toBe("Bearer secret-key");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.models[0]).toEqual({
      id: "yunyi-codex/gpt-5.2",
      name: "Yunyi GPT-5.2",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 128000,
      maxTokens: 32768,
    });
    expect(result.modelIds).toEqual(["yunyi-codex/gpt-5.2", "yunyi-codex/gpt-5.2-mini"]);
    await server.close();
  });

  it("reuses /models when baseUrl already ends with /v1", async () => {
    const seen = { url: "" };
    const server = await startJsonServer((req) => {
      seen.url = req.url ?? "";
      return { body: { data: [] } };
    });

    const result = await verifyThirdPartyNodeConnection({
      providerKey: "openai-compatible",
      baseUrl: `${server.baseUrl}/proxy/v1`,
      auth: "token",
    });

    expect(seen.url).toBe("/proxy/v1/models");
    expect(result.ok).toBe(true);
    await server.close();
  });
});
