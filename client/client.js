window.__ModuleLoader__.load({ id: "dsh-web-search-ext", factory: (require) => {

	var module = { exports: {} };
	var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
//#region src/client/locales.js
const en = {
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
	save: "Save",
	discard: "Discard",
	saving: "Saving…",
	saved: "Saved.",
	error: "Save failed:"
};
const zh = {
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
	save: "保存",
	discard: "放弃",
	saving: "保存中…",
	saved: "已保存。",
	error: "保存失败："
};
//#endregion
//#region src/client/styles.js
const CSS = `
.wsx-card{background:var(--dsw-alias-bg-module-platform,#fff);border:1px solid var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.08));border-radius:12px;margin:0 0 12px}
.wsx-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;cursor:pointer}
.wsx-titles{min-width:0}
.wsx-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary,#1a1a1a)}
.wsx-desc{font-size:13px;color:var(--dsw-alias-label-tertiary,#9a9a9a);margin-top:2px}
.wsx-chevron{flex:none;width:9px;height:9px;border-right:1.5px solid var(--dsw-alias-label-secondary,#666);border-bottom:1.5px solid var(--dsw-alias-label-secondary,#666);transform:rotate(-45deg);transition:transform .15s;margin-top:3px}
.wsx-card.open .wsx-chevron{transform:rotate(45deg);margin-top:1px}
.wsx-body{padding:2px 16px 16px;border-top:1px solid var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
.wsx-field{margin:12px 0}
.wsx-labelrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
.wsx-label{font-size:13px;color:var(--dsw-alias-label-secondary,#555)}
.wsx-input,.wsx-select{width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;color:var(--dsw-alias-label-primary,#1a1a1a);background:transparent;border:1px solid var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.14));border-radius:8px}
.wsx-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,#9a9a9a);margin-top:4px}
.wsx-badge{font-size:11px;line-height:1;padding:3px 8px;border-radius:999px;border:1px solid var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.14));color:var(--dsw-alias-label-tertiary,#9a9a9a)}
.wsx-badge.set{color:var(--dsw-alias-state-business-primary,#16a34a);border-color:var(--dsw-alias-state-business-primary,#16a34a)}
.wsx-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-secondary,#555);cursor:pointer}
.wsx-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:14px}
.wsx-status{margin-right:auto;font-size:12px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}
.wsx-status.error{color:var(--dsw-alias-label-error,#d33)}
.wsx-btn{font-size:13px;padding:7px 14px;border-radius:8px;border:1px solid var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.16));background:transparent;color:var(--dsw-alias-label-primary,#1a1a1a);cursor:pointer}
.wsx-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.wsx-btn.primary{background:var(--dsw-alias-brand-primary,#3355ff);border-color:transparent;color:#fff}
.wsx-btn:disabled{opacity:.5;cursor:default}
`;
const ID = "wsx-card-css";
/** Inject the card CSS once (the shell owns no copy for third-party cards). */
function ensureStyle(doc) {
	if (doc.getElementById(ID)) return;
	const el = doc.createElement("style");
	el.id = ID;
	el.textContent = CSS;
	doc.head.appendChild(el);
}
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
	...NUMERIC,
	"firecrawlKeyless"
];
const inject = [
	"slots",
	"locale",
	"connection",
	"settingsScope",
	"remote"
];
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
function initialDraft(snap) {
	const v = snap && snap.value || {};
	return {
		preferred: v.preferred,
		numResults: v.numResults,
		maxSnippetChars: v.maxSnippetChars,
		rateLimitCooldownSec: v.rateLimitCooldownSec,
		firecrawlKeyless: v.firecrawlKeyless
	};
}
function WebSearchExtCard(props) {
	const { t, scope, api, remote } = props;
	const [open, setOpen] = (0, react.useState)(true);
	const [snap, setSnap] = (0, react.useState)(null);
	const [draft, setDraft] = (0, react.useState)(null);
	const [keyDraft, setKeyDraft] = (0, react.useState)({
		exa: "",
		fc: ""
	});
	const [keyState, setKeyState] = (0, react.useState)({
		exa: false,
		fc: false
	});
	const [status, setStatus] = (0, react.useState)({
		kind: "idle",
		msg: ""
	});
	const [dirty, setDirty] = (0, react.useState)(false);
	(0, react.useEffect)(() => {
		const s = readScope(scope);
		setSnap(s);
		setDraft(initialDraft(s));
		Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).then((res) => {
			const c = res && res.credentials || {};
			setKeyState({
				exa: !!(c[EXA_REF] && c[EXA_REF].configured),
				fc: !!(c[FC_REF] && c[FC_REF].configured)
			});
		}).catch(() => {});
	}, [scope, api]);
	(0, react.useEffect)(() => {
		let off = null;
		try {
			const r = remote && remote.$on ? remote.$on("credentials/reference-updated", (ref) => {
				if (ref !== EXA_REF && ref !== FC_REF) return;
				Promise.resolve().then(() => api.credentials.describe({ refs: [ref] })).then((res) => {
					const c = res && res.credentials || {};
					const configured = !!(c[ref] && c[ref].configured);
					setKeyState((prev) => ref === EXA_REF ? {
						...prev,
						exa: configured
					} : {
						...prev,
						fc: configured
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
		setDirty(true);
	}
	async function save() {
		setStatus({
			kind: "saving",
			msg: ""
		});
		try {
			for (const field of FIELDS) {
				const value = draft[field];
				const base = snap && snap.value ? snap.value[field] : void 0;
				if (value === void 0 || value === base) continue;
				let toWrite = value;
				if (NUMERIC.includes(field)) {
					toWrite = Number(value);
					if (!Number.isFinite(toWrite)) throw new Error(`${field}: not a number`);
				}
				if (toWrite === "") await scope.unset(field);
				else await scope.set(field, toWrite);
			}
			if (keyDraft.exa.trim()) await api.credentials.set({
				ref: EXA_REF,
				value: keyDraft.exa.trim()
			});
			if (keyDraft.fc.trim()) await api.credentials.set({
				ref: FC_REF,
				value: keyDraft.fc.trim()
			});
			const c = await Promise.resolve().then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] })).catch(() => null);
			if (c && c.credentials) setKeyState({
				exa: !!(c.credentials[EXA_REF] && c.credentials[EXA_REF].configured),
				fc: !!(c.credentials[FC_REF] && c.credentials[FC_REF].configured)
			});
			setStatus({
				kind: "saved",
				msg: ""
			});
			setDirty(false);
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
		setDirty(false);
	}
	const saving = status.kind === "saving";
	return (0, react.createElement)("div", { className: `wsx-card${open ? " open" : ""}` }, (0, react.createElement)("div", {
		className: "wsx-head",
		role: "button",
		"aria-expanded": open,
		onClick: () => setOpen((o) => !o)
	}, (0, react.createElement)("div", { className: "wsx-titles" }, (0, react.createElement)("div", { className: "wsx-title" }, t("title")), (0, react.createElement)("div", { className: "wsx-desc" }, t("description"))), (0, react.createElement)("span", { className: "wsx-chevron" })), open ? (0, react.createElement)("div", { className: "wsx-body" }, (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("preferred"))), (0, react.createElement)("select", {
		className: "wsx-select",
		value: String(draft ? draft.preferred : "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("numResults"))), (0, react.createElement)("input", {
		className: "wsx-input",
		type: "number",
		min: "1",
		value: draft ? String(draft.numResults) : "",
		onChange: (e) => setField("numResults", e.target.value)
	})), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("maxSnippetChars"))), (0, react.createElement)("input", {
		className: "wsx-input",
		type: "number",
		min: "1",
		value: draft ? String(draft.maxSnippetChars) : "",
		onChange: (e) => setField("maxSnippetChars", e.target.value)
	})), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("cooldown"))), (0, react.createElement)("input", {
		className: "wsx-input",
		type: "number",
		min: "0",
		value: draft ? String(draft.rateLimitCooldownSec) : "",
		onChange: (e) => setField("rateLimitCooldownSec", e.target.value)
	})), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("label", { className: "wsx-check" }, (0, react.createElement)("input", {
		type: "checkbox",
		checked: draft ? !!draft.firecrawlKeyless : true,
		onChange: (e) => setField("firecrawlKeyless", e.target.checked)
	}), t("keyless"))), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("exaKey")), (0, react.createElement)("span", { className: `wsx-badge${keyState.exa ? " set" : ""}` }, t(keyState.exa ? "keySet" : "keyUnset"))), (0, react.createElement)("input", {
		className: "wsx-input",
		type: "password",
		autoComplete: "off",
		placeholder: keyState.exa ? "" : EXA_REF,
		value: keyDraft.exa,
		onChange: (e) => setKeyDraft((k) => ({
			...k,
			exa: e.target.value
		}))
	}), (0, react.createElement)("div", { className: "wsx-hint" }, t("keyHint"))), (0, react.createElement)("div", { className: "wsx-field" }, (0, react.createElement)("div", { className: "wsx-labelrow" }, (0, react.createElement)("label", { className: "wsx-label" }, t("firecrawlKey")), (0, react.createElement)("span", { className: `wsx-badge${keyState.fc ? " set" : ""}` }, t(keyState.fc ? "keySet" : "keyUnset"))), (0, react.createElement)("input", {
		className: "wsx-input",
		type: "password",
		autoComplete: "off",
		placeholder: keyState.fc ? "" : FC_REF,
		value: keyDraft.fc,
		onChange: (e) => setKeyDraft((k) => ({
			...k,
			fc: e.target.value
		}))
	})), (0, react.createElement)("div", { className: "wsx-footer" }, (0, react.createElement)("span", { className: `wsx-status${status.kind === "error" ? " error" : ""}` }, status.kind === "saving" ? t("saving") : status.kind === "saved" ? t("saved") : status.kind === "error" ? (0, react.createElement)("span", null, t("error"), " ", status.msg) : ""), (0, react.createElement)("button", {
		className: "wsx-btn",
		disabled: saving || !dirty,
		onClick: discard
	}, t("discard")), (0, react.createElement)("button", {
		className: "wsx-btn primary",
		disabled: saving || !dirty,
		onClick: () => save()
	}, t("save")))) : null);
}
function apply(ctx) {
	try {
		ensureStyle(globalThis.document);
	} catch (err) {}
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "web-search-ext: dictionaries");
	const t = ctx.locale.bind(NS);
	const scope = ctx.settingsScope.bind({ namespace: NS });
	const api = ctx.get("connection").api;
	const remote = ctx.get("remote");
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
}
const name = () => "web-search-ext";
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

//# sourceMappingURL=index.cjs.map
	return module.exports;
}
});

//# sourceMappingURL=client.js.map
