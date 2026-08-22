// Card CSS. Classes are namespaced with `wsx-` so they cannot collide with
// the shell. Colors use the shell's design-system alias variables (the same
// set the built-in settings cards use) so the card follows the active theme;
// each var() carries a light-theme fallback.
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
export function ensureStyle(doc) {
  if (doc.getElementById(ID)) return;
  const el = doc.createElement("style");
  el.id = ID;
  el.textContent = CSS;
  doc.head.appendChild(el);
}
