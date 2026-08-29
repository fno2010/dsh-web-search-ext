try {
window.__ModuleLoader__.load({ id: "dsh-web-search-ext", factory: (require) => {
	var module = { exports: {} };
	var exports = module.exports;
const wsxCss = ".row-module__root {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__row {\n  align-items: center;\n  min-width: 0;\n  height: 24px;\n  display: flex;\n  position: relative;\n  overflow: hidden;\n}\n\n.row-module__row[data-expandable] {\n  cursor: pointer;\n}\n\n.row-module__root[data-state=\"running\"] .row-module__row:after {\n  content: \"\";\n  background: linear-gradient(90deg, transparent 0%,\n    color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent) 55%, transparent 100%);\n  pointer-events: none;\n  width: 300px;\n  animation: 2.6s ease-out infinite row-module__sweep;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n}\n\n@keyframes row-module__sweep {\n  0% {\n    left: -300px;\n  }\n\n  90%, 100% {\n    left: 100%;\n  }\n}\n\n.row-module__leading {\n  width: 16px;\n  height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  justify-content: center;\n  align-items: center;\n  margin-right: 6px;\n  display: inline-flex;\n  position: relative;\n}\n\n.row-module__title {\n  color: var(--dsw-alias-label-secondary);\n  flex: none;\n  font-size: 14px;\n  line-height: 24px;\n}\n\n.row-module__chevron {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__sep {\n  background: var(--dsw-alias-label-caption);\n  border-radius: 1px;\n  flex: none;\n  width: 2px;\n  height: 2px;\n  margin: 0 8px;\n}\n\n.row-module__summary {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n  color: var(--dsw-alias-label-tertiary);\n  flex: auto;\n  font-size: 14px;\n  line-height: 24px;\n  overflow: hidden;\n}\n\n.row-module__errorSummary {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__runningSuffix {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-caption);\n  flex: none;\n  margin-left: 8px;\n  font-size: 12px;\n  line-height: 24px;\n}\n\n.row-module__visuallyHidden {\n  clip: rect(0 0 0 0);\n  white-space: nowrap;\n  border: 0;\n  width: 1px;\n  height: 1px;\n  margin: -1px;\n  padding: 0;\n  position: absolute;\n  overflow: hidden;\n}\n\n.row-module__bodyWrap {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__card {\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-markdown-code-block);\n  border-radius: 12px;\n  flex-direction: column;\n  gap: 8px;\n  max-height: 320px;\n  margin: 4px 0 4px 4px;\n  padding: 8px 12px;\n  display: flex;\n  overflow: auto;\n}\n\n.row-module__provenance {\n  color: var(--dsw-alias-label-secondary);\n  border-bottom: 1px solid var(--dsw-alias-border-l2);\n  flex-direction: column;\n  gap: 4px;\n  padding-bottom: 6px;\n  font-size: 12px;\n  line-height: 1.5;\n  display: flex;\n}\n\n.row-module__provenanceEntry {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__provenanceQuery {\n  color: var(--dsw-alias-label-caption);\n  font-size: 11px;\n}\n\n.row-module__provenanceLine {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__emptyNote {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n}\n\n.row-module__sourceIndex {\n  color: var(--dsw-alias-label-caption);\n  text-align: right;\n  flex: none;\n  min-width: 14px;\n  font-size: 12px;\n}\n\n.row-module__sources {\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  display: flex;\n}\n\n.row-module__source {\n  padding: 6px 0;\n}\n\n.row-module__source + .row-module__source {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.row-module__sourceHead {\n  cursor: pointer;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  display: flex;\n}\n\n.row-module__drillToggle {\n  width: 16px;\n  height: 16px;\n  color: var(--dsw-alias-label-caption);\n  text-align: center;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  flex: none;\n  padding: 0;\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 16px;\n}\n\n.row-module__drillToggle:hover, .row-module__drillToggle[aria-expanded=\"true\"] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__drill {\n  border-top: 1px dashed var(--dsw-alias-border-l2);\n  flex-direction: column;\n  gap: 2px;\n  margin-top: 4px;\n  padding-top: 4px;\n  display: flex;\n}\n\n.row-module__drillRow {\n  gap: 8px;\n  min-width: 0;\n  font-size: 12px;\n  line-height: 1.5;\n  display: flex;\n}\n\n.row-module__drillLabel {\n  color: var(--dsw-alias-label-caption);\n  flex: none;\n  width: 72px;\n}\n\n.row-module__drillValue {\n  color: var(--dsw-alias-label-secondary);\n  word-break: break-word;\n  min-width: 0;\n}\n\n.row-module__drillValue_ok {\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.row-module__drillValue_warn {\n  color: var(--dsw-alias-state-warn-primary);\n}\n\n.row-module__drillValue_error {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__drillValue_muted {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.row-module__badge {\n  white-space: nowrap;\n  border: 1px solid;\n  border-radius: 999px;\n  flex: none;\n  padding: 0 6px;\n  font-size: 11px;\n  line-height: 18px;\n}\n\n.row-module__badge_ok {\n  color: var(--dsw-alias-state-success-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_warn {\n  color: var(--dsw-alias-state-warn-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_error {\n  color: var(--dsw-alias-state-error-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_muted {\n  color: var(--dsw-alias-label-tertiary);\n  border-color: currentColor;\n}\n\n.row-module__sourceTitle {\n  color: var(--dsw-alias-label-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n  text-decoration: none;\n  overflow: hidden;\n}\n\n.row-module__sourceTitle:hover {\n  text-decoration: underline;\n}\n\n.row-module__sourceSnippet {\n  color: var(--dsw-alias-label-secondary);\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  margin-top: 2px;\n  font-size: 13px;\n  line-height: 1.5;\n  display: -webkit-box;\n  overflow: hidden;\n}\n\n.row-module__sourceMeta {\n  color: var(--dsw-alias-label-caption);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  margin-top: 2px;\n  font-size: 12px;\n  overflow: hidden;\n}\n\n.row-module__truncatedNote {\n  color: var(--dsw-alias-state-warn-primary);\n  font-size: 12px;\n}\n\n.row-module__answerText {\n  color: var(--dsw-alias-label-secondary);\n  word-break: break-word;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.row-module__genericText {\n  color: var(--dsw-alias-label-secondary);\n  white-space: pre-wrap;\n  word-break: break-word;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.row-module__errorText {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__inspectButton {\n  border: 1px solid var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  background: none;\n  border-radius: 8px;\n  align-self: flex-start;\n  align-items: center;\n  gap: 4px;\n  margin: 0 0 0 4px;\n  padding: 2px 8px;\n  font-size: 12px;\n  line-height: 16px;\n  display: inline-flex;\n}\n\n.row-module__inspectButton:hover {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-tertiary);\n}\n.card-module__card {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  border-radius: 12px;\n  list-style: none;\n  transition: border-color .16s, background .16s;\n}\n\n.card-module__card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__header {\n  appearance: none;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 12px;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  display: flex;\n}\n\n.card-module__header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n.card-module__headText {\n  flex-direction: column;\n  flex: 1;\n  gap: 4px;\n  min-width: 0;\n  display: flex;\n}\n\n.card-module__name {\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.card-module__description {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__chevron {\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  transition: transform .16s;\n  display: inline-flex;\n}\n\n.card-module__chevronOpen {\n  transform: rotate(180deg);\n}\n\n.card-module__body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n.card-module__field {\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n  display: flex;\n}\n\n.card-module__field + .card-module__field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.card-module__head {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__label {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  flex: 1;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n}\n\n.card-module__badges {\n  align-items: center;\n  gap: 8px;\n  display: inline-flex;\n}\n\n.card-module__badge {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__badgeMuted {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.card-module__pending {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__input {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  height: 34px;\n  font: inherit;\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 0 12px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__input:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n.card-module__input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n.card-module__hint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__check {\n  width: 14px;\n  height: 14px;\n  accent-color: var(--dsw-alias-brand-primary);\n}\n\n.card-module__footer {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 0 4px;\n  display: flex;\n}\n\n.card-module__failed {\n  min-width: 0;\n  color: var(--dsw-alias-label-error);\n  flex: 1;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__discard, .card-module__save {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  border: 1px solid #0000;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__discard {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  background: none;\n}\n\n.card-module__discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n.card-module__discard:disabled, .card-module__save:disabled {\n  opacity: .4;\n  cursor: default;\n}\n\n.card-module__discard:focus-visible, .card-module__save:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__spin {\n  animation: .8s linear infinite card-module__wsx-rot;\n  display: inline-flex;\n}\n\n@keyframes card-module__wsx-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.card-module__tabs {\n  gap: 4px;\n  padding: 12px 0 8px;\n  display: flex;\n}\n\n.card-module__tab {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  color: var(--dsw-alias-label-tertiary);\n  background: none;\n  border: 1px solid #0000;\n  border-radius: 999px;\n  padding: 3px 12px;\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__tab:hover:not(.card-module__tabActive) {\n  color: var(--dsw-alias-label-primary);\n}\n\n.card-module__tabActive {\n  color: var(--dsw-alias-label-primary);\n  background: var(--dsw-alias-bg-module-platform);\n}\n\n.card-module__tab:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__settingsPane {\n  flex-direction: column;\n  display: flex;\n}\n\n.card-module__health {\n  gap: 4px;\n  padding: 2px 0 8px;\n  display: flex;\n}\n\n.card-module__healthSection {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  gap: 6px;\n  padding: 10px 0;\n  display: flex;\n}\n\n.card-module__healthSectionHead {\n  justify-content: space-between;\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__healthSectionTitle {\n  color: var(--dsw-alias-label-tertiary);\n  letter-spacing: .04em;\n  text-transform: uppercase;\n  font-size: 11px;\n  font-weight: 600;\n}\n\n.card-module__healthRow {\n  justify-content: baseline;\n  align-items: baseline;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__healthLabel {\n  color: var(--dsw-alias-label-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: none;\n  min-width: 0;\n  max-width: 160px;\n  font-size: 13px;\n  font-weight: 500;\n  overflow: hidden;\n}\n\n.card-module__healthValue {\n  color: var(--dsw-alias-label-secondary);\n  flex: 1;\n  min-width: 0;\n  font-size: 13px;\n  line-height: 1.5;\n}\n";
const wsxTagId = "@fno2010/dsh-web-search-ext/card.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(wsxTagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-web-search-ext";
	tag.dataset.pluginCss = wsxTagId;
	tag.textContent = wsxCss;
	document.head.appendChild(tag);
}

Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
//#region src/client/locales.js
const en = {
	title: "Web Search (ext)",
	description: "Multi-backend web_search provider: Exa + Firecrawl, automatic failover, per-backend 429 cooldowns.",
	preferred: "Preferred backend",
	numResults: "Default result count",
	maxSnippetChars: "Snippet length bound (chars)",
	cooldown: "429 cooldown (seconds, 0 disables)",
	verifyLevel: "Verification tier",
	verifyLevelHint: "off: no verification · liveness: HEAD-check every source · content: also verify snippet text on the live page (experimental)",
	keyless: "Allow keyless Firecrawl requests",
	exaKey: "Exa API key",
	firecrawlKey: "Firecrawl API key",
	keySet: "Configured",
	keyUnset: "Not configured",
	keyHint: "Leave blank to keep the stored key; enter a value to replace it.",
	keyReadOnlyHint: "Supplied by the process environment — read-only; the host rejects UI writes that an environment value would shadow.",
	save: "Save",
	discard: "Discard",
	saving: "Saving…",
	saved: "Saved.",
	error: "Save failed:",
	pending: "unsaved changes",
	"row.title": "Search",
	"row.running": "Searching the web…",
	"row.searching": "searching…",
	"row.failed": "Search failed",
	"row.stopped": "Search stopped",
	"row.truncated": "Showing the first {count} sources. Refine the query for more.",
	"row.noResults": "No results found.",
	"row.inspect": "Inspect",
	"row.drill.backend": "Backend",
	"row.drill.merged": " (merged across sub-queries)",
	"row.drill.published": "Published",
	"row.drill.toggle": "Expand details",
	"row.drill.unknown": "unknown",
	"row.drill.verification": "Verification",
	"row.drill.notVerified": "not verified",
	"health.settings": "Settings",
	"health.tab": "Health",
	"health.loading": "Loading…",
	"health.error": "Health unavailable:",
	"health.session": "Session",
	"health.uptime": "Uptime",
	"health.searches": "{count} searches",
	"health.fetches": "{count} fetches",
	"health.results": "{count} results",
	"health.last": "last",
	"health.never": "never",
	"health.ok": "ok",
	"health.failed": "failed",
	"health.cooldowns": "Cooldowns",
	"health.remaining": "{count}s remaining",
	"health.none": "none",
	"health.noActivity": "No backend activity this session yet.",
	"health.refresh": "Refresh",
	"health.connectivity": "Connectivity",
	"health.connectivity.test": "Test now",
	"health.connectivity.testing": "Testing…",
	"health.connectivity.error": "Connectivity test failed:",
	"health.connectivity.last": "tested {age} ago",
	"health.connectivity.none": "No connectivity test yet.",
	"probe.ok": "OK",
	"probe.rate-limited": "rate limited (429)",
	"probe.auth": "auth rejected",
	"probe.timeout": "timed out",
	"probe.network": "network error",
	"probe.error": "request failed",
	"probe.disabled": "not enabled",
	"cmd.description": "Configure web-search-ext: preferred backend, status, connectivity test",
	"cmd.preferExa": "Prefer Exa",
	"cmd.preferFirecrawl": "Prefer Firecrawl",
	"cmd.test": "Test connectivity",
	"cmd.keyedEnv": "keyed (env)",
	"cmd.keyedFile": "keyed (file)",
	"cmd.keyless": "keyless",
	"cmd.keyMissing": "no key, keyless disabled",
	"cmd.never": "never called",
	"cmd.lastOk": "last ok {time} ago",
	"cmd.lastFail": "last failed {time} ago",
	"cmd.cooldown": "cooldown for {time}",
	"cmd.neverTested": "never tested",
	"cmd.testLast": "last test {age} ago: {codes}",
	"cmd.testFailed": "connectivity test failed (HTTP {status})",
	"cmd.line": "Slash command: /{name}",
	"cmd.lineFallback": "Slash command: /{name} (/{primary} is in use)",
	"cmd.lineUnavail": "Slash command unavailable (/search-engine and /web-search-engine are both in use)"
};
const zh = {
	title: "Web 搜索（ext）",
	description: "多后端 web_search 提供方：Exa + Firecrawl，自动故障切换，按后端 429 冷却。",
	preferred: "首选后端",
	numResults: "默认结果条数",
	maxSnippetChars: "摘要长度上限（字符）",
	cooldown: "429 冷却时长（秒，0 关闭）",
	verifyLevel: "校验层级",
	verifyLevelHint: "off：不校验 · liveness：对每个来源做 HEAD 存活检查 · content：额外校验摘要文本仍出现在活页面上（实验性）",
	keyless: "允许无 key 的 Firecrawl 请求",
	exaKey: "Exa API key",
	firecrawlKey: "Firecrawl API key",
	keySet: "已配置",
	keyUnset: "未配置",
	keyHint: "留空则保留已存储的 key；填入值则替换。",
	keyReadOnlyHint: "由进程环境变量提供——只读；环境变量会遮蔽写入，宿主会拒绝 UI 写入。",
	save: "保存",
	discard: "放弃",
	saving: "保存中…",
	saved: "已保存。",
	error: "保存失败：",
	pending: "未保存的更改",
	"row.title": "搜索",
	"row.running": "正在搜索网页…",
	"row.searching": "搜索中…",
	"row.failed": "搜索失败",
	"row.stopped": "搜索已中止",
	"row.truncated": "仅显示前 {count} 条来源。细化查询可获取更多。",
	"row.noResults": "未找到结果。",
	"row.inspect": "查看",
	"row.drill.backend": "来源后端",
	"row.drill.merged": "（跨子查询合并）",
	"row.drill.published": "发布时间",
	"row.drill.toggle": "展开详情",
	"row.drill.unknown": "未知",
	"row.drill.verification": "校验状态",
	"row.drill.notVerified": "未校验",
	"health.settings": "设置",
	"health.tab": "健康",
	"health.loading": "加载中…",
	"health.error": "健康状态不可用：",
	"health.session": "会话",
	"health.uptime": "运行时长",
	"health.searches": "{count} 次搜索",
	"health.fetches": "{count} 次抓取",
	"health.results": "{count} 条结果",
	"health.last": "最近",
	"health.never": "从未",
	"health.ok": "成功",
	"health.failed": "失败",
	"health.cooldowns": "冷却中",
	"health.remaining": "剩余 {count}s",
	"health.none": "无",
	"health.noActivity": "本会话尚无后端活动。",
	"health.refresh": "刷新",
	"health.connectivity": "连接状态",
	"health.connectivity.test": "立即测试",
	"health.connectivity.testing": "正在测试…",
	"health.connectivity.error": "连接测试失败：",
	"health.connectivity.last": "{age} 前测试",
	"health.connectivity.none": "尚未测试连接。",
	"probe.ok": "正常",
	"probe.rate-limited": "限流 (429)",
	"probe.auth": "认证被拒绝",
	"probe.timeout": "超时",
	"probe.network": "网络错误",
	"probe.error": "请求失败",
	"probe.disabled": "未启用",
	"cmd.description": "配置 web-search-ext：首选后端、状态、连通性测试",
	"cmd.preferExa": "优先 Exa",
	"cmd.preferFirecrawl": "优先 Firecrawl",
	"cmd.test": "测试连通性",
	"cmd.keyedEnv": "带 key（环境变量）",
	"cmd.keyedFile": "带 key（文件）",
	"cmd.keyless": "无 key",
	"cmd.keyMissing": "无 key 且已禁用 keyless",
	"cmd.never": "从未调用",
	"cmd.lastOk": "最近成功：{time} 前",
	"cmd.lastFail": "最近失败：{time} 前",
	"cmd.cooldown": "冷却中：剩 {time}",
	"cmd.neverTested": "从未测试",
	"cmd.testLast": "上次测试 {age} 前：{codes}",
	"cmd.testFailed": "连通性测试失败（HTTP {status}）",
	"cmd.line": "斜杠命令：/{name}",
	"cmd.lineFallback": "斜杠命令：/{name}（/{primary} 已被占用）",
	"cmd.lineUnavail": "斜杠命令不可用（/search-engine 与 /web-search-engine 均被占用）"
};
//#endregion
//#region src/client/model.js
/** Marker label → visual tone. Closed list, keyed by the EXACT marker text
*  our verify.js MARKERS emits — an unknown bracket prefix in a snippet is
*  not a marker (avoids false-positive badges on `[Some Title]` snippets). */
const MARKER_TONE = {
	alive: "ok",
	verified: "ok",
	"verified·changed": "warn",
	unverified: "muted",
	"dead 404": "error",
	blocked: "error",
	timeout: "warn",
	unreachable: "error",
	skipped: "muted"
};
/** Receipt prefix: our provenance line is only ever claimed from a line that
*  starts with this (lib/index.js buildReceipt). */
const RECEIPT_PREFIX = "web-search-ext:";
/**
* Parse the serving backend's label out of a claimed receipt line.
* buildReceipt emits `web-search-ext: <label> · <seconds>s · …` where label
* is the backend that answered the call ("exa-rest" / "exa-mcp" /
* "firecrawl"). The per-source backend is NOT a wire field — dsh-tool-web's
* projectSource keeps only url/title/snippet/publishedAt — so the receipt is
* the card's only source of backend truth (all of a call's sources come
* from that one backend; failover is per-call, not per-result).
* @param {string} receipt - a claimed receipt line.
* @returns {string | null} the backend label, or null when unparseable.
*/
function receiptBackend(receipt) {
	const rest = receipt.slice(15).trimStart();
	const sep = rest.indexOf(" · ");
	const label = (sep === -1 ? rest : rest.slice(0, sep)).trim();
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label) ? label : null;
}
/**
* Parse our verification marker off a source snippet. verify.js `markSnippet`
* emits `[label] (detail) rest`, where `detail` is free text that may itself
* contain parentheses (fetch error reasons), so the detail group is matched
* with a balanced-paren scan, not a `[^)]*` regex (which truncates at the
* first inner `)`).
* @param {string} snippet - the source snippet as it arrived on the wire.
* @returns {{ marker: string, tone: string, detail: string | null, rest: string } | null}
*   null when the snippet carries no known marker (verifyLevel off, or a
*  host that stripped it) — the snippet then renders as-is.
*/
function parseMarker(snippet) {
	if (typeof snippet !== "string" || snippet === "") return null;
	if (snippet[0] !== "[") return null;
	const close = snippet.indexOf("]");
	if (close === -1) return null;
	const marker = snippet.slice(1, close);
	const tone = MARKER_TONE[marker];
	if (tone === void 0) return null;
	let restStart = close + 1;
	let detail = null;
	if (snippet[restStart] === " " && snippet[restStart + 1] === "(") {
		let depth = 0;
		let end = -1;
		for (let i = restStart + 1; i < snippet.length; i += 1) if (snippet[i] === "(") depth += 1;
		else if (snippet[i] === ")") {
			depth -= 1;
			if (depth === 0) {
				end = i;
				break;
			}
		}
		if (end !== -1) {
			detail = snippet.slice(restStart + 2, end) || null;
			restStart = end + 1;
		}
	}
	return {
		marker,
		tone,
		detail,
		rest: snippet.slice(restStart).replace(/^\s+/, "")
	};
}
/**
* Whether a wire source URL is safe to render as a clickable link. The
* mirror of the host's SafeLink policy: only public http(s) URLs are links;
* everything else renders as inert text (the wire only guarantees a string,
* and a nonconforming or malicious provider could carry javascript:/data:
* URLs).
* @param {unknown} url
* @returns {boolean}
*/
function isSafeHref(url) {
	if (typeof url !== "string" || url === "") return false;
	try {
		const protocol = new URL(url).protocol;
		return protocol === "http:" || protocol === "https:";
	} catch {
		return false;
	}
}
/**
* The row title: the host's authoritative view title when present, else the
* query list parsed from the raw args. A window-truncated replay may drop the
* call head, so the settled form falls back to the resultView title.
* @param {object} block - frozen RunningToolCall or ToolResultNode.
* @returns {string} the title, possibly "" (the row renders bare then).
*/
function queryTitle(block) {
	if ("kind" in block) {
		const view = block.resultView;
		if (view !== null && view !== void 0 && view.card === "web" && view.kind === "search" && typeof view.title === "string" && view.title !== "") return view.title;
	}
	const argsRaw = ("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "";
	try {
		const parsed = JSON.parse(argsRaw);
		if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.queries)) {
			const queries = parsed.queries.filter((q) => typeof q === "string" && q !== "");
			if (queries.length > 0) return queries.join(", ");
		}
	} catch {}
	return "";
}
/** Flatten the settled result's content blocks to one text (the host's generic contract). */
function contentText(block) {
	const parts = [];
	for (const item of block.content ?? []) if (item !== null && typeof item === "object" && item.type === "text" && typeof item.text === "string") parts.push(item.text);
	const text = parts.join("\n").trim();
	return text === "" ? null : text;
}
/**
* Split a tool output answer into per-query sections. The host joins
* multi-query results as `### <query>\n\n<content>` (dsh-tool-web
* mergeSearchResults); a single-query answer is one section without a header.
* An unanchored leading `###` line in provider text is treated as a section
* boundary too — worst case a receipt-less foreign section, which is exactly
* how foreign text is identified (no receipt claimed for it).
* @param {string} answer
* @returns {Array<{ query: string | null, body: string }>}
*/
function splitSections(answer) {
	const sections = [];
	const parts = answer.split(/\n(?=### )/);
	for (const part of parts) {
		const m = part.match(/^### ([^\n]*)\n/);
		if (m !== null) sections.push({
			query: m[1].trim() || null,
			body: part.slice(m[0].length).trim()
		});
		else sections.push({
			query: null,
			body: part.trim()
		});
	}
	return sections.filter((section) => section.body !== "");
}
/**
* Extract (receipt, rest) pairs from one section body. A section contributes
* a receipt only when one of its lines starts with our receipt prefix —
* foreign provider text is never dressed up as web-search-ext provenance.
* @param {string} body
* @returns {{ receipt: string | null, rest: string | null }}
*/
function splitReceipt(body) {
	const lines = body.split("\n");
	const receiptIndex = lines.findIndex((line) => line.trimStart().startsWith(RECEIPT_PREFIX));
	if (receiptIndex === -1) return {
		receipt: null,
		rest: body
	};
	const receipt = lines[receiptIndex].trim();
	lines.splice(receiptIndex, 1);
	const rest = lines.join("\n").trim();
	return {
		receipt,
		rest: rest !== "" ? rest : null
	};
}
/**
* Derive the whole card from the frozen block. Pure: no subscriptions, no
* host lookups — the view is a function of what the turn already knows.
* @param {object} block - frozen RunningToolCall or ToolResultNode.
* @returns the card model consumed by the row component:
*   { state, title, startMs, provenance: [{query, receipt, backend}], backends: string[],
*     answer, truncated, sources: [{url,title,snippet,publishedAt,badge}], text }
*
* `startMs` (C5): the running call's start time — the host's `tool/call`
* event log time (Unix epoch ms, the only start-time fact the wire carries)
* — or null when the block is settled or `time` is absent/malformed. The
* row ticks the elapsed indicator on its own clock from this; the host
* never re-renders a running row (its running affordance is pure CSS), so
* the client owns the tick. A malformed `time` degrades to a label without
* a number rather than a garbage elapsed.
*/
function webSearchCardModel(block) {
	const settled = "kind" in block;
	const state = !settled ? "running" : block.error?.code === "interrupted" ? "stopped" : block.isError ? "error" : "ok";
	const model = {
		state,
		title: queryTitle(block),
		startMs: !settled && typeof block.time === "number" && Number.isFinite(block.time) && block.time >= 0 ? block.time : null,
		provenance: [],
		backends: [],
		answer: null,
		truncated: false,
		sources: [],
		text: null
	};
	if (!settled) return model;
	if (state === "error") {
		model.text = contentText(block) ?? (block.error !== void 0 ? `${block.error.name ?? "error"}: ${block.error.code ?? ""}` : null);
		return model;
	}
	const view = block.resultView;
	const web = view !== null && view !== void 0 && view.card === "web" && view.kind === "search" && Array.isArray(view.sources) ? view : null;
	if (web === null) {
		model.text = contentText(block);
		return model;
	}
	model.truncated = web.truncated === true;
	if (typeof web.answer === "string" && web.answer !== "") {
		const sections = splitSections(web.answer);
		const rest = [];
		for (const section of sections) {
			const { receipt, rest: restText } = splitReceipt(section.body);
			if (receipt !== null) {
				const backend = receiptBackend(receipt);
				model.provenance.push({
					query: section.query,
					receipt,
					backend
				});
				if (backend !== null && !model.backends.includes(backend)) model.backends.push(backend);
			}
			if (restText !== null) rest.push(receipt === null && section.query !== null ? `### ${section.query}\n${restText}` : restText);
		}
		model.answer = rest.length > 0 ? rest.join("\n\n") : null;
	}
	for (const source of web.sources) {
		if (source === null || typeof source !== "object") continue;
		const snippet = typeof source.snippet === "string" ? source.snippet : "";
		const marker = parseMarker(snippet);
		model.sources.push({
			url: typeof source.url === "string" ? source.url : "",
			title: typeof source.title === "string" && source.title !== "" ? source.title : null,
			snippet: marker !== null ? marker.rest : snippet,
			publishedAt: typeof source.publishedAt === "string" ? source.publishedAt : null,
			badge: marker !== null ? {
				label: marker.marker,
				tone: marker.tone,
				detail: marker.detail
			} : null
		});
	}
	return model;
}
//#endregion
//#region src/client/health.js
/** Same-origin route the Health tab fetches (host lib/health.js). */
const HEALTH_ROUTE = "/web-search-ext/health";
/** Same-origin route the "Test now" button POSTs to (host lib/index.js, G3). */
const PROBE_ROUTE = "/web-search-ext/probe";
/**
* Closed set of probe detail codes the host may produce
* (lib/index.js `classifyProbeError`). Anything else is a shape change —
* reject the whole payload rather than render an unknown code.
*/
const PROBE_DETAIL_CODES = [
	"ok",
	"rate-limited",
	"auth",
	"timeout",
	"error",
	"network",
	"disabled"
];
function isFiniteNumber(v) {
	return typeof v === "number" && Number.isFinite(v);
}
/**
* Validate the G3 probe payload (host `probeBackends` result). Returns the
* display model — or null when malformed (a shape change must surface as
* the unavailable line, exactly like the C2 counters).
*
* Display model: `{ at: number, backends: [{ name: string, label: string,
* status: "ok" | "error" | "disabled", detail: <PROBE_DETAIL_CODES>,
* ms: number }] }`. `label` defaults to `name`; a missing `ms` to 0.
*/
function parseProbe(probe) {
	if (probe === null || typeof probe !== "object" || Array.isArray(probe)) return null;
	if (!isFiniteNumber(probe.at) || probe.at < 0) return null;
	if (!Array.isArray(probe.backends)) return null;
	const backends = [];
	for (const row of probe.backends) {
		if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
		if (typeof row.name !== "string" || row.name === "") return null;
		if (row.status !== "ok" && row.status !== "error" && row.status !== "disabled") return null;
		if (typeof row.detail !== "string" || !PROBE_DETAIL_CODES.includes(row.detail)) return null;
		const ms = row.ms === void 0 || row.ms === null ? 0 : row.ms;
		if (!isFiniteNumber(ms) || ms < 0) return null;
		backends.push({
			name: row.name,
			label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
			status: row.status,
			detail: row.detail,
			ms
		});
	}
	return {
		at: probe.at,
		backends
	};
}
/**
* Normalize the wire payload into the display model, or null when any
* required field is malformed (a shape change must surface as the
* unavailable line, never as a silently wrong number).
*
* Display model:
*   { startedAt: number, uptimeMs: number, searchCalls: number,
*     fetchCalls: number, resultsReturned: number | null,
*     backends: [{ provider: string, name: string, label: string,
*       attempts: number, ok: number, failed: number,
*       lastCallAt: number | null, lastCallMs: number | null,
*       lastOk: boolean | null, cooldownRemainingMs: number }],
*     probe: null | { at: number, backends: [{ name, label, status,
*       detail, ms }] } }
*
* The `probe` field (G3) is absent/null until the first connectivity probe;
* when present it must be well-formed, or the whole payload is rejected.
*/
function parseHealth(payload) {
	if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
	const p = payload;
	if (!isFiniteNumber(p.startedAt) || p.startedAt < 0) return null;
	if (!isFiniteNumber(p.uptimeMs) || p.uptimeMs < 0) return null;
	if (!isFiniteNumber(p.searchCalls) || p.searchCalls < 0) return null;
	if (!isFiniteNumber(p.fetchCalls) || p.fetchCalls < 0) return null;
	if (p.resultsReturned !== void 0 && p.resultsReturned !== null && (!isFiniteNumber(p.resultsReturned) || p.resultsReturned < 0)) return null;
	if (!Array.isArray(p.backends)) return null;
	const backends = [];
	for (const row of p.backends) {
		if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
		if (typeof row.provider !== "string" || row.provider === "") return null;
		if (typeof row.name !== "string" || row.name === "") return null;
		if (!isFiniteNumber(row.attempts) || row.attempts < 0) return null;
		if (!isFiniteNumber(row.ok) || row.ok < 0) return null;
		if (!isFiniteNumber(row.failed) || row.failed < 0) return null;
		const lastCallAt = row.lastCallAt === void 0 ? null : row.lastCallAt;
		const lastCallMs = row.lastCallMs === void 0 ? null : row.lastCallMs;
		const lastOk = row.lastOk === void 0 ? null : row.lastOk;
		if (lastCallAt !== null && !isFiniteNumber(lastCallAt)) return null;
		if (lastCallMs !== null && !isFiniteNumber(lastCallMs)) return null;
		if (lastOk !== null && typeof lastOk !== "boolean") return null;
		const cooldown = row.cooldownRemainingMs === void 0 || row.cooldownRemainingMs === null ? 0 : row.cooldownRemainingMs;
		if (!isFiniteNumber(cooldown) || cooldown < 0) return null;
		backends.push({
			provider: row.provider,
			name: row.name,
			label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
			attempts: row.attempts,
			ok: row.ok,
			failed: row.failed,
			lastCallAt,
			lastCallMs,
			lastOk,
			cooldownRemainingMs: cooldown
		});
	}
	const probe = p.probe === void 0 || p.probe === null ? null : parseProbe(p.probe);
	if (probe === null && p.probe !== void 0 && p.probe !== null) return null;
	return {
		startedAt: p.startedAt,
		uptimeMs: p.uptimeMs,
		searchCalls: p.searchCalls,
		fetchCalls: p.fetchCalls,
		resultsReturned: p.resultsReturned === void 0 ? null : p.resultsReturned,
		backends,
		probe
	};
}
/**
* Human duration from milliseconds: "12s" / "2m 3s" / "1h 1m" / "3d 2h".
* Two units at most (the leading unit + the next smaller one); negatives
* and non-finite values clamp to "0s" — the card must never render a
* negative age or NaN.
*/
function formatDuration(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "0s";
	const s = Math.floor(ms / 1e3);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ${s % 60}s`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ${m % 60}m`;
	return `${Math.floor(h / 24)}d ${h % 24}h`;
}
/**
* "How long ago": null when the event is unknown (never called), else the
* clamped age between `then` and `now` (defaults to Date.now()).
*/
function ageOf(then, now = Date.now()) {
	if (!isFiniteNumber(then)) return null;
	if (!isFiniteNumber(now)) return null;
	return formatDuration(Math.max(0, now - then));
}
//#endregion
//#region src/client/row.module.css
var row_module_default = {
	"answerText": "row-module__answerText",
	"badge": "row-module__badge",
	"badge_error": "row-module__badge_error",
	"badge_muted": "row-module__badge_muted",
	"badge_ok": "row-module__badge_ok",
	"badge_warn": "row-module__badge_warn",
	"bodyWrap": "row-module__bodyWrap",
	"card": "row-module__card",
	"chevron": "row-module__chevron",
	"drill": "row-module__drill",
	"drillLabel": "row-module__drillLabel",
	"drillRow": "row-module__drillRow",
	"drillToggle": "row-module__drillToggle",
	"drillValue": "row-module__drillValue",
	"drillValue_error": "row-module__drillValue_error",
	"drillValue_muted": "row-module__drillValue_muted",
	"drillValue_ok": "row-module__drillValue_ok",
	"drillValue_warn": "row-module__drillValue_warn",
	"emptyNote": "row-module__emptyNote",
	"errorSummary": "row-module__errorSummary",
	"errorText": "row-module__errorText",
	"genericText": "row-module__genericText",
	"inspectButton": "row-module__inspectButton",
	"leading": "row-module__leading",
	"provenance": "row-module__provenance",
	"provenanceEntry": "row-module__provenanceEntry",
	"provenanceLine": "row-module__provenanceLine",
	"provenanceQuery": "row-module__provenanceQuery",
	"root": "row-module__root",
	"row": "row-module__row",
	"runningSuffix": "row-module__runningSuffix",
	"sep": "row-module__sep",
	"source": "row-module__source",
	"sourceHead": "row-module__sourceHead",
	"sourceIndex": "row-module__sourceIndex",
	"sourceMeta": "row-module__sourceMeta",
	"sources": "row-module__sources",
	"sourceSnippet": "row-module__sourceSnippet",
	"sourceTitle": "row-module__sourceTitle",
	"summary": "row-module__summary",
	"sweep": "row-module__sweep",
	"title": "row-module__title",
	"truncatedNote": "row-module__truncatedNote",
	"visuallyHidden": "row-module__visuallyHidden"
};
//#endregion
//#region src/client/row.js
/** Title fallback when a source ships no title (usually keyless paths). */
function hostnameOf(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
/** State substitution for the collapsed leading slot (host ToolRow contract). */
function leadingFor(state) {
	switch (state) {
		case "error": return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" });
		case "stopped": return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "warning" });
		default: return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, { size: 14 });
	}
}
/** Visually hidden run-state label for the colour-only lifecycle cues. */
function stateStatus(state, t) {
	switch (state) {
		case "running": return t("row.running");
		case "error": return t("row.failed");
		case "stopped": return t("row.stopped");
		default: return null;
	}
}
function firstLine(text) {
	const nl = text.indexOf("\n");
	return nl === -1 ? text : text.slice(0, nl);
}
/**
* Render one `web_search` call: host row chrome (DisclosureRow, same tokens
* as the built-in web row) + our card body (provenance, badges, sources,
* truncation notice, optional vendor answer text).
* @param {object} props - the keyed toolview payload plus our locale seat.
*/
function WebSearchRow({ block, inspect, t }) {
	const model = webSearchCardModel(block);
	const [expanded, setExpanded] = (0, react.useState)(false);
	const [drillIndex, setDrillIndex] = (0, react.useState)(null);
	(0, react.useEffect)(() => setDrillIndex(null), [block.callId]);
	const [elapsedMs, setElapsedMs] = (0, react.useState)(0);
	(0, react.useEffect)(() => {
		if (model.state !== "running" || model.startMs === null) return void 0;
		const tick = () => setElapsedMs(Math.max(0, Date.now() - model.startMs));
		tick();
		const id = setInterval(tick, 1e3);
		return () => clearInterval(id);
	}, [
		model.state,
		model.startMs,
		block.callId
	]);
	const hasBody = model.state === "ok" ? model.provenance.length > 0 || model.sources.length > 0 || model.truncated === true || model.answer !== null || model.text !== null : model.text !== null;
	const empty = model.state === "ok" && !hasBody;
	const expandable = hasBody || empty;
	const open = expanded && expandable;
	const status = stateStatus(model.state, t);
	const summary = model.state === "error" && model.text !== null ? firstLine(model.text) : model.title !== "" ? model.title : t("row.title");
	const summaryClass = model.state === "error" ? `${row_module_default.summary} ${row_module_default.errorSummary}` : row_module_default.summary;
	return (0, react.createElement)("div", {
		className: row_module_default.root,
		"data-tool": "web-search-ext",
		"data-state": model.state
	}, status !== null ? (0, react.createElement)("span", { className: row_module_default.visuallyHidden }, status) : null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
		rowClassName: row_module_default.row,
		leadingClassName: row_module_default.leading,
		titleClassName: row_module_default.title,
		chevronClassName: row_module_default.chevron,
		icon: leadingFor(model.state),
		title: t("row.title"),
		open,
		expandable,
		expandOnRowClick: true,
		keepContentWhenOpen: true,
		onToggle: () => setExpanded((value) => !value),
		collapsedContent: [
			(0, react.createElement)("span", {
				key: "sep",
				className: row_module_default.sep,
				"aria-hidden": true
			}),
			(0, react.createElement)("span", {
				key: "summary",
				className: summaryClass
			}, summary),
			model.state === "running" ? (0, react.createElement)("span", {
				key: "running",
				className: row_module_default.runningSuffix
			}, model.startMs !== null ? `${t("row.searching")} ${formatDuration(elapsedMs)}` : t("row.searching")) : null
		]
	}, (0, react.createElement)("div", { className: row_module_default.bodyWrap }, (0, react.createElement)("div", { className: row_module_default.card }, model.provenance.length > 0 ? (0, react.createElement)("div", { className: row_module_default.provenance }, model.provenance.map((entry, i) => (0, react.createElement)("div", {
		key: i,
		className: row_module_default.provenanceEntry
	}, entry.query !== null ? (0, react.createElement)("div", { className: row_module_default.provenanceQuery }, entry.query) : null, (0, react.createElement)("div", { className: row_module_default.provenanceLine }, entry.receipt)))) : null, empty ? (0, react.createElement)("div", { className: row_module_default.emptyNote }, t("row.noResults")) : null, model.sources.length > 0 ? (0, react.createElement)("ul", { className: row_module_default.sources }, model.sources.map((source, i) => (0, react.createElement)("li", {
		key: `${source.url}:${i}`,
		className: row_module_default.source
	}, (0, react.createElement)("div", {
		className: row_module_default.sourceHead,
		onClick: () => setDrillIndex(drillIndex === i ? null : i)
	}, (0, react.createElement)("span", {
		className: row_module_default.sourceIndex,
		"aria-hidden": true
	}, String(i + 1)), source.badge !== null ? (0, react.createElement)("span", { className: `${row_module_default.badge} ${row_module_default[`badge_${source.badge.tone}`]}` }, source.badge.detail !== null ? `${source.badge.label} · ${source.badge.detail}` : source.badge.label) : null, isSafeHref(source.url) ? (0, react.createElement)("a", {
		className: row_module_default.sourceTitle,
		href: source.url,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (event) => event.stopPropagation()
	}, source.title !== null ? source.title : hostnameOf(source.url)) : (0, react.createElement)("span", {
		className: row_module_default.sourceTitle,
		"aria-disabled": "true"
	}, source.title !== null ? source.title : source.url), (0, react.createElement)("button", {
		type: "button",
		className: row_module_default.drillToggle,
		"aria-expanded": drillIndex === i,
		"aria-controls": `${block.callId ?? "websearch"}-drill-${i}`,
		"aria-label": t("row.drill.toggle"),
		onClick: (event) => {
			event.stopPropagation();
			setDrillIndex(drillIndex === i ? null : i);
		}
	}, "›")), drillIndex === i ? (0, react.createElement)("div", {
		id: `${block.callId ?? "websearch"}-drill-${i}`,
		className: row_module_default.drill
	}, [
		model.backends.length > 0 ? (0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.backend")), (0, react.createElement)("span", { className: row_module_default.drillValue }, model.backends.length > 1 ? `${model.backends.join(" · ")}${t("row.drill.merged")}` : model.backends[0])]) : null,
		(0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.published")), (0, react.createElement)("span", { className: row_module_default.drillValue }, source.publishedAt !== null && source.publishedAt !== "" ? source.publishedAt : t("row.drill.unknown"))]),
		(0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.verification")), (0, react.createElement)("span", { className: `${row_module_default.drillValue}${source.badge !== null ? ` ${row_module_default[`drillValue_${source.badge.tone}`]}` : ""}` }, source.badge !== null ? `${source.badge.label}${source.badge.detail !== null ? ` · ${source.badge.detail}` : ""}` : t("row.drill.notVerified"))])
	]) : null, source.snippet !== "" ? (0, react.createElement)("div", { className: row_module_default.sourceSnippet }, source.snippet) : null, (0, react.createElement)("div", { className: row_module_default.sourceMeta }, [source.url, source.publishedAt].filter((part) => part !== null && part !== "").join(" · "))))) : null, model.truncated === true ? (0, react.createElement)("div", { className: row_module_default.truncatedNote }, t("row.truncated", { count: model.sources.length })) : null, model.answer !== null ? (0, react.createElement)("div", { className: row_module_default.answerText }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: model.answer })) : null, model.text !== null ? (0, react.createElement)("div", { className: model.state === "error" ? `${row_module_default.genericText} ${row_module_default.errorText}` : row_module_default.genericText }, model.text) : null), inspect !== void 0 ? (0, react.createElement)("button", {
		type: "button",
		className: row_module_default.inspectButton,
		onClick: inspect
	}, [(0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconInspectOutline12, {}), t("row.inspect")]) : null)));
}
//#endregion
//#region src/client/command.js
/**
* Primary command name and its fallback. The host's contribution registry
* rejects a duplicate name at register time (and a host-catalog collision
* fails loud at candidate synthesis), so registration tries the primary
* name first and falls back to the second — the card shows which one
* actually materialized.
*/
const COMMAND_PRIMARY = "search-engine";
const COMMAND_FALLBACK = "web-search-engine";
/**
* Key-state word for one API key ref.
* @param {{configured: boolean, source: string}} key - credentials.describe
*   projection (NO_KEY_STATE when the ref is absent).
* @param {boolean} keylessAllowed - whether the backend serves without a key
*   (exa: always — the anonymous MCP path; firecrawl: only when
*   firecrawlKeyless is on).
* @param {(key: string, params?: object) => string} t - bound translator.
* @returns {string} one of the closed cmd.keyed* / cmd.keyless words.
*/
function keyWord(key, keylessAllowed, t) {
	if (key !== null && key !== void 0 && key.configured === true) return key.source === "env" ? t("cmd.keyedEnv") : t("cmd.keyedFile");
	return keylessAllowed ? t("cmd.keyless") : t("cmd.keyMissing");
}
/**
* Status word for one health backends row (search provider): cooldown, last
* call outcome + age, or "never called". Closed vocabulary, locale-neutral
* on the wire, translated here.
* @param {{cooldownRemainingMs: number, lastCallAt: number | null, lastOk: boolean | null} | null} backend
* @param {(key: string, params?: object) => string} t
* @returns {string}
*/
function backendStatusWord(backend, t) {
	if (backend === null || backend === void 0) return t("cmd.never");
	if (typeof backend.cooldownRemainingMs === "number" && backend.cooldownRemainingMs > 0) return t("cmd.cooldown", { time: formatDuration(backend.cooldownRemainingMs) });
	if (typeof backend.lastCallAt !== "number" || !Number.isFinite(backend.lastCallAt)) return t("cmd.never");
	return backend.lastOk === true ? t("cmd.lastOk", { time: ageOf(backend.lastCallAt) }) : t("cmd.lastFail", { time: ageOf(backend.lastCallAt) });
}
/**
* One-line probe summary for the "Test connectivity" row: "last test {age}
* ago: {codes}" where codes join the stored probe's per-backend CLOSED
* detail codes through the existing probe.* keys (locale parity with the
* Health tab).
* @param {{at: number, backends: Array<{label: string, detail: string}>} | null} probe
* @param {(key: string, params?: object) => string} t
* @returns {string}
*/
function probeWord(probe, t) {
	if (probe === null || probe === void 0) return t("cmd.neverTested");
	const codes = (Array.isArray(probe.backends) ? probe.backends : []).filter((b) => b !== null && typeof b === "object" && typeof b.detail === "string").map((b) => `${typeof b.label === "string" && b.label !== "" ? b.label : b.name} ${t(`probe.${b.detail}`)}`).join(" · ");
	return codes === "" ? t("cmd.neverTested") : t("cmd.testLast", {
		age: ageOf(probe.at),
		codes
	});
}
/**
* Build the popupSelect options for the /search-engine command.
* @param {object} args
* @param {(key: string, params?: object) => string} args.t - bound translator.
* @param {"exa" | "firecrawl"} args.preferred - effective preferred backend
*   (the merged settings value, schema default "exa" when unset).
* @param {{configured: boolean, source: string} | null} args.exaKey
* @param {{configured: boolean, source: string} | null} args.fcKey
* @param {boolean} args.fcKeyless - effective firecrawlKeyless setting.
* @param {{backends?: Array<object>, probe?: object | null} | null} args.health -
*   parseHealth output for the live payload, or null when the health route
*   is unavailable (degrade: status words fall back to "never called").
* @returns {Array<{id: string, label: string, detail: string, active?: boolean}>}
*   Two "prefer <backend>" rows (the active one marked) + one test row.
*/
function commandOptions({ t, preferred, exaKey, fcKey, fcKeyless, health }) {
	const searchBackends = Array.isArray(health?.backends) ? health.backends : [];
	const exa = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "exa") ?? null;
	const fc = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "firecrawl") ?? null;
	return [
		{
			id: "exa",
			label: t("cmd.preferExa"),
			detail: `${keyWord(exaKey, true, t)} · ${backendStatusWord(exa, t)}`,
			active: preferred === "exa"
		},
		{
			id: "firecrawl",
			label: t("cmd.preferFirecrawl"),
			detail: `${keyWord(fcKey, fcKeyless === true, t)} · ${backendStatusWord(fc, t)}`,
			active: preferred === "firecrawl"
		},
		{
			id: "test",
			label: t("cmd.test"),
			detail: probeWord(health?.probe ?? null, t)
		}
	];
}
//#endregion
//#region src/client/settings-model.js
/** The closed set of host-accepted verification tiers, in card display order. */
const VERIFY_LEVELS = Object.freeze([
	"off",
	"liveness",
	"content"
]);
/** The host schema's default tier (lib/index.js Config schema). */
const VERIFY_LEVEL_DEFAULT = "liveness";
/**
* The tier the settings-card select should display for a stored value:
* one of the three schema tiers, or the schema default when the value is
* unset or unrecognized. A hand-edited settings.yaml may hold anything;
* the host would reject a write of an unrecognized tier, so the card
* normalizes it to the default instead of echoing it back.
* @param {unknown} stored - raw document value (undefined when unset).
* @returns {"off" | "liveness" | "content"}
*/
function effectiveVerifyLevel(stored) {
	return VERIFY_LEVELS.includes(stored) ? stored : VERIFY_LEVEL_DEFAULT;
}
//#endregion
//#region src/client/card.module.css
var card_module_default = {
	"badge": "card-module__badge",
	"badgeMuted": "card-module__badgeMuted",
	"badges": "card-module__badges",
	"body": "card-module__body",
	"card": "card-module__card",
	"cardOpen": "card-module__cardOpen",
	"check": "card-module__check",
	"chevron": "card-module__chevron",
	"chevronOpen": "card-module__chevronOpen",
	"description": "card-module__description",
	"discard": "card-module__discard",
	"failed": "card-module__failed",
	"field": "card-module__field",
	"footer": "card-module__footer",
	"head": "card-module__head",
	"header": "card-module__header",
	"headText": "card-module__headText",
	"health": "card-module__health",
	"healthLabel": "card-module__healthLabel",
	"healthRow": "card-module__healthRow",
	"healthSection": "card-module__healthSection",
	"healthSectionHead": "card-module__healthSectionHead",
	"healthSectionTitle": "card-module__healthSectionTitle",
	"healthValue": "card-module__healthValue",
	"hint": "card-module__hint",
	"input": "card-module__input",
	"label": "card-module__label",
	"name": "card-module__name",
	"pending": "card-module__pending",
	"save": "card-module__save",
	"settingsPane": "card-module__settingsPane",
	"spin": "card-module__spin",
	"tab": "card-module__tab",
	"tabActive": "card-module__tabActive",
	"tabs": "card-module__tabs",
	"wsx-rot": "card-module__wsx-rot"
};
//#endregion
//#region src/client/index.js
const NS = "web-search-ext";
const EXA_REF = "EXA_API_KEY";
const FC_REF = "FIRECRAWL_API_KEY";
const NUMERIC = [
	"numResults",
	"maxSnippetChars",
	"rateLimitCooldownSec"
];
const FIELDS = [
	"preferred",
	"verifyLevel",
	...NUMERIC,
	"firecrawlKeyless"
];
const inject = [
	"slots",
	"locale",
	"connection",
	"settingsScope",
	"remote",
	"commandUi"
];
const NO_KEY_STATE = {
	configured: false,
	writable: true,
	source: ""
};
let commandRegistration = {
	name: null,
	fallback: false,
	unavailable: true
};
/** Defensively read whatever shape the derived scope exposes. */
function readScope(scope) {
	try {
		if (scope && typeof scope.getSnapshot === "function") return scope.getSnapshot();
		if (scope && typeof scope.snapshot === "function") return scope.snapshot();
		if (scope && typeof scope === "object") return scope;
	} catch (err) {
		return { __error: String(err && err.message || err) };
	}
	return null;
}
function effectiveValue(snap, field) {
	return snap && snap.value ? snap.value[field] : void 0;
}
function initialDraft(snap) {
	return {
		preferred: effectiveValue(snap, "preferred"),
		verifyLevel: effectiveVerifyLevel(effectiveValue(snap, "verifyLevel")),
		numResults: effectiveValue(snap, "numResults"),
		maxSnippetChars: effectiveValue(snap, "maxSnippetChars"),
		rateLimitCooldownSec: effectiveValue(snap, "rateLimitCooldownSec"),
		firecrawlKeyless: effectiveValue(snap, "firecrawlKeyless")
	};
}
/**
* Per-ref credentials state. describe({refs}) returns, per ref, which layer
* supplies the key and whether that layer accepts writes; a missing/failed
* response degrades to "unconfigured but writable" (the safe default: the
* input stays editable and a failed write reports itself on save).
*/
function keyStateFrom(res) {
	const c = res && res.credentials || {};
	const one = (ref) => {
		const d = c[ref];
		if (!d || typeof d !== "object") return { ...NO_KEY_STATE };
		return {
			configured: !!d.configured,
			writable: d.writable !== false,
			source: d.source || ""
		};
	};
	return {
		exa: one(EXA_REF),
		fc: one(FC_REF)
	};
}
/** C3: settings-pane hint line — which slash-command name materialized (or none). */
function commandLineText(t) {
	if (commandRegistration.name === null) return t("cmd.lineUnavail");
	if (commandRegistration.fallback) return t("cmd.lineFallback", {
		name: COMMAND_FALLBACK,
		primary: COMMAND_PRIMARY
	});
	return t("cmd.line", { name: COMMAND_PRIMARY });
}
function WebSearchExtCard(props) {
	const { t, scope, api, remote } = props;
	const [open, setOpen] = (0, react.useState)(false);
	const [tab, setTab] = (0, react.useState)("settings");
	const [snap, setSnap] = (0, react.useState)(null);
	const [draft, setDraft] = (0, react.useState)(null);
	const [keyDraft, setKeyDraft] = (0, react.useState)({
		exa: "",
		fc: ""
	});
	const [keyState, setKeyState] = (0, react.useState)(() => keyStateFrom(null));
	const [status, setStatus] = (0, react.useState)({
		kind: "idle",
		msg: ""
	});
	const [dirty, setDirty] = (0, react.useState)(false);
	const dirtyRef = (0, react.useRef)(false);
	function markDirty(value) {
		dirtyRef.current = value;
		setDirty(value);
	}
	(0, react.useEffect)(() => {
		const s = readScope(scope);
		setSnap(s);
		setDraft(initialDraft(s));
		let off = null;
		try {
			off = scope.subscribe(() => {
				const next = readScope(scope);
				setSnap(next);
				if (!dirtyRef.current) setDraft(initialDraft(next));
			});
		} catch (err) {
			off = null;
		}
		Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).then((res) => setKeyState(keyStateFrom(res))).catch(() => {});
		return () => {
			if (typeof off === "function") try {
				off();
			} catch (err) {}
		};
	}, [scope, api]);
	(0, react.useEffect)(() => {
		let off = null;
		try {
			const r = remote && remote.$on ? remote.$on("credentials/reference-updated", (ref) => {
				if (ref !== EXA_REF && ref !== FC_REF) return;
				Promise.resolve().then(() => api.credentials.describe({ refs: [ref] })).then((res) => {
					const d = (res && res.credentials || {})[ref];
					setKeyState((prev) => {
						const st = d && typeof d === "object" ? {
							configured: !!d.configured,
							writable: d.writable !== false,
							source: d.source || ""
						} : { ...NO_KEY_STATE };
						return ref === EXA_REF ? {
							...prev,
							exa: st
						} : {
							...prev,
							fc: st
						};
					});
				}).catch(() => {});
			}) : null;
			off = typeof r === "function" ? r : null;
		} catch (err) {
			off = null;
		}
		return () => {
			if (off) try {
				off();
			} catch (err) {}
		};
	}, [remote, api]);
	function setField(field, value) {
		setDraft((d) => ({
			...d,
			[field]: value
		}));
		markDirty(true);
	}
	function setKey(kind, value) {
		setKeyDraft((k) => ({
			...k,
			[kind]: value
		}));
		markDirty(true);
	}
	async function save() {
		setStatus({
			kind: "saving",
			msg: ""
		});
		try {
			for (const field of FIELDS) {
				const value = draft[field];
				if (value === void 0) continue;
				const base = effectiveValue(snap, field);
				if (NUMERIC.includes(field)) {
					if (value === "") {
						await scope.unset(field);
						continue;
					}
					const n = Number(value);
					if (!Number.isFinite(n)) throw new Error(`${field}: not a number`);
					if (n === base) continue;
					await scope.set(field, n);
				} else {
					if (value === base) continue;
					await scope.set(field, value);
				}
			}
			if (keyDraft.exa.trim() && keyState.exa.writable !== false) await api.credentials.set({
				ref: EXA_REF,
				value: keyDraft.exa.trim()
			});
			if (keyDraft.fc.trim() && keyState.fc.writable !== false) await api.credentials.set({
				ref: FC_REF,
				value: keyDraft.fc.trim()
			});
			const c = await Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).catch(() => null);
			if (c && c.credentials) setKeyState(keyStateFrom(c));
			markDirty(false);
			setStatus({
				kind: "saved",
				msg: ""
			});
		} catch (err) {
			setStatus({
				kind: "error",
				msg: String(err && err.message || err)
			});
		}
	}
	function discard() {
		setDraft(initialDraft(snap));
		setKeyDraft({
			exa: "",
			fc: ""
		});
		setStatus({
			kind: "idle",
			msg: ""
		});
		markDirty(false);
	}
	const saving = status.kind === "saving";
	const busy = dirty || saving;
	const ro = snap === null ? false : snap.writable === false;
	function keyField(labelKey, ref, value, onChange, state) {
		const st = state && typeof state === "object" ? state : NO_KEY_STATE;
		const readOnly = st.configured && !st.writable;
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey)), (0, react.createElement)("span", { className: card_module_default.badges }, (0, react.createElement)("span", { className: st.configured ? card_module_default.badge : card_module_default.badgeMuted }, t(st.configured ? "keySet" : "keyUnset")))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type: "password",
			autoComplete: "off",
			disabled: ro || readOnly,
			placeholder: readOnly ? `${ref} · ${st.source || "env"}` : st.configured ? "" : ref,
			value,
			onChange: (e) => onChange(e.target.value)
		}), (0, react.createElement)("p", { className: card_module_default.hint }, t(readOnly ? "keyReadOnlyHint" : "keyHint")));
	}
	function textField(labelKey, field, type, min) {
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type,
			min,
			disabled: ro,
			value: draft ? String(draft[field] == null ? "" : draft[field]) : "",
			onChange: (e) => setField(field, e.target.value)
		}));
	}
	return (0, react.createElement)("div", { className: `${card_module_default.card}${open ? ` ${card_module_default.cardOpen}` : ""}` }, (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.header,
		"aria-expanded": open,
		onClick: () => setOpen((o) => !o)
	}, (0, react.createElement)("div", { className: card_module_default.headText }, (0, react.createElement)("div", { className: card_module_default.name }, t("title")), (0, react.createElement)("div", { className: card_module_default.description }, t("description"))), dirty && !saving ? (0, react.createElement)("span", { className: card_module_default.pending }, t("pending")) : null, (0, react.createElement)("span", { className: open ? `${card_module_default.chevron} ${card_module_default.chevronOpen}` : card_module_default.chevron }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 }))), open ? (0, react.createElement)("div", { className: card_module_default.body }, (0, react.createElement)("div", {
		className: card_module_default.tabs,
		role: "tablist"
	}, (0, react.createElement)("button", {
		type: "button",
		role: "tab",
		id: "dsw-websearch-tab-settings",
		"aria-controls": "dsw-websearch-panel-settings",
		className: tab === "settings" ? `${card_module_default.tab} ${card_module_default.tabActive}` : card_module_default.tab,
		"aria-selected": tab === "settings",
		onClick: () => setTab("settings")
	}, t("health.settings")), (0, react.createElement)("button", {
		type: "button",
		role: "tab",
		id: "dsw-websearch-tab-health",
		"aria-controls": "dsw-websearch-panel-health",
		className: tab === "health" ? `${card_module_default.tab} ${card_module_default.tabActive}` : card_module_default.tab,
		"aria-selected": tab === "health",
		onClick: () => setTab("health")
	}, t("health.tab"))), tab === "settings" ? (0, react.createElement)("div", {
		className: card_module_default.settingsPane,
		role: "tabpanel",
		id: "dsw-websearch-panel-settings"
	}, (0, react.createElement)("p", { className: card_module_default.hint }, commandLineText(t)), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("preferred"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: String(draft?.preferred ?? "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("verifyLevel"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: effectiveVerifyLevel(draft?.verifyLevel),
		onChange: (e) => setField("verifyLevel", e.target.value)
	}, ...VERIFY_LEVELS.map((level) => (0, react.createElement)("option", { value: level }, level))), (0, react.createElement)("p", { className: card_module_default.hint }, t("verifyLevelHint"))), textField("numResults", "numResults", "number", "1"), textField("maxSnippetChars", "maxSnippetChars", "number", "1"), textField("cooldown", "rateLimitCooldownSec", "number", "0"), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("keyless")), (0, react.createElement)("input", {
		type: "checkbox",
		className: card_module_default.check,
		disabled: ro,
		checked: draft ? !!draft.firecrawlKeyless : true,
		onChange: (e) => setField("firecrawlKeyless", e.target.checked)
	}))), keyField("exaKey", EXA_REF, keyDraft.exa, (v) => setKey("exa", v), keyState.exa), keyField("firecrawlKey", FC_REF, keyDraft.fc, (v) => setKey("fc", v), keyState.fc), (0, react.createElement)("div", { className: card_module_default.footer }, status.kind === "error" ? (0, react.createElement)("p", { className: card_module_default.failed }, t("error"), " ", status.msg) : status.kind === "saved" ? (0, react.createElement)("p", {
		className: card_module_default.hint,
		style: {
			flex: 1,
			margin: 0
		}
	}, t("saved")) : null, (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.discard,
		disabled: !busy || saving || ro,
		onClick: discard
	}, t("discard")), (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.save,
		disabled: !busy || saving || ro,
		onClick: () => save()
	}, saving ? (0, react.createElement)("span", { style: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6
	} }, (0, react.createElement)("span", { className: card_module_default.spin }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, { size: 16 })), t("saving")) : t("save")))) : (0, react.createElement)(HealthTab, {
		t,
		panelId: "dsw-websearch-panel-health"
	})) : null);
}
let autoProbeFired = false;
/**
* Health tab (C2 + G3): fetches the session telemetry from the host's
* same-origin GET /web-search-ext/health route on mount and on refresh,
* and shows the connectivity probe result (POST /web-search-ext/probe on
* first open / on "Test now"). A fetch/parse failure surfaces as an
* explicit unavailable line with a retry — the tab never renders a
* silently empty state.
*/
function HealthTab({ t, panelId }) {
	const [state, setState] = (0, react.useState)({
		phase: "loading",
		data: null,
		error: ""
	});
	const [reload, setReload] = (0, react.useState)(0);
	const [probe, setProbe] = (0, react.useState)({
		testing: false,
		error: ""
	});
	const live = (0, react.useRef)(true);
	(0, react.useEffect)(() => {
		live.current = true;
		return () => {
			live.current = false;
		};
	}, []);
	(0, react.useEffect)(() => {
		let cancelled = false;
		setState({
			phase: "loading",
			data: null,
			error: ""
		});
		fetch(HEALTH_ROUTE, { headers: { accept: "application/json" } }).then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}).then((payload) => {
			if (cancelled) return;
			const model = parseHealth(payload);
			if (model === null) throw new Error("unparsable payload");
			setState({
				phase: "ready",
				data: model,
				error: ""
			});
			if (model.probe === null && !autoProbeFired) {
				autoProbeFired = true;
				runProbe();
			}
		}).catch((err) => {
			if (cancelled) return;
			setState({
				phase: "error",
				data: null,
				error: String(err && err.message || err)
			});
		});
		return () => {
			cancelled = true;
		};
	}, [reload]);
	function refreshButton() {
		return (0, react.createElement)("button", {
			type: "button",
			className: card_module_default.discard,
			onClick: () => setReload((n) => n + 1)
		}, t("health.refresh"));
	}
	function runProbe() {
		setProbe((p) => ({
			...p,
			testing: true,
			error: ""
		}));
		fetch(PROBE_ROUTE, {
			method: "POST",
			headers: { accept: "application/json" }
		}).then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}).then((payload) => {
			if (!live.current) return;
			const model = parseHealth(payload);
			if (model === null) throw new Error("unparsable payload");
			setState((s) => s.phase === "error" ? {
				phase: "ready",
				data: model,
				error: ""
			} : {
				...s,
				data: model
			});
			setProbe({
				testing: false,
				error: ""
			});
		}).catch((err) => {
			if (!live.current) return;
			setProbe({
				testing: false,
				error: String(err && err.message || err)
			});
		});
	}
	function testButton() {
		return (0, react.createElement)("button", {
			type: "button",
			className: card_module_default.discard,
			disabled: probe.testing,
			onClick: () => runProbe()
		}, probe.testing ? t("health.connectivity.testing") : t("health.connectivity.test"));
	}
	function section(title, headExtra, ...rows) {
		return (0, react.createElement)("div", { className: card_module_default.healthSection }, (0, react.createElement)("div", { className: card_module_default.healthSectionHead }, (0, react.createElement)("div", { className: card_module_default.healthSectionTitle }, title), headExtra), ...rows);
	}
	function row(label, value) {
		return (0, react.createElement)("div", { className: card_module_default.healthRow }, (0, react.createElement)("div", { className: card_module_default.healthLabel }, label), (0, react.createElement)("div", { className: card_module_default.healthValue }, value));
	}
	function valueRow(value) {
		return (0, react.createElement)("div", { className: card_module_default.healthRow }, (0, react.createElement)("div", { className: card_module_default.healthValue }, value));
	}
	if (state.phase === "loading") return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, (0, react.createElement)("p", { className: card_module_default.hint }, t("health.loading")));
	if (state.phase === "error") return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, (0, react.createElement)("p", { className: card_module_default.failed }, t("health.error"), " ", state.error), (0, react.createElement)("div", { className: card_module_default.healthSectionHead }, refreshButton()));
	const data = state.data;
	const now = Date.now();
	const searchRows = data.backends.filter((b) => b.provider === "search");
	const fetchRows = data.backends.filter((b) => b.provider === "fetch");
	const cooled = data.backends.filter((b) => b.cooldownRemainingMs > 0);
	function backendLine(b) {
		const counts = `${b.ok} ${t("health.ok")} · ${b.failed} ${t("health.failed")}`;
		if (b.lastCallAt === null) return `${counts} · ${t("health.never")}`;
		const age = ageOf(b.lastCallAt, now);
		const stateWord = b.lastOk ? t("health.ok") : t("health.failed");
		const ms = b.lastCallMs === null ? "" : ` · ${b.lastCallMs}ms`;
		return `${counts} · ${t("health.last")} ${age} ${stateWord}${ms}`;
	}
	function backendSection(provider, rows) {
		if (rows.length === 0) return null;
		return section(provider, null, ...rows.map((b) => row(b.label, backendLine(b))));
	}
	const sessionLine = [
		`${t("health.uptime")} ${formatDuration(data.uptimeMs)}`,
		t("health.searches", { count: data.searchCalls }),
		t("health.fetches", { count: data.fetchCalls }),
		...data.resultsReturned === null ? [] : [t("health.results", { count: data.resultsReturned })]
	].join(" · ");
	const cooldownRows = cooled.length === 0 ? [valueRow(t("health.none"))] : cooled.map((b) => row(b.label, t("health.remaining", { count: Math.ceil(b.cooldownRemainingMs / 1e3) })));
	const probeData = data.probe;
	function probeLine(b) {
		return `${b.status === "ok" ? "✓" : b.status === "disabled" ? "−" : "✗"} ${t(`probe.${b.detail}`)}${b.status === "disabled" ? "" : ` · ${b.ms}ms`}`;
	}
	const probeRows = probeData === null ? [valueRow(probe.testing ? t("health.connectivity.testing") : t("health.connectivity.none"))] : [valueRow(t("health.connectivity.last", { age: ageOf(probeData.at, now) })), ...probeData.backends.map((b) => row(b.label, probeLine(b)))];
	return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, section(t("health.connectivity"), testButton(), ...probeRows), probe.error !== "" ? (0, react.createElement)("p", { className: card_module_default.failed }, t("health.connectivity.error"), " ", probe.error) : null, section(t("health.session"), refreshButton(), valueRow(sessionLine)), data.backends.length === 0 ? (0, react.createElement)("p", { className: card_module_default.hint }, t("health.noActivity")) : null, backendSection("search", searchRows), backendSection("fetch", fetchRows), section(t("health.cooldowns"), null, ...cooldownRows));
}
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "web-search-ext: dictionaries");
	const t = ctx.locale.bind(NS);
	const scope = ctx.settingsScope.bind({ namespace: NS });
	const api = ctx.get("connection").api;
	const remote = ctx.get("remote");
	if (ctx.commandUi && typeof ctx.commandUi.register === "function") {
		const value = () => {
			const snap = readScope(scope);
			return snap && snap.value && typeof snap.value === "object" ? snap.value : {};
		};
		const contribution = {
			name: COMMAND_PRIMARY,
			description: t("cmd.description"),
			available: () => true,
			ui: {
				kind: "popupSelect",
				options: async (_session, signal) => {
					const [healthPayload, keyRes] = await Promise.all([fetch(HEALTH_ROUTE, {
						headers: { accept: "application/json" },
						signal
					}).then((res) => res.ok ? res.json() : null).catch(() => null), Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).catch(() => null)]);
					const v = value();
					return commandOptions({
						t,
						preferred: typeof v.preferred === "string" ? v.preferred : "exa",
						exaKey: keyStateFrom(keyRes).exa,
						fcKey: keyStateFrom(keyRes).fc,
						fcKeyless: v.firecrawlKeyless !== false,
						health: parseHealth(healthPayload)
					});
				},
				onSelect: async (option) => {
					if (option.id === "exa" || option.id === "firecrawl") {
						if (value().preferred === option.id) return;
						await scope.set("preferred", option.id);
						return;
					}
					if (option.id === "test") {
						const res = await fetch(PROBE_ROUTE, {
							method: "POST",
							headers: { accept: "application/json" }
						});
						if (!res.ok) throw new Error(t("cmd.testFailed", { status: res.status }));
					}
				}
			}
		};
		try {
			ctx.effect(() => ctx.commandUi.register(contribution), "web-search-ext: /search-engine command");
			commandRegistration = {
				name: COMMAND_PRIMARY,
				fallback: false,
				unavailable: false
			};
		} catch {
			try {
				ctx.effect(() => ctx.commandUi.register({
					...contribution,
					name: COMMAND_FALLBACK
				}), "web-search-ext: /web-search-engine command (fallback)");
				commandRegistration = {
					name: COMMAND_FALLBACK,
					fallback: true,
					unavailable: false
				};
			} catch {
				commandRegistration = {
					name: null,
					fallback: false,
					unavailable: true
				};
			}
		}
	} else commandRegistration = {
		name: null,
		fallback: false,
		unavailable: true
	};
	ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
		name: "settings.plugin.item",
		key: NS,
		locale: NS,
		inject: () => ({
			t,
			scope,
			api,
			remote
		})
	}, WebSearchExtCard));
	ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
		name: "tool.call.toolview",
		key: "web_search",
		locale: NS
	}, WebSearchRow));
}
const name = "web-search-ext";
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

	return module.exports;
}
});
} catch (wsxErr) {
if (!String((wsxErr && wsxErr.message) || wsxErr).includes("duplicate factory registration")) throw wsxErr;
}

try {
window.__ModuleLoader__.load({ id: "@fno2010/dsh-web-search-ext", factory: (require) => {
	var module = { exports: {} };
	var exports = module.exports;
const wsxCss = ".row-module__root {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__row {\n  align-items: center;\n  min-width: 0;\n  height: 24px;\n  display: flex;\n  position: relative;\n  overflow: hidden;\n}\n\n.row-module__row[data-expandable] {\n  cursor: pointer;\n}\n\n.row-module__root[data-state=\"running\"] .row-module__row:after {\n  content: \"\";\n  background: linear-gradient(90deg, transparent 0%,\n    color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent) 55%, transparent 100%);\n  pointer-events: none;\n  width: 300px;\n  animation: 2.6s ease-out infinite row-module__sweep;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n}\n\n@keyframes row-module__sweep {\n  0% {\n    left: -300px;\n  }\n\n  90%, 100% {\n    left: 100%;\n  }\n}\n\n.row-module__leading {\n  width: 16px;\n  height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  justify-content: center;\n  align-items: center;\n  margin-right: 6px;\n  display: inline-flex;\n  position: relative;\n}\n\n.row-module__title {\n  color: var(--dsw-alias-label-secondary);\n  flex: none;\n  font-size: 14px;\n  line-height: 24px;\n}\n\n.row-module__chevron {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__sep {\n  background: var(--dsw-alias-label-caption);\n  border-radius: 1px;\n  flex: none;\n  width: 2px;\n  height: 2px;\n  margin: 0 8px;\n}\n\n.row-module__summary {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n  color: var(--dsw-alias-label-tertiary);\n  flex: auto;\n  font-size: 14px;\n  line-height: 24px;\n  overflow: hidden;\n}\n\n.row-module__errorSummary {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__runningSuffix {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-caption);\n  flex: none;\n  margin-left: 8px;\n  font-size: 12px;\n  line-height: 24px;\n}\n\n.row-module__visuallyHidden {\n  clip: rect(0 0 0 0);\n  white-space: nowrap;\n  border: 0;\n  width: 1px;\n  height: 1px;\n  margin: -1px;\n  padding: 0;\n  position: absolute;\n  overflow: hidden;\n}\n\n.row-module__bodyWrap {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__card {\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-markdown-code-block);\n  border-radius: 12px;\n  flex-direction: column;\n  gap: 8px;\n  max-height: 320px;\n  margin: 4px 0 4px 4px;\n  padding: 8px 12px;\n  display: flex;\n  overflow: auto;\n}\n\n.row-module__provenance {\n  color: var(--dsw-alias-label-secondary);\n  border-bottom: 1px solid var(--dsw-alias-border-l2);\n  flex-direction: column;\n  gap: 4px;\n  padding-bottom: 6px;\n  font-size: 12px;\n  line-height: 1.5;\n  display: flex;\n}\n\n.row-module__provenanceEntry {\n  flex-direction: column;\n  display: flex;\n}\n\n.row-module__provenanceQuery {\n  color: var(--dsw-alias-label-caption);\n  font-size: 11px;\n}\n\n.row-module__provenanceLine {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__emptyNote {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n}\n\n.row-module__sourceIndex {\n  color: var(--dsw-alias-label-caption);\n  text-align: right;\n  flex: none;\n  min-width: 14px;\n  font-size: 12px;\n}\n\n.row-module__sources {\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  display: flex;\n}\n\n.row-module__source {\n  padding: 6px 0;\n}\n\n.row-module__source + .row-module__source {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.row-module__sourceHead {\n  cursor: pointer;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  display: flex;\n}\n\n.row-module__drillToggle {\n  width: 16px;\n  height: 16px;\n  color: var(--dsw-alias-label-caption);\n  text-align: center;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  flex: none;\n  padding: 0;\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 16px;\n}\n\n.row-module__drillToggle:hover, .row-module__drillToggle[aria-expanded=\"true\"] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.row-module__drill {\n  border-top: 1px dashed var(--dsw-alias-border-l2);\n  flex-direction: column;\n  gap: 2px;\n  margin-top: 4px;\n  padding-top: 4px;\n  display: flex;\n}\n\n.row-module__drillRow {\n  gap: 8px;\n  min-width: 0;\n  font-size: 12px;\n  line-height: 1.5;\n  display: flex;\n}\n\n.row-module__drillLabel {\n  color: var(--dsw-alias-label-caption);\n  flex: none;\n  width: 72px;\n}\n\n.row-module__drillValue {\n  color: var(--dsw-alias-label-secondary);\n  word-break: break-word;\n  min-width: 0;\n}\n\n.row-module__drillValue_ok {\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.row-module__drillValue_warn {\n  color: var(--dsw-alias-state-warn-primary);\n}\n\n.row-module__drillValue_error {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__drillValue_muted {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.row-module__badge {\n  white-space: nowrap;\n  border: 1px solid;\n  border-radius: 999px;\n  flex: none;\n  padding: 0 6px;\n  font-size: 11px;\n  line-height: 18px;\n}\n\n.row-module__badge_ok {\n  color: var(--dsw-alias-state-success-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_warn {\n  color: var(--dsw-alias-state-warn-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_error {\n  color: var(--dsw-alias-state-error-primary);\n  border-color: currentColor;\n}\n\n.row-module__badge_muted {\n  color: var(--dsw-alias-label-tertiary);\n  border-color: currentColor;\n}\n\n.row-module__sourceTitle {\n  color: var(--dsw-alias-label-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n  text-decoration: none;\n  overflow: hidden;\n}\n\n.row-module__sourceTitle:hover {\n  text-decoration: underline;\n}\n\n.row-module__sourceSnippet {\n  color: var(--dsw-alias-label-secondary);\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  margin-top: 2px;\n  font-size: 13px;\n  line-height: 1.5;\n  display: -webkit-box;\n  overflow: hidden;\n}\n\n.row-module__sourceMeta {\n  color: var(--dsw-alias-label-caption);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  margin-top: 2px;\n  font-size: 12px;\n  overflow: hidden;\n}\n\n.row-module__truncatedNote {\n  color: var(--dsw-alias-state-warn-primary);\n  font-size: 12px;\n}\n\n.row-module__answerText {\n  color: var(--dsw-alias-label-secondary);\n  word-break: break-word;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.row-module__genericText {\n  color: var(--dsw-alias-label-secondary);\n  white-space: pre-wrap;\n  word-break: break-word;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.row-module__errorText {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.row-module__inspectButton {\n  border: 1px solid var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  background: none;\n  border-radius: 8px;\n  align-self: flex-start;\n  align-items: center;\n  gap: 4px;\n  margin: 0 0 0 4px;\n  padding: 2px 8px;\n  font-size: 12px;\n  line-height: 16px;\n  display: inline-flex;\n}\n\n.row-module__inspectButton:hover {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-tertiary);\n}\n.card-module__card {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  border-radius: 12px;\n  list-style: none;\n  transition: border-color .16s, background .16s;\n}\n\n.card-module__card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__header {\n  appearance: none;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 12px;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  display: flex;\n}\n\n.card-module__header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n.card-module__headText {\n  flex-direction: column;\n  flex: 1;\n  gap: 4px;\n  min-width: 0;\n  display: flex;\n}\n\n.card-module__name {\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.card-module__description {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__chevron {\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  transition: transform .16s;\n  display: inline-flex;\n}\n\n.card-module__chevronOpen {\n  transform: rotate(180deg);\n}\n\n.card-module__body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n.card-module__field {\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n  display: flex;\n}\n\n.card-module__field + .card-module__field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.card-module__head {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__label {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  flex: 1;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n}\n\n.card-module__badges {\n  align-items: center;\n  gap: 8px;\n  display: inline-flex;\n}\n\n.card-module__badge {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__badgeMuted {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.card-module__pending {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__input {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  height: 34px;\n  font: inherit;\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 0 12px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__input:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n.card-module__input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n.card-module__hint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__check {\n  width: 14px;\n  height: 14px;\n  accent-color: var(--dsw-alias-brand-primary);\n}\n\n.card-module__footer {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 0 4px;\n  display: flex;\n}\n\n.card-module__failed {\n  min-width: 0;\n  color: var(--dsw-alias-label-error);\n  flex: 1;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__discard, .card-module__save {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  border: 1px solid #0000;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__discard {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  background: none;\n}\n\n.card-module__discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n.card-module__discard:disabled, .card-module__save:disabled {\n  opacity: .4;\n  cursor: default;\n}\n\n.card-module__discard:focus-visible, .card-module__save:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__spin {\n  animation: .8s linear infinite card-module__wsx-rot;\n  display: inline-flex;\n}\n\n@keyframes card-module__wsx-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.card-module__tabs {\n  gap: 4px;\n  padding: 12px 0 8px;\n  display: flex;\n}\n\n.card-module__tab {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  color: var(--dsw-alias-label-tertiary);\n  background: none;\n  border: 1px solid #0000;\n  border-radius: 999px;\n  padding: 3px 12px;\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__tab:hover:not(.card-module__tabActive) {\n  color: var(--dsw-alias-label-primary);\n}\n\n.card-module__tabActive {\n  color: var(--dsw-alias-label-primary);\n  background: var(--dsw-alias-bg-module-platform);\n}\n\n.card-module__tab:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__settingsPane {\n  flex-direction: column;\n  display: flex;\n}\n\n.card-module__health {\n  gap: 4px;\n  padding: 2px 0 8px;\n  display: flex;\n}\n\n.card-module__healthSection {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  gap: 6px;\n  padding: 10px 0;\n  display: flex;\n}\n\n.card-module__healthSectionHead {\n  justify-content: space-between;\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__healthSectionTitle {\n  color: var(--dsw-alias-label-tertiary);\n  letter-spacing: .04em;\n  text-transform: uppercase;\n  font-size: 11px;\n  font-weight: 600;\n}\n\n.card-module__healthRow {\n  justify-content: baseline;\n  align-items: baseline;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__healthLabel {\n  color: var(--dsw-alias-label-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: none;\n  min-width: 0;\n  max-width: 160px;\n  font-size: 13px;\n  font-weight: 500;\n  overflow: hidden;\n}\n\n.card-module__healthValue {\n  color: var(--dsw-alias-label-secondary);\n  flex: 1;\n  min-width: 0;\n  font-size: 13px;\n  line-height: 1.5;\n}\n";
const wsxTagId = "@fno2010/dsh-web-search-ext/card.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(wsxTagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@fno2010/dsh-web-search-ext";
	tag.dataset.pluginCss = wsxTagId;
	tag.textContent = wsxCss;
	document.head.appendChild(tag);
}

Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
//#region src/client/locales.js
const en = {
	title: "Web Search (ext)",
	description: "Multi-backend web_search provider: Exa + Firecrawl, automatic failover, per-backend 429 cooldowns.",
	preferred: "Preferred backend",
	numResults: "Default result count",
	maxSnippetChars: "Snippet length bound (chars)",
	cooldown: "429 cooldown (seconds, 0 disables)",
	verifyLevel: "Verification tier",
	verifyLevelHint: "off: no verification · liveness: HEAD-check every source · content: also verify snippet text on the live page (experimental)",
	keyless: "Allow keyless Firecrawl requests",
	exaKey: "Exa API key",
	firecrawlKey: "Firecrawl API key",
	keySet: "Configured",
	keyUnset: "Not configured",
	keyHint: "Leave blank to keep the stored key; enter a value to replace it.",
	keyReadOnlyHint: "Supplied by the process environment — read-only; the host rejects UI writes that an environment value would shadow.",
	save: "Save",
	discard: "Discard",
	saving: "Saving…",
	saved: "Saved.",
	error: "Save failed:",
	pending: "unsaved changes",
	"row.title": "Search",
	"row.running": "Searching the web…",
	"row.searching": "searching…",
	"row.failed": "Search failed",
	"row.stopped": "Search stopped",
	"row.truncated": "Showing the first {count} sources. Refine the query for more.",
	"row.noResults": "No results found.",
	"row.inspect": "Inspect",
	"row.drill.backend": "Backend",
	"row.drill.merged": " (merged across sub-queries)",
	"row.drill.published": "Published",
	"row.drill.toggle": "Expand details",
	"row.drill.unknown": "unknown",
	"row.drill.verification": "Verification",
	"row.drill.notVerified": "not verified",
	"health.settings": "Settings",
	"health.tab": "Health",
	"health.loading": "Loading…",
	"health.error": "Health unavailable:",
	"health.session": "Session",
	"health.uptime": "Uptime",
	"health.searches": "{count} searches",
	"health.fetches": "{count} fetches",
	"health.results": "{count} results",
	"health.last": "last",
	"health.never": "never",
	"health.ok": "ok",
	"health.failed": "failed",
	"health.cooldowns": "Cooldowns",
	"health.remaining": "{count}s remaining",
	"health.none": "none",
	"health.noActivity": "No backend activity this session yet.",
	"health.refresh": "Refresh",
	"health.connectivity": "Connectivity",
	"health.connectivity.test": "Test now",
	"health.connectivity.testing": "Testing…",
	"health.connectivity.error": "Connectivity test failed:",
	"health.connectivity.last": "tested {age} ago",
	"health.connectivity.none": "No connectivity test yet.",
	"probe.ok": "OK",
	"probe.rate-limited": "rate limited (429)",
	"probe.auth": "auth rejected",
	"probe.timeout": "timed out",
	"probe.network": "network error",
	"probe.error": "request failed",
	"probe.disabled": "not enabled",
	"cmd.description": "Configure web-search-ext: preferred backend, status, connectivity test",
	"cmd.preferExa": "Prefer Exa",
	"cmd.preferFirecrawl": "Prefer Firecrawl",
	"cmd.test": "Test connectivity",
	"cmd.keyedEnv": "keyed (env)",
	"cmd.keyedFile": "keyed (file)",
	"cmd.keyless": "keyless",
	"cmd.keyMissing": "no key, keyless disabled",
	"cmd.never": "never called",
	"cmd.lastOk": "last ok {time} ago",
	"cmd.lastFail": "last failed {time} ago",
	"cmd.cooldown": "cooldown for {time}",
	"cmd.neverTested": "never tested",
	"cmd.testLast": "last test {age} ago: {codes}",
	"cmd.testFailed": "connectivity test failed (HTTP {status})",
	"cmd.line": "Slash command: /{name}",
	"cmd.lineFallback": "Slash command: /{name} (/{primary} is in use)",
	"cmd.lineUnavail": "Slash command unavailable (/search-engine and /web-search-engine are both in use)"
};
const zh = {
	title: "Web 搜索（ext）",
	description: "多后端 web_search 提供方：Exa + Firecrawl，自动故障切换，按后端 429 冷却。",
	preferred: "首选后端",
	numResults: "默认结果条数",
	maxSnippetChars: "摘要长度上限（字符）",
	cooldown: "429 冷却时长（秒，0 关闭）",
	verifyLevel: "校验层级",
	verifyLevelHint: "off：不校验 · liveness：对每个来源做 HEAD 存活检查 · content：额外校验摘要文本仍出现在活页面上（实验性）",
	keyless: "允许无 key 的 Firecrawl 请求",
	exaKey: "Exa API key",
	firecrawlKey: "Firecrawl API key",
	keySet: "已配置",
	keyUnset: "未配置",
	keyHint: "留空则保留已存储的 key；填入值则替换。",
	keyReadOnlyHint: "由进程环境变量提供——只读；环境变量会遮蔽写入，宿主会拒绝 UI 写入。",
	save: "保存",
	discard: "放弃",
	saving: "保存中…",
	saved: "已保存。",
	error: "保存失败：",
	pending: "未保存的更改",
	"row.title": "搜索",
	"row.running": "正在搜索网页…",
	"row.searching": "搜索中…",
	"row.failed": "搜索失败",
	"row.stopped": "搜索已中止",
	"row.truncated": "仅显示前 {count} 条来源。细化查询可获取更多。",
	"row.noResults": "未找到结果。",
	"row.inspect": "查看",
	"row.drill.backend": "来源后端",
	"row.drill.merged": "（跨子查询合并）",
	"row.drill.published": "发布时间",
	"row.drill.toggle": "展开详情",
	"row.drill.unknown": "未知",
	"row.drill.verification": "校验状态",
	"row.drill.notVerified": "未校验",
	"health.settings": "设置",
	"health.tab": "健康",
	"health.loading": "加载中…",
	"health.error": "健康状态不可用：",
	"health.session": "会话",
	"health.uptime": "运行时长",
	"health.searches": "{count} 次搜索",
	"health.fetches": "{count} 次抓取",
	"health.results": "{count} 条结果",
	"health.last": "最近",
	"health.never": "从未",
	"health.ok": "成功",
	"health.failed": "失败",
	"health.cooldowns": "冷却中",
	"health.remaining": "剩余 {count}s",
	"health.none": "无",
	"health.noActivity": "本会话尚无后端活动。",
	"health.refresh": "刷新",
	"health.connectivity": "连接状态",
	"health.connectivity.test": "立即测试",
	"health.connectivity.testing": "正在测试…",
	"health.connectivity.error": "连接测试失败：",
	"health.connectivity.last": "{age} 前测试",
	"health.connectivity.none": "尚未测试连接。",
	"probe.ok": "正常",
	"probe.rate-limited": "限流 (429)",
	"probe.auth": "认证被拒绝",
	"probe.timeout": "超时",
	"probe.network": "网络错误",
	"probe.error": "请求失败",
	"probe.disabled": "未启用",
	"cmd.description": "配置 web-search-ext：首选后端、状态、连通性测试",
	"cmd.preferExa": "优先 Exa",
	"cmd.preferFirecrawl": "优先 Firecrawl",
	"cmd.test": "测试连通性",
	"cmd.keyedEnv": "带 key（环境变量）",
	"cmd.keyedFile": "带 key（文件）",
	"cmd.keyless": "无 key",
	"cmd.keyMissing": "无 key 且已禁用 keyless",
	"cmd.never": "从未调用",
	"cmd.lastOk": "最近成功：{time} 前",
	"cmd.lastFail": "最近失败：{time} 前",
	"cmd.cooldown": "冷却中：剩 {time}",
	"cmd.neverTested": "从未测试",
	"cmd.testLast": "上次测试 {age} 前：{codes}",
	"cmd.testFailed": "连通性测试失败（HTTP {status}）",
	"cmd.line": "斜杠命令：/{name}",
	"cmd.lineFallback": "斜杠命令：/{name}（/{primary} 已被占用）",
	"cmd.lineUnavail": "斜杠命令不可用（/search-engine 与 /web-search-engine 均被占用）"
};
//#endregion
//#region src/client/model.js
/** Marker label → visual tone. Closed list, keyed by the EXACT marker text
*  our verify.js MARKERS emits — an unknown bracket prefix in a snippet is
*  not a marker (avoids false-positive badges on `[Some Title]` snippets). */
const MARKER_TONE = {
	alive: "ok",
	verified: "ok",
	"verified·changed": "warn",
	unverified: "muted",
	"dead 404": "error",
	blocked: "error",
	timeout: "warn",
	unreachable: "error",
	skipped: "muted"
};
/** Receipt prefix: our provenance line is only ever claimed from a line that
*  starts with this (lib/index.js buildReceipt). */
const RECEIPT_PREFIX = "web-search-ext:";
/**
* Parse the serving backend's label out of a claimed receipt line.
* buildReceipt emits `web-search-ext: <label> · <seconds>s · …` where label
* is the backend that answered the call ("exa-rest" / "exa-mcp" /
* "firecrawl"). The per-source backend is NOT a wire field — dsh-tool-web's
* projectSource keeps only url/title/snippet/publishedAt — so the receipt is
* the card's only source of backend truth (all of a call's sources come
* from that one backend; failover is per-call, not per-result).
* @param {string} receipt - a claimed receipt line.
* @returns {string | null} the backend label, or null when unparseable.
*/
function receiptBackend(receipt) {
	const rest = receipt.slice(15).trimStart();
	const sep = rest.indexOf(" · ");
	const label = (sep === -1 ? rest : rest.slice(0, sep)).trim();
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label) ? label : null;
}
/**
* Parse our verification marker off a source snippet. verify.js `markSnippet`
* emits `[label] (detail) rest`, where `detail` is free text that may itself
* contain parentheses (fetch error reasons), so the detail group is matched
* with a balanced-paren scan, not a `[^)]*` regex (which truncates at the
* first inner `)`).
* @param {string} snippet - the source snippet as it arrived on the wire.
* @returns {{ marker: string, tone: string, detail: string | null, rest: string } | null}
*   null when the snippet carries no known marker (verifyLevel off, or a
*  host that stripped it) — the snippet then renders as-is.
*/
function parseMarker(snippet) {
	if (typeof snippet !== "string" || snippet === "") return null;
	if (snippet[0] !== "[") return null;
	const close = snippet.indexOf("]");
	if (close === -1) return null;
	const marker = snippet.slice(1, close);
	const tone = MARKER_TONE[marker];
	if (tone === void 0) return null;
	let restStart = close + 1;
	let detail = null;
	if (snippet[restStart] === " " && snippet[restStart + 1] === "(") {
		let depth = 0;
		let end = -1;
		for (let i = restStart + 1; i < snippet.length; i += 1) if (snippet[i] === "(") depth += 1;
		else if (snippet[i] === ")") {
			depth -= 1;
			if (depth === 0) {
				end = i;
				break;
			}
		}
		if (end !== -1) {
			detail = snippet.slice(restStart + 2, end) || null;
			restStart = end + 1;
		}
	}
	return {
		marker,
		tone,
		detail,
		rest: snippet.slice(restStart).replace(/^\s+/, "")
	};
}
/**
* Whether a wire source URL is safe to render as a clickable link. The
* mirror of the host's SafeLink policy: only public http(s) URLs are links;
* everything else renders as inert text (the wire only guarantees a string,
* and a nonconforming or malicious provider could carry javascript:/data:
* URLs).
* @param {unknown} url
* @returns {boolean}
*/
function isSafeHref(url) {
	if (typeof url !== "string" || url === "") return false;
	try {
		const protocol = new URL(url).protocol;
		return protocol === "http:" || protocol === "https:";
	} catch {
		return false;
	}
}
/**
* The row title: the host's authoritative view title when present, else the
* query list parsed from the raw args. A window-truncated replay may drop the
* call head, so the settled form falls back to the resultView title.
* @param {object} block - frozen RunningToolCall or ToolResultNode.
* @returns {string} the title, possibly "" (the row renders bare then).
*/
function queryTitle(block) {
	if ("kind" in block) {
		const view = block.resultView;
		if (view !== null && view !== void 0 && view.card === "web" && view.kind === "search" && typeof view.title === "string" && view.title !== "") return view.title;
	}
	const argsRaw = ("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "";
	try {
		const parsed = JSON.parse(argsRaw);
		if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.queries)) {
			const queries = parsed.queries.filter((q) => typeof q === "string" && q !== "");
			if (queries.length > 0) return queries.join(", ");
		}
	} catch {}
	return "";
}
/** Flatten the settled result's content blocks to one text (the host's generic contract). */
function contentText(block) {
	const parts = [];
	for (const item of block.content ?? []) if (item !== null && typeof item === "object" && item.type === "text" && typeof item.text === "string") parts.push(item.text);
	const text = parts.join("\n").trim();
	return text === "" ? null : text;
}
/**
* Split a tool output answer into per-query sections. The host joins
* multi-query results as `### <query>\n\n<content>` (dsh-tool-web
* mergeSearchResults); a single-query answer is one section without a header.
* An unanchored leading `###` line in provider text is treated as a section
* boundary too — worst case a receipt-less foreign section, which is exactly
* how foreign text is identified (no receipt claimed for it).
* @param {string} answer
* @returns {Array<{ query: string | null, body: string }>}
*/
function splitSections(answer) {
	const sections = [];
	const parts = answer.split(/\n(?=### )/);
	for (const part of parts) {
		const m = part.match(/^### ([^\n]*)\n/);
		if (m !== null) sections.push({
			query: m[1].trim() || null,
			body: part.slice(m[0].length).trim()
		});
		else sections.push({
			query: null,
			body: part.trim()
		});
	}
	return sections.filter((section) => section.body !== "");
}
/**
* Extract (receipt, rest) pairs from one section body. A section contributes
* a receipt only when one of its lines starts with our receipt prefix —
* foreign provider text is never dressed up as web-search-ext provenance.
* @param {string} body
* @returns {{ receipt: string | null, rest: string | null }}
*/
function splitReceipt(body) {
	const lines = body.split("\n");
	const receiptIndex = lines.findIndex((line) => line.trimStart().startsWith(RECEIPT_PREFIX));
	if (receiptIndex === -1) return {
		receipt: null,
		rest: body
	};
	const receipt = lines[receiptIndex].trim();
	lines.splice(receiptIndex, 1);
	const rest = lines.join("\n").trim();
	return {
		receipt,
		rest: rest !== "" ? rest : null
	};
}
/**
* Derive the whole card from the frozen block. Pure: no subscriptions, no
* host lookups — the view is a function of what the turn already knows.
* @param {object} block - frozen RunningToolCall or ToolResultNode.
* @returns the card model consumed by the row component:
*   { state, title, startMs, provenance: [{query, receipt, backend}], backends: string[],
*     answer, truncated, sources: [{url,title,snippet,publishedAt,badge}], text }
*
* `startMs` (C5): the running call's start time — the host's `tool/call`
* event log time (Unix epoch ms, the only start-time fact the wire carries)
* — or null when the block is settled or `time` is absent/malformed. The
* row ticks the elapsed indicator on its own clock from this; the host
* never re-renders a running row (its running affordance is pure CSS), so
* the client owns the tick. A malformed `time` degrades to a label without
* a number rather than a garbage elapsed.
*/
function webSearchCardModel(block) {
	const settled = "kind" in block;
	const state = !settled ? "running" : block.error?.code === "interrupted" ? "stopped" : block.isError ? "error" : "ok";
	const model = {
		state,
		title: queryTitle(block),
		startMs: !settled && typeof block.time === "number" && Number.isFinite(block.time) && block.time >= 0 ? block.time : null,
		provenance: [],
		backends: [],
		answer: null,
		truncated: false,
		sources: [],
		text: null
	};
	if (!settled) return model;
	if (state === "error") {
		model.text = contentText(block) ?? (block.error !== void 0 ? `${block.error.name ?? "error"}: ${block.error.code ?? ""}` : null);
		return model;
	}
	const view = block.resultView;
	const web = view !== null && view !== void 0 && view.card === "web" && view.kind === "search" && Array.isArray(view.sources) ? view : null;
	if (web === null) {
		model.text = contentText(block);
		return model;
	}
	model.truncated = web.truncated === true;
	if (typeof web.answer === "string" && web.answer !== "") {
		const sections = splitSections(web.answer);
		const rest = [];
		for (const section of sections) {
			const { receipt, rest: restText } = splitReceipt(section.body);
			if (receipt !== null) {
				const backend = receiptBackend(receipt);
				model.provenance.push({
					query: section.query,
					receipt,
					backend
				});
				if (backend !== null && !model.backends.includes(backend)) model.backends.push(backend);
			}
			if (restText !== null) rest.push(receipt === null && section.query !== null ? `### ${section.query}\n${restText}` : restText);
		}
		model.answer = rest.length > 0 ? rest.join("\n\n") : null;
	}
	for (const source of web.sources) {
		if (source === null || typeof source !== "object") continue;
		const snippet = typeof source.snippet === "string" ? source.snippet : "";
		const marker = parseMarker(snippet);
		model.sources.push({
			url: typeof source.url === "string" ? source.url : "",
			title: typeof source.title === "string" && source.title !== "" ? source.title : null,
			snippet: marker !== null ? marker.rest : snippet,
			publishedAt: typeof source.publishedAt === "string" ? source.publishedAt : null,
			badge: marker !== null ? {
				label: marker.marker,
				tone: marker.tone,
				detail: marker.detail
			} : null
		});
	}
	return model;
}
//#endregion
//#region src/client/health.js
/** Same-origin route the Health tab fetches (host lib/health.js). */
const HEALTH_ROUTE = "/web-search-ext/health";
/** Same-origin route the "Test now" button POSTs to (host lib/index.js, G3). */
const PROBE_ROUTE = "/web-search-ext/probe";
/**
* Closed set of probe detail codes the host may produce
* (lib/index.js `classifyProbeError`). Anything else is a shape change —
* reject the whole payload rather than render an unknown code.
*/
const PROBE_DETAIL_CODES = [
	"ok",
	"rate-limited",
	"auth",
	"timeout",
	"error",
	"network",
	"disabled"
];
function isFiniteNumber(v) {
	return typeof v === "number" && Number.isFinite(v);
}
/**
* Validate the G3 probe payload (host `probeBackends` result). Returns the
* display model — or null when malformed (a shape change must surface as
* the unavailable line, exactly like the C2 counters).
*
* Display model: `{ at: number, backends: [{ name: string, label: string,
* status: "ok" | "error" | "disabled", detail: <PROBE_DETAIL_CODES>,
* ms: number }] }`. `label` defaults to `name`; a missing `ms` to 0.
*/
function parseProbe(probe) {
	if (probe === null || typeof probe !== "object" || Array.isArray(probe)) return null;
	if (!isFiniteNumber(probe.at) || probe.at < 0) return null;
	if (!Array.isArray(probe.backends)) return null;
	const backends = [];
	for (const row of probe.backends) {
		if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
		if (typeof row.name !== "string" || row.name === "") return null;
		if (row.status !== "ok" && row.status !== "error" && row.status !== "disabled") return null;
		if (typeof row.detail !== "string" || !PROBE_DETAIL_CODES.includes(row.detail)) return null;
		const ms = row.ms === void 0 || row.ms === null ? 0 : row.ms;
		if (!isFiniteNumber(ms) || ms < 0) return null;
		backends.push({
			name: row.name,
			label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
			status: row.status,
			detail: row.detail,
			ms
		});
	}
	return {
		at: probe.at,
		backends
	};
}
/**
* Normalize the wire payload into the display model, or null when any
* required field is malformed (a shape change must surface as the
* unavailable line, never as a silently wrong number).
*
* Display model:
*   { startedAt: number, uptimeMs: number, searchCalls: number,
*     fetchCalls: number, resultsReturned: number | null,
*     backends: [{ provider: string, name: string, label: string,
*       attempts: number, ok: number, failed: number,
*       lastCallAt: number | null, lastCallMs: number | null,
*       lastOk: boolean | null, cooldownRemainingMs: number }],
*     probe: null | { at: number, backends: [{ name, label, status,
*       detail, ms }] } }
*
* The `probe` field (G3) is absent/null until the first connectivity probe;
* when present it must be well-formed, or the whole payload is rejected.
*/
function parseHealth(payload) {
	if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
	const p = payload;
	if (!isFiniteNumber(p.startedAt) || p.startedAt < 0) return null;
	if (!isFiniteNumber(p.uptimeMs) || p.uptimeMs < 0) return null;
	if (!isFiniteNumber(p.searchCalls) || p.searchCalls < 0) return null;
	if (!isFiniteNumber(p.fetchCalls) || p.fetchCalls < 0) return null;
	if (p.resultsReturned !== void 0 && p.resultsReturned !== null && (!isFiniteNumber(p.resultsReturned) || p.resultsReturned < 0)) return null;
	if (!Array.isArray(p.backends)) return null;
	const backends = [];
	for (const row of p.backends) {
		if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
		if (typeof row.provider !== "string" || row.provider === "") return null;
		if (typeof row.name !== "string" || row.name === "") return null;
		if (!isFiniteNumber(row.attempts) || row.attempts < 0) return null;
		if (!isFiniteNumber(row.ok) || row.ok < 0) return null;
		if (!isFiniteNumber(row.failed) || row.failed < 0) return null;
		const lastCallAt = row.lastCallAt === void 0 ? null : row.lastCallAt;
		const lastCallMs = row.lastCallMs === void 0 ? null : row.lastCallMs;
		const lastOk = row.lastOk === void 0 ? null : row.lastOk;
		if (lastCallAt !== null && !isFiniteNumber(lastCallAt)) return null;
		if (lastCallMs !== null && !isFiniteNumber(lastCallMs)) return null;
		if (lastOk !== null && typeof lastOk !== "boolean") return null;
		const cooldown = row.cooldownRemainingMs === void 0 || row.cooldownRemainingMs === null ? 0 : row.cooldownRemainingMs;
		if (!isFiniteNumber(cooldown) || cooldown < 0) return null;
		backends.push({
			provider: row.provider,
			name: row.name,
			label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
			attempts: row.attempts,
			ok: row.ok,
			failed: row.failed,
			lastCallAt,
			lastCallMs,
			lastOk,
			cooldownRemainingMs: cooldown
		});
	}
	const probe = p.probe === void 0 || p.probe === null ? null : parseProbe(p.probe);
	if (probe === null && p.probe !== void 0 && p.probe !== null) return null;
	return {
		startedAt: p.startedAt,
		uptimeMs: p.uptimeMs,
		searchCalls: p.searchCalls,
		fetchCalls: p.fetchCalls,
		resultsReturned: p.resultsReturned === void 0 ? null : p.resultsReturned,
		backends,
		probe
	};
}
/**
* Human duration from milliseconds: "12s" / "2m 3s" / "1h 1m" / "3d 2h".
* Two units at most (the leading unit + the next smaller one); negatives
* and non-finite values clamp to "0s" — the card must never render a
* negative age or NaN.
*/
function formatDuration(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "0s";
	const s = Math.floor(ms / 1e3);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ${s % 60}s`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ${m % 60}m`;
	return `${Math.floor(h / 24)}d ${h % 24}h`;
}
/**
* "How long ago": null when the event is unknown (never called), else the
* clamped age between `then` and `now` (defaults to Date.now()).
*/
function ageOf(then, now = Date.now()) {
	if (!isFiniteNumber(then)) return null;
	if (!isFiniteNumber(now)) return null;
	return formatDuration(Math.max(0, now - then));
}
//#endregion
//#region src/client/row.module.css
var row_module_default = {
	"answerText": "row-module__answerText",
	"badge": "row-module__badge",
	"badge_error": "row-module__badge_error",
	"badge_muted": "row-module__badge_muted",
	"badge_ok": "row-module__badge_ok",
	"badge_warn": "row-module__badge_warn",
	"bodyWrap": "row-module__bodyWrap",
	"card": "row-module__card",
	"chevron": "row-module__chevron",
	"drill": "row-module__drill",
	"drillLabel": "row-module__drillLabel",
	"drillRow": "row-module__drillRow",
	"drillToggle": "row-module__drillToggle",
	"drillValue": "row-module__drillValue",
	"drillValue_error": "row-module__drillValue_error",
	"drillValue_muted": "row-module__drillValue_muted",
	"drillValue_ok": "row-module__drillValue_ok",
	"drillValue_warn": "row-module__drillValue_warn",
	"emptyNote": "row-module__emptyNote",
	"errorSummary": "row-module__errorSummary",
	"errorText": "row-module__errorText",
	"genericText": "row-module__genericText",
	"inspectButton": "row-module__inspectButton",
	"leading": "row-module__leading",
	"provenance": "row-module__provenance",
	"provenanceEntry": "row-module__provenanceEntry",
	"provenanceLine": "row-module__provenanceLine",
	"provenanceQuery": "row-module__provenanceQuery",
	"root": "row-module__root",
	"row": "row-module__row",
	"runningSuffix": "row-module__runningSuffix",
	"sep": "row-module__sep",
	"source": "row-module__source",
	"sourceHead": "row-module__sourceHead",
	"sourceIndex": "row-module__sourceIndex",
	"sourceMeta": "row-module__sourceMeta",
	"sources": "row-module__sources",
	"sourceSnippet": "row-module__sourceSnippet",
	"sourceTitle": "row-module__sourceTitle",
	"summary": "row-module__summary",
	"sweep": "row-module__sweep",
	"title": "row-module__title",
	"truncatedNote": "row-module__truncatedNote",
	"visuallyHidden": "row-module__visuallyHidden"
};
//#endregion
//#region src/client/row.js
/** Title fallback when a source ships no title (usually keyless paths). */
function hostnameOf(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
/** State substitution for the collapsed leading slot (host ToolRow contract). */
function leadingFor(state) {
	switch (state) {
		case "error": return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" });
		case "stopped": return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "warning" });
		default: return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, { size: 14 });
	}
}
/** Visually hidden run-state label for the colour-only lifecycle cues. */
function stateStatus(state, t) {
	switch (state) {
		case "running": return t("row.running");
		case "error": return t("row.failed");
		case "stopped": return t("row.stopped");
		default: return null;
	}
}
function firstLine(text) {
	const nl = text.indexOf("\n");
	return nl === -1 ? text : text.slice(0, nl);
}
/**
* Render one `web_search` call: host row chrome (DisclosureRow, same tokens
* as the built-in web row) + our card body (provenance, badges, sources,
* truncation notice, optional vendor answer text).
* @param {object} props - the keyed toolview payload plus our locale seat.
*/
function WebSearchRow({ block, inspect, t }) {
	const model = webSearchCardModel(block);
	const [expanded, setExpanded] = (0, react.useState)(false);
	const [drillIndex, setDrillIndex] = (0, react.useState)(null);
	(0, react.useEffect)(() => setDrillIndex(null), [block.callId]);
	const [elapsedMs, setElapsedMs] = (0, react.useState)(0);
	(0, react.useEffect)(() => {
		if (model.state !== "running" || model.startMs === null) return void 0;
		const tick = () => setElapsedMs(Math.max(0, Date.now() - model.startMs));
		tick();
		const id = setInterval(tick, 1e3);
		return () => clearInterval(id);
	}, [
		model.state,
		model.startMs,
		block.callId
	]);
	const hasBody = model.state === "ok" ? model.provenance.length > 0 || model.sources.length > 0 || model.truncated === true || model.answer !== null || model.text !== null : model.text !== null;
	const empty = model.state === "ok" && !hasBody;
	const expandable = hasBody || empty;
	const open = expanded && expandable;
	const status = stateStatus(model.state, t);
	const summary = model.state === "error" && model.text !== null ? firstLine(model.text) : model.title !== "" ? model.title : t("row.title");
	const summaryClass = model.state === "error" ? `${row_module_default.summary} ${row_module_default.errorSummary}` : row_module_default.summary;
	return (0, react.createElement)("div", {
		className: row_module_default.root,
		"data-tool": "web-search-ext",
		"data-state": model.state
	}, status !== null ? (0, react.createElement)("span", { className: row_module_default.visuallyHidden }, status) : null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
		rowClassName: row_module_default.row,
		leadingClassName: row_module_default.leading,
		titleClassName: row_module_default.title,
		chevronClassName: row_module_default.chevron,
		icon: leadingFor(model.state),
		title: t("row.title"),
		open,
		expandable,
		expandOnRowClick: true,
		keepContentWhenOpen: true,
		onToggle: () => setExpanded((value) => !value),
		collapsedContent: [
			(0, react.createElement)("span", {
				key: "sep",
				className: row_module_default.sep,
				"aria-hidden": true
			}),
			(0, react.createElement)("span", {
				key: "summary",
				className: summaryClass
			}, summary),
			model.state === "running" ? (0, react.createElement)("span", {
				key: "running",
				className: row_module_default.runningSuffix
			}, model.startMs !== null ? `${t("row.searching")} ${formatDuration(elapsedMs)}` : t("row.searching")) : null
		]
	}, (0, react.createElement)("div", { className: row_module_default.bodyWrap }, (0, react.createElement)("div", { className: row_module_default.card }, model.provenance.length > 0 ? (0, react.createElement)("div", { className: row_module_default.provenance }, model.provenance.map((entry, i) => (0, react.createElement)("div", {
		key: i,
		className: row_module_default.provenanceEntry
	}, entry.query !== null ? (0, react.createElement)("div", { className: row_module_default.provenanceQuery }, entry.query) : null, (0, react.createElement)("div", { className: row_module_default.provenanceLine }, entry.receipt)))) : null, empty ? (0, react.createElement)("div", { className: row_module_default.emptyNote }, t("row.noResults")) : null, model.sources.length > 0 ? (0, react.createElement)("ul", { className: row_module_default.sources }, model.sources.map((source, i) => (0, react.createElement)("li", {
		key: `${source.url}:${i}`,
		className: row_module_default.source
	}, (0, react.createElement)("div", {
		className: row_module_default.sourceHead,
		onClick: () => setDrillIndex(drillIndex === i ? null : i)
	}, (0, react.createElement)("span", {
		className: row_module_default.sourceIndex,
		"aria-hidden": true
	}, String(i + 1)), source.badge !== null ? (0, react.createElement)("span", { className: `${row_module_default.badge} ${row_module_default[`badge_${source.badge.tone}`]}` }, source.badge.detail !== null ? `${source.badge.label} · ${source.badge.detail}` : source.badge.label) : null, isSafeHref(source.url) ? (0, react.createElement)("a", {
		className: row_module_default.sourceTitle,
		href: source.url,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (event) => event.stopPropagation()
	}, source.title !== null ? source.title : hostnameOf(source.url)) : (0, react.createElement)("span", {
		className: row_module_default.sourceTitle,
		"aria-disabled": "true"
	}, source.title !== null ? source.title : source.url), (0, react.createElement)("button", {
		type: "button",
		className: row_module_default.drillToggle,
		"aria-expanded": drillIndex === i,
		"aria-controls": `${block.callId ?? "websearch"}-drill-${i}`,
		"aria-label": t("row.drill.toggle"),
		onClick: (event) => {
			event.stopPropagation();
			setDrillIndex(drillIndex === i ? null : i);
		}
	}, "›")), drillIndex === i ? (0, react.createElement)("div", {
		id: `${block.callId ?? "websearch"}-drill-${i}`,
		className: row_module_default.drill
	}, [
		model.backends.length > 0 ? (0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.backend")), (0, react.createElement)("span", { className: row_module_default.drillValue }, model.backends.length > 1 ? `${model.backends.join(" · ")}${t("row.drill.merged")}` : model.backends[0])]) : null,
		(0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.published")), (0, react.createElement)("span", { className: row_module_default.drillValue }, source.publishedAt !== null && source.publishedAt !== "" ? source.publishedAt : t("row.drill.unknown"))]),
		(0, react.createElement)("div", { className: row_module_default.drillRow }, [(0, react.createElement)("span", { className: row_module_default.drillLabel }, t("row.drill.verification")), (0, react.createElement)("span", { className: `${row_module_default.drillValue}${source.badge !== null ? ` ${row_module_default[`drillValue_${source.badge.tone}`]}` : ""}` }, source.badge !== null ? `${source.badge.label}${source.badge.detail !== null ? ` · ${source.badge.detail}` : ""}` : t("row.drill.notVerified"))])
	]) : null, source.snippet !== "" ? (0, react.createElement)("div", { className: row_module_default.sourceSnippet }, source.snippet) : null, (0, react.createElement)("div", { className: row_module_default.sourceMeta }, [source.url, source.publishedAt].filter((part) => part !== null && part !== "").join(" · "))))) : null, model.truncated === true ? (0, react.createElement)("div", { className: row_module_default.truncatedNote }, t("row.truncated", { count: model.sources.length })) : null, model.answer !== null ? (0, react.createElement)("div", { className: row_module_default.answerText }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: model.answer })) : null, model.text !== null ? (0, react.createElement)("div", { className: model.state === "error" ? `${row_module_default.genericText} ${row_module_default.errorText}` : row_module_default.genericText }, model.text) : null), inspect !== void 0 ? (0, react.createElement)("button", {
		type: "button",
		className: row_module_default.inspectButton,
		onClick: inspect
	}, [(0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconInspectOutline12, {}), t("row.inspect")]) : null)));
}
//#endregion
//#region src/client/command.js
/**
* Primary command name and its fallback. The host's contribution registry
* rejects a duplicate name at register time (and a host-catalog collision
* fails loud at candidate synthesis), so registration tries the primary
* name first and falls back to the second — the card shows which one
* actually materialized.
*/
const COMMAND_PRIMARY = "search-engine";
const COMMAND_FALLBACK = "web-search-engine";
/**
* Key-state word for one API key ref.
* @param {{configured: boolean, source: string}} key - credentials.describe
*   projection (NO_KEY_STATE when the ref is absent).
* @param {boolean} keylessAllowed - whether the backend serves without a key
*   (exa: always — the anonymous MCP path; firecrawl: only when
*   firecrawlKeyless is on).
* @param {(key: string, params?: object) => string} t - bound translator.
* @returns {string} one of the closed cmd.keyed* / cmd.keyless words.
*/
function keyWord(key, keylessAllowed, t) {
	if (key !== null && key !== void 0 && key.configured === true) return key.source === "env" ? t("cmd.keyedEnv") : t("cmd.keyedFile");
	return keylessAllowed ? t("cmd.keyless") : t("cmd.keyMissing");
}
/**
* Status word for one health backends row (search provider): cooldown, last
* call outcome + age, or "never called". Closed vocabulary, locale-neutral
* on the wire, translated here.
* @param {{cooldownRemainingMs: number, lastCallAt: number | null, lastOk: boolean | null} | null} backend
* @param {(key: string, params?: object) => string} t
* @returns {string}
*/
function backendStatusWord(backend, t) {
	if (backend === null || backend === void 0) return t("cmd.never");
	if (typeof backend.cooldownRemainingMs === "number" && backend.cooldownRemainingMs > 0) return t("cmd.cooldown", { time: formatDuration(backend.cooldownRemainingMs) });
	if (typeof backend.lastCallAt !== "number" || !Number.isFinite(backend.lastCallAt)) return t("cmd.never");
	return backend.lastOk === true ? t("cmd.lastOk", { time: ageOf(backend.lastCallAt) }) : t("cmd.lastFail", { time: ageOf(backend.lastCallAt) });
}
/**
* One-line probe summary for the "Test connectivity" row: "last test {age}
* ago: {codes}" where codes join the stored probe's per-backend CLOSED
* detail codes through the existing probe.* keys (locale parity with the
* Health tab).
* @param {{at: number, backends: Array<{label: string, detail: string}>} | null} probe
* @param {(key: string, params?: object) => string} t
* @returns {string}
*/
function probeWord(probe, t) {
	if (probe === null || probe === void 0) return t("cmd.neverTested");
	const codes = (Array.isArray(probe.backends) ? probe.backends : []).filter((b) => b !== null && typeof b === "object" && typeof b.detail === "string").map((b) => `${typeof b.label === "string" && b.label !== "" ? b.label : b.name} ${t(`probe.${b.detail}`)}`).join(" · ");
	return codes === "" ? t("cmd.neverTested") : t("cmd.testLast", {
		age: ageOf(probe.at),
		codes
	});
}
/**
* Build the popupSelect options for the /search-engine command.
* @param {object} args
* @param {(key: string, params?: object) => string} args.t - bound translator.
* @param {"exa" | "firecrawl"} args.preferred - effective preferred backend
*   (the merged settings value, schema default "exa" when unset).
* @param {{configured: boolean, source: string} | null} args.exaKey
* @param {{configured: boolean, source: string} | null} args.fcKey
* @param {boolean} args.fcKeyless - effective firecrawlKeyless setting.
* @param {{backends?: Array<object>, probe?: object | null} | null} args.health -
*   parseHealth output for the live payload, or null when the health route
*   is unavailable (degrade: status words fall back to "never called").
* @returns {Array<{id: string, label: string, detail: string, active?: boolean}>}
*   Two "prefer <backend>" rows (the active one marked) + one test row.
*/
function commandOptions({ t, preferred, exaKey, fcKey, fcKeyless, health }) {
	const searchBackends = Array.isArray(health?.backends) ? health.backends : [];
	const exa = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "exa") ?? null;
	const fc = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "firecrawl") ?? null;
	return [
		{
			id: "exa",
			label: t("cmd.preferExa"),
			detail: `${keyWord(exaKey, true, t)} · ${backendStatusWord(exa, t)}`,
			active: preferred === "exa"
		},
		{
			id: "firecrawl",
			label: t("cmd.preferFirecrawl"),
			detail: `${keyWord(fcKey, fcKeyless === true, t)} · ${backendStatusWord(fc, t)}`,
			active: preferred === "firecrawl"
		},
		{
			id: "test",
			label: t("cmd.test"),
			detail: probeWord(health?.probe ?? null, t)
		}
	];
}
//#endregion
//#region src/client/settings-model.js
/** The closed set of host-accepted verification tiers, in card display order. */
const VERIFY_LEVELS = Object.freeze([
	"off",
	"liveness",
	"content"
]);
/** The host schema's default tier (lib/index.js Config schema). */
const VERIFY_LEVEL_DEFAULT = "liveness";
/**
* The tier the settings-card select should display for a stored value:
* one of the three schema tiers, or the schema default when the value is
* unset or unrecognized. A hand-edited settings.yaml may hold anything;
* the host would reject a write of an unrecognized tier, so the card
* normalizes it to the default instead of echoing it back.
* @param {unknown} stored - raw document value (undefined when unset).
* @returns {"off" | "liveness" | "content"}
*/
function effectiveVerifyLevel(stored) {
	return VERIFY_LEVELS.includes(stored) ? stored : VERIFY_LEVEL_DEFAULT;
}
//#endregion
//#region src/client/card.module.css
var card_module_default = {
	"badge": "card-module__badge",
	"badgeMuted": "card-module__badgeMuted",
	"badges": "card-module__badges",
	"body": "card-module__body",
	"card": "card-module__card",
	"cardOpen": "card-module__cardOpen",
	"check": "card-module__check",
	"chevron": "card-module__chevron",
	"chevronOpen": "card-module__chevronOpen",
	"description": "card-module__description",
	"discard": "card-module__discard",
	"failed": "card-module__failed",
	"field": "card-module__field",
	"footer": "card-module__footer",
	"head": "card-module__head",
	"header": "card-module__header",
	"headText": "card-module__headText",
	"health": "card-module__health",
	"healthLabel": "card-module__healthLabel",
	"healthRow": "card-module__healthRow",
	"healthSection": "card-module__healthSection",
	"healthSectionHead": "card-module__healthSectionHead",
	"healthSectionTitle": "card-module__healthSectionTitle",
	"healthValue": "card-module__healthValue",
	"hint": "card-module__hint",
	"input": "card-module__input",
	"label": "card-module__label",
	"name": "card-module__name",
	"pending": "card-module__pending",
	"save": "card-module__save",
	"settingsPane": "card-module__settingsPane",
	"spin": "card-module__spin",
	"tab": "card-module__tab",
	"tabActive": "card-module__tabActive",
	"tabs": "card-module__tabs",
	"wsx-rot": "card-module__wsx-rot"
};
//#endregion
//#region src/client/index.js
const NS = "web-search-ext";
const EXA_REF = "EXA_API_KEY";
const FC_REF = "FIRECRAWL_API_KEY";
const NUMERIC = [
	"numResults",
	"maxSnippetChars",
	"rateLimitCooldownSec"
];
const FIELDS = [
	"preferred",
	"verifyLevel",
	...NUMERIC,
	"firecrawlKeyless"
];
const inject = [
	"slots",
	"locale",
	"connection",
	"settingsScope",
	"remote",
	"commandUi"
];
const NO_KEY_STATE = {
	configured: false,
	writable: true,
	source: ""
};
let commandRegistration = {
	name: null,
	fallback: false,
	unavailable: true
};
/** Defensively read whatever shape the derived scope exposes. */
function readScope(scope) {
	try {
		if (scope && typeof scope.getSnapshot === "function") return scope.getSnapshot();
		if (scope && typeof scope.snapshot === "function") return scope.snapshot();
		if (scope && typeof scope === "object") return scope;
	} catch (err) {
		return { __error: String(err && err.message || err) };
	}
	return null;
}
function effectiveValue(snap, field) {
	return snap && snap.value ? snap.value[field] : void 0;
}
function initialDraft(snap) {
	return {
		preferred: effectiveValue(snap, "preferred"),
		verifyLevel: effectiveVerifyLevel(effectiveValue(snap, "verifyLevel")),
		numResults: effectiveValue(snap, "numResults"),
		maxSnippetChars: effectiveValue(snap, "maxSnippetChars"),
		rateLimitCooldownSec: effectiveValue(snap, "rateLimitCooldownSec"),
		firecrawlKeyless: effectiveValue(snap, "firecrawlKeyless")
	};
}
/**
* Per-ref credentials state. describe({refs}) returns, per ref, which layer
* supplies the key and whether that layer accepts writes; a missing/failed
* response degrades to "unconfigured but writable" (the safe default: the
* input stays editable and a failed write reports itself on save).
*/
function keyStateFrom(res) {
	const c = res && res.credentials || {};
	const one = (ref) => {
		const d = c[ref];
		if (!d || typeof d !== "object") return { ...NO_KEY_STATE };
		return {
			configured: !!d.configured,
			writable: d.writable !== false,
			source: d.source || ""
		};
	};
	return {
		exa: one(EXA_REF),
		fc: one(FC_REF)
	};
}
/** C3: settings-pane hint line — which slash-command name materialized (or none). */
function commandLineText(t) {
	if (commandRegistration.name === null) return t("cmd.lineUnavail");
	if (commandRegistration.fallback) return t("cmd.lineFallback", {
		name: COMMAND_FALLBACK,
		primary: COMMAND_PRIMARY
	});
	return t("cmd.line", { name: COMMAND_PRIMARY });
}
function WebSearchExtCard(props) {
	const { t, scope, api, remote } = props;
	const [open, setOpen] = (0, react.useState)(false);
	const [tab, setTab] = (0, react.useState)("settings");
	const [snap, setSnap] = (0, react.useState)(null);
	const [draft, setDraft] = (0, react.useState)(null);
	const [keyDraft, setKeyDraft] = (0, react.useState)({
		exa: "",
		fc: ""
	});
	const [keyState, setKeyState] = (0, react.useState)(() => keyStateFrom(null));
	const [status, setStatus] = (0, react.useState)({
		kind: "idle",
		msg: ""
	});
	const [dirty, setDirty] = (0, react.useState)(false);
	const dirtyRef = (0, react.useRef)(false);
	function markDirty(value) {
		dirtyRef.current = value;
		setDirty(value);
	}
	(0, react.useEffect)(() => {
		const s = readScope(scope);
		setSnap(s);
		setDraft(initialDraft(s));
		let off = null;
		try {
			off = scope.subscribe(() => {
				const next = readScope(scope);
				setSnap(next);
				if (!dirtyRef.current) setDraft(initialDraft(next));
			});
		} catch (err) {
			off = null;
		}
		Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).then((res) => setKeyState(keyStateFrom(res))).catch(() => {});
		return () => {
			if (typeof off === "function") try {
				off();
			} catch (err) {}
		};
	}, [scope, api]);
	(0, react.useEffect)(() => {
		let off = null;
		try {
			const r = remote && remote.$on ? remote.$on("credentials/reference-updated", (ref) => {
				if (ref !== EXA_REF && ref !== FC_REF) return;
				Promise.resolve().then(() => api.credentials.describe({ refs: [ref] })).then((res) => {
					const d = (res && res.credentials || {})[ref];
					setKeyState((prev) => {
						const st = d && typeof d === "object" ? {
							configured: !!d.configured,
							writable: d.writable !== false,
							source: d.source || ""
						} : { ...NO_KEY_STATE };
						return ref === EXA_REF ? {
							...prev,
							exa: st
						} : {
							...prev,
							fc: st
						};
					});
				}).catch(() => {});
			}) : null;
			off = typeof r === "function" ? r : null;
		} catch (err) {
			off = null;
		}
		return () => {
			if (off) try {
				off();
			} catch (err) {}
		};
	}, [remote, api]);
	function setField(field, value) {
		setDraft((d) => ({
			...d,
			[field]: value
		}));
		markDirty(true);
	}
	function setKey(kind, value) {
		setKeyDraft((k) => ({
			...k,
			[kind]: value
		}));
		markDirty(true);
	}
	async function save() {
		setStatus({
			kind: "saving",
			msg: ""
		});
		try {
			for (const field of FIELDS) {
				const value = draft[field];
				if (value === void 0) continue;
				const base = effectiveValue(snap, field);
				if (NUMERIC.includes(field)) {
					if (value === "") {
						await scope.unset(field);
						continue;
					}
					const n = Number(value);
					if (!Number.isFinite(n)) throw new Error(`${field}: not a number`);
					if (n === base) continue;
					await scope.set(field, n);
				} else {
					if (value === base) continue;
					await scope.set(field, value);
				}
			}
			if (keyDraft.exa.trim() && keyState.exa.writable !== false) await api.credentials.set({
				ref: EXA_REF,
				value: keyDraft.exa.trim()
			});
			if (keyDraft.fc.trim() && keyState.fc.writable !== false) await api.credentials.set({
				ref: FC_REF,
				value: keyDraft.fc.trim()
			});
			const c = await Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).catch(() => null);
			if (c && c.credentials) setKeyState(keyStateFrom(c));
			markDirty(false);
			setStatus({
				kind: "saved",
				msg: ""
			});
		} catch (err) {
			setStatus({
				kind: "error",
				msg: String(err && err.message || err)
			});
		}
	}
	function discard() {
		setDraft(initialDraft(snap));
		setKeyDraft({
			exa: "",
			fc: ""
		});
		setStatus({
			kind: "idle",
			msg: ""
		});
		markDirty(false);
	}
	const saving = status.kind === "saving";
	const busy = dirty || saving;
	const ro = snap === null ? false : snap.writable === false;
	function keyField(labelKey, ref, value, onChange, state) {
		const st = state && typeof state === "object" ? state : NO_KEY_STATE;
		const readOnly = st.configured && !st.writable;
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey)), (0, react.createElement)("span", { className: card_module_default.badges }, (0, react.createElement)("span", { className: st.configured ? card_module_default.badge : card_module_default.badgeMuted }, t(st.configured ? "keySet" : "keyUnset")))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type: "password",
			autoComplete: "off",
			disabled: ro || readOnly,
			placeholder: readOnly ? `${ref} · ${st.source || "env"}` : st.configured ? "" : ref,
			value,
			onChange: (e) => onChange(e.target.value)
		}), (0, react.createElement)("p", { className: card_module_default.hint }, t(readOnly ? "keyReadOnlyHint" : "keyHint")));
	}
	function textField(labelKey, field, type, min) {
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type,
			min,
			disabled: ro,
			value: draft ? String(draft[field] == null ? "" : draft[field]) : "",
			onChange: (e) => setField(field, e.target.value)
		}));
	}
	return (0, react.createElement)("div", { className: `${card_module_default.card}${open ? ` ${card_module_default.cardOpen}` : ""}` }, (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.header,
		"aria-expanded": open,
		onClick: () => setOpen((o) => !o)
	}, (0, react.createElement)("div", { className: card_module_default.headText }, (0, react.createElement)("div", { className: card_module_default.name }, t("title")), (0, react.createElement)("div", { className: card_module_default.description }, t("description"))), dirty && !saving ? (0, react.createElement)("span", { className: card_module_default.pending }, t("pending")) : null, (0, react.createElement)("span", { className: open ? `${card_module_default.chevron} ${card_module_default.chevronOpen}` : card_module_default.chevron }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 }))), open ? (0, react.createElement)("div", { className: card_module_default.body }, (0, react.createElement)("div", {
		className: card_module_default.tabs,
		role: "tablist"
	}, (0, react.createElement)("button", {
		type: "button",
		role: "tab",
		id: "dsw-websearch-tab-settings",
		"aria-controls": "dsw-websearch-panel-settings",
		className: tab === "settings" ? `${card_module_default.tab} ${card_module_default.tabActive}` : card_module_default.tab,
		"aria-selected": tab === "settings",
		onClick: () => setTab("settings")
	}, t("health.settings")), (0, react.createElement)("button", {
		type: "button",
		role: "tab",
		id: "dsw-websearch-tab-health",
		"aria-controls": "dsw-websearch-panel-health",
		className: tab === "health" ? `${card_module_default.tab} ${card_module_default.tabActive}` : card_module_default.tab,
		"aria-selected": tab === "health",
		onClick: () => setTab("health")
	}, t("health.tab"))), tab === "settings" ? (0, react.createElement)("div", {
		className: card_module_default.settingsPane,
		role: "tabpanel",
		id: "dsw-websearch-panel-settings"
	}, (0, react.createElement)("p", { className: card_module_default.hint }, commandLineText(t)), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("preferred"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: String(draft?.preferred ?? "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("verifyLevel"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: effectiveVerifyLevel(draft?.verifyLevel),
		onChange: (e) => setField("verifyLevel", e.target.value)
	}, ...VERIFY_LEVELS.map((level) => (0, react.createElement)("option", { value: level }, level))), (0, react.createElement)("p", { className: card_module_default.hint }, t("verifyLevelHint"))), textField("numResults", "numResults", "number", "1"), textField("maxSnippetChars", "maxSnippetChars", "number", "1"), textField("cooldown", "rateLimitCooldownSec", "number", "0"), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("keyless")), (0, react.createElement)("input", {
		type: "checkbox",
		className: card_module_default.check,
		disabled: ro,
		checked: draft ? !!draft.firecrawlKeyless : true,
		onChange: (e) => setField("firecrawlKeyless", e.target.checked)
	}))), keyField("exaKey", EXA_REF, keyDraft.exa, (v) => setKey("exa", v), keyState.exa), keyField("firecrawlKey", FC_REF, keyDraft.fc, (v) => setKey("fc", v), keyState.fc), (0, react.createElement)("div", { className: card_module_default.footer }, status.kind === "error" ? (0, react.createElement)("p", { className: card_module_default.failed }, t("error"), " ", status.msg) : status.kind === "saved" ? (0, react.createElement)("p", {
		className: card_module_default.hint,
		style: {
			flex: 1,
			margin: 0
		}
	}, t("saved")) : null, (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.discard,
		disabled: !busy || saving || ro,
		onClick: discard
	}, t("discard")), (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.save,
		disabled: !busy || saving || ro,
		onClick: () => save()
	}, saving ? (0, react.createElement)("span", { style: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6
	} }, (0, react.createElement)("span", { className: card_module_default.spin }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, { size: 16 })), t("saving")) : t("save")))) : (0, react.createElement)(HealthTab, {
		t,
		panelId: "dsw-websearch-panel-health"
	})) : null);
}
let autoProbeFired = false;
/**
* Health tab (C2 + G3): fetches the session telemetry from the host's
* same-origin GET /web-search-ext/health route on mount and on refresh,
* and shows the connectivity probe result (POST /web-search-ext/probe on
* first open / on "Test now"). A fetch/parse failure surfaces as an
* explicit unavailable line with a retry — the tab never renders a
* silently empty state.
*/
function HealthTab({ t, panelId }) {
	const [state, setState] = (0, react.useState)({
		phase: "loading",
		data: null,
		error: ""
	});
	const [reload, setReload] = (0, react.useState)(0);
	const [probe, setProbe] = (0, react.useState)({
		testing: false,
		error: ""
	});
	const live = (0, react.useRef)(true);
	(0, react.useEffect)(() => {
		live.current = true;
		return () => {
			live.current = false;
		};
	}, []);
	(0, react.useEffect)(() => {
		let cancelled = false;
		setState({
			phase: "loading",
			data: null,
			error: ""
		});
		fetch(HEALTH_ROUTE, { headers: { accept: "application/json" } }).then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}).then((payload) => {
			if (cancelled) return;
			const model = parseHealth(payload);
			if (model === null) throw new Error("unparsable payload");
			setState({
				phase: "ready",
				data: model,
				error: ""
			});
			if (model.probe === null && !autoProbeFired) {
				autoProbeFired = true;
				runProbe();
			}
		}).catch((err) => {
			if (cancelled) return;
			setState({
				phase: "error",
				data: null,
				error: String(err && err.message || err)
			});
		});
		return () => {
			cancelled = true;
		};
	}, [reload]);
	function refreshButton() {
		return (0, react.createElement)("button", {
			type: "button",
			className: card_module_default.discard,
			onClick: () => setReload((n) => n + 1)
		}, t("health.refresh"));
	}
	function runProbe() {
		setProbe((p) => ({
			...p,
			testing: true,
			error: ""
		}));
		fetch(PROBE_ROUTE, {
			method: "POST",
			headers: { accept: "application/json" }
		}).then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}).then((payload) => {
			if (!live.current) return;
			const model = parseHealth(payload);
			if (model === null) throw new Error("unparsable payload");
			setState((s) => s.phase === "error" ? {
				phase: "ready",
				data: model,
				error: ""
			} : {
				...s,
				data: model
			});
			setProbe({
				testing: false,
				error: ""
			});
		}).catch((err) => {
			if (!live.current) return;
			setProbe({
				testing: false,
				error: String(err && err.message || err)
			});
		});
	}
	function testButton() {
		return (0, react.createElement)("button", {
			type: "button",
			className: card_module_default.discard,
			disabled: probe.testing,
			onClick: () => runProbe()
		}, probe.testing ? t("health.connectivity.testing") : t("health.connectivity.test"));
	}
	function section(title, headExtra, ...rows) {
		return (0, react.createElement)("div", { className: card_module_default.healthSection }, (0, react.createElement)("div", { className: card_module_default.healthSectionHead }, (0, react.createElement)("div", { className: card_module_default.healthSectionTitle }, title), headExtra), ...rows);
	}
	function row(label, value) {
		return (0, react.createElement)("div", { className: card_module_default.healthRow }, (0, react.createElement)("div", { className: card_module_default.healthLabel }, label), (0, react.createElement)("div", { className: card_module_default.healthValue }, value));
	}
	function valueRow(value) {
		return (0, react.createElement)("div", { className: card_module_default.healthRow }, (0, react.createElement)("div", { className: card_module_default.healthValue }, value));
	}
	if (state.phase === "loading") return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, (0, react.createElement)("p", { className: card_module_default.hint }, t("health.loading")));
	if (state.phase === "error") return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, (0, react.createElement)("p", { className: card_module_default.failed }, t("health.error"), " ", state.error), (0, react.createElement)("div", { className: card_module_default.healthSectionHead }, refreshButton()));
	const data = state.data;
	const now = Date.now();
	const searchRows = data.backends.filter((b) => b.provider === "search");
	const fetchRows = data.backends.filter((b) => b.provider === "fetch");
	const cooled = data.backends.filter((b) => b.cooldownRemainingMs > 0);
	function backendLine(b) {
		const counts = `${b.ok} ${t("health.ok")} · ${b.failed} ${t("health.failed")}`;
		if (b.lastCallAt === null) return `${counts} · ${t("health.never")}`;
		const age = ageOf(b.lastCallAt, now);
		const stateWord = b.lastOk ? t("health.ok") : t("health.failed");
		const ms = b.lastCallMs === null ? "" : ` · ${b.lastCallMs}ms`;
		return `${counts} · ${t("health.last")} ${age} ${stateWord}${ms}`;
	}
	function backendSection(provider, rows) {
		if (rows.length === 0) return null;
		return section(provider, null, ...rows.map((b) => row(b.label, backendLine(b))));
	}
	const sessionLine = [
		`${t("health.uptime")} ${formatDuration(data.uptimeMs)}`,
		t("health.searches", { count: data.searchCalls }),
		t("health.fetches", { count: data.fetchCalls }),
		...data.resultsReturned === null ? [] : [t("health.results", { count: data.resultsReturned })]
	].join(" · ");
	const cooldownRows = cooled.length === 0 ? [valueRow(t("health.none"))] : cooled.map((b) => row(b.label, t("health.remaining", { count: Math.ceil(b.cooldownRemainingMs / 1e3) })));
	const probeData = data.probe;
	function probeLine(b) {
		return `${b.status === "ok" ? "✓" : b.status === "disabled" ? "−" : "✗"} ${t(`probe.${b.detail}`)}${b.status === "disabled" ? "" : ` · ${b.ms}ms`}`;
	}
	const probeRows = probeData === null ? [valueRow(probe.testing ? t("health.connectivity.testing") : t("health.connectivity.none"))] : [valueRow(t("health.connectivity.last", { age: ageOf(probeData.at, now) })), ...probeData.backends.map((b) => row(b.label, probeLine(b)))];
	return (0, react.createElement)("div", {
		className: card_module_default.health,
		role: "tabpanel",
		id: panelId
	}, section(t("health.connectivity"), testButton(), ...probeRows), probe.error !== "" ? (0, react.createElement)("p", { className: card_module_default.failed }, t("health.connectivity.error"), " ", probe.error) : null, section(t("health.session"), refreshButton(), valueRow(sessionLine)), data.backends.length === 0 ? (0, react.createElement)("p", { className: card_module_default.hint }, t("health.noActivity")) : null, backendSection("search", searchRows), backendSection("fetch", fetchRows), section(t("health.cooldowns"), null, ...cooldownRows));
}
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "web-search-ext: dictionaries");
	const t = ctx.locale.bind(NS);
	const scope = ctx.settingsScope.bind({ namespace: NS });
	const api = ctx.get("connection").api;
	const remote = ctx.get("remote");
	if (ctx.commandUi && typeof ctx.commandUi.register === "function") {
		const value = () => {
			const snap = readScope(scope);
			return snap && snap.value && typeof snap.value === "object" ? snap.value : {};
		};
		const contribution = {
			name: COMMAND_PRIMARY,
			description: t("cmd.description"),
			available: () => true,
			ui: {
				kind: "popupSelect",
				options: async (_session, signal) => {
					const [healthPayload, keyRes] = await Promise.all([fetch(HEALTH_ROUTE, {
						headers: { accept: "application/json" },
						signal
					}).then((res) => res.ok ? res.json() : null).catch(() => null), Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).catch(() => null)]);
					const v = value();
					return commandOptions({
						t,
						preferred: typeof v.preferred === "string" ? v.preferred : "exa",
						exaKey: keyStateFrom(keyRes).exa,
						fcKey: keyStateFrom(keyRes).fc,
						fcKeyless: v.firecrawlKeyless !== false,
						health: parseHealth(healthPayload)
					});
				},
				onSelect: async (option) => {
					if (option.id === "exa" || option.id === "firecrawl") {
						if (value().preferred === option.id) return;
						await scope.set("preferred", option.id);
						return;
					}
					if (option.id === "test") {
						const res = await fetch(PROBE_ROUTE, {
							method: "POST",
							headers: { accept: "application/json" }
						});
						if (!res.ok) throw new Error(t("cmd.testFailed", { status: res.status }));
					}
				}
			}
		};
		try {
			ctx.effect(() => ctx.commandUi.register(contribution), "web-search-ext: /search-engine command");
			commandRegistration = {
				name: COMMAND_PRIMARY,
				fallback: false,
				unavailable: false
			};
		} catch {
			try {
				ctx.effect(() => ctx.commandUi.register({
					...contribution,
					name: COMMAND_FALLBACK
				}), "web-search-ext: /web-search-engine command (fallback)");
				commandRegistration = {
					name: COMMAND_FALLBACK,
					fallback: true,
					unavailable: false
				};
			} catch {
				commandRegistration = {
					name: null,
					fallback: false,
					unavailable: true
				};
			}
		}
	} else commandRegistration = {
		name: null,
		fallback: false,
		unavailable: true
	};
	ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
		name: "settings.plugin.item",
		key: NS,
		locale: NS,
		inject: () => ({
			t,
			scope,
			api,
			remote
		})
	}, WebSearchExtCard));
	ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
		name: "tool.call.toolview",
		key: "web_search",
		locale: NS
	}, WebSearchRow));
}
const name = "web-search-ext";
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

	return module.exports;
}
});
} catch (wsxErr) {
if (!String((wsxErr && wsxErr.message) || wsxErr).includes("duplicate factory registration")) throw wsxErr;
}
