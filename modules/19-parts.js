// ======================================================================
// 19-parts.js
// Repair parts: shared catalogue, on-item picker, and a manager window
// ======================================================================
//
// The catalogue and the stock count live on the server (api/parts.php), so
// the web app and the desktop suite always agree. Stock is only changed by
// saving a job - the server works out which parts the job uses - so nothing
// here ever decrements stock directly. That's what stops a part fitted from
// the phone being counted again when the job is opened on the laptop.
//
// The list is cached locally so the picker still works with no signal.

const PARTS_CACHE_KEY = "zoltanstudios-parts-cache-v1";

function cachedParts() {
  try {
    const raw = window.localStorage.getItem(PARTS_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function cacheParts(list) {
  try {
    window.localStorage.setItem(PARTS_CACHE_KEY, JSON.stringify(list || []));
  } catch (e) { /* storage full - the list is re-fetched next time anyway */ }
}

/** Parts that can be billed as fitted. Consumable kits are excluded. */
function fittableParts(list) {
  return (list || []).filter(p => p.active !== false && !p.consumable);
}

function partById(list, id) {
  if (!id) return null;
  return (list || []).find(p => p.id === id) || null;
}

/**
 * Calls parts.php using the same rule as the rest of the sync layer:
 * the admin session first (browser on the site), then the API token
 * (desktop / mobile shell, which runs on its own origin).
 */
async function partsFetch(path, opts) {
  const cfg = loadServerConfig();
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) throw new Error("No server configured.");
  const method = (opts && opts.method) || "GET";
  const body = opts && opts.body;

  const attempt = async useSession => {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (useSession) {
      if (method !== "GET") headers["X-CSRF-Token"] = await getCsrf(base);
    } else {
      if (!cfg.token) throw new Error("No API token configured.");
      headers["Authorization"] = "Bearer " + cfg.token;
    }
    const res = await fetch(base + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: useSession ? "include" : "omit",
      cache: "no-store"
    });
    const d = await res.json();
    if (!d || !d.ok) throw new Error(d && d.error || "The parts request failed.");
    return d.data;
  };

  if (cfg.session) {
    try {
      return await attempt(true);
    } catch (e) {
      if (!cfg.token) throw e;
    }
  }
  return await attempt(false);
}

/** Fetches the catalogue, falling back to the cached copy when offline. */
async function fetchParts() {
  try {
    const list = await partsFetch("/api/parts.php?action=list");
    if (Array.isArray(list)) {
      cacheParts(list);
      return list;
    }
  } catch (e) { /* offline or signed out - use the cache */ }
  return cachedParts();
}

async function savePartToServer(part) {
  const saved = await partsFetch("/api/parts.php?action=save", {
    method: "POST",
    body: part
  });
  const list = cachedParts().filter(p => p.id !== saved.id).concat([saved]);
  list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  cacheParts(list);
  return saved;
}

/** React hook: the catalogue, served from cache at once and refreshed in the background. */
function usePartsCatalogue() {
  const [parts, setParts] = React.useState(cachedParts);
  React.useEffect(() => {
    let alive = true;
    fetchParts().then(list => { if (alive) setParts(list); });
    return () => { alive = false; };
  }, []);
  return parts;
}

/** Sell price of the parts fitted across a job's items, for the estimate. */
function partsTotalFor(items, parts) {
  let total = 0;
  (items || []).forEach(i => {
    const p = partById(parts, i.partId);
    if (p && !p.consumable) total += Number(p.sell) || 0;
  });
  return total;
}

// ---------------------------------------------------------- item picker

function PartFittedSelect({ item, parts, onChange, inputCls }) {
  const options = fittableParts(parts);
  const current = partById(parts, item.partId);
  const low = current && current.onHand <= 0;

  return React.createElement("div", null,
    React.createElement("div", {
      className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
    }, "Part fitted"),
    React.createElement("select", {
      className: `${inputCls} py-1 text-xs`,
      value: item.partId || "",
      onChange: e => onChange(e.target.value)
    },
      React.createElement("option", { value: "" }, "(none)"),
      options.map(p => React.createElement("option", { key: p.id, value: p.id },
        p.name + " — $" + Number(p.sell).toFixed(2) + (p.onHand <= 0 ? "  (none in stock)" : "")))
    ),
    low && React.createElement("div", {
      className: "text-[10px] text-amber-700 mt-0.5"
    }, "None left in stock"),
    options.length === 0 && React.createElement("div", {
      className: "text-[10px] text-slate-400 mt-0.5"
    }, "Parts list not loaded yet")
  );
}

// ------------------------------------------------------- helpers for views

const PART_FIELDS = ["name", "sku", "cost", "sell", "onHand", "lowAt", "consumable", "active"];
const PARTS_MARKUP = 2.5; // matches the server: cost plus 250%

function suggestedSell(cost) {
  const c = Number(cost) || 0;
  return c > 0 ? Math.ceil(c * (1 + PARTS_MARKUP)) : 0;
}

function money(n) {
  return "$" + (Number(n) || 0).toFixed(2);
}

function partStatus(p) {
  if (p.active === false) return { key: "archived", label: "Archived", cls: "bg-slate-100 text-slate-500" };
  const on = Number(p.onHand) || 0;
  if (on <= 0) return { key: "out", label: "Out", cls: "bg-red-100 text-red-700" };
  if (on <= (Number(p.lowAt) || 0)) return { key: "low", label: "Low", cls: "bg-amber-100 text-amber-800" };
  return { key: "ok", label: "OK", cls: "bg-emerald-100 text-emerald-700" };
}

function restockText(list) {
  const lines = list.map(p =>
    (p.sku ? p.sku : "").padEnd(9) + p.name + "  —  " + (Number(p.onHand) || 0) + " left");
  return "Restock list — ZoltanStudios — " + new Date().toLocaleDateString("en-AU") + "\n\n" + lines.join("\n");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to the old method */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

// ------------------------------------------------------ main-page panel

/**
 * Stock at a glance on the job list, so running low is noticed before a job
 * rather than on site. Opens the full Parts screen.
 */
function PartsSummaryCard({ onOpen }) {
  const h = React.createElement;
  const parts = usePartsCatalogue();
  const active = parts.filter(p => p.active !== false);
  const billable = active.filter(p => !p.consumable);
  const kits = active.filter(p => p.consumable);
  const low = active.filter(p => ["low", "out"].includes(partStatus(p).key));
  const out = low.filter(p => partStatus(p).key === "out");

  return h("button", {
    type: "button",
    onClick: onOpen,
    className: "w-full text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-4 mb-4 transition-all group"
  },
    h("div", { className: "flex items-start gap-3" },
      h("div", {
        className: "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 " +
          (out.length ? "bg-red-50" : low.length ? "bg-amber-50" : "bg-slate-100")
      }, "\uD83D\uDD27"),
      h("div", { className: "flex-1 min-w-0" },
        h("div", { className: "flex items-center justify-between gap-2" },
          h("div", { className: "font-semibold text-slate-900" }, "Repair Parts"),
          h("span", { className: "text-xs font-semibold text-blue-600 group-hover:underline whitespace-nowrap" },
            "Open parts \u2192")),
        parts.length === 0
          ? h("div", { className: "text-xs text-slate-500 mt-0.5" },
              "Stock list not loaded yet \u2014 open to load it from the server.")
          : h(React.Fragment, null,
              h("div", { className: "text-xs text-slate-500 mt-0.5" },
                billable.length + " part" + (billable.length === 1 ? "" : "s") + " \u00B7 " +
                kits.length + " kit" + (kits.length === 1 ? "" : "s")),
              h("div", { className: "flex flex-wrap gap-1.5 mt-2" },
                low.length === 0
                  ? h("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700" },
                      "All stocked")
                  : h(React.Fragment, null,
                      out.length > 0 && h("span", {
                        className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
                      }, out.length + " out of stock"),
                      low.length - out.length > 0 && h("span", {
                        className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                      }, (low.length - out.length) + " running low"),
                      low.slice(0, 3).map(p => h("span", {
                        key: p.id,
                        className: "text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate max-w-[220px]"
                      }, p.name)),
                      low.length > 3 && h("span", { className: "text-xs text-slate-400 px-1" },
                        "+" + (low.length - 3) + " more")))))));
}

// --------------------------------------------------------- parts screen

function PartsView({ onBack }) {
  const h = React.createElement;
  const [parts, setParts] = React.useState(cachedParts);
  const [drafts, setDrafts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [offline, setOffline] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [note, setNote] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const blankNew = { name: "", sku: "", cost: "", sell: "", onHand: "1", lowAt: "2", consumable: false };
  const [fresh, setFresh] = React.useState(blankNew);

  const load = () => {
    setLoading(true);
    partsFetch("/api/parts.php?action=list")
      .then(list => { cacheParts(list); setParts(list); setOffline(false); })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  };
  React.useEffect(load, []);

  const flash = (kind, text) => {
    setNote({ kind: kind, text: text });
    if (kind === "ok") setTimeout(() => setNote(n => (n && n.text === text ? null : n)), 2500);
  };

  // ---- editing ------------------------------------------------------
  const current = p => drafts[p.id] || p;
  const edit = (p, patch) => setDrafts(d => Object.assign({}, d, { [p.id]: Object.assign({}, d[p.id] || p, patch) }));
  const isDirty = p => {
    const d = drafts[p.id];
    return !!d && PART_FIELDS.some(f => String(d[f]) !== String(p[f]));
  };
  const dirty = parts.filter(isDirty);
  const bump = (p, delta) => edit(p, { onHand: Math.max(0, (Number(current(p).onHand) || 0) + delta) });

  const bodyFor = (p, d) => {
    const body = {
      id: p.id,
      sku: String(d.sku || "").trim(),
      name: String(d.name || "").trim(),
      cost: Number(d.cost) || 0,
      sell: d.consumable ? 0 : (d.sell === "" || d.sell === null ? "" : Number(d.sell) || 0),
      lowAt: Math.max(0, Number(d.lowAt) || 0),
      active: d.active !== false,
      consumable: !!d.consumable
    };
    // Only send the count when it was changed here - a price edit must not
    // put back parts fitted from another device since this screen loaded.
    if (Number(d.onHand) !== Number(p.onHand)) body.onHand = Math.max(0, Number(d.onHand) || 0);
    return body;
  };

  const commit = saved => {
    setParts(list => list.map(x => (x.id === saved.id ? saved : x)));
    setDrafts(d => { const n = Object.assign({}, d); delete n[saved.id]; return n; });
  };

  const saveRow = async p => {
    const d = current(p);
    if (!String(d.name || "").trim()) { flash("err", "A part needs a name."); return; }
    setBusy(p.id);
    try {
      commit(await savePartToServer(bodyFor(p, d)));
      flash("ok", "Saved " + d.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  const saveAll = async () => {
    setBusy("all");
    let failed = 0;
    for (const p of dirty) {
      try { commit(await savePartToServer(bodyFor(p, current(p)))); } catch (e) { failed++; }
    }
    setBusy("");
    failed ? flash("err", failed + " change(s) couldn't be saved - check your connection.") : flash("ok", "All changes saved");
  };

  const setActive = async (p, active) => {
    setBusy(p.id);
    try {
      commit(await savePartToServer(Object.assign(bodyFor(p, p), { active: active })));
      flash("ok", (active ? "Restored " : "Archived ") + p.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  const addPart = async () => {
    if (!fresh.name.trim()) { flash("err", "Give the part a name."); return; }
    setBusy("add");
    try {
      const saved = await savePartToServer({
        name: fresh.name.trim(),
        sku: fresh.sku.trim(),
        cost: Number(fresh.cost) || 0,
        sell: fresh.consumable ? 0 : (fresh.sell === "" ? "" : Number(fresh.sell) || 0),
        onHand: Math.max(0, Number(fresh.onHand) || 0),
        lowAt: Math.max(0, Number(fresh.lowAt) || 0),
        consumable: fresh.consumable
      });
      setParts(list => list.concat([saved]).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      setFresh(blankNew);
      setShowAdd(false);
      flash("ok", "Added " + saved.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  // ---- figures ------------------------------------------------------
  const active = parts.filter(p => p.active !== false);
  const low = active.filter(p => ["low", "out"].includes(partStatus(p).key));
  const valueCost = active.reduce((s, p) => s + (Number(p.cost) || 0) * (Number(p.onHand) || 0), 0);
  const valueSell = active.filter(p => !p.consumable)
    .reduce((s, p) => s + (Number(p.sell) || 0) * (Number(p.onHand) || 0), 0);

  const q = query.trim().toLowerCase();
  const shown = (filter === "archived" ? parts.filter(p => p.active === false)
    : filter === "low" ? low
    : filter === "kits" ? active.filter(p => p.consumable)
    : active)
    .filter(p => !q || String(p.name).toLowerCase().includes(q) || String(p.sku || "").includes(q));

  const input = "w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400";
  const label = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  const chip = (key, text, count) => h("button", {
    key: key,
    type: "button",
    onClick: () => setFilter(key),
    className: "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors " +
      (filter === key ? "bg-slate-800 text-white border-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50")
  }, text + (count !== undefined ? " (" + count + ")" : ""));

  const tile = (value, text, tone) => h("div", {
    className: "bg-white border border-slate-200 rounded-xl px-4 py-3"
  },
    h("div", { className: "text-xl font-bold " + (tone || "text-slate-900") }, value),
    h("div", { className: "text-xs text-slate-500 mt-0.5" }, text));

  const stepper = (p, big) => {
    const d = current(p);
    const btn = "flex items-center justify-center font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors " +
      (big ? "w-11 h-11 text-xl rounded-lg" : "w-7 h-7 text-base rounded");
    return h("div", { className: "flex items-center gap-1.5" },
      h("button", { type: "button", onClick: () => bump(p, -1), className: btn, title: "One fewer" }, "\u2212"),
      h("input", {
        type: "number", min: 0, value: d.onHand,
        onChange: e => edit(p, { onHand: e.target.value }),
        className: "border border-slate-300 rounded-lg text-center font-semibold " + (big ? "w-16 h-11 text-lg" : "w-14 h-7 text-sm")
      }),
      h("button", { type: "button", onClick: () => bump(p, 1), className: btn, title: "One more" }, "+"));
  };

  const actions = p => h("div", { className: "flex items-center gap-2 justify-end" },
    isDirty(p) && h("button", {
      type: "button", onClick: () => saveRow(p), disabled: !!busy,
      className: "text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
    }, busy === p.id ? "Saving\u2026" : "Save"),
    p.active === false
      ? h("button", {
          type: "button", onClick: () => setActive(p, true), disabled: !!busy,
          className: "text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
        }, "Restore")
      : !isDirty(p) && h("button", {
          type: "button", onClick: () => setActive(p, false), disabled: !!busy,
          title: "Hide from the picker without losing its history",
          className: "text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        }, "Archive"));

  return h("div", { className: "max-w-6xl mx-auto p-4 md:p-8 pb-28" },

    // ---- header
    h("button", {
      type: "button", onClick: onBack,
      className: "inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-4"
    }, h(ArrowLeft, { size: 16 }), " Back to jobs"),

    h("div", { className: "flex flex-wrap items-start justify-between gap-3 mb-5" },
      h("div", null,
        h("h1", { className: "text-2xl font-bold text-slate-900" }, "Repair Parts"),
        h("p", { className: "text-sm text-slate-500 mt-1" },
          "Van stock for on-site repairs. Shared with the desktop app \u2014 stock comes off when a job is saved.")),
      h("button", {
        type: "button", onClick: () => setShowAdd(v => !v),
        className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm"
      }, h(Plus, { size: 18 }), showAdd ? " Close" : " Add part")),

    // ---- messages
    note && h("div", {
      className: "text-sm rounded-lg px-4 py-2.5 mb-4 border " +
        (note.kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")
    }, note.text),
    offline && h("div", {
      className: "text-sm rounded-lg px-4 py-2.5 mb-4 border bg-amber-50 border-amber-200 text-amber-900 flex items-center justify-between gap-3"
    },
      h("span", null, "Couldn't reach the server \u2014 showing the last saved copy. Changes need a connection."),
      h("button", { type: "button", onClick: load, className: "text-xs font-semibold underline whitespace-nowrap" }, "Try again")),

    // ---- add form
    showAdd && h("div", { className: "bg-white border border-slate-200 rounded-xl p-4 md:p-5 mb-5" },
      h("div", { className: "font-semibold text-slate-900 mb-3" }, "New part"),
      h("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-3" },
        h("div", { className: "col-span-2" },
          h("label", { className: label }, "Name"),
          h("input", { className: input, value: fresh.name, placeholder: "e.g. DETA 10A Plug Top - Black",
            onChange: e => setFresh(Object.assign({}, fresh, { name: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Bunnings I/N"),
          h("input", { className: input, value: fresh.sku, placeholder: "4330985",
            onChange: e => setFresh(Object.assign({}, fresh, { sku: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Cost"),
          h("input", { className: input, type: "number", step: "0.01", value: fresh.cost, placeholder: "0.00",
            onChange: e => setFresh(Object.assign({}, fresh, { cost: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Sell"),
          h("input", { className: input, type: "number", step: "0.01", value: fresh.sell,
            disabled: fresh.consumable,
            placeholder: fresh.consumable ? "not billed" : "auto " + money(suggestedSell(fresh.cost)),
            onChange: e => setFresh(Object.assign({}, fresh, { sell: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "In stock"),
          h("input", { className: input, type: "number", min: 0, value: fresh.onHand,
            onChange: e => setFresh(Object.assign({}, fresh, { onHand: e.target.value })) }))),
      h("div", { className: "flex flex-wrap items-center justify-between gap-3 mt-3" },
        h("label", { className: "flex items-center gap-2 text-sm text-slate-600" },
          h("input", { type: "checkbox", checked: fresh.consumable,
            onChange: e => setFresh(Object.assign({}, fresh, { consumable: e.target.checked })) }),
          "Consumable kit (heatshrink, crimp terminals) \u2014 tracked, never billed per fit"),
        h("button", {
          type: "button", onClick: addPart, disabled: busy === "add",
          className: "bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        }, busy === "add" ? "Adding\u2026" : "Add part"))),

    // ---- figures
    h("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" },
      tile(active.filter(p => !p.consumable).length, "Parts carried"),
      tile(low.length, "Need restocking", low.length ? "text-amber-600" : "text-slate-900"),
      tile(money(valueCost), "Stock value at cost"),
      tile(money(valueSell), "Stock value at sell")),

    // ---- restock
    low.length > 0 && h("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-2" },
        h("div", { className: "font-semibold text-amber-900" },
          "Restock list \u2014 " + low.length + " item" + (low.length === 1 ? "" : "s")),
        h("button", {
          type: "button",
          onClick: async () => {
            const ok = await copyText(restockText(low));
            flash(ok ? "ok" : "err", ok ? "Restock list copied - paste it into a message or note"
                                        : "Couldn't copy - select the list and copy it by hand");
          },
          className: "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
        }, h(ClipboardList, { size: 14 }), " Copy list")),
      h("div", { className: "divide-y divide-amber-200/70" },
        low.map(p => h("div", { key: p.id, className: "flex items-center justify-between gap-3 py-1.5 text-sm" },
          h("div", { className: "min-w-0" },
            h("div", { className: "text-amber-950 truncate" }, p.name),
            p.sku && h("div", { className: "text-[11px] text-amber-700 font-mono" }, "I/N " + p.sku)),
          h("span", {
            className: "text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap " + partStatus(p).cls
          }, (Number(p.onHand) || 0) + " left"))))),

    // ---- toolbar
    h("div", { className: "flex flex-col md:flex-row md:items-center gap-3 mb-3" },
      h("div", { className: "relative flex-1" },
        h(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
        h("input", {
          value: query, onChange: e => setQuery(e.target.value),
          placeholder: "Search parts or I/N...",
          className: "w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        })),
      h("div", { className: "flex flex-wrap gap-2" },
        chip("all", "All", active.length),
        chip("low", "Running low", low.length),
        chip("kits", "Kits", active.filter(p => p.consumable).length),
        chip("archived", "Archived", parts.filter(p => p.active === false).length))),

    loading && parts.length === 0 && h("div", { className: "text-sm text-slate-500 py-10 text-center" },
      h(Loader2, { size: 18, className: "animate-spin inline mr-2" }), "Loading parts\u2026"),

    !loading && shown.length === 0 && h("div", {
      className: "text-sm text-slate-500 py-10 text-center border-2 border-dashed border-slate-200 rounded-xl"
    }, filter === "low" ? "Nothing needs restocking." : q ? "No parts match that search." : "No parts here."),

    // ---- wide screens: table
    shown.length > 0 && h("div", { className: "hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden" },
      h("table", { className: "w-full text-sm" },
        h("thead", null,
          h("tr", { className: "text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200" },
            ["Part", "Cost", "Sell", "In stock", "Low at", "Kit", "Status", ""].map(t =>
              h("th", { key: t, className: "px-3 py-2.5" }, t)))),
        h("tbody", null, shown.map(p => {
          const d = current(p);
          const st = partStatus(d);
          return h("tr", {
            key: p.id,
            className: "border-b border-slate-100 last:border-0 " + (isDirty(p) ? "bg-blue-50/40" : "")
          },
            h("td", { className: "px-3 py-2 min-w-[260px]" },
              h("input", { className: input + " font-medium", value: d.name,
                onChange: e => edit(p, { name: e.target.value }) }),
              h("input", { className: "mt-1 w-32 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono text-slate-500",
                value: d.sku || "", placeholder: "I/N",
                onChange: e => edit(p, { sku: e.target.value }) })),
            h("td", { className: "px-3 py-2 w-28" },
              h("input", { className: input, type: "number", step: "0.01", value: d.cost,
                onChange: e => edit(p, { cost: e.target.value }) })),
            h("td", { className: "px-3 py-2 w-28" },
              h("input", { className: input, type: "number", step: "0.01",
                value: d.consumable ? "" : d.sell, disabled: d.consumable,
                placeholder: d.consumable ? "\u2014" : "",
                onChange: e => edit(p, { sell: e.target.value }) })),
            h("td", { className: "px-3 py-2" }, stepper(p, false)),
            h("td", { className: "px-3 py-2 w-20" },
              h("input", { className: input, type: "number", min: 0, value: d.lowAt,
                onChange: e => edit(p, { lowAt: e.target.value }) })),
            h("td", { className: "px-3 py-2 text-center" },
              h("input", { type: "checkbox", checked: !!d.consumable,
                title: "Consumable kit - tracked, never billed per fit",
                onChange: e => edit(p, { consumable: e.target.checked }) })),
            h("td", { className: "px-3 py-2" },
              h("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full " + st.cls }, st.label)),
            h("td", { className: "px-3 py-2 whitespace-nowrap" }, actions(p)));
        })))),

    // ---- phones: cards with big stock buttons for use on site
    shown.length > 0 && h("div", { className: "md:hidden space-y-3" },
      shown.map(p => {
        const d = current(p);
        const st = partStatus(d);
        return h("div", {
          key: p.id,
          className: "bg-white border rounded-xl p-4 " + (isDirty(p) ? "border-blue-300" : "border-slate-200")
        },
          h("div", { className: "flex items-start justify-between gap-2 mb-3" },
            // Wraps rather than truncating: the end of the name is often the
            // colour, which is what tells the plug tops apart.
            h("textarea", { className: input + " font-semibold resize-none leading-snug", rows: 2, value: d.name,
              onChange: e => edit(p, { name: e.target.value.replace(/\n/g, " ") }) }),
            h("span", { className: "text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap " + st.cls }, st.label)),
          h("div", { className: "flex items-center justify-between gap-3 mb-3" },
            h("div", { className: "text-xs text-slate-500" }, "In stock"),
            stepper(p, true)),
          h("div", { className: "grid grid-cols-3 gap-2 mb-3" },
            h("div", null, h("label", { className: label }, "Cost"),
              h("input", { className: input, type: "number", step: "0.01", value: d.cost,
                onChange: e => edit(p, { cost: e.target.value }) })),
            h("div", null, h("label", { className: label }, "Sell"),
              h("input", { className: input, type: "number", step: "0.01",
                value: d.consumable ? "" : d.sell, disabled: d.consumable,
                placeholder: d.consumable ? "kit" : "",
                onChange: e => edit(p, { sell: e.target.value }) })),
            h("div", null, h("label", { className: label }, "Low at"),
              h("input", { className: input, type: "number", min: 0, value: d.lowAt,
                onChange: e => edit(p, { lowAt: e.target.value }) }))),
          h("div", { className: "flex items-center justify-between gap-2" },
            h("div", { className: "text-[11px] text-slate-400 font-mono" }, d.sku ? "I/N " + d.sku : ""),
            actions(p)));
      })),

    // ---- unsaved changes bar
    dirty.length > 0 && h("div", {
      className: "fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 shadow-2xl",
      style: { paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }
    },
      h("div", { className: "max-w-6xl mx-auto flex items-center justify-between gap-3" },
        h("span", { className: "text-sm" },
          dirty.length + " unsaved change" + (dirty.length === 1 ? "" : "s")),
        h("div", { className: "flex gap-2" },
          h("button", {
            type: "button", onClick: () => setDrafts({}), disabled: busy === "all",
            className: "text-sm px-4 py-2 rounded-lg text-slate-300 hover:text-white"
          }, "Discard"),
          h("button", {
            type: "button", onClick: saveAll, disabled: busy === "all",
            className: "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          }, busy === "all" ? "Saving\u2026" : h(React.Fragment, null, h(Save, { size: 15 }), " Save all"))))));
}
