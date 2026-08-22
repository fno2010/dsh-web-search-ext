try {
window.__ModuleLoader__.load({ id: "dsh-web-search-ext", factory: (require) => {
	var module = { exports: {} };
	var exports = module.exports;
const wsxCss = ".card-module__card {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  border-radius: 12px;\n  list-style: none;\n  transition: border-color .16s, background .16s;\n}\n\n.card-module__card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__header {\n  appearance: none;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 12px;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  display: flex;\n}\n\n.card-module__header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n.card-module__headText {\n  flex-direction: column;\n  flex: 1;\n  gap: 4px;\n  min-width: 0;\n  display: flex;\n}\n\n.card-module__name {\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.card-module__description {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__chevron {\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  transition: transform .16s;\n  display: inline-flex;\n}\n\n.card-module__chevronOpen {\n  transform: rotate(180deg);\n}\n\n.card-module__body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n.card-module__field {\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n  display: flex;\n}\n\n.card-module__field + .card-module__field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.card-module__head {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__label {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  flex: 1;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n}\n\n.card-module__badges {\n  align-items: center;\n  gap: 8px;\n  display: inline-flex;\n}\n\n.card-module__badge {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__badgeMuted {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.card-module__pending {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__input {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  height: 34px;\n  font: inherit;\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 0 12px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__input:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n.card-module__input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n.card-module__hint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__check {\n  width: 14px;\n  height: 14px;\n  accent-color: var(--dsw-alias-brand-primary);\n}\n\n.card-module__footer {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 0 4px;\n  display: flex;\n}\n\n.card-module__failed {\n  min-width: 0;\n  color: var(--dsw-alias-label-error);\n  flex: 1;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__discard, .card-module__save {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  border: 1px solid #0000;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__discard {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  background: none;\n}\n\n.card-module__discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n.card-module__discard:disabled, .card-module__save:disabled {\n  opacity: .4;\n  cursor: default;\n}\n\n.card-module__discard:focus-visible, .card-module__save:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__spin {\n  animation: .8s linear infinite card-module__wsx-rot;\n  display: inline-flex;\n}\n\n@keyframes card-module__wsx-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n";
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
	pending: "unsaved changes"
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
	keyReadOnlyHint: "由进程环境变量提供——只读；环境变量会遮蔽写入，宿主会拒绝 UI 写入。",
	save: "保存",
	discard: "放弃",
	saving: "保存中…",
	saved: "已保存。",
	error: "保存失败：",
	pending: "未保存的更改"
};
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
	"hint": "card-module__hint",
	"input": "card-module__input",
	"label": "card-module__label",
	"name": "card-module__name",
	"pending": "card-module__pending",
	"save": "card-module__save",
	"spin": "card-module__spin",
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
const NO_KEY_STATE = {
	configured: false,
	writable: true,
	source: ""
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
function WebSearchExtCard(props) {
	const { t, scope, api, remote } = props;
	const [open, setOpen] = (0, react.useState)(false);
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
	}, (0, react.createElement)("div", { className: card_module_default.headText }, (0, react.createElement)("div", { className: card_module_default.name }, t("title")), (0, react.createElement)("div", { className: card_module_default.description }, t("description"))), dirty && !saving ? (0, react.createElement)("span", { className: card_module_default.pending }, t("pending")) : null, (0, react.createElement)("span", { className: open ? `${card_module_default.chevron} ${card_module_default.chevronOpen}` : card_module_default.chevron }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 }))), open ? (0, react.createElement)("div", { className: card_module_default.body }, (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("preferred"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: String(draft?.preferred ?? "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), textField("numResults", "numResults", "number", "1"), textField("maxSnippetChars", "maxSnippetChars", "number", "1"), textField("cooldown", "rateLimitCooldownSec", "number", "0"), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("keyless")), (0, react.createElement)("input", {
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
	} }, (0, react.createElement)("span", { className: card_module_default.spin }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, { size: 16 })), t("saving")) : t("save")))) : null);
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
const wsxCss = ".card-module__card {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  border-radius: 12px;\n  list-style: none;\n  transition: border-color .16s, background .16s;\n}\n\n.card-module__card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__header {\n  appearance: none;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 12px;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  display: flex;\n}\n\n.card-module__header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n.card-module__headText {\n  flex-direction: column;\n  flex: 1;\n  gap: 4px;\n  min-width: 0;\n  display: flex;\n}\n\n.card-module__name {\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.card-module__description {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__chevron {\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  transition: transform .16s;\n  display: inline-flex;\n}\n\n.card-module__chevronOpen {\n  transform: rotate(180deg);\n}\n\n.card-module__body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n.card-module__field {\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n  display: flex;\n}\n\n.card-module__field + .card-module__field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.card-module__head {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.card-module__label {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  flex: 1;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n}\n\n.card-module__badges {\n  align-items: center;\n  gap: 8px;\n  display: inline-flex;\n}\n\n.card-module__badge {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__badgeMuted {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.card-module__pending {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.card-module__input {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  height: 34px;\n  font: inherit;\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 0 12px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__input:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n.card-module__input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n.card-module__hint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__check {\n  width: 14px;\n  height: 14px;\n  accent-color: var(--dsw-alias-brand-primary);\n}\n\n.card-module__footer {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 0 4px;\n  display: flex;\n}\n\n.card-module__failed {\n  min-width: 0;\n  color: var(--dsw-alias-label-error);\n  flex: 1;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.card-module__discard, .card-module__save {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  border: 1px solid #0000;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.card-module__discard {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  background: none;\n}\n\n.card-module__discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.card-module__save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n.card-module__discard:disabled, .card-module__save:disabled {\n  opacity: .4;\n  cursor: default;\n}\n\n.card-module__discard:focus-visible, .card-module__save:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n.card-module__spin {\n  animation: .8s linear infinite card-module__wsx-rot;\n  display: inline-flex;\n}\n\n@keyframes card-module__wsx-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n";
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
	pending: "unsaved changes"
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
	keyReadOnlyHint: "由进程环境变量提供——只读；环境变量会遮蔽写入，宿主会拒绝 UI 写入。",
	save: "保存",
	discard: "放弃",
	saving: "保存中…",
	saved: "已保存。",
	error: "保存失败：",
	pending: "未保存的更改"
};
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
	"hint": "card-module__hint",
	"input": "card-module__input",
	"label": "card-module__label",
	"name": "card-module__name",
	"pending": "card-module__pending",
	"save": "card-module__save",
	"spin": "card-module__spin",
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
const NO_KEY_STATE = {
	configured: false,
	writable: true,
	source: ""
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
function WebSearchExtCard(props) {
	const { t, scope, api, remote } = props;
	const [open, setOpen] = (0, react.useState)(false);
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
	}, (0, react.createElement)("div", { className: card_module_default.headText }, (0, react.createElement)("div", { className: card_module_default.name }, t("title")), (0, react.createElement)("div", { className: card_module_default.description }, t("description"))), dirty && !saving ? (0, react.createElement)("span", { className: card_module_default.pending }, t("pending")) : null, (0, react.createElement)("span", { className: open ? `${card_module_default.chevron} ${card_module_default.chevronOpen}` : card_module_default.chevron }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 }))), open ? (0, react.createElement)("div", { className: card_module_default.body }, (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("preferred"))), (0, react.createElement)("select", {
		className: card_module_default.input,
		disabled: ro,
		value: String(draft?.preferred ?? "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), textField("numResults", "numResults", "number", "1"), textField("maxSnippetChars", "maxSnippetChars", "number", "1"), textField("cooldown", "rateLimitCooldownSec", "number", "0"), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("keyless")), (0, react.createElement)("input", {
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
	} }, (0, react.createElement)("span", { className: card_module_default.spin }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, { size: 16 })), t("saving")) : t("save")))) : null);
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
