---
summary: "Control UI 中基于模板的第三方节点认证流程"
read_when:
  - 你想在浏览器里添加 OpenAI 兼容的第三方节点
  - 你想把外部 provider 门户、激活器或回调登录流程接到统一操作流里
title: "第三方节点"
---

# 第三方节点

Control UI 在 **AI Agents** 页面里提供了一套可复用的第三方节点接入流程。

这套流程适合那些认证不完全发生在 OpenClaw 内部的 provider。例如：

- provider 门户里手动签发 API key
- 需要执行 `npx <provider>-activator` 之类的 CLI 激活器
- 通过网页登录，再重定向回本地回调地址并带回 `code`

OpenClaw 目前不会直接执行这些 provider 登录流程。它做的是把步骤编排出来、在浏览器里保存进度，并帮助操作者把最终 credential 落到正确字段，再做连通性验证。

如果你是在编写 provider 模板，见 [第三方节点模板](/zh-CN/reference/third-party-node-templates)。

## 内置 provider 示例

当前内置模板已经覆盖了几种不同接入形态：

| 模板 | 典型用途 | 认证形态 | 文档 |
| --- | --- | --- | --- |
| `yunyi` | 带 activator 和 callback 引导的第三方节点门户 | `api-key`、`token`、`oauth` | [Yunyi](https://yunyi.rdzhvip.com/codex) |
| `openrouter` | 以手动粘贴密钥为主的 OpenAI 兼容路由 provider | `api-key` | [OpenRouter](https://openrouter.ai/docs/api-reference/overview) |
| `groq` | 低延迟、手动粘贴密钥的 OpenAI 兼容端点 | `api-key` | [Groq](https://console.groq.com/docs/openai) |
| `openai-compatible` | 任意兼容 provider 的通用兜底模板 | `api-key`、`token` | 本地自行补充 |

优先把这些模板当作操作者参考样例；只有当新的 provider 在认证流程或默认值上明显不同，再单独拆一个模板。

## 入口位置

打开 Control UI 后，进入 **AI Agents** 标签页。

第三方节点面板支持：

- 选择 provider 模板
- 选择认证模式（`api-key`、`token`、`oauth`，前提是模板支持）
- 将最终 credential 粘贴到 credential 字段
- 在应用前先测试 provider 的 `/models` 端点
- 把 provider 配置写回 gateway 配置文件

浏览器控制台的通用说明见 [Control UI](/web/control-ui)。

## 通用流程

推荐操作顺序：

1. 选择模板，确认 Base URL、provider key、模型和认证模式。
2. 使用模板提供的 auth adapter 或 auth flow action。
3. 在 OpenClaw 之外完成 provider 的认证步骤。
4. 把拿到的 key、token 或 OAuth 派生 credential 粘贴到凭证字段。
5. 点击 **Test Connection**，验证派生出的 `/models` 端点。
6. 应用配置。

这样做的目的，是让 OpenClaw 保持通用，不需要为每个第三方节点单独内嵌一套网页登录逻辑。

## 模板字段

模板定义在 `src/gateway/third-party-nodes/catalog.ts`。

对应的 UI 协议约束定义在 `src/gateway/protocol/schema/third-party-nodes.ts`。

### `credentialTargets`

`credentialTargets` 用来告诉 UI：最终 credential 应该落到哪个 credential 字段，以及该字段接受哪些 credential 类型。

当前主要用途：

- `field: "apiKey"` 表示最终内容要进入表单里的 credential 字段
- `accepts` 声明可接受的结果类型：
  - `api-key`
  - `token`
  - `oauth-credential`

UI 会据此显示 credential 落点提示，例如“当前 token 模式可以直接落到这个字段”。

### `authAdapters`

`authAdapters` 描述操作者如何在 OpenClaw 之外拿到 credential。

当前支持的 adapter 类型：

- `command`：复制命令，然后手动标记已执行
- `browser-callback`：打开 provider 页面，并可选监听回调 URL
- `manual-paste`：直接聚焦到 credential 字段，适合手动粘贴

adapter 会按 `authModes` 过滤，所以同一个模板可以同时支持多种认证策略，而不会把无关控件都渲染出来。

### `authFlowActions`

`authFlowActions` 是比 adapter 更轻量的引导动作。

当前支持：

- `copy-command`
- `open-url`
- `mark-done`

如果 provider 只需要几个操作提示，而不需要完整 adapter 卡片，就适合放在这里。

## 回调捕获

如果模板里声明了带 `callbackUrl` 的 `browser-callback` adapter，Control UI 会检查当前浏览器 URL：

- 路径是否匹配回调地址
- 查询参数里是否存在 `code`

命中后，UI 会显示回调捕获面板，操作者可以点击 **Use callback code**：

- 把回调 `code` 草拟到 credential 字段
- 更新 adapter 进度为 `callback_received`

这里的设计是保守的：

- OpenClaw 不会自动用 `code` 去换 token
- OpenClaw 不会内嵌 provider 登录浏览器
- 是否把这个 `code` 当成最终 credential，仍由操作者判断

## 进度跟踪

adapter 的进度会持久化到浏览器存储里，并显示回 adapter 卡片。

当前阶段：

- `copied`
- `executed`
- `credential_received`
- `callback_received`

这样即使页面刷新，操作者也能继续多步骤认证流，同时保留一条轻量的操作轨迹。

相关状态入口在：

- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/app-view-state.ts`
- `ui/src/ui/views/third-party-nodes.ts`

## 添加新的 provider

要接入新的第三方节点 provider：

1. 在 `src/gateway/third-party-nodes/catalog.ts` 里新增模板。
2. 尽量复用已有的 `authOptions`、`credentialTargets`、`authAdapters` 和 `authFlowActions`。
3. 给 adapter/action 配好 `authModes`，避免 UI 渲染无关步骤。
4. 如果 provider 会回跳到本地回调地址，就增加一个带 `callbackUrl` 的 `browser-callback` adapter。
5. 模板尽量写成对 provider 页面小改动仍然稳定的形式，不要把易变网页细节写死。

一个实用原则：

- provider 的静态事实放模板里
- 操作者自己的 secret 放表单里
- 登录执行仍放在 OpenClaw 外部，除非后续明确新增后端能力来承接

## 验证与应用

**Test Connection** 会基于当前 Base URL，调用 OpenAI 兼容的 models 端点做验证。

建议先验证再应用，因为它能较早发现：

- credential 错误
- Base URL 填错
- provider 实际不兼容 `/models`
- 模板默认值与真实部署不匹配

应用时，会沿用 Control UI 现有的 base-hash guard，把 provider 条目写入 gateway 配置。

## 回归检查

修改这套流程后，执行：

```bash
corepack pnpm run test:third-party-nodes
```

相关覆盖包括：

- `ui/src/ui/views/third-party-nodes.browser.test.ts`
- `ui/src/ui/app.third-party-nodes.test.ts`
- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `src/gateway/server.third-party-nodes.test.ts`
