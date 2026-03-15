import { createConfigIO, readConfigFileSnapshot, readConfigFileSnapshotForWrite, resolveConfigSnapshotHash, validateConfigObjectWithPlugins, writeConfigFile } from "../../config/config.js";
import { extractDeliveryInfo } from "../../config/sessions.js";
import { type OpenClawConfig } from "../../config/types.openclaw.js";
import { diffConfigPaths } from "../config-reload.js";
import { formatControlPlaneActor, resolveControlPlaneActor, summarizeChangedPaths } from "../control-plane-audit.js";
import {
  ErrorCodes,
  errorShape,
  validateThirdPartyNodesApplyParams,
  validateThirdPartyNodesCatalogParams,
  validateThirdPartyNodesStatusParams,
  validateThirdPartyNodesVerifyParams,
} from "../protocol/index.js";
import { formatDoctorNonInteractiveHint, type RestartSentinelPayload, writeRestartSentinel } from "../../infra/restart-sentinel.js";
import { scheduleGatewaySigusr1Restart } from "../../infra/restart.js";
import { listThirdPartyNodeTemplates } from "../third-party-nodes/catalog.js";
import {
  applyThirdPartyNodeDraftToConfig,
  listThirdPartyNodeStatusEntries,
  normalizeProviderKey,
} from "../third-party-nodes/mapping.js";
import { verifyThirdPartyNodeConnection } from "../third-party-nodes/verify.js";
import { parseRestartRequestParams } from "./restart-request.js";
import type { GatewayRequestHandlers, RespondFn } from "./types.js";
import { assertValidParams } from "./validation.js";

function requireConfigBaseHash(
  params: unknown,
  snapshot: Awaited<ReturnType<typeof readConfigFileSnapshot>>,
  respond: RespondFn,
): boolean {
  if (!snapshot.exists) {
    return true;
  }
  const snapshotHash = resolveConfigSnapshotHash(snapshot);
  if (!snapshotHash) {
    respond(
      false,
      undefined,
      errorShape(ErrorCodes.INVALID_REQUEST, "config base hash unavailable; re-run and retry"),
    );
    return false;
  }
  const baseHash = (params as { baseHash?: unknown }).baseHash;
  if (typeof baseHash !== "string" || !baseHash.trim()) {
    respond(
      false,
      undefined,
      errorShape(ErrorCodes.INVALID_REQUEST, "config base hash required; re-run and retry"),
    );
    return false;
  }
  if (baseHash !== snapshotHash) {
    respond(
      false,
      undefined,
      errorShape(ErrorCodes.INVALID_REQUEST, "config changed since last load; re-run and retry"),
    );
    return false;
  }
  return true;
}

function assertValidBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) {
      throw new Error("baseUrl must use http or https");
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "invalid baseUrl");
  }
  return trimmed;
}

function presentErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function toStatusEntry(config: OpenClawConfig, providerKey: string) {
  return listThirdPartyNodeStatusEntries(config).find((entry) => entry.providerKey === providerKey);
}

function toDisabledStatusEntry(params: { providerKey: string; label: string; baseUrl: string }) {
  return {
    providerKey: params.providerKey,
    label: params.label,
    baseUrl: params.baseUrl,
    enabled: false,
    hasApiKey: false,
    headerNames: [],
  };
}

function resolveConfigRestartRequest(params: unknown) {
  const { sessionKey, note, restartDelayMs } = parseRestartRequestParams(params);
  const { deliveryContext, threadId } = extractDeliveryInfo(sessionKey);
  return {
    sessionKey,
    note,
    restartDelayMs,
    deliveryContext,
    threadId,
  };
}

function buildRestartSentinelPayload(params: {
  kind: RestartSentinelPayload["kind"];
  mode: string;
  sessionKey: string | undefined;
  deliveryContext: ReturnType<typeof extractDeliveryInfo>["deliveryContext"];
  threadId: ReturnType<typeof extractDeliveryInfo>["threadId"];
  note: string | undefined;
}): RestartSentinelPayload {
  const configPath = createConfigIO().configPath;
  return {
    kind: params.kind,
    status: "ok",
    ts: Date.now(),
    sessionKey: params.sessionKey,
    deliveryContext: params.deliveryContext,
    threadId: params.threadId,
    message: params.note ?? null,
    doctorHint: formatDoctorNonInteractiveHint(),
    stats: {
      mode: params.mode,
      root: configPath,
    },
  };
}

async function tryWriteRestartSentinelPayload(payload: RestartSentinelPayload): Promise<string | null> {
  try {
    return await writeRestartSentinel(payload);
  } catch {
    return null;
  }
}

export const thirdPartyNodesHandlers: GatewayRequestHandlers = {
  "thirdPartyNodes.catalog": ({ params, respond }) => {
    if (!assertValidParams(params, validateThirdPartyNodesCatalogParams, "thirdPartyNodes.catalog", respond)) {
      return;
    }
    try {
      respond(true, { templates: listThirdPartyNodeTemplates() }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, presentErrorMessage(err)));
    }
  },
  "thirdPartyNodes.status": async ({ params, respond }) => {
    if (!assertValidParams(params, validateThirdPartyNodesStatusParams, "thirdPartyNodes.status", respond)) {
      return;
    }
    try {
      const snapshot = await readConfigFileSnapshot();
      respond(
        true,
        {
          path: createConfigIO().configPath,
          baseHash: resolveConfigSnapshotHash(snapshot),
          entries: listThirdPartyNodeStatusEntries(snapshot.config),
        },
        undefined,
      );
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, presentErrorMessage(err)));
    }
  },
  "thirdPartyNodes.apply": async ({ params, respond, client, context }) => {
    if (!assertValidParams(params, validateThirdPartyNodesApplyParams, "thirdPartyNodes.apply", respond)) {
      return;
    }
    const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
    if (!requireConfigBaseHash(params, snapshot, respond)) {
      return;
    }
    if (!snapshot.valid) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid config; fix before patching"));
      return;
    }

    const draft = { ...(params as { entry: Record<string, unknown> }).entry };
    const providerKey = normalizeProviderKey(String(draft.providerKey ?? ""));
    if (!providerKey) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "providerKey is required"));
      return;
    }
    const baseUrl = assertValidBaseUrl(String(draft.baseUrl ?? ""));

    let nextConfig: OpenClawConfig;
    try {
      nextConfig = applyThirdPartyNodeDraftToConfig(snapshot.config, {
        providerKey,
        label: String(draft.label ?? providerKey),
        baseUrl,
        apiKey: typeof draft.apiKey === "string" ? draft.apiKey : undefined,
        auth: draft.auth as never,
        api: draft.api as never,
        modelId: String(draft.modelId ?? ""),
        modelName: typeof draft.modelName === "string" ? draft.modelName : undefined,
        enabled: Boolean(draft.enabled),
        headers:
          draft.headers && typeof draft.headers === "object" && !Array.isArray(draft.headers)
            ? Object.fromEntries(
                Object.entries(draft.headers).filter(
                  (entry): entry is [string, string] => typeof entry[1] === "string",
                ),
              )
            : undefined,
        reasoning: typeof draft.reasoning === "boolean" ? draft.reasoning : undefined,
        supportsImageInput:
          typeof draft.supportsImageInput === "boolean" ? draft.supportsImageInput : undefined,
        contextWindow: typeof draft.contextWindow === "number" ? draft.contextWindow : undefined,
        maxTokens: typeof draft.maxTokens === "number" ? draft.maxTokens : undefined,
      });
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, presentErrorMessage(err)));
      return;
    }

    const validated = validateConfigObjectWithPlugins(nextConfig);
    if (!validated.ok) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid third-party node config", {
        details: { issues: validated.issues },
      }));
      return;
    }

    const changedPaths = diffConfigPaths(snapshot.config, validated.config);
    const actor = resolveControlPlaneActor(client);
    context?.logGateway?.info(
      `thirdPartyNodes.apply write ${formatControlPlaneActor(actor)} changedPaths=${summarizeChangedPaths(changedPaths)} restartReason=thirdPartyNodes.apply`,
    );
    await writeConfigFile(validated.config, writeOptions);

    const { sessionKey, note, restartDelayMs, deliveryContext, threadId } =
      resolveConfigRestartRequest((params as { entry: Record<string, unknown> }).entry);
    const payload = buildRestartSentinelPayload({
      kind: "config-patch",
      mode: "thirdPartyNodes.apply",
      sessionKey,
      deliveryContext,
      threadId,
      note,
    });
    const sentinelPath = await tryWriteRestartSentinelPayload(payload);
    const restart = scheduleGatewaySigusr1Restart({
      delayMs: restartDelayMs,
      reason: "thirdPartyNodes.apply",
      audit: {
        actor: actor.actor,
        deviceId: actor.deviceId,
        clientIp: actor.clientIp,
        changedPaths,
      },
    });
    if (restart.coalesced) {
      context?.logGateway?.warn(
        `thirdPartyNodes.apply restart coalesced ${formatControlPlaneActor(actor)} delayMs=${restart.delayMs}`,
      );
    }

    const statusEntry =
      toStatusEntry(validated.config, providerKey) ??
      toDisabledStatusEntry({
        providerKey,
        label: String(draft.label ?? providerKey),
        baseUrl,
      });
    if (!statusEntry) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "applied config but failed to resolve status entry"));
      return;
    }

    respond(
      true,
      {
        ok: true,
        path: createConfigIO().configPath,
        entry: statusEntry,
        restart,
        sentinel: {
          path: sentinelPath,
          payload,
        },
      },
      undefined,
    );
  },
  "thirdPartyNodes.verify": async ({ params, respond }) => {
    if (!assertValidParams(params, validateThirdPartyNodesVerifyParams, "thirdPartyNodes.verify", respond)) {
      return;
    }

    const draft = { ...(params as { entry: Record<string, unknown> }).entry };
    const providerKey = normalizeProviderKey(String(draft.providerKey ?? ""));
    if (!providerKey) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "providerKey is required"));
      return;
    }

    let baseUrl: string;
    try {
      baseUrl = assertValidBaseUrl(String(draft.baseUrl ?? ""));
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, presentErrorMessage(err)));
      return;
    }

    const result = await verifyThirdPartyNodeConnection({
      providerKey,
      baseUrl,
      apiKey: typeof draft.apiKey === "string" ? draft.apiKey : undefined,
      auth: draft.auth as "api-key" | "oauth" | "token" | "aws-sdk" | undefined,
    });
    respond(true, result, undefined);
  },
};
