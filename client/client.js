window.__ModuleLoader__.load({ id: "dsh-web-search-ext", factory: (require) => {

	var module = { exports: {} };
	var exports = module.exports;
const css$0 = "._4TrM5a_card {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  border-radius: 12px;\n  list-style: none;\n  transition: border-color .16s, background .16s;\n}\n\n._4TrM5a_card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n._4TrM5a_cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n._4TrM5a_header {\n  appearance: none;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 12px;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  display: flex;\n}\n\n._4TrM5a_header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n._4TrM5a_headText {\n  flex-direction: column;\n  flex: 1;\n  gap: 4px;\n  min-width: 0;\n  display: flex;\n}\n\n._4TrM5a_name {\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n._4TrM5a_description {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n._4TrM5a_chevron {\n  color: var(--dsw-alias-label-tertiary);\n  flex: none;\n  transition: transform .16s;\n  display: inline-flex;\n}\n\n._4TrM5a_chevronOpen {\n  transform: rotate(180deg);\n}\n\n._4TrM5a_body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n._4TrM5a_field {\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n  display: flex;\n}\n\n._4TrM5a_field + ._4TrM5a_field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n._4TrM5a_head {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n._4TrM5a_label {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  flex: 1;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n}\n\n._4TrM5a_badges {\n  align-items: center;\n  gap: 8px;\n  display: inline-flex;\n}\n\n._4TrM5a_badge {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n._4TrM5a_badgeMuted {\n  white-space: nowrap;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n._4TrM5a_pending {\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n._4TrM5a_input {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  height: 34px;\n  font: inherit;\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 0 12px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n._4TrM5a_input:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n._4TrM5a_input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n._4TrM5a_hint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n._4TrM5a_check {\n  width: 14px;\n  height: 14px;\n  accent-color: var(--dsw-alias-brand-primary);\n}\n\n._4TrM5a_footer {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 0 4px;\n  display: flex;\n}\n\n._4TrM5a_failed {\n  min-width: 0;\n  color: var(--dsw-alias-label-error);\n  flex: 1;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n._4TrM5a_discard, ._4TrM5a_save {\n  appearance: none;\n  font: inherit;\n  cursor: pointer;\n  border: 1px solid #0000;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n._4TrM5a_discard {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-secondary);\n  background: none;\n}\n\n._4TrM5a_discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n._4TrM5a_save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n._4TrM5a_discard:disabled, ._4TrM5a_save:disabled {\n  opacity: .5;\n  cursor: default;\n}\n\n._4TrM5a_spin {\n  animation: .8s linear infinite _4TrM5a_wsx-rot;\n  display: inline-flex;\n}\n\n@keyframes _4TrM5a_wsx-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n";
const tagId$0 = "@fno2010/dsh-web-search-ext/card.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$0) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@fno2010/dsh-web-search-ext";
	tag.dataset.pluginCss = tagId$0;
	tag.textContent = css$0;
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
	"badge": "_4TrM5a_badge",
	"badgeMuted": "_4TrM5a_badgeMuted",
	"badges": "_4TrM5a_badges",
	"body": "_4TrM5a_body",
	"card": "_4TrM5a_card",
	"cardOpen": "_4TrM5a_cardOpen",
	"check": "_4TrM5a_check",
	"chevron": "_4TrM5a_chevron",
	"chevronOpen": "_4TrM5a_chevronOpen",
	"description": "_4TrM5a_description",
	"discard": "_4TrM5a_discard",
	"failed": "_4TrM5a_failed",
	"field": "_4TrM5a_field",
	"footer": "_4TrM5a_footer",
	"head": "_4TrM5a_head",
	"header": "_4TrM5a_header",
	"headText": "_4TrM5a_headText",
	"hint": "_4TrM5a_hint",
	"input": "_4TrM5a_input",
	"label": "_4TrM5a_label",
	"name": "_4TrM5a_name",
	"pending": "_4TrM5a_pending",
	"save": "_4TrM5a_save",
	"spin": "_4TrM5a_spin",
	"wsx-rot": "_4TrM5a_wsx-rot"
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
	const busy = dirty || saving;
	function keyField(labelKey, ref, value, onChange, configured) {
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey)), (0, react.createElement)("span", { className: card_module_default.badges }, (0, react.createElement)("span", { className: configured ? card_module_default.badge : card_module_default.badgeMuted }, t(configured ? "keySet" : "keyUnset")))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type: "password",
			autoComplete: "off",
			placeholder: ref,
			value,
			onChange: (e) => onChange(e.target.value)
		}), (0, react.createElement)("p", { className: card_module_default.hint }, t("keyHint")));
	}
	function textField(labelKey, field, type, min) {
		return (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t(labelKey))), (0, react.createElement)("input", {
			className: card_module_default.input,
			type,
			min,
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
		value: String(draft ? draft.preferred : "exa"),
		onChange: (e) => setField("preferred", e.target.value)
	}, (0, react.createElement)("option", { value: "exa" }, "exa"), (0, react.createElement)("option", { value: "firecrawl" }, "firecrawl"))), textField("numResults", "numResults", "number", "1"), textField("maxSnippetChars", "maxSnippetChars", "number", "1"), textField("cooldown", "rateLimitCooldownSec", "number", "0"), (0, react.createElement)("div", { className: card_module_default.field }, (0, react.createElement)("div", { className: card_module_default.head }, (0, react.createElement)("label", { className: card_module_default.label }, t("keyless")), (0, react.createElement)("input", {
		type: "checkbox",
		className: card_module_default.check,
		checked: draft ? !!draft.firecrawlKeyless : true,
		onChange: (e) => setField("firecrawlKeyless", e.target.checked)
	}))), keyField("exaKey", EXA_REF, keyDraft.exa, (v) => setKeyDraft((k) => ({
		...k,
		exa: v
	})), keyState.exa), keyField("firecrawlKey", FC_REF, keyDraft.fc, (v) => setKeyDraft((k) => ({
		...k,
		fc: v
	})), keyState.fc), (0, react.createElement)("div", { className: card_module_default.footer }, status.kind === "error" ? (0, react.createElement)("p", { className: card_module_default.failed }, t("error"), " ", status.msg) : status.kind === "saved" ? (0, react.createElement)("p", {
		className: card_module_default.hint,
		style: {
			flex: 1,
			margin: 0
		}
	}, t("saved")) : null, (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.discard,
		disabled: !busy || saving,
		onClick: discard
	}, t("discard")), (0, react.createElement)("button", {
		type: "button",
		className: card_module_default.save,
		disabled: !busy || saving,
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

//# sourceMappingURL=index.cjs.map
	return module.exports;
}
});

//# sourceMappingURL=client.js.map
