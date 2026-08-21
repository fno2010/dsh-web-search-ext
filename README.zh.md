# dsh-web-search-ext

[English](README.md) | 中文

![CI](https://github.com/fno2010/dsh-web-search-ext/actions/workflows/ci.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/@fno2010/dsh-web-search-ext)
![npm downloads](https://img.shields.io/npm/dm/@fno2010/dsh-web-search-ext)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的多后端 `web_search` 提供方。**完全不需要 API key 即可工作**；配置 key 后可解锁更高限额。注册进 web 能力缝（`ctx.web`），使用稳定 provider id（`web-search-ext`）。

## 为什么需要它

内置 `web_search` 工具的后端可插拔，但内置默认提供方（`deepseek-official`）需要一个 DeepSeek API key。本插件是无 key 可用的替代方案：开箱即走 Exa 匿名 MCP 端点，某个后端被限流时**自动故障切换**到下一个。

## 特性

- **当前两个后端**：Exa（有 key 走 REST，无 key 走匿名 hosted MCP）与 Firecrawl（v2 search API，可有 key 或无 key）
- **自动故障切换**：任何后端失败（429、401/402/403、5xx、网络错误、响应体不合法）都会按偏好顺序落到下一个后端
- **按后端的 429 冷却**（默认 60 秒）：被限流的后端在冷却期内被跳过；全部后端都失败时，错误信息会列出每个后端的失败原因（含冷却状态）
- **可选 key**，按后端独立解析，优先级：设置明文 → 凭证服务 → 启动环境变量
- **无安装期脚本**：纯 ESM JavaScript，无构建步骤，无 `postinstall`/`prepare`
- **可扩展**：加一个后端 = 一个搜索函数 + 一个 plan 条目 + 配置字段，见 [CONTRIBUTING](CONTRIBUTING.md)

## 后端

| 后端 | 有 key | 无 key |
|---|---|---|
| **Exa** | REST `POST https://api.exa.ai/search`（限额更高、带高亮摘要） | 匿名 hosted MCP `POST https://mcp.exa.ai/mcp`（JSON-RPC 2.0，官方文档化的公共回退端点，有速率限制 → HTTP 429） |
| **Firecrawl** | `POST https://api.firecrawl.dev/v2/search`（Bearer） | `firecrawlKeyless: true` 时无 key 请求（非官方支持；可能被限流或移除） |

## 安装

```sh
dsh plugin --profile web add @fno2010/dsh-web-search-ext
# 或从本地 checkout 安装：
dsh plugin --profile web add ./path/to/dsh-web-search-ext
```

安装插件后需要重启正在运行的 `dsh web` 进程（profile 的 bundle 列表在启动时解析）。之后改配置是热加载的——不用重启。

bundle patch 通过设置 `web.searchProvider: web-search-ext` 让本插件接管内置 `web_search` 工具。官方 `deepseek-official` 提供方保持注册但不使用；显式选择同时避免了 `WEB_PROVIDER_AMBIGUOUS`。

## 配置

设置命名空间 `web-search-ext`，位于 `~/.dsh/settings.yaml`（热加载）：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `preferred` | `exa` | 首选后端：`exa` \| `firecrawl` |
| `numResults` | `8` | 工具未限制条数时的默认结果数 |
| `maxSnippetChars` | `500` | 摘要长度上限 |
| `rateLimitCooldownSec` | `60` | 429 后端的跳过时长（秒）；`0` 关闭 |
| `firecrawlKeyless` | `true` | 允许无 key 的 Firecrawl 请求 |
| `exaApiKey` / `firecrawlApiKey` | — | 各后端的明文 API key |
| `exaApiKeyEnv` / `firecrawlApiKeyEnv` | `EXA_API_KEY` / `FIRECRAWL_API_KEY` | key 解析用的环境变量名 |
| `exaApiUrl` / `exaMcpUrl` / `firecrawlBaseUrl` | `https://api.exa.ai/search` / `https://mcp.exa.ai/mcp` / `https://api.firecrawl.dev/v2` | 端点覆盖 |

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
2. 凭证服务：`~/.dsh/.credentials.yaml` 中的 `EXA_API_KEY` / `FIRECRAWL_API_KEY` 条目（Web 的 "Models" 页面只管理 LLM 提供方凭证，没有这两个字段——直接编辑文件即可；界面配置入口见待办的 settings-UI feature issue）
3. 同名的启动环境变量

一个 key 都没有也能工作：Exa 走匿名 MCP 端点，Firecrawl 以无 key 方式尝试。

## 故障切换机制

每次搜索按"当前 key 情况下可用的后端"构建有序计划（首选在前）。只有当后续所有后端都失败时，才把第一个失败的后端作为整体错误报出——429 额外触发该后端的冷却，冷却窗口内后续搜索会跳过它。

## 卸载

```sh
dsh plugin --profile web remove @fno2010/dsh-web-search-ext   # 然后重启 dsh web
```

## 安全说明

- 出站请求只发往所配置的 Exa 与 Firecrawl 端点，不接触任何其它服务。
- API key 只出现在其后端请求的 `authorization` 头里——不进请求体、不发往另一个后端、不出现在错误信息中。
- 无安装期脚本：纯 ESM JavaScript，无构建步骤，无 `postinstall`/`prepare`。
- 摘要有长度上限（`maxSnippetChars`）；Firecrawl 的页面 markdown 描述在进入模型上下文前会剥掉图片链接。

## 开发

- 测试：`npm test`——10 个 mock 故障切换/映射场景 + 真实无 key 冒烟调用（CI 中跳过冒烟）。
- 添加后端、分支/PR 规范、发版流程：[CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
