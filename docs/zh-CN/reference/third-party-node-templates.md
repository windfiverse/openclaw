---
summary: "Control UI 第三方节点模板的编写参考"
read_when:
  - 你要新增第三方节点 provider 模板
  - 你需要一份稳定的 adapter、credential 落点和验证行为检查清单
title: "第三方节点模板"
---

# 第三方节点模板

这页面向 provider 接入者和维护者，目标是为 `src/gateway/third-party-nodes/catalog.ts` 增加模板条目。

面向操作者的说明见 [第三方节点](/zh-CN/web/third-party-nodes)。

## 目标

一个好的模板，应该描述 provider 稳定的接入面，而不是把易碎的 provider 网页细节硬编码进 OpenClaw。

好的模板通常做到三件事：

- 预填合理默认值
- 把操作者引导到正确的 credential 字段 / credential 落点
- 让认证编排足够通用，能承受 provider 流程的小改动

## 内置示例索引

新增模板前，先把现有 catalog 当成第一参考源：

| 模板 | 接入模式 | 存在原因 |
| --- | --- | --- |
| `openai-compatible` | 通用手动 credential 落点 | 任意 OpenAI 兼容端点的基线模板 |
| `yunyi` | command + browser callback + manual paste | provider 外部认证门户的完整示例 |
| `openrouter` | 文档引导 + 手动发 key | 非 callback 类 provider 的简单示例 |
| `groq` | 文档引导 + 手动发 key，并带固定 `/openai/v1` 预设 | 低延迟 provider 模板示例 |

实践规则：

- 如果只是默认值不同，优先从 `openai-compatible` 扩展
- 只有当认证编排或文档引导明显不同，才拆成独立模板

## 必填字段

每个模板都应定义：

- `id`
- `label`
- `description`
- `providerKeyDefault`
- `authOptions`
- `defaultAuth`
- `defaultApi`
- `baseUrlPresets`
- `defaultModel`

实用规则：

- `id` 要稳定、适合机器处理
- `providerKeyDefault` 应该是安全的配置 key 种子，不要拿展示文案代替
- `defaultApi` 应反映真实协议面，不要写成营销名词
- `defaultModel` 要选“高概率真能用”的默认值，不要只追最新宣传型号

## 认证模型

用 `authOptions` 声明模板支持的顶层认证模式：

- `api-key`
- `token`
- `oauth`

`defaultAuth` 应该优先选最容易首轮成功的路径。
同时，`defaultAuth` 必须包含在 `authOptions` 里。

如果 provider 并不会产出一个能粘贴回 OpenClaw 的最终 credential，就不要宣称支持 `oauth`。

## Credential 落点

用 `credentialTargets` 告诉 UI：最终 credential 应写入哪个 credential 字段。

当前目标字段：

- `apiKey`

支持的接受类型：

- `api-key`
- `token`
- `oauth-credential`

建议：

- 如果 provider 最终返回一个 bearer 风格 secret，就落到 `apiKey`
- 即使中间步骤很多，模板里也只描述最终操作者可见的 credential 落点

## Auth adapters

`authAdapters` 用来表达操作者真实的 credential 获取路径。

当前支持：

- `command`
- `browser-callback`
- `manual-paste`

### `command`

适用于 provider 要求本地执行命令的场景，例如：

```bash
npx provider-activator
```

要求：

- 设置 `command`
- 用 `detail` 说明执行后要把什么结果粘贴回来
- 如果只适用于部分认证模式，用 `authModes` 做限制
- `authModes` 里的值必须是模板 `authOptions` 的子集

### `browser-callback`

适用于 provider 提供网页登录或门户流程的场景。

常用字段：

- `url`
- `callbackUrl`

只有当 provider 真的会跳回一个稳定的本地 URL 时，才设置 `callbackUrl`。
`browser-callback` 必须声明 `url`，`callbackUrl` 则是可选的。
如果声明了 `authModes`，它的值也必须是模板 `authOptions` 的子集。

不要假设 OpenClaw 会自动把 callback code 换成 token。当前它只会识别并草拟回调里的 `code`。

### `manual-paste`

适用于 provider 流程本身已足够清晰，而 UI 只需要把光标引导到 credential 字段的场景。

这是最安全的兜底 adapter。

## Flow actions

`authFlowActions` 适合补充轻量 auth flow 提示动作。

当前支持：

- `copy-command`
- `open-url`
- `mark-done`

校验规则：

- `copy-command` 必须声明 `value`
- `open-url` 必须声明 `url`
- `mark-done` 只应用于本地 UI 完成态的引导步骤
- `authModes` 里的值必须是模板 `authOptions` 的子集

适用场景：

- 需要一个快捷操作，但没必要做成完整 adapter 卡片
- provider 流程很简单，用完整 adapter 反而冗余

## Provider 文档链接

如果 provider 有稳定的接入说明页，可以设置 `docsUrl`。

适合承载：

- provider 特有的登录说明
- 模型目录说明
- 访问策略说明

但不要把它当成唯一解释来源。模板本身仍应携带足够信息，让操作者只看 Control UI 也能完成主要 auth flow。

## 默认模型建议

`defaultModel` 应优先选择这样的模型：

- provider 默认可用
- 与 `defaultApi` 协议兼容
- 能通过 `/models` 稳定验证

避免：

- 猜测性的 model ID
- 除非模板本身是地区专用，否则不要使用地区限定 ID
- 对 provider endpoint 并未体现的能力做乐观声明

## 兼容性检查清单

新增模板前，至少确认：

1. Base URL 真的暴露了所选 API 面。
2. 认证模式与 provider 实际请求要求一致。
3. 操作者最终能拿到一个可粘贴的 credential。
4. `Test Connection` 能通过 `/models` 完成验证。
5. provider 登录页文案稍作修改后，模板仍然可用。

## 术语一致性清单

模板文档里的术语要尽量和 Control UI 保持一致，避免操作者自己在脑内做二次翻译：

1. 表单里的最终粘贴目标统一叫 `credential field`。
2. 只有在描述“最终 credential 落到哪里”时，才使用 `credential landing`。
3. 面向操作者的可执行获取步骤统一叫 `auth adapter`。
4. 比 adapter 更轻量的辅助提示统一叫 `auth flow action`。
5. 浏览器识别回调 `code` 并草拟到字段时，统一叫 `callback capture`。

避免混用这些近义但容易跑偏的表达：

- 明明指的是 `credential field`，却写成 `secret field`
- 明明指的是 `auth flow action`，却只写笼统的 `action`
- 明明是把回调 `code` 草拟进字段，却写成泛化的“登录结果”

## 速查清单

- `defaultAuth` 已包含在 `authOptions` 中
- 每个 adapter 的 `authModes` 都是 `authOptions` 的子集
- 每个 action 的 `authModes` 都是 `authOptions` 的子集
- 每个 `browser-callback` adapter 都声明了 provider `url`
- 只有 `browser-callback` adapter 才使用 `callbackUrl`
- 每个 `copy-command` action 都声明了 `value`
- 每个 `open-url` action 都声明了 `url`
- `docsUrl` 是稳定、面向操作者的说明页，而不是一次性登录跳转链接

## 改动后同步清单

当你改了模板结构、认证流程语义或操作者可见文案时，周边面也要一起同步：

1. 更新 `src/gateway/third-party-nodes/catalog.ts`，以及对应的 `src/gateway/protocol/schema/third-party-nodes.ts`。
2. 更新 `ui/src/ui/views/third-party-nodes.ts` 里的 Control UI 文案，以及 `ui/src/i18n/locales/*.ts` 里的 locale key。
3. 如果 Control UI 里的可见流程变了，同步更新 `docs/web/third-party-nodes.md` 操作说明。
4. 如果编写规则、支持的 adapter 类型或示例变了，同步更新本参考页。
5. 合并前执行 `corepack pnpm run test:third-party-nodes`。

## 最小模板示例

```ts
{
  id: "openai-compatible",
  label: "OpenAI-Compatible",
  description: "Generic OpenAI-compatible third-party node using an API key.",
  providerKeyDefault: "openai-compatible",
  authOptions: ["api-key", "token"],
  defaultAuth: "api-key",
  defaultApi: "openai-responses",
  baseUrlPresets: [],
  defaultModel: {
    id: "gpt-5.2",
    name: "GPT-5.2",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 32768,
  },
  credentialTargets: [
    { field: "apiKey", label: "Credential field", accepts: ["api-key", "token"] },
  ],
  authAdapters: [
    {
      kind: "manual-paste",
      label: "Paste credential manually",
      detail: "Paste the provider-issued key or token into the credential field below.",
      authModes: ["api-key", "token"],
    },
  ],
}
```

## 回调型示例

```ts
{
  id: "yunyi",
  label: "Yunyi",
  providerKeyDefault: "yunyi-codex",
  authOptions: ["api-key", "token", "oauth"],
  defaultAuth: "api-key",
  docsUrl: "https://yunyi.rdzhvip.com/codex",
  authAdapters: [
    {
      kind: "command",
      label: "CLI activator",
      command: "npx yunyi-activator",
      authModes: ["api-key", "token", "oauth"],
    },
    {
      kind: "browser-callback",
      label: "Provider web login",
      url: "https://yunyi.rdzhvip.com/codex",
      callbackUrl: "http://localhost:1455/auth/callback",
      authModes: ["oauth", "api-key", "token"],
    },
  ],
  authFlowActions: [
    {
      kind: "copy-command",
      label: "Copy activator command",
      value: "npx yunyi-activator",
    },
    {
      kind: "open-url",
      label: "Open provider page",
      url: "https://yunyi.rdzhvip.com/codex",
    },
    {
      kind: "mark-done",
      label: "I already authenticated",
    },
  ],
}
```

## 非回调型示例

```ts
{
  id: "openrouter",
  label: "OpenRouter",
  description: "OpenRouter OpenAI-compatible routing endpoint for multi-provider model access.",
  providerKeyDefault: "openrouter",
  authOptions: ["api-key"],
  defaultAuth: "api-key",
  defaultApi: "openai-responses",
  baseUrlPresets: [{ label: "openrouter.ai/api", url: "https://openrouter.ai/api" }],
  defaultModel: {
    id: "openai/gpt-4o-mini",
    name: "OpenAI GPT-4o Mini",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 16384,
  },
  docsUrl: "https://openrouter.ai/docs/api-reference/overview",
  credentialTargets: [
    { field: "apiKey", label: "Credential field", accepts: ["api-key"] },
  ],
  authAdapters: [
    {
      kind: "manual-paste",
      label: "Paste OpenRouter key",
      detail: "Create an API key in the OpenRouter dashboard and paste it into the credential field.",
      authModes: ["api-key"],
    },
  ],
  authFlowActions: [
    {
      kind: "open-url",
      label: "Open OpenRouter docs",
      url: "https://openrouter.ai/docs/api-reference/overview",
    },
    {
      kind: "mark-done",
      label: "I already have a key",
    },
  ],
}
```

## 设计边界

这些边界要保持清晰：

- provider 登录执行仍在 OpenClaw 外部
- 模板描述的是编排，不是 secret 交换
- 浏览器回调检测只是路径 + `code` 捕获，不是完整 OAuth 收尾

如果某个 provider 需要 token exchange、PKCE 或安全 secret broker，那应该做成单独的后端能力，而不是塞进模板里。

## 回归测试

模板或 UI 流程改动后，执行：

```bash
corepack pnpm run test:third-party-nodes
```
