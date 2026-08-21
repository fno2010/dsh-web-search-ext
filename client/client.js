window.__ModuleLoader__.load({ id: "dsh-web-search-ext", factory: (require) => {

	var module = { exports: {} };
	var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
//#region src/client/locales.js
const en = {
	title: "Web Search (ext) — spike",
	hint: "Read-only spike: the values below are read live from the web-search-ext settings namespace."
};
const zh = {
	title: "Web 搜索（ext）— 探针",
	hint: "只读探针：以下数值实时读取自 web-search-ext 设置命名空间。"
};
//#endregion
//#region src/client/index.js
const NS = "web-search-ext";
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
function pick(snap, field) {
	if (!snap) return void 0;
	if (snap.value && typeof snap.value === "object" && field in snap.value) return snap.value[field];
	if (field in snap) return snap[field];
	if (snap.user && typeof snap.user === "object" && field in snap.user) return snap.user[field];
}
function WebSearchExtSpikeCard(props) {
	const { t, scope } = props;
	const snap = readScope(scope);
	const keys = snap && typeof snap === "object" && !snap.__error ? Object.keys(snap) : [];
	return (0, react.createElement)("div", { "data-wsx-spike": "1" }, (0, react.createElement)("h3", null, t("title")), (0, react.createElement)("p", null, t("hint")), (0, react.createElement)("dl", null, (0, react.createElement)("div", null, (0, react.createElement)("dt", null, "revision"), (0, react.createElement)("dd", null, String(pick(snap, "revision") ?? "?"))), (0, react.createElement)("div", null, (0, react.createElement)("dt", null, "preferred"), (0, react.createElement)("dd", null, String(pick(snap, "preferred") ?? "?"))), (0, react.createElement)("div", null, (0, react.createElement)("dt", null, "numResults"), (0, react.createElement)("dd", null, String(pick(snap, "numResults") ?? "?"))), (0, react.createElement)("div", null, (0, react.createElement)("dt", null, "snapshot keys"), (0, react.createElement)("dd", null, keys.join(", ") || "(none)"))));
}
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "web-search-ext: dictionaries");
	const t = ctx.locale.bind(NS);
	const scope = ctx.settingsScope.bind({ namespace: NS });
	ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
		name: "settings.plugin.item",
		key: NS,
		locale: NS,
		inject: () => ({
			t,
			scope
		})
	}, WebSearchExtSpikeCard));
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
