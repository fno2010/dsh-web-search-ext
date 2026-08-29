# dsh-web-search-ext

[English](README.md) | 中文

![CI](https://github.com/fno2010/dsh-web-search-ext/actions/workflows/ci.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/@fno2010/dsh-web-search-ext)
![npm downloads](https://img.shields.io/npm/dm/@fno2010/dsh-web-search-ext)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的多后端 `web_search` **与** `web_fetch` 提供方。**完全不需要 API key 即可工作**；配置 key 后可解锁更高限额。注册进 web 能力缝（`ctx.web`），使用稳定 provider id（`web-search-ext`）。

## 为什么需要它

内置 `web_search` 工具的后端可插拔，但内置默认提供方（`deepseek-official`）需要一个 DeepSeek API key。本插件是无 key 可用的替代方案：开箱即走 Exa 匿名 MCP 端点，某个后端被限流时**自动故障切换**到下一个。它还注册了一个无 key 可用的 `web_fetch` 提供方，并对交给模型的结果做校验（死链、内容变更、实际应答的后端——全部体现在结果中）。

## 特性

- **当前两个后端**：Exa（有 key 走 REST，无 key 走匿名 hosted MCP）与 Firecrawl（v2 search/scrape API，可有 key 或无 key）
- **无 key `web_fetch`**：通过 Firecrawl scrape 抓取 URL，失败时回退到 Exa 匿名 MCP 的 `web_fetch_exa`；无需任何 API key，输出受 `fetchMaxChars` 上限约束
- **自动故障切换**：任何后端失败（429、401/402/403、5xx、网络错误、响应体不合法）都会按顺序落到下一个后端（搜索与抓取均如此）
- **按后端的 429 冷却**：被限流的后端在冷却期内被跳过；冷却时长优先采用后端自己报告的窗口（`Retry-After` 响应头或响应体中的 `retry_after_seconds`），并由 `maxCooldownSec` 封顶；全部后端都失败时，错误信息会列出每个后端的失败原因（含冷却状态）
- **结果校验**（L0 存活性，默认开启）：返回的每条来源都会做本地探测，摘要打上 `[alive]` / `[dead 404]` / `[blocked]` / `[timeout]` / `[unreachable]` / `[skipped]` 标记——结果永远不会被丢弃；`verifyLevel: "content"` 可开启实验性 L1 内容校验（`[verified]` / `[verified·changed]` / `[unverified]`（页面存活但无摘要可比对））
- **来源回执**：`web_search` 结果携带单行回执（`web-search-ext: <backend> · <elapsed>s · <n> results · liveness: …`），标明实际应答的后端，并显式披露限制（如无 key Exa 无法执行时间窗口过滤）而非静默忽略
- **时间窗口**：`freshness: 24h | 7d | 30d` 在后端支持时随请求发出（Exa `startPublishedDate`、Firecrawl `tbs`）；无 key Exa MCP 路径无法按日期过滤，回执会明确说明
- **可选 key**，按后端独立解析，优先级：设置明文 → 凭证服务 → 启动环境变量
- **Web 端设置卡片**：设置 → 插件 → 插件配置 中可编辑六个核心配置字段——含校验层级（`off` / `liveness` / `content`，自下一次搜索起热生效）——和两个 API key，key 状态自动发现自凭证各层（时间窗口仍只在 `settings.yaml`）
- **Web 端 `web_search` 卡片**：对话中的 `web_search` 行接管宿主的内置 web 卡片，额外显示来源回执行、按来源的校验徽章（按状态着色：`alive`、`verified`、`dead 404` 等）、截断提示、逐条下钻（点击来源可查看其服务后端、新鲜度与校验状态），以及搜索进行中的进度指示（扫光动画 + 客户端计时的已耗时标签——宿主不提供进行中进度通道，结果到达前不声称阶段与服务后端）；当 web seam 未固定到本插件时优雅降级（不冒领回执、不虚构徽章、不声称后端），不会把别人后端的结果显示成 web-search-ext 的结果
- **Web 端会话 Health 标签页**：设置卡片的 Health 标签页显示宿主 `GET /web-search-ext/health` 路由提供的会话遥测——运行时长、各后端成功/失败次数、最近调用时间、活动中的 429 冷却、会话搜索/抓取计数；载荷仅含计数器（不含凭证、URL、查询文本），路由未注册（CLI/headless 场景）时标签页显式显示不可用状态并给出重试，而非空白
- **Web 端首装连接探测**：Health 标签页的连接状态区探测 Exa（带 key REST 或无 key MCP）与 Firecrawl（带 key 或无 key）——首次打开标签页且无已存结果时自动探测一次，"立即测试"可随时重测——每个后端显示封闭状态码（正常 / 限流 (429) / 认证被拒绝 / 超时 / 网络错误 / 请求失败 / 未启用）与耗时。宿主仅在 `POST /web-search-ext/probe` 按需探测，apply 时不探测，因此安装、宿主重启与 CI 全程不产生供应商调用；载荷只含计划字面量与封闭状态码（不含供应商消息、URL、密钥）
- **Web 端 `/search-engine` 斜杠命令**：在输入框的 `/` 菜单中直接切换首选后端、查看实时状态（key 来源、最近调用结果、活动中的 429 冷却）并运行连通性测试——由宿主的弹出菜单外壳渲染。若 `/search-engine` 已被占用，命令改注册为 `/web-search-engine`，设置卡片会标明实际生效的名称（或两者均不可用）——回退会被显式告知，绝不静默
- **无安装期脚本**：纯 ESM JavaScript，无构建步骤，无 `postinstall`/`prepare`
- **可扩展**：加一个后端 = 一个搜索函数 + 一个 plan 条目 + 配置字段，见 [CONTRIBUTING](CONTRIBUTING.md)

## 后端

| 后端 | 搜索 | 抓取 |
|---|---|---|
| **Exa** | 有 key：REST `POST https://api.exa.ai/search`（限额更高、带高亮摘要）；无 key：匿名 hosted MCP `POST https://mcp.exa.ai/mcp`（JSON-RPC 2.0，官方文档化的公共回退端点，有速率限制 → HTTP 429） | 无 key：hosted MCP `web_fetch_exa` 工具（回退路径） |
| **Firecrawl** | `POST https://api.firecrawl.dev/v2/search`（有 key 走 Bearer；`firecrawlKeyless: true` 时允许无 key 请求——非官方支持，可能被限流或移除） | `POST {base}/scrape`（可有 key 或无 key；首选抓取路径——markdown + 元数据） |

## 安装

```sh
dsh plugin --profile web add @fno2010/dsh-web-search-ext
# 或从本地 checkout 安装：
dsh plugin --profile web add ./path/to/dsh-web-search-ext
```

安装插件后需要重启正在运行的 `dsh web` 进程（profile 的 bundle 列表在启动时解析）。之后改配置是热加载的——不用重启。

bundle patch 通过设置 `web.searchProvider: web-search-ext` 让本插件接管内置 `web_search` 工具，并设置 `web.fetchProvider: web-search-ext` 接管 `web_fetch`。官方 `deepseek-official` 提供方保持注册但不使用；显式选择同时避免了 `WEB_PROVIDER_AMBIGUOUS`。

插件还会让模型侧的 `web_fetch` 工具开箱即用。该工具正常情况下由 agent-preset 层（`tool-web`）注册，但所有出厂 preset 中该行都是 `fetch: false`，且 `dsh web` profile 还会禁用 profile 层的 `tool-web` 行——因此没有任何出厂组合路径会注册 `web_fetch`，即使 fetch provider 已装好，模型调用也会报 `unknown tool "web_fetch"`。本插件在 apply 阶段补齐这一缺口：当 `web_fetch` 尚未注册时，复用 `@deepseek-ai/dsh-tool-web` 自己的 `applyWebFetchTool` 注册出厂工具（schema、提示词、呈现与 harness 完全一致）。工具的执行路径走 `ctx.web.fetch`——即 pin 到本插件的 web 缝——其抓取路径有 fail-closed 的 SSRF 检查（仅允许公共 http(s) 目标，这正是 base 禁用该工具的原因）。若某个 preset 启用了 `tool-web.fetch`，它注册的 agent 层工具优先于本插件的注册；若工具已存在，本插件的注册步骤自动跳过。要彻底关闭 `web_fetch`，卸载本插件即可。

## 配置

设置命名空间 `web-search-ext`，位于 `~/.dsh/settings.yaml`（热加载）：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `preferred` | `exa` | 首选后端：`exa` \| `firecrawl` |
| `numResults` | `8` | 请求的结果条数；同时是返回条数的硬上限（上下文预算）——更大的 `maxResults` 请求会被钳制到它，回执中会注明 |
| `maxSnippetChars` | `500` | 摘要长度上限 |
| `rateLimitCooldownSec` | `60` | 后端未报告窗口时的兜底 429 冷却（秒）；`0` 关闭 |
| `firecrawlKeyless` | `true` | 允许无 key 的 Firecrawl 请求（搜索与抓取） |
| `exaApiKey` / `firecrawlApiKey` | — | 各后端的明文 API key |
| `exaApiKeyEnv` / `firecrawlApiKeyEnv` | `EXA_API_KEY` / `FIRECRAWL_API_KEY` | key 解析用的环境变量名 |
| `exaApiUrl` / `exaMcpUrl` / `firecrawlBaseUrl` | `https://api.exa.ai/search` / `https://mcp.exa.ai/mcp` / `https://api.firecrawl.dev/v2` | 端点覆盖 |
| `verifyLevel` | `liveness` | 结果校验层级：`off` \| `liveness`（对每条来源做 HEAD 探测）\| `content`（实验性：额外检查页面是否仍包含摘要关键词） |
| `livenessTimeoutMs` | `3000` | L0 HEAD 探测的单 URL 超时 |
| `contentCheckBytes` | `10240` | L1 每个页面读取的最大字节数 |
| `contentCheckMinBytes` | `200` | L1 短于此长度视为反爬空壳页 |
| `contentCheckMatchWords` | `5` | L1 对照摘要前 N 个词 |
| `contentCheckTimeoutMs` | `3000` | L1：请求与正文读取各一个超时预算 |
| `freshness` | `any` | 时间窗口：`any` \| `24h` \| `7d` \| `30d`（后端支持时随请求发出；无 key Exa MCP 无法过滤，回执会说明） |
| `maxCooldownSec` | `86400` | 采用后端报告的 `retry_after` 冷却时的上限；`0` = 完全采用报告值 |
| `fetchMaxChars` | `50000` | `web_fetch` 输出字符上限 |

```yaml
web-search-ext:
  preferred: exa
  numResults: 8
  # rateLimitCooldownSec: 60   # 其余均为默认值
```

也可以不用 bundle patch，用环境变量选择本插件：`DSH_WEB_SEARCH_PROVIDER=web-search-ext`。

## Key（可选但推荐）

每个后端按以下优先级解析 key：

1. 设置段里的明文 key（`exaApiKey` / `firecrawlApiKey`）
2. 凭证服务：`~/.dsh/.credentials.yaml`（或 `.env` 文件）中的 `EXA_API_KEY` / `FIRECRAWL_API_KEY` 条目
3. 同名的启动环境变量

**设置界面（Web）**：本插件在 **设置 → 插件 → 插件配置** 中有卡片，可编辑六个配置字段（含校验层级）和两个 API key。key 状态自动发现自上述各层——`~/.dsh/.credentials.yaml` 变更时"已配置/未配置"徽章实时更新；由 live 进程环境变量提供的 key 渲染为只读，因为宿主会拒绝会被环境变量值遮蔽的 UI 写入。（"模型"页面只管理 LLM 提供方凭证。）

一个 key 都没有也能工作：Exa 走匿名 MCP 端点，Firecrawl 以无 key 方式尝试。

## 故障切换机制

每次搜索（及每次抓取）按"当前 key 情况下可用的后端"构建有序计划——搜索时首选后端在前；抓取时优先 Firecrawl scrape（markdown 更完整），无 key 的 Exa MCP 抓取作回退。只有当后续所有后端都失败时，才把第一个失败的后端作为整体错误报出——429 额外触发该后端的冷却，冷却时长优先采用后端自己报告的窗口（`Retry-After` 响应头，或响应体中的 `retry_after_seconds`；由 `maxCooldownSec` 封顶），窗口内后续调用会跳过它。

`web_search` 结果还携带单行来源回执（`web-search-ext: <backend> · <elapsed>s · <n> results · liveness: …`）：哪个后端实际应答、时间窗口或校验层级是否被实际执行。不会有任何东西被静默丢弃。

## 卸载

```sh
dsh plugin --profile web remove @fno2010/dsh-web-search-ext   # 然后重启 dsh web
```

## 安全说明

- 出站请求只发往所配置的 Exa 与 Firecrawl 端点（另有下文所述的本地校验探测），不接触任何其它服务。
- API key 只出现在其后端请求的 `authorization` 头里——不进请求体、不发往另一个后端、不出现在错误信息中。
- 无安装期脚本：纯 ESM JavaScript，无构建步骤，无 `postinstall`/`prepare`。
- 单次搜索的上下文有界：结果条数钳制在 `numResults`（请求的 `maxResults` 超过它时回执带 `(numResults cap)` 标记；后端又超量返回时为 `N of M results` 形式），摘要有长度上限（`maxSnippetChars`）；Firecrawl 的页面 markdown 描述在进入模型上下文前会剥掉图片链接。
- 校验探测（L0/L1）只抓取后端结果中出现的 URL，字节数与超时均有界；重定向逐跳手动跟随，每一跳都按同一套 SSRF 规则重新校验（仅允许公共 http(s)；环回、内网、链路本地、CGNAT 地址一律拒绝——包括 IPv6 字面量与末尾点号拼写；无法确定是公共地址的一律拒绝，fail closed）。
- `web_fetch` 提供方在把 URL 交给任何抓取后端之前，拒绝非公共目标（非 http(s) 协议、环回、内网、链路本地地址）。

## 开发

- 测试：`npm test`——mock 故障切换/映射/校验/抓取场景（确定性、无网络）+ 真实无 key 冒烟调用（CI 中跳过冒烟）。
- 添加后端、分支/PR 规范、发版流程：[CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
