export const en = {
  title: "Web Search (ext)",
  description: "Multi-backend web_search provider: Exa + Firecrawl, automatic failover, per-backend 429 cooldowns.",
  preferred: "Preferred backend",
  numResults: "Default result count",
  maxSnippetChars: "Snippet length bound (chars)",
  cooldown: "429 cooldown (seconds, 0 disables)",
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

  // web_search toolview card (C1)
  "row.title": "Search",
  "row.running": "Searching the web…",
  "row.failed": "Search failed",
  "row.stopped": "Search stopped",
  "row.truncated": "Showing the first {count} sources. Refine the query for more.",
  "row.noResults": "No results found.",
  "row.inspect": "Inspect",

  // web_search toolview drill-down (C4)
  "row.drill.backend": "Backend",
  "row.drill.merged": " (merged across sub-queries)",
  "row.drill.published": "Published",
  "row.drill.toggle": "Expand details",
  "row.drill.unknown": "unknown",
  "row.drill.verification": "Verification",
  "row.drill.notVerified": "not verified"
};

export const zh = {
  title: "Web 搜索（ext）",
  description: "多后端 web_search 提供方：Exa + Firecrawl，自动故障切换，按后端 429 冷却。",
  preferred: "首选后端",
  numResults: "默认结果条数",
  maxSnippetChars: "摘要长度上限（字符）",
  cooldown: "429 冷却时长（秒，0 关闭）",
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

  // web_search toolview card (C1)
  "row.title": "搜索",
  "row.running": "正在搜索网页…",
  "row.failed": "搜索失败",
  "row.stopped": "搜索已中止",
  "row.truncated": "仅显示前 {count} 条来源。细化查询可获取更多。",
  "row.noResults": "未找到结果。",
  "row.inspect": "查看",

  // web_search toolview drill-down (C4)
  "row.drill.backend": "来源后端",
  "row.drill.merged": "（跨子查询合并）",
  "row.drill.published": "发布时间",
  "row.drill.toggle": "展开详情",
  "row.drill.unknown": "未知",
  "row.drill.verification": "校验状态",
  "row.drill.notVerified": "未校验"
};
