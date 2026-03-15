import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import type {
  ThirdPartyNodesApplyConfirm,
  ThirdPartyNodeStatusEntry,
  ThirdPartyNodeTemplate,
  ThirdPartyNodeTemplateAuthAdapter,
  ThirdPartyNodeTemplateAuthFlowAction,
  ThirdPartyNodeTemplateCredentialTarget,
  ThirdPartyNodeVerifiedModel,
  ThirdPartyNodesVerifyResult,
} from "../types.ts";
import type { ThirdPartyNodeFormState } from "../controllers/third-party-nodes.ts";

export type ThirdPartyNodesViewProps = {
  loading: boolean;
  saving: boolean;
  verifying: boolean;
  dirty: boolean;
  lastError: string | null;
  lastErrorReason: "template" | "verify" | "apply" | null;
  templates: ThirdPartyNodeTemplate[];
  entries: ThirdPartyNodeStatusEntry[];
  selectedTemplateId: string | null;
  form: ThirdPartyNodeFormState | null;
  verifyResult: ThirdPartyNodesVerifyResult | null;
  applyConfirm: ThirdPartyNodesApplyConfirm | null;
  filterReasoningOnly: boolean;
  filterImageOnly: boolean;
  recentModelId: string | null;
  highlightManualFields: boolean;
  manualHighlightNoticeDismissed: boolean;
  focusedSource: CapabilitySource | null;
  focusedManualGroup: ManualOverrideGroup["key"] | null;
  authAdapterStatuses: Record<string, string>;
  authAdapterProgress: Record<string, AuthAdapterProgressEntry>;
  activeHelpField: CapabilityField | null;
  activeHelpPopoverPlacement: HelpPopoverPlacement;
  onReload: () => void;
  onApply: () => void;
  onVerify: () => void;
  onApplyConfirm: () => void;
  onApplyCancel: () => void;
  onFilterReasoningOnlyChange: (value: boolean) => void;
  onFilterImageOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  onApplyTemplateDefaults: () => void;
  onClearRecentModel: () => void;
  onToggleManualHighlights: () => void;
  onDismissManualHighlightNotice: () => void;
  onFocusSource: (source: CapabilitySource | null) => void;
  onFocusManualGroup: (group: ManualOverrideGroup["key"] | null) => void;
  onAuthAdapterStatusChange: (adapterKey: string, status: string) => void;
  onAuthAdapterProgressChange: (adapterKey: string, progress: AuthAdapterProgressEntry) => void;
  onToggleHelpField: (field: CapabilityField | null, placement?: HelpPopoverPlacement) => void;
  onResetField: (
    key:
      | "modelId"
      | "modelName"
      | "reasoning"
      | "supportsImageInput"
      | "contextWindow"
      | "maxTokens",
  ) => void;
  onTemplateChange: (templateId: string) => void;
  onFieldChange: <K extends keyof ThirdPartyNodeFormState>(
    key: K,
    value: ThirdPartyNodeFormState[K],
  ) => void;
};

type VerifyPresentation = {
  title: string;
  tone: string;
  badge: string;
  summary: string;
  hint: string;
};

type CapabilitySource = "recent" | "verified" | "template" | "manual";
type CapabilityField =
  | "modelId"
  | "modelName"
  | "reasoning"
  | "supportsImageInput"
  | "contextWindow"
  | "maxTokens";
type SourceTone = {
  label: string;
  color: string;
  border: string;
  background: string;
  hint: string;
};
type ManualOverrideGroup = {
  key: "identity" | "capabilities" | "limits";
  label: string;
  count: number;
  fields: CapabilityField[];
};
type HelpPopoverPlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type CredentialFieldMeta = {
  label: string;
  placeholder: string;
  help: string;
};
type AuthAdapterProgressEntry = {
  phase: "copied" | "executed" | "credential_received" | "callback_received";
  updatedAt: number;
  detail: string;
};
type CallbackCapture = {
  code: string;
  callbackUrl: string;
};

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  active: boolean;
  tone?: SourceTone;
};

type ThirdPartyNodeAuthMode = ThirdPartyNodeFormState["auth"];
type ThirdPartyNodeApiMode = ThirdPartyNodeFormState["api"];

const SEGMENTED_TRACK_STYLE =
  "display:inline-flex;gap:4px;align-items:center;padding:4px;border-radius:999px;background:rgba(15,23,42,0.06);";
const HELP_POPOVER_BASE_STYLE =
  "position:absolute;z-index:2;min-width:220px;max-width:min(320px,calc(100vw - 32px));padding:10px 12px;border-radius:12px;background:#fff;border:1px solid rgba(15,23,42,0.14);box-shadow:0 10px 30px rgba(15,23,42,0.14);font-size:12px;line-height:1.5;animation:third-party-help-pop 140ms ease-out;";
const HELP_POPOVER_ESTIMATED_HEIGHT = 180;
const FLEX_ROW_WRAP_STYLE = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;";
const FLEX_ROW_START_WRAP_STYLE = "display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;";
const LABEL_HINT_STYLE = "font-size:12px;";
const MUTED_TEXT_STYLE = "margin-top:6px;font-size:12px;";
const SUBTLE_CARD_STYLE = "padding:10px 12px;border-radius:10px;background:rgba(127,127,127,0.08);";
const ICON_BUTTON_STYLE =
  "padding:0;line-height:1;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;";
const RESET_BUTTON_STYLE = `${ICON_BUTTON_STYLE}min-height:24px;min-width:24px;width:24px;font-weight:700;`;
const HELP_BUTTON_STYLE = `${ICON_BUTTON_STYLE}min-height:18px;min-width:18px;width:18px;font-size:11px;`;
const DISMISS_BUTTON_STYLE = `${ICON_BUTTON_STYLE}min-height:22px;min-width:22px;width:22px;`;
const FIELD_ORDER: CapabilityField[] = [
  "modelId",
  "modelName",
  "reasoning",
  "supportsImageInput",
  "contextWindow",
  "maxTokens",
];
const SECTION_EYEBROW_STYLE = "font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;";

function presentAuthModeLabel(auth: ThirdPartyNodeAuthMode): string {
  if (auth === "oauth") {
    return t("thirdPartyNodes.form.authModes.oauth");
  }
  if (auth === "token") {
    return t("thirdPartyNodes.form.authModes.token");
  }
  return t("thirdPartyNodes.form.authModes.apiKey");
}

function presentApiModeLabel(api: ThirdPartyNodeApiMode): string {
  if (api === "openai-completions") {
    return t("thirdPartyNodes.form.apiModes.openaiCompletions");
  }
  if (api === "openai-codex-responses") {
    return t("thirdPartyNodes.form.apiModes.openaiCodexResponses");
  }
  if (api === "anthropic-messages") {
    return t("thirdPartyNodes.form.apiModes.anthropicMessages");
  }
  if (api === "google-generative-ai") {
    return t("thirdPartyNodes.form.apiModes.googleGenerativeAi");
  }
  if (api === "github-copilot") {
    return t("thirdPartyNodes.form.apiModes.githubCopilot");
  }
  if (api === "bedrock-converse-stream") {
    return t("thirdPartyNodes.form.apiModes.bedrockConverseStream");
  }
  if (api === "ollama") {
    return t("thirdPartyNodes.form.apiModes.ollama");
  }
  return t("thirdPartyNodes.form.apiModes.openaiResponses");
}

function getSegmentedButtonStyle<T extends string>(option: SegmentedOption<T>): string {
  return `border-radius:999px;min-height:28px;${
    option.active && option.tone
      ? `background:${option.tone.background};border-color:${option.tone.border};color:${option.tone.color};`
      : "background:transparent;border-color:transparent;"
  }`;
}

function resolveHelpPopoverPlacement(rect: DOMRect | null): HelpPopoverPlacement {
  if (!rect || typeof window === "undefined") {
    return "bottom-left";
  }
  const popoverWidth = Math.min(320, Math.max(220, window.innerWidth - 32));
  const spaceRight = window.innerWidth - rect.left;
  const spaceLeft = rect.right;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const horizontal = spaceRight < popoverWidth && spaceLeft > spaceRight ? "right" : "left";
  const vertical =
    spaceBelow < HELP_POPOVER_ESTIMATED_HEIGHT && spaceAbove > spaceBelow ? "top" : "bottom";
  return `${vertical}-${horizontal}`;
}

function getHelpPopoverPositionStyle(placement: HelpPopoverPlacement): string {
  const [verticalPlacement, horizontalPlacement] = placement.split("-") as [
    "top" | "bottom",
    "left" | "right",
  ];
  return [
    verticalPlacement === "top"
      ? "bottom:calc(100% + 6px);top:auto;"
      : "top:calc(100% + 6px);bottom:auto;",
    horizontalPlacement === "right" ? "right:0;left:auto;" : "left:0;right:auto;",
    `transform-origin:${verticalPlacement === "top" ? "bottom" : "top"} ${horizontalPlacement};`,
  ].join("");
}

function getHelpPopoverArrowStyle(placement: HelpPopoverPlacement): string {
  const [verticalPlacement, horizontalPlacement] = placement.split("-") as [
    "top" | "bottom",
    "left" | "right",
  ];
  return [
    `position:absolute;${horizontalPlacement === "right" ? "right:12px;" : "left:12px;"}`,
    verticalPlacement === "top"
      ? "bottom:-7px;border-right:1px solid rgba(15,23,42,0.14);border-bottom:1px solid rgba(15,23,42,0.14);"
      : "top:-7px;border-left:1px solid rgba(15,23,42,0.14);border-top:1px solid rgba(15,23,42,0.14);",
    "width:12px;height:12px;transform:rotate(45deg);background:#fff;",
  ].join("");
}

function getCapabilityFieldGroup(field: CapabilityField): ManualOverrideGroup["key"] {
  if (field === "modelId" || field === "modelName") {
    return "identity";
  }
  if (field === "reasoning" || field === "supportsImageInput") {
    return "capabilities";
  }
  return "limits";
}

function getFieldLabelContainerStyle(args: {
  source: CapabilitySource;
  fieldGroup: ManualOverrideGroup["key"];
  highlightManualFields: boolean;
  focusedSource: CapabilitySource | null;
  focusedManualGroup: ManualOverrideGroup["key"] | null;
}): string {
  const { source, fieldGroup, highlightManualFields, focusedSource, focusedManualGroup } = args;
  const manualTone = getSourceTone("manual");
  const sourceTone = getSourceTone(source);
  const fragments = ["position:relative;display:flex;gap:6px;align-items:center;flex-wrap:wrap;"];
  const basePadding = source === "manual" && highlightManualFields ? "2px 6px 2px 10px" : "2px 6px";

  if (source === "manual" && highlightManualFields) {
    fragments.push(
      `padding:${basePadding};border-radius:10px;background:${manualTone.background};box-shadow:inset 3px 0 0 ${manualTone.color};`,
    );
  }
  if (focusedSource === source) {
    fragments.push(
      `padding:${basePadding};border-radius:10px;background:${sourceTone.background};box-shadow:inset 3px 0 0 ${sourceTone.color};`,
    );
  }
  if (source === "manual" && focusedManualGroup !== null && focusedManualGroup === fieldGroup) {
    fragments.push(
      `padding:${basePadding};border-radius:10px;background:${manualTone.background};box-shadow:inset 3px 0 0 ${manualTone.color};outline:1px solid ${manualTone.border};`,
    );
  }
  return fragments.join("");
}

function getSourceTone(source: CapabilitySource): SourceTone {
  if (source === "recent") {
    return {
      label: t("thirdPartyNodes.sources.recentLabel"),
      color: "#9a6700",
      border: "rgba(154,103,0,0.28)",
      background: "rgba(154,103,0,0.12)",
      hint: t("thirdPartyNodes.sources.recentHint"),
    };
  }
  if (source === "verified") {
    return {
      label: t("thirdPartyNodes.sources.verifiedLabel"),
      color: "var(--success, #1a7f37)",
      border: "rgba(26,127,55,0.28)",
      background: "rgba(26,127,55,0.12)",
      hint: t("thirdPartyNodes.sources.verifiedHint"),
    };
  }
  if (source === "template") {
    return {
      label: t("thirdPartyNodes.sources.templateLabel"),
      color: "#475467",
      border: "rgba(71,84,103,0.24)",
      background: "rgba(71,84,103,0.1)",
      hint: t("thirdPartyNodes.sources.templateHint"),
    };
  }
  return {
    label: t("thirdPartyNodes.sources.manualLabel"),
    color: "var(--danger, #b42318)",
    border: "rgba(180,35,24,0.3)",
    background: "rgba(180,35,24,0.12)",
    hint: t("thirdPartyNodes.sources.manualHint"),
  };
}

function confirmTone(severity: ThirdPartyNodesApplyConfirm["severity"]): string {
  return severity === "danger" ? "var(--danger, #b42318)" : "var(--warning, #b54708)";
}

function presentVerifyResult(result: ThirdPartyNodesVerifyResult): VerifyPresentation {
  if (result.ok && result.modelIds.length > 0) {
    return {
      title: t("thirdPartyNodes.verify.readyTitle"),
      tone: "var(--success, #1a7f37)",
      badge: t("thirdPartyNodes.verify.readyBadge"),
      summary: t("thirdPartyNodes.verify.readySummary", { count: String(result.modelIds.length) }),
      hint: t("thirdPartyNodes.verify.readyHint"),
    };
  }
  if (result.ok) {
    return {
      title: t("thirdPartyNodes.verify.partialTitle"),
      tone: "var(--warning, #b54708)",
      badge: t("thirdPartyNodes.verify.partialBadge"),
      summary: t("thirdPartyNodes.verify.partialSummary"),
      hint: t("thirdPartyNodes.verify.partialHint"),
    };
  }
  if (result.status === 0) {
    return {
      title: t("thirdPartyNodes.verify.networkTitle"),
      tone: "var(--danger, #b42318)",
      badge: t("thirdPartyNodes.verify.networkBadge"),
      summary: t("thirdPartyNodes.verify.networkSummary"),
      hint: t("thirdPartyNodes.verify.networkHint"),
    };
  }
  if (result.status === 401 || result.status === 403) {
    return {
      title: t("thirdPartyNodes.verify.authTitle"),
      tone: "var(--danger, #b42318)",
      badge: t("thirdPartyNodes.verify.authBadge"),
      summary: t("thirdPartyNodes.verify.authSummary"),
      hint: t("thirdPartyNodes.verify.authHint"),
    };
  }
  if (result.status === 404) {
    return {
      title: t("thirdPartyNodes.verify.pathTitle"),
      tone: "var(--danger, #b42318)",
      badge: t("thirdPartyNodes.verify.pathBadge"),
      summary: t("thirdPartyNodes.verify.pathSummary"),
      hint: t("thirdPartyNodes.verify.pathHint"),
    };
  }
  if (result.status === 429) {
    return {
      title: t("thirdPartyNodes.verify.rateLimitedTitle"),
      tone: "var(--warning, #b54708)",
      badge: "429",
      summary: t("thirdPartyNodes.verify.rateLimitedSummary"),
      hint: t("thirdPartyNodes.verify.rateLimitedHint"),
    };
  }
  if (result.status >= 500) {
    return {
      title: t("thirdPartyNodes.verify.providerTitle"),
      tone: "var(--danger, #b42318)",
      badge: "5xx",
      summary: t("thirdPartyNodes.verify.providerSummary"),
      hint: t("thirdPartyNodes.verify.providerHint"),
    };
  }
  return {
    title: t("thirdPartyNodes.verify.failedTitle"),
    tone: "var(--danger, #b42318)",
    badge: `HTTP ${result.status}`,
    summary: t("thirdPartyNodes.verify.failedSummary"),
    hint: t("thirdPartyNodes.verify.failedHint"),
  };
}

function formatVerifiedModelInput(model: ThirdPartyNodeVerifiedModel): string | null {
  if (!model.input || model.input.length === 0) {
    return null;
  }
  return model.input.join(", ");
}

function getVerifiedModelDetails(model: ThirdPartyNodeVerifiedModel): string[] {
  return [
    model.reasoning === undefined
      ? null
      : `${t("thirdPartyNodes.models.reasoning")}: ${model.reasoning ? t("thirdPartyNodes.common.yes") : t("thirdPartyNodes.common.no")}`,
    formatVerifiedModelInput(model)
      ? `${t("thirdPartyNodes.models.input")}: ${formatVerifiedModelInput(model)}`
      : null,
    model.contextWindow ? `${t("thirdPartyNodes.models.context")}: ${model.contextWindow}` : null,
    model.maxTokens ? `${t("thirdPartyNodes.models.maxOutput")}: ${model.maxTokens}` : null,
  ].filter((entry): entry is string => Boolean(entry));
}

function renderVerifiedModelMeta(model: ThirdPartyNodeVerifiedModel) {
  const details = getVerifiedModelDetails(model);

  return html`
    <div style=${SUBTLE_CARD_STYLE}>
      <div style="font-weight:600;">${model.name ?? model.id}</div>
      ${model.name ? html`<div class="muted" style="margin-top:2px;">${model.id}</div>` : nothing}
      ${details.length > 0
        ? html`
            <div class="muted" style=${MUTED_TEXT_STYLE}>
              ${details.join(" · ")}
            </div>
          `
        : nothing}
    </div>
  `;
}

function renderSourcePill(source: CapabilitySource) {
  const tone = getSourceTone(source);
  return html`
    <span
      class="pill pill--sm"
      data-third-party-source-pill=${source}
      title=${tone.hint}
      style=${`font-size:11px;border-color:${tone.border};background:${tone.background};color:${tone.color};`}
    >
      ${tone.label}
    </span>
  `;
}

function renderSourceLegend(
  sources: CapabilitySource[],
  focusedSource: CapabilitySource | null,
  onFocusSource: (source: CapabilitySource | null) => void,
) {
  const options = sources.map((source) => ({
    value: source,
    label: getSourceTone(source).label,
    active: focusedSource === source,
    tone: getSourceTone(source),
  }));
  return html`
    <div
      data-third-party-source-legend="true"
      style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"
    >
      ${renderSegmentedControl(
        t("thirdPartyNodes.focus.sourceLegend"),
        options,
        {
          groupAttr: "data-third-party-source-legend-group",
          buttonAttr: "data-third-party-source-legend-button",
          title: (source) =>
            t("thirdPartyNodes.focus.focusFields", { source: getSourceTone(source).label.toLowerCase() }),
          renderLabel: (source) => renderSourcePill(source),
        },
        (source) => onFocusSource(focusedSource === source ? null : source),
      )}
      ${focusedSource
        ? html`
            <button
              class="btn btn--sm"
              type="button"
              data-third-party-source-clear-focus="true"
              @click=${() => onFocusSource(null)}
            >
              ${t("thirdPartyNodes.focus.clear")}
            </button>
          `
        : nothing}
    </div>
  `;
}

function renderSegmentedControl<T extends string>(
  label: string,
  options: SegmentedOption<T>[],
  attrs:
    | {
        kind: "source" | "group";
        groupAttr?: never;
        buttonAttr?: never;
        title?: (value: T) => string;
        renderLabel?: (value: T, option: SegmentedOption<T>) => unknown;
      }
    | {
        kind?: never;
        groupAttr?: string;
        buttonAttr: string;
        title?: (value: T) => string;
        renderLabel?: (value: T, option: SegmentedOption<T>) => unknown;
      },
  onSelect: (value: T) => void,
) {
  const renderOption = (option: SegmentedOption<T>) => {
    const title = attrs.title?.(option.value) ?? nothing;
    const content = attrs.renderLabel ? attrs.renderLabel(option.value, option) : option.label;
    const style = getSegmentedButtonStyle(option);
    if (attrs.kind) {
      return html`
        <button
          class="btn btn--sm"
          type="button"
          data-third-party-focus-banner-kind=${attrs.kind}
          data-third-party-focus-banner-value=${option.value}
          title=${title}
          style=${style}
          @click=${() => onSelect(option.value)}
        >
          ${content}
        </button>
      `;
    }
    return html`
      <button
        class="btn btn--sm"
        type="button"
        data-third-party-source-legend-button=${option.value}
        title=${title}
        style=${style}
        @click=${() => onSelect(option.value)}
      >
        ${content}
      </button>
    `;
  };
  return html`
    <div style=${FLEX_ROW_WRAP_STYLE}>
      <span class="muted" style=${LABEL_HINT_STYLE}>${label}</span>
      ${attrs.kind
        ? html`
            <span
              style=${SEGMENTED_TRACK_STYLE}
            >
              ${options.map(renderOption)}
            </span>
          `
        : html`
            <span
              data-third-party-source-legend-group="true"
              style=${SEGMENTED_TRACK_STYLE}
            >
              ${options.map(renderOption)}
            </span>
          `}
    </div>
  `;
}

function describeFocusState(
  focusedSource: CapabilitySource | null,
  focusedManualGroup: ManualOverrideGroup["key"] | null,
): string | null {
  if (focusedManualGroup) {
    const label =
      focusedManualGroup === "identity"
        ? t("thirdPartyNodes.groups.identity")
        : focusedManualGroup === "capabilities"
          ? t("thirdPartyNodes.groups.capabilities")
          : t("thirdPartyNodes.groups.limits");
    return t("thirdPartyNodes.focus.focusingManualGroup", { group: label.toLowerCase() });
  }
  if (!focusedSource) {
    return null;
  }
  return t("thirdPartyNodes.focus.focusingSource", {
    source: getSourceTone(focusedSource).label.toLowerCase(),
  });
}

function renderFocusBanner(
  focusedSource: CapabilitySource | null,
  focusedManualGroup: ManualOverrideGroup["key"] | null,
  onClear: () => void,
  onFocusSource: (source: CapabilitySource | null) => void,
  onFocusManualGroup: (group: ManualOverrideGroup["key"] | null) => void,
) {
  const message = describeFocusState(focusedSource, focusedManualGroup);
  if (!message) {
    return nothing;
  }
  const tone = getSourceTone(focusedSource ?? "manual");
  return html`
    <div
      data-third-party-focus-banner="true"
      style=${`margin-top:8px;padding:8px 10px;border-radius:10px;background:${tone.background};border:1px solid ${tone.border};display:flex;justify-content:space-between;gap:8px;align-items:flex-start;`}
    >
      <div style=${`${FLEX_ROW_START_WRAP_STYLE}flex:1 1 auto;`}>
        <div style=${FLEX_ROW_WRAP_STYLE}>
          <span style=${`${LABEL_HINT_STYLE}color:${tone.color};`}>${message}</span>
        </div>
        ${renderSegmentedControl(
          t("thirdPartyNodes.focus.source"),
          (["recent", "verified", "template", "manual"] as CapabilitySource[]).map((source) => ({
            value: source,
            label: getSourceTone(source).label,
            active: focusedSource === source,
            tone: getSourceTone(source),
          })),
          { kind: "source" },
          (source) => onFocusSource(focusedSource === source ? null : source),
        )}
        ${renderSegmentedControl(
          t("thirdPartyNodes.focus.group"),
          (["identity", "capabilities", "limits"] as ManualOverrideGroup["key"][]).map((group) => ({
            value: group,
            label: t(`thirdPartyNodes.groups.${group}`),
            active: focusedManualGroup === group,
            tone: getSourceTone("manual"),
          })),
          { kind: "group" },
          (group) => onFocusManualGroup(focusedManualGroup === group ? null : group),
        )}
      </div>
      <button class="btn btn--sm" type="button" data-third-party-focus-banner-clear="true" @click=${onClear}>
        ${t("thirdPartyNodes.focus.clear")}
      </button>
    </div>
  `;
}

function renderFieldLabel(
  label: string,
  field: CapabilityField,
  source: CapabilitySource,
  highlightManualFields: boolean,
  focusedSource: CapabilitySource | null,
  focusedManualGroup: ManualOverrideGroup["key"] | null,
  activeHelpField: CapabilityField | null,
  activeHelpPopoverPlacement: HelpPopoverPlacement,
  onToggleHelpField: (field: CapabilityField | null, placement?: HelpPopoverPlacement) => void,
  sourceExplanation: string,
  resetTargetLabel: string | null = null,
  onReset: (() => void) | null = null,
) {
  const fieldGroup = getCapabilityFieldGroup(field);
  const isHelpOpen = activeHelpField === field;
  const popoverAnchorStyle = getHelpPopoverPositionStyle(activeHelpPopoverPlacement);
  const arrowStyle = getHelpPopoverArrowStyle(activeHelpPopoverPlacement);
  return html`
    <span
      data-third-party-field-help-container="true"
      data-third-party-manual-field=${source === "manual" ? "true" : "false"}
      data-third-party-field-source=${source}
      data-third-party-field-group=${fieldGroup}
      style=${getFieldLabelContainerStyle({
        source,
        fieldGroup,
        highlightManualFields,
        focusedSource,
        focusedManualGroup,
      })}
    >
      <span>${label}</span>
      ${renderSourcePill(source)}
      ${source === "manual" && onReset
        ? html`
            <button
              class="btn btn--sm"
              type="button"
              title=${resetTargetLabel
                ? t("thirdPartyNodes.fields.resetTo", { target: resetTargetLabel })
                : t("thirdPartyNodes.fields.resetField")}
              @click=${onReset}
              aria-label=${resetTargetLabel
                ? t("thirdPartyNodes.fields.resetTo", { target: resetTargetLabel })
                : t("thirdPartyNodes.fields.resetField")}
              style=${RESET_BUTTON_STYLE}
            >
              <span aria-hidden="true" style="font-size:12px;">&#8634;</span>
            </button>
          `
        : nothing}
      <button
        class="btn btn--sm"
        type="button"
        data-third-party-field-help=${field}
        aria-expanded=${isHelpOpen}
        aria-label=${t("thirdPartyNodes.fields.sourceExplanation", { label })}
        style=${HELP_BUTTON_STYLE}
        @click=${(event: Event) => {
          const target = event.currentTarget as HTMLElement | null;
          const rect = target?.getBoundingClientRect();
          const placement = resolveHelpPopoverPlacement(rect ?? null);
          onToggleHelpField(isHelpOpen ? null : field, placement);
        }}
      >
        ?
      </button>
      ${isHelpOpen
        ? html`
            <span
              data-third-party-field-help-popover=${field}
              style=${`${HELP_POPOVER_BASE_STYLE}${popoverAnchorStyle}`}
            >
              <span
                aria-hidden="true"
                style=${arrowStyle}
              ></span>
              <style>
                @keyframes third-party-help-pop {
                  from {
                    opacity: 0;
                    transform: translateY(-4px) scale(0.98);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
              </style>
              ${sourceExplanation}
            </span>
          `
        : nothing}
    </span>
  `;
}

function explainCapabilitySource(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
  field: CapabilityField,
  source: CapabilitySource,
): string {
  if (source === "recent") {
    return recentModelId
      ? t("thirdPartyNodes.fields.usingRecentModel", { model: recentModelId })
      : t("thirdPartyNodes.fields.usingRecentData");
  }
  if (source === "verified") {
    return selectedVerifiedModel
      ? t("thirdPartyNodes.fields.matchesVerifiedFor", {
          model: selectedVerifiedModel.name ?? selectedVerifiedModel.id,
        })
      : t("thirdPartyNodes.fields.matchesVerified");
  }
  if (source === "template") {
    return selectedTemplate
      ? t("thirdPartyNodes.fields.usingTemplateDefaultsFor", {
          template: selectedTemplate.label,
          model: selectedTemplate.defaultModel.id,
        })
      : t("thirdPartyNodes.fields.usingTemplateDefaults");
  }
  return t("thirdPartyNodes.fields.manuallyChanged", {
    target: resolveResetTargetLabel(form, selectedTemplate, selectedVerifiedModel, recentModelId, field),
    field,
  });
}

function resolveResetTargetLabel(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
  field:
    | "modelId"
    | "modelName"
    | "reasoning"
    | "supportsImageInput"
    | "contextWindow"
    | "maxTokens",
): string {
  if (field === "modelId") {
    if (recentModelId) {
      return t("thirdPartyNodes.fields.recentModel");
    }
    return t("thirdPartyNodes.fields.templateDefault");
  }
  if (field === "modelName") {
    if (selectedVerifiedModel?.name?.trim()) {
      return recentModelId === selectedVerifiedModel.id
        ? t("thirdPartyNodes.fields.recentModelName")
        : t("thirdPartyNodes.fields.verifiedModelName");
    }
    return t("thirdPartyNodes.fields.templateOrDefaultModelName");
  }
  if (field === "reasoning") {
    if (selectedVerifiedModel?.reasoning !== undefined) {
      return recentModelId === form.modelId.trim()
        ? t("thirdPartyNodes.fields.recentVerifiedValue")
        : t("thirdPartyNodes.fields.verifiedValue");
    }
    return t("thirdPartyNodes.fields.templateDefault");
  }
  if (field === "supportsImageInput") {
    if (selectedVerifiedModel?.input) {
      return recentModelId === form.modelId.trim()
        ? t("thirdPartyNodes.fields.recentVerifiedValue")
        : t("thirdPartyNodes.fields.verifiedValue");
    }
    return t("thirdPartyNodes.fields.templateDefault");
  }
  if (field === "contextWindow" || field === "maxTokens") {
    const verifiedValue =
      field === "contextWindow" ? selectedVerifiedModel?.contextWindow : selectedVerifiedModel?.maxTokens;
    if (verifiedValue !== undefined) {
      return recentModelId === form.modelId.trim()
        ? t("thirdPartyNodes.fields.recentVerifiedValue")
        : t("thirdPartyNodes.fields.verifiedValue");
    }
    return t("thirdPartyNodes.fields.templateDefault");
  }
  return t("thirdPartyNodes.fields.bestAvailableSource");
}

function resolveCapabilitySource(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
  field:
    | "modelId"
    | "modelName"
    | "reasoning"
    | "supportsImageInput"
    | "contextWindow"
    | "maxTokens",
): CapabilitySource {
  const isRecent = recentModelId === form.modelId.trim();
  if (field === "modelId") {
    if (isRecent) {
      return "recent";
    }
    if (selectedVerifiedModel?.id === form.modelId.trim()) {
      return "verified";
    }
    if (selectedTemplate?.defaultModel.id === form.modelId.trim()) {
      return "template";
    }
    return "manual";
  }
  if (field === "modelName") {
    if (isRecent && form.modelName.trim() === form.modelId.trim()) {
      return "recent";
    }
    if (
      selectedVerifiedModel?.name?.trim() &&
      selectedVerifiedModel.name.trim() === form.modelName.trim()
    ) {
      return recentModelId === selectedVerifiedModel.id ? "recent" : "verified";
    }
    if (selectedTemplate?.defaultModel.name === form.modelName.trim()) {
      return "template";
    }
    return "manual";
  }
  if (selectedVerifiedModel) {
    if (field === "reasoning") {
      if (
        selectedVerifiedModel.reasoning !== undefined &&
        selectedVerifiedModel.reasoning === form.reasoning
      ) {
        return isRecent ? "recent" : "verified";
      }
    }
    if (field === "supportsImageInput") {
      const verifiedImage = selectedVerifiedModel.input?.includes("image");
      if (verifiedImage !== undefined && verifiedImage === form.supportsImageInput) {
        return isRecent ? "recent" : "verified";
      }
    }
    if (field === "contextWindow") {
      if (
        selectedVerifiedModel.contextWindow !== undefined &&
        selectedVerifiedModel.contextWindow === form.contextWindow
      ) {
        return isRecent ? "recent" : "verified";
      }
    }
    if (field === "maxTokens") {
      if (
        selectedVerifiedModel.maxTokens !== undefined &&
        selectedVerifiedModel.maxTokens === form.maxTokens
      ) {
        return isRecent ? "recent" : "verified";
      }
    }
  }

  if (selectedTemplate) {
    const templateModel = selectedTemplate.defaultModel;
    if (field === "reasoning" && templateModel.reasoning === form.reasoning) {
      return "template";
    }
    if (
      field === "supportsImageInput" &&
      templateModel.input.includes("image") === form.supportsImageInput
    ) {
      return "template";
    }
    if (field === "contextWindow" && templateModel.contextWindow === form.contextWindow) {
      return "template";
    }
    if (field === "maxTokens" && templateModel.maxTokens === form.maxTokens) {
      return "template";
    }
  }

  return "manual";
}

function summarizeCapabilitySource(
  model: ThirdPartyNodeVerifiedModel,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  recentModelId: string | null,
): string {
  if (recentModelId === model.id) {
    return t("thirdPartyNodes.focus.summaryRecent");
  }
  const usesVerifiedMetadata =
    model.reasoning !== undefined ||
    Boolean(model.input && model.input.length > 0) ||
    model.contextWindow !== undefined ||
    model.maxTokens !== undefined;
  if (usesVerifiedMetadata) {
    return t("thirdPartyNodes.focus.summaryVerified");
  }
  if (selectedTemplate) {
    return t("thirdPartyNodes.focus.summaryTemplate", { template: selectedTemplate.label });
  }
  return t("thirdPartyNodes.focus.summaryLocal");
}

function renderTemplateDiffSummary(
  model: ThirdPartyNodeVerifiedModel,
  selectedTemplate: ThirdPartyNodeTemplate | null,
) {
  if (!selectedTemplate) {
    return nothing;
  }
  const templateModel = selectedTemplate.defaultModel;
  const diffs: string[] = [];

  if (model.reasoning !== undefined && model.reasoning !== templateModel.reasoning) {
    diffs.push(
      t("thirdPartyNodes.models.reasoningDiff", {
        model: model.reasoning ? t("thirdPartyNodes.common.enabled") : t("thirdPartyNodes.common.disabled"),
        template: templateModel.reasoning
          ? t("thirdPartyNodes.common.enabled")
          : t("thirdPartyNodes.common.disabled"),
      }),
    );
  }

  if (model.input && model.input.length > 0) {
    const modelImage = model.input.includes("image");
    const templateImage = templateModel.input.includes("image");
    if (modelImage !== templateImage) {
      diffs.push(
        t("thirdPartyNodes.models.imageInputDiff", {
          model: modelImage ? t("thirdPartyNodes.common.enabled") : t("thirdPartyNodes.common.disabled"),
          template: templateImage
            ? t("thirdPartyNodes.common.enabled")
            : t("thirdPartyNodes.common.disabled"),
        }),
      );
    }
  }

  if (
    model.contextWindow !== undefined &&
    model.contextWindow !== templateModel.contextWindow
  ) {
    diffs.push(
      t("thirdPartyNodes.models.contextDiff", {
        model: String(model.contextWindow),
        template: String(templateModel.contextWindow),
      }),
    );
  }

  if (model.maxTokens !== undefined && model.maxTokens !== templateModel.maxTokens) {
    diffs.push(
      t("thirdPartyNodes.models.maxOutputDiff", {
        model: String(model.maxTokens),
        template: String(templateModel.maxTokens),
      }),
    );
  }

  if (diffs.length === 0) {
    return html`
      <div class="muted" style="margin-top:6px;font-size:12px;">
        ${t("thirdPartyNodes.models.matchesTemplateDefaults")}
      </div>
    `;
  }

  return html`
    <div style="margin-top:6px;">
      <div style=${SECTION_EYEBROW_STYLE}>
        ${t("thirdPartyNodes.models.templateDiff")}
      </div>
      <div class="muted" style="margin-top:4px;font-size:12px;">
        ${diffs.join(" · ")}
      </div>
    </div>
  `;
}

function countManualOverrideFields(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
): number {
  return FIELD_ORDER.filter(
    (field) =>
      resolveCapabilitySource(
        form,
        selectedTemplate,
        selectedVerifiedModel,
        recentModelId,
        field,
      ) === "manual",
  ).length;
}

function summarizeManualOverrideGroups(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
): ManualOverrideGroup[] {
  const groups: Array<Omit<ManualOverrideGroup, "count">> = [
    { key: "identity", label: t("thirdPartyNodes.groups.identity"), fields: ["modelId", "modelName"] },
    {
      key: "capabilities",
      label: t("thirdPartyNodes.groups.capabilities"),
      fields: ["reasoning", "supportsImageInput"],
    },
    { key: "limits", label: t("thirdPartyNodes.groups.limits"), fields: ["contextWindow", "maxTokens"] },
  ];
  return groups
    .map((group) => ({
      ...group,
      count: group.fields.filter(
        (field) =>
          resolveCapabilitySource(
            form,
            selectedTemplate,
            selectedVerifiedModel,
            recentModelId,
            field,
          ) === "manual",
      ).length,
    }))
    .filter((group) => group.count > 0);
}

function getCapabilityFieldPresentation(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
  field: CapabilityField,
) {
  const source = resolveCapabilitySource(
    form,
    selectedTemplate,
    selectedVerifiedModel,
    recentModelId,
    field,
  );
  return {
    source,
    explanation: explainCapabilitySource(
      form,
      selectedTemplate,
      selectedVerifiedModel,
      recentModelId,
      field,
      source,
    ),
    resetTargetLabel: resolveResetTargetLabel(
      form,
      selectedTemplate,
      selectedVerifiedModel,
      recentModelId,
      field,
    ),
  };
}

function renderVerifiedModelCard(
  model: ThirdPartyNodeVerifiedModel,
  selectedModelId: string | null,
  recentModelId: string | null,
  onUseModel: (modelId: string) => void,
) {
  const isSelected = selectedModelId === model.id;
  const isRecent = recentModelId === model.id;
  const details = getVerifiedModelDetails(model);
  return html`
    <div style=${SUBTLE_CARD_STYLE}>
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
        <div style="min-width:0;flex:1 1 auto;">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <div style="font-weight:600;">${model.name ?? model.id}</div>
            ${isRecent ? renderSourcePill("recent") : nothing}
          </div>
          ${model.name
            ? html`<div class="muted" style="margin-top:2px;">${model.id}</div>`
            : nothing}
          ${details.length > 0
            ? html`
                <div class="muted" style=${MUTED_TEXT_STYLE}>
                  ${details.join(" · ")}
                </div>
              `
            : nothing}
        </div>
        <button
          class=${isSelected ? "btn btn--sm primary" : "btn btn--sm"}
          ?disabled=${isSelected}
          @click=${() => onUseModel(model.id)}
        >
          ${isSelected ? t("thirdPartyNodes.models.selected") : t("thirdPartyNodes.models.useThisModel")}
        </button>
      </div>
    </div>
  `;
}

function renderManualOverrideSummary(
  manualOverrideGroups: ManualOverrideGroup[],
  manualOverrideCount: number,
  focusedManualGroup: ManualOverrideGroup["key"] | null,
  highlightManualFields: boolean,
  manualHighlightNoticeDismissed: boolean,
  onFocusManualGroup: (group: ManualOverrideGroup["key"] | null) => void,
  onToggleManualHighlights: () => void,
  onDismissManualHighlightNotice: () => void,
) {
  const manualTone = getSourceTone("manual");
  return html`
    ${manualOverrideGroups.length > 0
      ? html`
          <div
            data-third-party-manual-breakdown="true"
            style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"
          >
            <span class="muted" style=${LABEL_HINT_STYLE}>${t("thirdPartyNodes.focus.manualOverrideGroups")}</span>
            ${manualOverrideGroups.map(
              (group) => html`
                <button
                  class="btn btn--sm"
                  type="button"
                  title=${`${group.label}: ${group.fields.join(", ")}`}
                  data-third-party-manual-group=${group.key}
                  style=${focusedManualGroup === group.key
                    ? `background:${manualTone.background};border-color:${manualTone.border};color:${manualTone.color};`
                    : ""}
                  @click=${() => onFocusManualGroup(focusedManualGroup === group.key ? null : group.key)}
                >
                  ${group.label}: ${group.count}
                </button>
              `,
            )}
          </div>
        `
      : nothing}
    <button
      class="btn btn--sm"
      type="button"
      style=${`margin-top:6px;${
        highlightManualFields
          ? `background:${manualTone.background};border-color:${manualTone.border};color:${manualTone.color};`
          : ""
      }`}
      ?disabled=${manualOverrideCount === 0}
      @click=${onToggleManualHighlights}
    >
      ${t("thirdPartyNodes.focus.manualOverrides")}: ${manualOverrideCount}
    </button>
    ${highlightManualFields && !manualHighlightNoticeDismissed
      ? html`
          <div
            style=${`margin-top:6px;padding:8px 10px;border-radius:10px;background:${manualTone.background};border:1px solid ${manualTone.border};font-size:12px;display:flex;justify-content:space-between;gap:8px;align-items:center;`}
          >
            <span style=${`color:${manualTone.color};`}>${t("thirdPartyNodes.focus.highlightingManualFields")}</span>
            <button
              class="btn btn--sm"
              type="button"
              @click=${onDismissManualHighlightNotice}
              aria-label=${t("thirdPartyNodes.focus.dismissManualHighlightNotice")}
              title=${t("thirdPartyNodes.focus.dismiss")}
              style=${DISMISS_BUTTON_STYLE}
            >
              <span aria-hidden="true" style="font-size:12px;">&times;</span>
            </button>
          </div>
        `
      : nothing}
  `;
}

function renderSelectedModelSummary(args: {
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel;
  selectedTemplate: ThirdPartyNodeTemplate | null;
  recentModelId: string | null;
  focusedSource: CapabilitySource | null;
  focusedManualGroup: ManualOverrideGroup["key"] | null;
  manualOverrideGroups: ManualOverrideGroup[];
  manualOverrideCount: number;
  highlightManualFields: boolean;
  manualHighlightNoticeDismissed: boolean;
  onFocusSource: (source: CapabilitySource | null) => void;
  onFocusManualGroup: (group: ManualOverrideGroup["key"] | null) => void;
  onToggleManualHighlights: () => void;
  onDismissManualHighlightNotice: () => void;
  onApplyTemplateDefaults: () => void;
  onClearRecentModel: () => void;
}) {
  const verifiedTone = getSourceTone("verified");
  return html`
    <div
      data-third-party-selected-model-summary="true"
      style=${`margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid ${verifiedTone.border};background:${verifiedTone.background};`}
    >
      <div
        style=${`${SECTION_EYEBROW_STYLE}color:${verifiedTone.color};`}
      >
        ${t("thirdPartyNodes.focus.selectedModelSummary")}
      </div>
      <div
        class="muted"
        title=${t("thirdPartyNodes.focus.summaryTitle")}
        style="margin-top:4px;font-size:12px;"
      >
        ${summarizeCapabilitySource(args.selectedVerifiedModel, args.selectedTemplate, args.recentModelId)}
      </div>
      ${renderFocusBanner(
        args.focusedSource,
        args.focusedManualGroup,
        () => {
          if (args.focusedManualGroup) {
            args.onFocusManualGroup(null);
            return;
          }
          args.onFocusSource(null);
        },
        args.onFocusSource,
        args.onFocusManualGroup,
      )}
      ${renderSourceLegend(
        ["recent", "verified", "template", "manual"],
        args.focusedSource,
        args.onFocusSource,
      )}
      ${renderManualOverrideSummary(
        args.manualOverrideGroups,
        args.manualOverrideCount,
        args.focusedManualGroup,
        args.highlightManualFields,
        args.manualHighlightNoticeDismissed,
        args.onFocusManualGroup,
        args.onToggleManualHighlights,
        args.onDismissManualHighlightNotice,
      )}
      <div style="margin-top:8px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn--sm" @click=${args.onApplyTemplateDefaults}>
            ${t("thirdPartyNodes.focus.applyTemplateDefaultsBack")}
          </button>
          <button class="btn btn--sm" ?disabled=${!args.recentModelId} @click=${args.onClearRecentModel}>
            ${t("thirdPartyNodes.focus.clearRecent")}
          </button>
        </div>
      </div>
      <div style="margin-top:6px;">
        ${renderVerifiedModelMeta(args.selectedVerifiedModel)}
      </div>
      ${renderTemplateDiffSummary(args.selectedVerifiedModel, args.selectedTemplate)}
    </div>
  `;
}

function renderVerifyResultPanel(args: {
  verifyResult: ThirdPartyNodesVerifyResult;
  verifyPresentation: VerifyPresentation;
  filteredVerifiedModels: ThirdPartyNodeVerifiedModel[];
  hasActiveModelFilters: boolean;
  filterReasoningOnly: boolean;
  filterImageOnly: boolean;
  recentModelId: string | null;
  selectedModelId: string | null;
  onFilterReasoningOnlyChange: (value: boolean) => void;
  onFilterImageOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  onUseModel: (modelId: string) => void;
}) {
  const filterControls = renderVerifyFilters({
    filterReasoningOnly: args.filterReasoningOnly,
    filterImageOnly: args.filterImageOnly,
    hasActiveModelFilters: args.hasActiveModelFilters,
    onFilterReasoningOnlyChange: args.onFilterReasoningOnlyChange,
    onFilterImageOnlyChange: args.onFilterImageOnlyChange,
    onClearFilters: args.onClearFilters,
  });
  return html`
    <div
      class="panel"
      data-third-party-verify-result="true"
      style="margin-top:12px;padding:12px;border-color:${args.verifyPresentation.tone};border-width:2px;"
    >
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <strong>${args.verifyPresentation.title}</strong>
        <span
          class="pill pill--sm"
          style="border-color:${args.verifyPresentation.tone};color:${args.verifyPresentation.tone};"
          >${args.verifyPresentation.badge}</span
        >
      </div>
      <div style="margin-top:6px;">${args.verifyPresentation.summary}</div>
      <div class="muted" style="margin-top:6px;">${args.verifyPresentation.hint}</div>
      <div style="margin-top:8px;font-size:12px;">
        <div>${t("thirdPartyNodes.verify.status")}: HTTP ${args.verifyResult.status}</div>
        <div>${t("thirdPartyNodes.verify.checkedUrl")}: ${args.verifyResult.checkedUrl}</div>
        <div>
          ${t("thirdPartyNodes.verify.models")}:
          ${args.verifyResult.modelIds.length > 0
            ? args.verifyResult.modelIds.join(", ")
            : t("thirdPartyNodes.verify.noneReturned")}
        </div>
        <div>${t("thirdPartyNodes.verify.providerMessage")}: ${args.verifyResult.message}</div>
      </div>
      ${args.verifyResult.models.length > 0
        ? html`
            <div style="margin-top:12px;">
              <div
                style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;"
              >
                <div>
                  <div style=${SECTION_EYEBROW_STYLE}>
                    ${t("thirdPartyNodes.verify.discoveredModels")}
                  </div>
                  <div class="muted" style="margin-top:4px;font-size:12px;">
                    ${t("thirdPartyNodes.verify.showing", {
                      shown: String(args.filteredVerifiedModels.length),
                      total: String(args.verifyResult.models.length),
                    })}
                  </div>
                </div>
                ${filterControls}
              </div>
              <div
                style="display:grid;gap:8px;margin-top:8px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));"
              >
                ${args.filteredVerifiedModels.length > 0
                  ? args.filteredVerifiedModels.map((model) =>
                      renderVerifiedModelCard(
                        model,
                        args.selectedModelId,
                        args.recentModelId,
                        args.onUseModel,
                      ),
                    )
                  : html`
                      <div
                        class="muted"
                        style=${SUBTLE_CARD_STYLE}
                      >
                        ${t("thirdPartyNodes.verify.noModelsMatch")}
                      </div>
                    `}
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}

function renderVerifyFilters(args: {
  filterReasoningOnly: boolean;
  filterImageOnly: boolean;
  hasActiveModelFilters: boolean;
  onFilterReasoningOnlyChange: (value: boolean) => void;
  onFilterImageOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
}) {
  return html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <label class="checkbox" style=${`display:flex;gap:6px;align-items:center;${LABEL_HINT_STYLE}`}>
        <input
          type="checkbox"
          .checked=${args.filterReasoningOnly}
          @change=${(event: Event) =>
            args.onFilterReasoningOnlyChange((event.target as HTMLInputElement).checked)}
        />
        <span>${t("thirdPartyNodes.verify.reasoningOnly")}</span>
      </label>
      <label class="checkbox" style=${`display:flex;gap:6px;align-items:center;${LABEL_HINT_STYLE}`}>
        <input
          type="checkbox"
          .checked=${args.filterImageOnly}
          @change=${(event: Event) =>
            args.onFilterImageOnlyChange((event.target as HTMLInputElement).checked)}
        />
        <span>${t("thirdPartyNodes.verify.imageOnly")}</span>
      </label>
      <button class="btn btn--sm" ?disabled=${!args.hasActiveModelFilters} @click=${args.onClearFilters}>
        ${t("thirdPartyNodes.verify.clearFilters")}
      </button>
    </div>
  `;
}

function renderCapabilityInputField<K extends "modelId" | "modelName" | "contextWindow" | "maxTokens">(args: {
  label: string;
  field: K;
  form: ThirdPartyNodeFormState;
  presentation: ReturnType<typeof getCapabilityFieldPresentation> | null;
  props: ThirdPartyNodesViewProps;
  inputType?: "text" | "number";
  min?: string;
}) {
  const value =
    args.field === "contextWindow" || args.field === "maxTokens"
      ? String(args.form[args.field])
      : String(args.form[args.field]);
  return html`
    <label class="field">
      ${renderFieldLabel(
        args.label,
        args.field,
        args.presentation?.source ?? "template",
        args.props.highlightManualFields,
        args.props.focusedSource,
        args.props.focusedManualGroup,
        args.props.activeHelpField,
        args.props.activeHelpPopoverPlacement,
        args.props.onToggleHelpField,
        args.presentation?.explanation ?? t("thirdPartyNodes.fields.usingTemplateDefaults"),
        args.presentation?.resetTargetLabel ?? t("thirdPartyNodes.fields.templateDefault"),
        () => args.props.onResetField(args.field),
      )}
      <input
        type=${args.inputType ?? "text"}
        min=${args.min ?? nothing}
        .value=${value}
        @input=${(event: Event) =>
          args.props.onFieldChange(
            args.field,
            (args.field === "contextWindow" || args.field === "maxTokens"
              ? Number((event.target as HTMLInputElement).value || "0")
              : (event.target as HTMLInputElement).value) as ThirdPartyNodeFormState[K],
          )}
      />
    </label>
  `;
}

function renderCapabilityCheckboxField(
  label: string,
  field: "reasoning" | "supportsImageInput",
  form: ThirdPartyNodeFormState,
  presentation: ReturnType<typeof getCapabilityFieldPresentation> | null,
  props: ThirdPartyNodesViewProps,
) {
  return html`
    <label class="checkbox" style="display:flex;gap:8px;align-items:center;">
      <input
        type="checkbox"
        .checked=${form[field]}
        @change=${(event: Event) =>
          props.onFieldChange(field, (event.target as HTMLInputElement).checked)}
      />
      ${renderFieldLabel(
        label,
        field,
        presentation?.source ?? "template",
        props.highlightManualFields,
        props.focusedSource,
        props.focusedManualGroup,
        props.activeHelpField,
        props.activeHelpPopoverPlacement,
        props.onToggleHelpField,
        presentation?.explanation ?? t("thirdPartyNodes.fields.usingTemplateDefaults"),
        presentation?.resetTargetLabel ?? t("thirdPartyNodes.fields.templateDefault"),
        () => props.onResetField(field),
      )}
    </label>
  `;
}

function renderPanelHeader(args: {
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  verifying: boolean;
  canApply: boolean;
  canVerify: boolean;
  onReload: () => void;
  onVerify: () => void;
  onApply: () => void;
}) {
  return html`
    <div
      class="panel__header"
      style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;"
    >
      <div>
        <h3 style="margin:0;">${t("thirdPartyNodes.header.title")}</h3>
        <p class="muted" style="margin:6px 0 0 0;">
          ${t("thirdPartyNodes.header.subtitle")}
        </p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${args.dirty ? html`<span class="pill pill--sm">${t("thirdPartyNodes.header.unsaved")}</span>` : nothing}
        <button class="btn btn--sm" ?disabled=${args.loading} @click=${args.onReload}>
          ${args.loading ? t("thirdPartyNodes.header.loading") : t("thirdPartyNodes.header.reload")}
        </button>
        <button class="btn btn--sm" ?disabled=${!args.canVerify} @click=${args.onVerify}>
          ${args.verifying ? t("thirdPartyNodes.header.testing") : t("thirdPartyNodes.header.testConnection")}
        </button>
        <button class="btn btn--sm primary" ?disabled=${!args.canApply} @click=${args.onApply}>
          ${args.saving ? t("thirdPartyNodes.header.applying") : t("thirdPartyNodes.header.applyNode")}
        </button>
      </div>
    </div>
  `;
}

function renderTemplateSelector(
  selectedTemplateId: string | null,
  templates: ThirdPartyNodeTemplate[],
  selectedTemplate: ThirdPartyNodeTemplate | null,
  onFieldChange: ThirdPartyNodesViewProps["onFieldChange"],
  onTemplateChange: (templateId: string) => void,
) {
  let docsHost = "";
  if (selectedTemplate?.docsUrl) {
    try {
      docsHost = new URL(selectedTemplate.docsUrl).host;
    } catch {
      docsHost = selectedTemplate.docsUrl;
    }
  }
  return html`
    <div class="field">
      <label for="tpn-template">${t("thirdPartyNodes.summary.providerTemplate")}</label>
      <select
        id="tpn-template"
        .value=${selectedTemplateId ?? ""}
        @change=${(event: Event) => onTemplateChange((event.target as HTMLSelectElement).value)}
      >
        ${templates.map((template) => html`<option value=${template.id}>${template.label}</option>`)}
      </select>
      ${selectedTemplate
        ? html`
            <div data-third-party-template-summary="true" style=${`${SUBTLE_CARD_STYLE}margin-top:8px;`}>
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
                <div>
                  <strong>${selectedTemplate.label}</strong>
                  <div class="muted" style="margin-top:4px;">${selectedTemplate.description}</div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                  <a
                    class="btn btn--sm"
                    data-third-party-template-summary-operator-docs="true"
                    href="https://docs.openclaw.ai/web/third-party-nodes"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ${t("thirdPartyNodes.summary.operatorGuide")}
                  </a>
                  <a
                    class="btn btn--sm"
                    data-third-party-template-summary-spec-docs="true"
                    href="https://docs.openclaw.ai/reference/third-party-node-templates"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ${t("thirdPartyNodes.summary.templateSpec")}
                  </a>
                  ${selectedTemplate.docsUrl
                    ? html`
                        <a
                          class="btn btn--sm"
                          data-third-party-template-summary-docs="true"
                          href=${selectedTemplate.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ${t("thirdPartyNodes.summary.providerDocs")}
                        </a>
                      `
                    : nothing}
                </div>
              </div>
              ${selectedTemplate.baseUrlPresets[0]?.url
                ? html`
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">
                      <span class="muted" style=${LABEL_HINT_STYLE}>
                        ${t("thirdPartyNodes.summary.recommendedBaseUrl")}: ${selectedTemplate.baseUrlPresets[0].url}
                      </span>
                      <button
                        class="btn btn--sm"
                        type="button"
                        data-third-party-template-apply-baseurl="true"
                        @click=${() => onFieldChange("baseUrl", selectedTemplate.baseUrlPresets[0]!.url)}
                      >
                        ${t("thirdPartyNodes.summary.useRecommendedBaseUrl")}
                      </button>
                    </div>
                  `
                : nothing}
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">
                <span class="muted" style=${LABEL_HINT_STYLE}>
                  ${t("thirdPartyNodes.summary.defaultModel")}: ${selectedTemplate.defaultModel.id}
                </span>
                <button
                  class="btn btn--sm"
                  type="button"
                  data-third-party-template-apply-model="true"
                  @click=${() => {
                    onFieldChange("modelId", selectedTemplate.defaultModel.id);
                    onFieldChange("modelName", selectedTemplate.defaultModel.name);
                  }}
                >
                  ${t("thirdPartyNodes.summary.useDefaultModel")}
                </button>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                <span class="pill pill--sm" data-third-party-template-summary-auth="true">
                  ${t("thirdPartyNodes.summary.authLabel")}: ${selectedTemplate.authOptions
                    .map((auth) => presentAuthModeLabel(auth))
                    .join(", ")}
                </span>
                <span class="pill pill--sm" data-third-party-template-summary-api="true">
                  ${t("thirdPartyNodes.summary.apiLabel")}: ${presentApiModeLabel(selectedTemplate.defaultApi)}
                </span>
                <span class="pill pill--sm" data-third-party-template-summary-model="true">
                  ${t("thirdPartyNodes.summary.modelLabel")}: ${selectedTemplate.defaultModel.id}
                </span>
                <span class="pill pill--sm" data-third-party-template-summary-baseurls="true">
                  ${t("thirdPartyNodes.summary.baseUrlsLabel")}: ${selectedTemplate.baseUrlPresets.length}
                </span>
                ${docsHost
                  ? html`
                      <a
                        class="pill pill--sm"
                        data-third-party-template-summary-docs-host="true"
                        href=${selectedTemplate.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        ${t("thirdPartyNodes.summary.docsLabel")}: ${docsHost}
                      </a>
                    `
                  : nothing}
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}

function renderApplyConfirmCard(args: {
  applyConfirm: ThirdPartyNodesApplyConfirm;
  applyConfirmTone: string;
  applyConfirmButtonClass: string;
  applyConfirmButtonLabel: string;
  verifying: boolean;
  saving: boolean;
  onVerify: () => void;
  onApplyConfirm: () => void;
  onApplyCancel: () => void;
}) {
  return html`
    <div
      class=${`callout ${args.applyConfirm.severity === "danger" ? "danger" : ""}`}
      style="margin-top:12px;padding:16px;border-radius:14px;border:2px solid ${args.applyConfirmTone};background:color-mix(in srgb, ${args.applyConfirmTone} 10%, transparent);"
    >
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
        <div>
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${args.applyConfirmTone};font-weight:700;">${t("thirdPartyNodes.applyConfirm.title")}</div>
          <div style="font-weight:700;font-size:16px;margin-top:4px;">${args.applyConfirm.title}</div>
        </div>
        <span class="pill pill--sm" style="border-color:${args.applyConfirmTone};color:${args.applyConfirmTone};"
          >${args.applyConfirm.statusLabel}</span
        >
      </div>
      <div style="margin-top:8px;">${args.applyConfirm.message}</div>
      <div class="muted" style="margin-top:6px;">${args.applyConfirm.detail}</div>
      <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.45);font-size:12px;">
        ${t("thirdPartyNodes.applyConfirm.recommendedAction")}: ${args.applyConfirm.recommendation}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn" ?disabled=${args.verifying || args.saving} @click=${args.onVerify}>
          ${args.verifying ? t("thirdPartyNodes.applyConfirm.testing") : t("thirdPartyNodes.applyConfirm.testConnection")}
        </button>
        <button class=${args.applyConfirmButtonClass} ?disabled=${args.saving} @click=${args.onApplyConfirm}>
          ${args.saving ? t("thirdPartyNodes.applyConfirm.applying") : args.applyConfirmButtonLabel}
        </button>
        <button class="btn" ?disabled=${args.saving} @click=${args.onApplyCancel}>
          ${t("thirdPartyNodes.applyConfirm.cancel")}
        </button>
      </div>
    </div>
  `;
}

function renderConfiguredNodesSidebar(entries: ThirdPartyNodeStatusEntry[]) {
  return html`
    <aside class="card" style="padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${t("thirdPartyNodes.sidebar.title")}</strong>
        <span class="pill pill--sm">${entries.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        ${entries.length === 0
          ? html`<div class="muted">${t("thirdPartyNodes.sidebar.empty")}</div>`
          : entries.map(
              (entry) => html`
                <div class="panel" style="padding:12px;">
                  <div style="display:flex;justify-content:space-between;gap:8px;">
                    <strong>${entry.providerKey}</strong>
                    <span class="pill pill--sm">
                      ${entry.enabled ? t("thirdPartyNodes.sidebar.enabled") : t("thirdPartyNodes.sidebar.disabled")}
                    </span>
                  </div>
                  <div class="muted" style="margin-top:6px;">${entry.baseUrl}</div>
                  <div style="margin-top:8px;font-size:12px;">
                    <div>${t("thirdPartyNodes.sidebar.model")}: ${entry.modelId ?? t("thirdPartyNodes.sidebar.na")}</div>
                    <div>
                      ${t("thirdPartyNodes.sidebar.auth")}: ${entry.auth
                        ? presentAuthModeLabel(entry.auth)
                        : t("thirdPartyNodes.sidebar.na")}
                    </div>
                    <div>
                      ${t("thirdPartyNodes.sidebar.apiKey")}: ${entry.hasApiKey
                        ? t("thirdPartyNodes.sidebar.configured")
                        : t("thirdPartyNodes.sidebar.emptyValue")}
                    </div>
                  </div>
                </div>
              `,
            )}
      </div>
    </aside>
  `;
}

function renderVerifyHint() {
  return html`
    <div class="muted" style=${`margin-top:12px;${SUBTLE_CARD_STYLE}${LABEL_HINT_STYLE}`}>
      ${t("thirdPartyNodes.verify.hint")}
    </div>
  `;
}

function renderThirdPartyNodesError(
  lastError: string | null,
  lastErrorReason: "template" | "verify" | "apply" | null,
  actions: {
    onReload: () => void;
    onVerify: () => void;
  },
) {
  const message = lastError?.trim();
  if (!message) {
    return nothing;
  }
  const title =
    lastErrorReason === "verify"
      ? t("thirdPartyNodes.errors.verifyTitle")
      : lastErrorReason === "apply"
        ? t("thirdPartyNodes.errors.applyTitle")
        : t("thirdPartyNodes.errors.templateTitle");
  const actionLabel =
    lastErrorReason === "verify"
      ? t("thirdPartyNodes.errors.retryVerify")
      : lastErrorReason === "apply"
        ? t("thirdPartyNodes.errors.reloadConfig")
        : t("thirdPartyNodes.errors.reloadTemplates");
  const onAction = lastErrorReason === "verify" ? actions.onVerify : actions.onReload;
  return html`
    <div
      class="callout danger"
      role="alert"
      data-third-party-error-card="true"
      style="margin-top:16px;"
    >
      <strong>${title}</strong>
      <div style="margin-top:6px;">${message}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button
          class="btn btn--sm"
          type="button"
          data-third-party-error-action=${lastErrorReason ?? "template"}
          @click=${onAction}
        >
          ${actionLabel}
        </button>
      </div>
    </div>
  `;
}

function getCredentialFieldMeta(auth: ThirdPartyNodeFormState["auth"]): CredentialFieldMeta {
  if (auth === "oauth") {
    return {
      label: t("thirdPartyNodes.credential.oauthLabel"),
      placeholder: t("thirdPartyNodes.credential.oauthPlaceholder"),
      help: t("thirdPartyNodes.credential.oauthHelp"),
    };
  }
  if (auth === "token") {
    return {
      label: t("thirdPartyNodes.credential.tokenLabel"),
      placeholder: t("thirdPartyNodes.credential.tokenPlaceholder"),
      help: t("thirdPartyNodes.credential.tokenHelp"),
    };
  }
  return {
    label: t("thirdPartyNodes.credential.apiKeyLabel"),
    placeholder: t("thirdPartyNodes.credential.apiKeyPlaceholder"),
    help: t("thirdPartyNodes.credential.apiKeyHelp"),
  };
}

function getAuthFlowActions(
  auth: ThirdPartyNodeFormState["auth"],
  selectedTemplate: ThirdPartyNodeTemplate | null,
): ThirdPartyNodeTemplateAuthFlowAction[] {
  return (selectedTemplate?.authFlowActions ?? []).filter(
    (action) => !action.authModes || action.authModes.length === 0 || action.authModes.includes(auth),
  );
}

function getAuthAdapters(
  auth: ThirdPartyNodeFormState["auth"],
  selectedTemplate: ThirdPartyNodeTemplate | null,
): ThirdPartyNodeTemplateAuthAdapter[] {
  return (selectedTemplate?.authAdapters ?? []).filter(
    (adapter) =>
      !adapter.authModes || adapter.authModes.length === 0 || adapter.authModes.includes(auth),
  );
}

function getAdapterStatusKey(
  providerKey: string,
  adapterKind: ThirdPartyNodeTemplateAuthAdapter["kind"],
): string {
  return `${providerKey.trim()}::${adapterKind}`;
}

function detectBrowserCallback(selectedTemplate: ThirdPartyNodeTemplate | null): CallbackCapture | null {
  if (typeof window === "undefined") {
    return null;
  }
  const callbackAdapter = selectedTemplate?.authAdapters?.find(
    (adapter) => adapter.kind === "browser-callback" && adapter.callbackUrl,
  );
  if (!callbackAdapter?.callbackUrl) {
    return null;
  }
  try {
    const current = new URL(window.location.href);
    const expected = new URL(callbackAdapter.callbackUrl, current.href);
    const code = current.searchParams.get("code")?.trim() ?? "";
    if (!code || current.pathname !== expected.pathname) {
      return null;
    }
    return {
      code,
      callbackUrl: current.toString(),
    };
  } catch {
    return null;
  }
}

function getAuthGuideRoot(source: HTMLElement | null): ParentNode {
  return source?.closest('[data-third-party-auth-guide="true"]') ?? document;
}

function getThirdPartyPanelRoot(source: HTMLElement | null): ParentNode {
  return source?.closest("section.panel") ?? document;
}

function setAuthActionStatus(
  kind: ThirdPartyNodeTemplateAuthFlowAction["kind"],
  message: string,
  source: HTMLElement | null = null,
) {
  const target = getAuthGuideRoot(source).querySelector<HTMLElement>(
    `[data-third-party-auth-action-status="${kind}"]`,
  );
  if (target) {
    target.textContent = message;
  }
}

async function copyAuthFlowCommand(button: HTMLButtonElement, value: string) {
  const originalLabel = button.textContent ?? t("thirdPartyNodes.authGuide.copy");
  try {
    await navigator.clipboard.writeText(value);
    button.textContent = t("thirdPartyNodes.authGuide.copied");
    setAuthActionStatus(
      "copy-command",
      t("thirdPartyNodes.authGuide.commandCopiedStatus"),
      button,
    );
  } catch {
    button.textContent = t("thirdPartyNodes.authGuide.copyFailed");
    setAuthActionStatus(
      "copy-command",
      t("thirdPartyNodes.authGuide.copyFailedStatus"),
      button,
    );
  }
  window.setTimeout(() => {
    button.textContent = originalLabel;
  }, 1200);
}

function focusCredentialField(source: HTMLElement | null) {
  const input = getThirdPartyPanelRoot(source).querySelector<HTMLInputElement>(
    '[data-third-party-credential-input="true"]',
  );
  input?.focus();
  input?.select();
  setAuthActionStatus(
    "mark-done",
    t("thirdPartyNodes.authGuide.credentialFieldFocusedStatus"),
    source,
  );
}

function openAuthFlowUrl(rawUrl: string, source: HTMLElement | null) {
  const opened = window.open(rawUrl, "_blank", "noopener,noreferrer");
  if (opened) {
    opened.opener = null;
  }
  setAuthActionStatus(
    "open-url",
    opened
      ? t("thirdPartyNodes.authGuide.providerPageOpened")
      : t("thirdPartyNodes.authGuide.popupBlocked"),
    source,
  );
}

function describeCredentialTarget(
  auth: ThirdPartyNodeFormState["auth"],
  credentialTargets: ThirdPartyNodeTemplateCredentialTarget[] | undefined,
): string {
  if (!credentialTargets || credentialTargets.length === 0) {
    return t("thirdPartyNodes.authGuide.defaultCredentialHint");
  }
  const acceptedType =
    auth === "oauth" ? "oauth-credential" : auth === "token" ? "token" : "api-key";
  const matchingTarget =
    credentialTargets.find((target) => target.accepts.includes(acceptedType)) ?? credentialTargets[0];
  const acceptsCurrent = matchingTarget.accepts.includes(acceptedType);
  return acceptsCurrent
    ? t("thirdPartyNodes.authGuide.targetAcceptsCurrent", {
        label: matchingTarget.label,
        type: acceptedType,
      })
    : t("thirdPartyNodes.authGuide.targetLandingField", { label: matchingTarget.label });
}

function renderCredentialTargetList(
  auth: ThirdPartyNodeFormState["auth"],
  credentialTargets: ThirdPartyNodeTemplateCredentialTarget[] | undefined,
) {
  if (!credentialTargets || credentialTargets.length === 0) {
    return nothing;
  }
  const acceptedType =
    auth === "oauth" ? "oauth-credential" : auth === "token" ? "token" : "api-key";
  return html`
    <div data-third-party-credential-targets="true" style="margin-top:10px;display:grid;gap:8px;">
      ${credentialTargets.map(
        (target) => html`
          <div style=${SUBTLE_CARD_STYLE}>
            <div style=${FLEX_ROW_WRAP_STYLE}>
              <strong>${target.label}</strong>
              <span class="muted" style=${LABEL_HINT_STYLE}>
                ${t("thirdPartyNodes.authGuide.accepts")}: ${target.accepts.join(", ")}
              </span>
            </div>
            <div class="muted" style=${MUTED_TEXT_STYLE}>
              ${target.accepts.includes(acceptedType)
                ? t("thirdPartyNodes.authGuide.targetMatches", { type: acceptedType })
                : t("thirdPartyNodes.authGuide.targetDoesNotMatch", { type: acceptedType })}
            </div>
          </div>
        `,
      )}
    </div>
  `;
}

function renderAuthFlowAction(action: ThirdPartyNodeTemplateAuthFlowAction) {
  if (action.kind === "open-url" && action.url) {
    return html`
      <button
        class="btn btn--sm"
        type="button"
        data-third-party-auth-action=${action.kind}
        @click=${(event: Event) =>
          openAuthFlowUrl(action.url ?? "", event.currentTarget as HTMLElement | null)}
      >
        ${action.label}
      </button>
    `;
  }
  if (action.kind === "copy-command" && action.value) {
    return html`
      <button
        class="btn btn--sm"
        type="button"
        data-third-party-auth-action=${action.kind}
        @click=${(event: Event) =>
          void copyAuthFlowCommand(event.currentTarget as HTMLButtonElement, action.value ?? "")}
      >
        ${action.label}
      </button>
    `;
  }
  return html`
    <button
      class="btn btn--sm"
      type="button"
      data-third-party-auth-action=${action.kind}
      @click=${(event: Event) => focusCredentialField(event.currentTarget as HTMLElement | null)}
    >
      ${action.label}
    </button>
  `;
}

function renderAuthAdapter(
  adapter: ThirdPartyNodeTemplateAuthAdapter,
  props: ThirdPartyNodesViewProps,
) {
  const providerKey = props.form?.providerKey?.trim() ?? "";
  const statusKey = providerKey ? getAdapterStatusKey(providerKey, adapter.kind) : null;
  if (adapter.kind === "command" && adapter.command) {
    return html`
      <span style=${FLEX_ROW_WRAP_STYLE}>
        <button
          class="btn btn--sm"
          type="button"
          data-third-party-auth-adapter=${adapter.kind}
          @click=${async (event: Event) => {
            await copyAuthFlowCommand(event.currentTarget as HTMLButtonElement, adapter.command ?? "");
            if (statusKey) {
              props.onAuthAdapterStatusChange(
                statusKey,
                t("thirdPartyNodes.authGuide.commandCopiedLocallyStatus"),
              );
              props.onAuthAdapterProgressChange(statusKey, {
                phase: "copied",
                updatedAt: Date.now(),
                detail: t("thirdPartyNodes.authGuide.commandCopiedDetail"),
              });
            }
          }}
        >
          ${adapter.label}
        </button>
        <button
          class="btn btn--sm"
          type="button"
          data-third-party-auth-adapter-executed=${adapter.kind}
          @click=${() => {
            if (statusKey) {
              props.onAuthAdapterStatusChange(
                statusKey,
                t("thirdPartyNodes.authGuide.commandExecutedStatus"),
              );
              props.onAuthAdapterProgressChange(statusKey, {
                phase: "executed",
                updatedAt: Date.now(),
                detail: t("thirdPartyNodes.authGuide.commandExecutedDetail"),
              });
            }
          }}
        >
          ${t("thirdPartyNodes.authGuide.markExecuted")}
        </button>
      </span>
    `;
  }
  if (adapter.kind === "browser-callback" && adapter.url) {
    return html`
      <button
        class="btn btn--sm"
        type="button"
        data-third-party-auth-adapter=${adapter.kind}
        @click=${(event: Event) => {
          openAuthFlowUrl(adapter.url ?? "", event.currentTarget as HTMLElement | null);
          if (statusKey) {
            props.onAuthAdapterStatusChange(
              statusKey,
              t("thirdPartyNodes.authGuide.providerPageOpenedReturnStatus"),
            );
          }
        }}
      >
        ${adapter.label}
      </button>
    `;
  }
  return html`
    <button
      class="btn btn--sm"
      type="button"
      data-third-party-auth-adapter=${adapter.kind}
      @click=${(event: Event) => {
        focusCredentialField(event.currentTarget as HTMLElement | null);
        if (statusKey) {
          props.onAuthAdapterStatusChange(
            statusKey,
            t("thirdPartyNodes.authGuide.credentialFieldFocusedShortStatus"),
          );
        }
      }}
    >
      ${adapter.label}
    </button>
  `;
}

function renderCallbackCapturePanel(args: {
  capture: CallbackCapture;
  props: ThirdPartyNodesViewProps;
}) {
  return html`
    <div data-third-party-callback-capture="true" style="margin-top:10px;display:grid;gap:8px;">
      <div style=${SUBTLE_CARD_STYLE}>
        <div style=${SECTION_EYEBROW_STYLE}>${t("thirdPartyNodes.authGuide.browserCallbackDetected")}</div>
        <div class="muted" style=${MUTED_TEXT_STYLE}>
          ${t("thirdPartyNodes.authGuide.browserCallbackDetectedHint")}
        </div>
        <div class="muted" style=${MUTED_TEXT_STYLE}>${t("thirdPartyNodes.authGuide.code")}: ${args.capture.code}</div>
        <div style=${FLEX_ROW_WRAP_STYLE}>
          <button
            class="btn btn--sm"
            type="button"
            data-third-party-callback-use-code="true"
            @click=${() => {
              args.props.onFieldChange("apiKey", args.capture.code);
              const providerKey = args.props.form?.providerKey?.trim() ?? "";
              if (providerKey) {
                const adapterKey = getAdapterStatusKey(providerKey, "browser-callback");
                args.props.onAuthAdapterStatusChange(
                  adapterKey,
                  t("thirdPartyNodes.authGuide.callbackDraftedStatus"),
                );
                args.props.onAuthAdapterProgressChange(adapterKey, {
                  phase: "callback_received",
                  updatedAt: Date.now(),
                  detail: t("thirdPartyNodes.authGuide.callbackDraftedStatus"),
                });
              }
            }}
          >
            ${t("thirdPartyNodes.authGuide.useCallbackCode")}
          </button>
          <span class="muted" style=${LABEL_HINT_STYLE}>${t("thirdPartyNodes.authGuide.callback")}: ${args.capture.callbackUrl}</span>
        </div>
      </div>
    </div>
  `;
}

function renderAuthFlowGuide(
  auth: ThirdPartyNodeFormState["auth"],
  selectedTemplate: ThirdPartyNodeTemplate | null,
  props: ThirdPartyNodesViewProps,
) {
  const meta = getCredentialFieldMeta(auth);
  const actions = getAuthFlowActions(auth, selectedTemplate);
  const adapters = getAuthAdapters(auth, selectedTemplate);
  const callbackCapture = auth === "oauth" ? detectBrowserCallback(selectedTemplate) : null;
  const credentialHint = describeCredentialTarget(auth, selectedTemplate?.credentialTargets);
  const title =
    auth === "oauth"
      ? t("thirdPartyNodes.authGuide.oauthTitle")
      : auth === "token"
        ? t("thirdPartyNodes.authGuide.tokenTitle")
        : t("thirdPartyNodes.authGuide.apiKeyTitle");
  const steps =
    auth === "oauth"
      ? [
          t("thirdPartyNodes.authGuide.oauthStep1"),
          t("thirdPartyNodes.authGuide.oauthStep2"),
          t("thirdPartyNodes.authGuide.oauthStep3"),
        ]
      : auth === "token"
        ? [
            t("thirdPartyNodes.authGuide.tokenStep1"),
            t("thirdPartyNodes.authGuide.tokenStep2"),
            t("thirdPartyNodes.authGuide.tokenStep3"),
          ]
        : [
            t("thirdPartyNodes.authGuide.apiKeyStep1"),
            t("thirdPartyNodes.authGuide.apiKeyStep2"),
            t("thirdPartyNodes.authGuide.apiKeyStep3"),
          ];
  return html`
    <div data-third-party-auth-guide="true" style="grid-column:1 / -1;">
      <div style=${SUBTLE_CARD_STYLE}>
        <div style=${SECTION_EYEBROW_STYLE}>${t("thirdPartyNodes.authGuide.credentialFlow")}</div>
        <div style="margin-top:4px;font-weight:600;">${title}</div>
        <div class="muted" style=${MUTED_TEXT_STYLE}>${meta.help}</div>
        <div class="muted" style=${MUTED_TEXT_STYLE}>${credentialHint}</div>
        ${renderCredentialTargetList(auth, selectedTemplate?.credentialTargets)}
        ${callbackCapture ? renderCallbackCapturePanel({ capture: callbackCapture, props }) : nothing}
        <div style="margin-top:8px;display:grid;gap:6px;">
          ${steps.map(
            (step, index) => html`<div style=${LABEL_HINT_STYLE}>${index + 1}. ${step}</div>`,
          )}
        </div>
        ${adapters.length > 0
          ? html`
              <div data-third-party-auth-adapters="true" style="margin-top:10px;display:grid;gap:8px;">
                <div style=${SECTION_EYEBROW_STYLE}>${t("thirdPartyNodes.authGuide.authAdapters")}</div>
                ${adapters.map(
                  (adapter) => {
                    const adapterKey = getAdapterStatusKey(
                      props.form?.providerKey?.trim() ?? "",
                      adapter.kind,
                    );
                    const progress = props.authAdapterProgress[adapterKey];
                    return html`
                    <div data-third-party-auth-adapter-card=${adapter.kind} style=${SUBTLE_CARD_STYLE}>
                      <div style=${FLEX_ROW_WRAP_STYLE}>
                        ${renderAuthAdapter(adapter, props)}
                        ${adapter.detail
                          ? html`<span class="muted" style=${LABEL_HINT_STYLE}>${adapter.detail}</span>`
                          : nothing}
                      </div>
                      <div class="muted" style=${MUTED_TEXT_STYLE}>
                        ${props.authAdapterStatuses[adapterKey] ?? t("thirdPartyNodes.authGuide.ready")}
                      </div>
                      ${progress
                        ? html`
                            <div
                              class="muted"
                              data-third-party-auth-adapter-progress=${adapter.kind}
                              style=${MUTED_TEXT_STYLE}
                            >
                              ${presentAuthAdapterPhase(progress.phase)} · ${progress.detail} · ${t("thirdPartyNodes.authGuide.updated")}:
                              ${formatAuthAdapterProgressTime(progress.updatedAt)}
                            </div>
                          `
                        : nothing}
                      ${adapter.callbackUrl
                        ? html`
                            <div class="muted" style=${MUTED_TEXT_STYLE}>
                              ${t("thirdPartyNodes.authGuide.callback")}: ${adapter.callbackUrl}
                            </div>
                          `
                        : nothing}
                    </div>
                  `;
                  },
                )}
              </div>
            `
          : nothing}
        ${actions.length > 0
          ? html`
              <div style="margin-top:10px;display:grid;gap:8px;">
                ${actions.map(
                  (action) => html`
                    <div
                      data-third-party-auth-action-card=${action.kind}
                      style=${SUBTLE_CARD_STYLE}
                    >
                      <div style=${FLEX_ROW_WRAP_STYLE}>
                        ${renderAuthFlowAction(action)}
                        ${action.detail
                          ? html`<span class="muted" style=${LABEL_HINT_STYLE}>${action.detail}</span>`
                          : nothing}
                      </div>
                      <div
                        class="muted"
                        data-third-party-auth-action-status=${action.kind}
                        style=${MUTED_TEXT_STYLE}
                      >
                        ${t("thirdPartyNodes.authGuide.ready")}
                      </div>
                    </div>
                  `,
                )}
              </div>
            `
          : nothing}
        ${auth === "oauth"
          ? html`
              <div class="muted" style=${MUTED_TEXT_STYLE}>
                ${t("thirdPartyNodes.authGuide.oauthFootnote")}
              </div>
            `
          : nothing}
        <div
          data-third-party-docs-toolbar="true"
          style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;"
        >
          <span class="muted" style=${LABEL_HINT_STYLE}>${t("thirdPartyNodes.authGuide.docsToolbar")}</span>
          <a
            class="btn btn--sm"
            data-third-party-openclaw-docs-link="true"
            href="https://docs.openclaw.ai/web/third-party-nodes"
            target="_blank"
            rel="noreferrer"
          >
            ${t("thirdPartyNodes.summary.operatorGuide")}
          </a>
          <a
            class="btn btn--sm"
            data-third-party-template-spec-link="true"
            href="https://docs.openclaw.ai/reference/third-party-node-templates"
            target="_blank"
            rel="noreferrer"
          >
            ${t("thirdPartyNodes.summary.templateSpec")}
          </a>
          ${selectedTemplate?.docsUrl
            ? html`
                <a
                  class="btn btn--sm"
                  data-third-party-provider-docs-link="true"
                  href=${selectedTemplate.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  ${t("thirdPartyNodes.summary.providerDocs")}
                </a>
              `
            : nothing}
        </div>
      </div>
    </div>
  `;
}

function presentAuthAdapterPhase(phase: AuthAdapterProgressEntry["phase"]): string {
  if (phase === "copied") {
    return t("thirdPartyNodes.authGuide.phaseCopied");
  }
  if (phase === "executed") {
    return t("thirdPartyNodes.authGuide.phaseExecuted");
  }
  if (phase === "credential_received") {
    return t("thirdPartyNodes.authGuide.phaseCredentialReceived");
  }
  return t("thirdPartyNodes.authGuide.phaseCallbackReceived");
}

function formatAuthAdapterProgressTime(updatedAt: number): string {
  return new Date(updatedAt).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "Z");
}

function getCapabilityPresentations(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  selectedVerifiedModel: ThirdPartyNodeVerifiedModel | null,
  recentModelId: string | null,
): Record<CapabilityField, ReturnType<typeof getCapabilityFieldPresentation>> {
  return Object.fromEntries(
    FIELD_ORDER.map((field) => [
      field,
      getCapabilityFieldPresentation(
        form,
        selectedTemplate,
        selectedVerifiedModel,
        recentModelId,
        field,
      ),
    ]),
  ) as Record<CapabilityField, ReturnType<typeof getCapabilityFieldPresentation>>;
}

function renderBasicProviderFields(
  form: ThirdPartyNodeFormState,
  selectedTemplate: ThirdPartyNodeTemplate | null,
  props: ThirdPartyNodesViewProps,
  onFieldChange: ThirdPartyNodesViewProps["onFieldChange"],
) {
  const credentialField = getCredentialFieldMeta(form.auth);
  return html`
    <label class="field">
      <span>${t("thirdPartyNodes.form.providerKey")}</span>
      <input
        .value=${form.providerKey}
        @input=${(event: Event) => onFieldChange("providerKey", (event.target as HTMLInputElement).value)}
      />
    </label>
    <label class="field">
      <span>${t("thirdPartyNodes.form.displayLabel")}</span>
      <input
        .value=${form.label}
        @input=${(event: Event) => onFieldChange("label", (event.target as HTMLInputElement).value)}
      />
    </label>
    <label class="field" style="grid-column:1 / -1;">
      <span>${t("thirdPartyNodes.form.baseUrl")}</span>
      <input
        list="tpn-baseurl-presets"
        .value=${form.baseUrl}
        @input=${(event: Event) => onFieldChange("baseUrl", (event.target as HTMLInputElement).value)}
      />
      <datalist id="tpn-baseurl-presets">
        ${(selectedTemplate?.baseUrlPresets ?? []).map(
          (preset) => html`<option value=${preset.url}>${preset.label}</option>`,
        )}
      </datalist>
    </label>
    <label class="field">
      <span>${t("thirdPartyNodes.form.auth")}</span>
      <select
        .value=${form.auth}
        @change=${(event: Event) =>
          onFieldChange("auth", (event.target as HTMLSelectElement).value as ThirdPartyNodeFormState["auth"])}
      >
        ${(selectedTemplate?.authOptions ?? ["api-key"]).map(
          (auth) => html`<option value=${auth}>${presentAuthModeLabel(auth)}</option>`,
        )}
      </select>
    </label>
    <label class="field">
      <span>${t("thirdPartyNodes.form.apiMode")}</span>
      <select
        .value=${form.api}
        @change=${(event: Event) =>
          onFieldChange("api", (event.target as HTMLSelectElement).value as ThirdPartyNodeFormState["api"])}
      >
        ${[
          "openai-responses",
          "openai-completions",
          "openai-codex-responses",
          "anthropic-messages",
          "google-generative-ai",
          "github-copilot",
          "bedrock-converse-stream",
          "ollama",
        ].map((api) => html`<option value=${api}>${presentApiModeLabel(api)}</option>`)}
      </select>
    </label>
    ${renderAuthFlowGuide(form.auth, selectedTemplate, props)}
    <label class="field" style="grid-column:1 / -1;">
      <span>${credentialField.label}</span>
      <input
        type="password"
        autocomplete="off"
        data-third-party-credential-input="true"
        placeholder=${credentialField.placeholder}
        .value=${form.apiKey}
        @input=${(event: Event) => onFieldChange("apiKey", (event.target as HTMLInputElement).value)}
      />
    </label>
  `;
}

function renderCapabilityCheckboxRow(
  form: ThirdPartyNodeFormState,
  reasoningField: ReturnType<typeof getCapabilityFieldPresentation> | null,
  imageInputField: ReturnType<typeof getCapabilityFieldPresentation> | null,
  props: ThirdPartyNodesViewProps,
) {
  return html`
    <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;">
      <label class="checkbox" style="display:flex;gap:8px;align-items:center;">
        <input
          type="checkbox"
          .checked=${form.enabled}
          @change=${(event: Event) => props.onFieldChange("enabled", (event.target as HTMLInputElement).checked)}
        />
        <span>${t("thirdPartyNodes.form.enabled")}</span>
      </label>
      ${renderCapabilityCheckboxField(
        t("thirdPartyNodes.form.reasoning"),
        "reasoning",
        form,
        reasoningField,
        props,
      )}
      ${renderCapabilityCheckboxField(
        t("thirdPartyNodes.form.imageInput"),
        "supportsImageInput",
        form,
        imageInputField,
        props,
      )}
    </div>
  `;
}

export function renderThirdPartyNodes(props: ThirdPartyNodesViewProps) {
  const form = props.form;
  const selectedTemplate =
    props.templates.find((entry) => entry.id === props.selectedTemplateId) ?? null;
  const canApply =
    Boolean(form) &&
    !props.loading &&
    !props.saving &&
    !props.verifying &&
    Boolean(form?.providerKey.trim()) &&
    Boolean(form?.baseUrl.trim()) &&
    Boolean(form?.modelId.trim());
  const canVerify =
    Boolean(form) &&
    !props.loading &&
    !props.saving &&
    !props.verifying &&
    Boolean(form?.providerKey.trim()) &&
    Boolean(form?.baseUrl.trim());
  const verifyPresentation = props.verifyResult ? presentVerifyResult(props.verifyResult) : null;
  const applyConfirmTone = props.applyConfirm ? confirmTone(props.applyConfirm.severity) : null;
  const applyConfirmButtonClass = props.applyConfirm
    ? props.applyConfirm.severity === "danger"
      ? "btn danger"
      : "btn primary"
    : "btn primary";
  const applyConfirmButtonLabel = props.applyConfirm
    ? props.applyConfirm.severity === "danger"
      ? t("thirdPartyNodes.applyConfirm.applyAnyway")
      : t("thirdPartyNodes.applyConfirm.applyWithoutTest")
    : t("thirdPartyNodes.applyConfirm.apply");
  const verifiedModels = props.verifyResult?.models ?? [];
  const verifiedModelIds = verifiedModels.map((entry) => entry.id);
  const filteredVerifiedModels = verifiedModels.filter((entry) => {
    if (props.filterReasoningOnly && entry.reasoning !== true) {
      return false;
    }
    if (props.filterImageOnly && !entry.input?.includes("image")) {
      return false;
    }
    return true;
  });
  const selectedVerifiedModel =
    verifiedModels.find((entry) => entry.id === form?.modelId.trim()) ?? null;
  const recentModelId = props.recentModelId?.trim() || null;
  const hasActiveModelFilters = props.filterReasoningOnly || props.filterImageOnly;
  const manualOverrideCount =
    form && selectedVerifiedModel
      ? countManualOverrideFields(form, selectedTemplate, selectedVerifiedModel, recentModelId)
      : 0;
  const manualOverrideGroups =
    form && selectedVerifiedModel
      ? summarizeManualOverrideGroups(form, selectedTemplate, selectedVerifiedModel, recentModelId)
      : [];
  const fieldPresentations = form
    ? getCapabilityPresentations(form, selectedTemplate, selectedVerifiedModel, recentModelId)
    : null;
  return html`
    <section class="panel" style="margin-bottom:16px;">
      ${renderPanelHeader({
        dirty: props.dirty,
        loading: props.loading,
        saving: props.saving,
        verifying: props.verifying,
        canApply,
        canVerify,
        onReload: props.onReload,
        onVerify: props.onVerify,
        onApply: props.onApply,
      })}

      ${renderThirdPartyNodesError(props.lastError, props.lastErrorReason, {
        onReload: props.onReload,
        onVerify: props.onVerify,
      })}

      <div
        style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,0.9fr);gap:16px;margin-top:16px;"
      >
        <div class="card" style="padding:16px;">
          ${renderTemplateSelector(
            props.selectedTemplateId,
            props.templates,
            selectedTemplate,
            props.onFieldChange,
            props.onTemplateChange,
          )}

          ${form
            ? html`
                <div
                  style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;"
                >
                  ${renderBasicProviderFields(form, selectedTemplate, props, props.onFieldChange)}
                  ${renderCapabilityInputField({
                    label: t("thirdPartyNodes.form.modelId"),
                    field: "modelId",
                    form,
                    presentation: fieldPresentations?.modelId ?? null,
                    props,
                  })}
                    ${verifiedModelIds.length > 0
                      ? html`
                          <select
                            data-third-party-model-select="true"
                            style="margin-top:8px;"
                            @change=${(event: Event) =>
                              props.onFieldChange(
                                "modelId",
                                (event.target as HTMLSelectElement).value,
                              )}
                          >
                            <option value="" ?selected=${!verifiedModelIds.includes(form.modelId)}>
                              ${t("thirdPartyNodes.form.chooseVerifiedModel")}
                            </option>
                            ${verifiedModels.map(
                              (model) =>
                                html`<option value=${model.id} ?selected=${model.id === form.modelId}>
                                  ${model.name ? `${model.name} (${model.id})` : model.id}${recentModelId === model.id
                                    ? ` — ${t("thirdPartyNodes.sources.recentLabel")}`
                                    : ""}
                                </option>`,
                            )}
                          </select>
                          <div class="muted" style="margin-top:6px;font-size:12px;">
                            ${t("thirdPartyNodes.form.verifiedModelsHint")}
                          </div>
                        `
                      : nothing}
                    ${selectedVerifiedModel
                      ? renderSelectedModelSummary({
                          selectedVerifiedModel,
                          selectedTemplate,
                          recentModelId,
                          focusedSource: props.focusedSource,
                          focusedManualGroup: props.focusedManualGroup,
                          manualOverrideGroups,
                          manualOverrideCount,
                          highlightManualFields: props.highlightManualFields,
                          manualHighlightNoticeDismissed: props.manualHighlightNoticeDismissed,
                          onFocusSource: props.onFocusSource,
                          onFocusManualGroup: props.onFocusManualGroup,
                          onToggleManualHighlights: props.onToggleManualHighlights,
                          onDismissManualHighlightNotice: props.onDismissManualHighlightNotice,
                          onApplyTemplateDefaults: props.onApplyTemplateDefaults,
                          onClearRecentModel: props.onClearRecentModel,
                        })
                      : nothing}
                  ${renderCapabilityInputField({
                    label: t("thirdPartyNodes.form.modelName"),
                    field: "modelName",
                    form,
                    presentation: fieldPresentations?.modelName ?? null,
                    props,
                  })}
                  ${renderCapabilityInputField({
                    label: t("thirdPartyNodes.form.contextWindow"),
                    field: "contextWindow",
                    form,
                    presentation: fieldPresentations?.contextWindow ?? null,
                    props,
                    inputType: "number",
                    min: "1",
                  })}
                  ${renderCapabilityInputField({
                    label: t("thirdPartyNodes.form.maxTokens"),
                    field: "maxTokens",
                    form,
                    presentation: fieldPresentations?.maxTokens ?? null,
                    props,
                    inputType: "number",
                    min: "1",
                  })}
                </div>
                ${renderCapabilityCheckboxRow(
                  form,
                  fieldPresentations?.reasoning ?? null,
                  fieldPresentations?.supportsImageInput ?? null,
                  props,
                )}
                ${renderVerifyHint()}
                ${props.verifyResult && verifyPresentation
                  ? renderVerifyResultPanel({
                      verifyResult: props.verifyResult,
                      verifyPresentation,
                      filteredVerifiedModels,
                      hasActiveModelFilters,
                      filterReasoningOnly: props.filterReasoningOnly,
                      filterImageOnly: props.filterImageOnly,
                      recentModelId,
                      selectedModelId: form?.modelId.trim() ?? null,
                      onFilterReasoningOnlyChange: props.onFilterReasoningOnlyChange,
                      onFilterImageOnlyChange: props.onFilterImageOnlyChange,
                      onClearFilters: props.onClearFilters,
                      onUseModel: (modelId) => props.onFieldChange("modelId", modelId),
                    })
                  : nothing}
                ${props.applyConfirm && applyConfirmTone
                  ? renderApplyConfirmCard({
                      applyConfirm: props.applyConfirm,
                      applyConfirmTone,
                      applyConfirmButtonClass,
                      applyConfirmButtonLabel,
                      verifying: props.verifying,
                      saving: props.saving,
                      onVerify: props.onVerify,
                      onApplyConfirm: props.onApplyConfirm,
                      onApplyCancel: props.onApplyCancel,
                    })
                  : nothing}
              `
            : html`<div class="muted">${t("thirdPartyNodes.form.noTemplateAvailable")}</div>`}
        </div>
        ${renderConfiguredNodesSidebar(props.entries)}
      </div>
    </section>
  `;
}
