// ======================================================================
// 21-item-checks.js
// Guided testing: what each item still needs, class-aware hints, reading
// sanity checks, the visual checklist, fail handling, on-site repairs
// (plug tops 10 A / 15 A) and the "is this job ready to certify?" gate.
// ======================================================================
//
// Items created before this version (no checksVersion) keep the old rules,
// so saved jobs don't suddenly turn Pending.

const CHECKS_VERSION = 2;

const VISUAL_CHECKS = [
  { k: "cord", label: "Cord & sheath" },
  { k: "plug", label: "Plug & pins" },
  { k: "grip", label: "Cord grip" },
  { k: "casing", label: "Casing & guards" },
  { k: "label", label: "Markings & label" },
];

const FAULT_PRESETS = [
  "Damaged plug top",
  "Bent or loose plug pins",
  "Cord sheath cut or damaged",
  "Cord grip failed - inner cores exposed",
  "Damaged casing or guard",
  "Earth bond over limit",
  "Insulation resistance under limit",
  "Leakage current over limit",
  "Polarity incorrect",
  "RCD did not trip / tripped too slowly",
  "Compliance label missing or illegible",
];

const REPAIR_TYPES = [
  { value: "", label: "No repair" },
  { value: "plug", label: "Plug top replaced" },
  { value: "socket", label: "Extension socket replaced" },
  { value: "cord", label: "Flexible cord replaced" },
];

// Fields that live only in the apps (no tt_items column). They travel to the
// server as job.itemExtras, keyed by the item's permanent qrId.
const ITEM_EXTRA_FIELDS = ["checksVersion", "visualChecks", "polarity", "cordLength", "faultDescription",
  "repairType", "plugRating", "repairDetails", "removedFromService", "followUp"];

function itemExtrasFor(items) {
  const out = {};
  (items || []).forEach(it => {
    if (!it.qrId) return;
    const x = {};
    ITEM_EXTRA_FIELDS.forEach(k => { if (it[k] !== undefined && it[k] !== "" && it[k] !== false) x[k] = it[k]; });
    if (Object.keys(x).length) out[it.qrId] = x;
  });
  return out;
}
function applyItemExtras(items, extras) {
  if (!extras || typeof extras !== "object") return items;
  return items.map(it => (it.qrId && extras[it.qrId] ? Object.assign({}, it, extras[it.qrId]) : it));
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------
function usesGuidedChecks(it) { return !!it && (it.checksVersion || 0) >= CHECKS_VERSION; }
function hasReading(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }
function readingNum(v) { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }

// "OL", "open", ">" and the like: the tester saw no earth path at all.
function earthOpen(v) {
  return hasReading(v) && /^(ol|o\/l|o\.l|open|inf|infinity|∞|>|no\b|nr\b|n\/r|none)/i.test(String(v).trim());
}

function isLeadItem(it) {
  return /\b(extension|ext\.? lead|lead|power ?board|powerboard|cord ?set|cable reel|cable drum|reel|drum|piggy ?back|adaptor|adapter|epod|outlet device|double adaptor)\b/i
    .test((it.description || "") + " " + (it.makeModel || ""));
}

// Equipment with surge protection or switch-mode supplies: a 500 V insulation
// test can falsely fail it, so 250 V or a leakage test is the right method.
function likelySurgeProtected(it) {
  return /\b(surge|power ?board|powerboard|ups\b|uninterruptible|computer|desktop|pc\b|server|laptop|monitor|screen|printer|photocopier|copier|scanner|router|modem|network switch|television|\btv\b|set top|charger|power supply|led driver|eftpos|pos terminal|cash register)\b/i
    .test((it.description || "") + " " + (it.makeModel || ""));
}

// ---------------------------------------------------------------------------
// What an item still needs
// ---------------------------------------------------------------------------
function visualFailed(it) {
  const vc = it.visualChecks || {};
  return it.visual === "fail" || VISUAL_CHECKS.some(c => vc[c.k] === "fail");
}

function missingReadings(it) {
  if (!usesGuidedChecks(it) || isUnusedItem(it)) return [];
  if (visualFailed(it)) return []; // stop at the visual: no electrical tests on a damaged item
  const need = [];
  const vc = it.visualChecks || {};
  if (VISUAL_CHECKS.some(c => vc[c.k] !== "ok")) need.push("visual checklist");
  const cls = it.equipmentClass;
  if (cls === "I" && !hasReading(it.earthContinuity)) need.push("earth bond");
  if ((cls === "I" || cls === "II") && !hasReading(it.insulationResistance) && !hasReading(it.leakageCurrent)) need.push("insulation or leakage");
  if (isLeadItem(it) && !it.polarity) need.push("polarity");
  if (it.itemType === "rcd" && (it.rcdTest || "n/a") === "n/a") need.push("RCD push-button test");
  if (it.itemType === "rcd" && !it.rcdTripTestEnabled) need.push("RCD trip test");
  if (it.rcdTripTestEnabled) {
    if (it.rcdTestMode === "ramp" ? !hasReading(it.rcdMeasuredTripCurrentMa) : !hasReading(it.rcdMeasuredTripTimeMs)) need.push("RCD trip reading");
  }
  if (it.repairType === "plug" && !it.plugRating) need.push("plug rating (10 A or 15 A)");
  if (it.repairType === "socket" && !it.plugRating) need.push("socket rating (10 A or 15 A)");
  return need;
}

// "pending" | "pass" | "fail"
function itemStatus(it) {
  if (!it) return "pending";
  if (it.overrideResult) return it.overallResult === "fail" ? "fail" : "pass";
  if (it.overallResult === "fail") return "fail";
  return missingReadings(it).length ? "pending" : "pass";
}

// A fail is only finished once the reason is written down and the item is
// tagged out (or repaired and retested to a pass).
function failNeeds(it) {
  if (!usesGuidedChecks(it) || itemStatus(it) !== "fail") return [];
  const need = [];
  if (!hasReading(it.faultDescription)) need.push("fault description");
  if (!it.removedFromService) need.push("confirm Danger tag fitted and removed from service");
  return need;
}

function itemIssues(it) {
  return itemStatus(it) === "pending" ? missingReadings(it) : failNeeds(it);
}

// Non-blocking things worth a second look.
function itemWarnings(it) {
  const w = [];
  if (!usesGuidedChecks(it)) return w;
  const earth = readingNum(it.earthContinuity);
  if (it.equipmentClass === "I" && hasReading(it.earthContinuity) && !earthOpen(it.earthContinuity)) {
    if (earth === 0) w.push("Earth bond of exactly 0.00 Ω is unusual. Were the test leads nulled against the tester's earth pin?");
    if (earth !== null && earth >= 10 && !/[.,]/.test(String(it.earthContinuity))) w.push("Earth bond of " + it.earthContinuity + " Ω. Did you mean 0." + String(it.earthContinuity).replace(/\D/g, "") + "? Check the reading.");
    const len = readingNum(it.cordLength);
    if (isLeadItem(it) && len && earth !== null && earth > 0.5) {
      const expected = len * 0.0121; // 1.5 mm² copper, about 12.1 mΩ per metre
      if (earth > expected * 3 + 0.2) w.push("A " + len + " m lead should read about " + expected.toFixed(2) + " Ω on the earth (1.5 mm² cord). " + it.earthContinuity + " Ω points to a poor connection at the plug or socket, not cord length.");
    }
  }
  const ins = readingNum(it.insulationResistance);
  if (ins !== null && ins > 0 && ins < 1 && !/</.test(String(it.insulationResistance))) w.push("Insulation under 1 MΩ fails. Check it isn't a 1.0 typed as 0.1.");
  if (it.rcdTripTestEnabled && it.rcdTestMode !== "ramp") {
    const t = readingNum(it.rcdMeasuredTripTimeMs);
    if (t !== null && t > 0 && t < 5) w.push("RCD trip under 5 ms is faster than an RCD can open. Check the reading.");
  }
  if (likelySurgeProtected(it) && String(it.insulationTestVoltage || "500") === "500") {
    w.push("This looks like surge-protected or electronic gear. A 500 V insulation test can falsely fail it: use 250 V or the leakage test.");
  }
  return w;
}

// ---------------------------------------------------------------------------
// Job readiness: blocking problems stop a certificate being issued.
// ---------------------------------------------------------------------------
function calibrationState(dateStr, testDate) {
  if (!dateStr) return "missing";
  const due = addMonths(dateStr, 12);
  if (due && testDate && due < testDate) return "overdue";
  return "ok";
}

function jobReadiness(job) {
  const blocking = [], warnings = [];
  certItems(job).forEach(it => {
    const label = (it.assetId || "Untagged") + (it.description ? " " + it.description : "");
    const need = itemIssues(it);
    if (need.length) blocking.push(label + ": " + need.join(", "));
    itemWarnings(it).forEach(m => warnings.push(label + ": " + m));
  });

  const f = fixedRcdOf(job);
  const seen = {};
  f.rows.forEach(r => {
    const label = "RCD " + [r.board, r.circuit && "circuit " + r.circuit].filter(Boolean).join(" ") + (r.location ? " (" + r.location + ")" : "");
    const g = gradeFixedRcd(r);
    if (g === "") blocking.push(label + ": " + (r.method === "push" ? "push-button result" : "0° and 180° trip times"));
    if (g === "nt" && !hasReading(r.notes)) blocking.push(label + ": reason it wasn't tested");
    const key = (r.board || "").trim().toLowerCase() + "|" + (r.circuit || "").trim().toLowerCase();
    if (r.circuit && seen[key]) warnings.push(label + ": circuit logged twice on the same board.");
    seen[key] = true;
    if (r.method === "time" && !r.noTrip) {
      [r.t0, r.t180].forEach(v => { const n = readingNum(v); if (n !== null && n > 0 && n < 5) warnings.push(label + ": trip under 5 ms, check the reading."); });
    }
  });

  const t = effectiveTester();
  const patCal = (f.rows.length && f.calDate) || t.testEquipmentCalibrationDate;
  const patState = calibrationState(patCal, job.testDate);
  if (patState === "overdue") blocking.push((t.testEquipment || "Tester") + " calibration is more than 12 months old (" + formatDisplayDate(patCal) + "). Get it recalibrated before issuing certificates.");
  if (patState === "missing") warnings.push("No calibration date for " + (t.testEquipment || "the tester") + ". Add it in Tester Defaults so it can be checked.");
  if (job.meggerEquipment && calibrationState(job.meggerCalibrationDate, job.testDate) === "overdue") {
    blocking.push(job.meggerEquipment + " calibration is more than 12 months old.");
  }
  return { blocking, warnings, ready: blocking.length === 0 };
}

// ---------------------------------------------------------------------------
// UI: the guidance row under each item
// ---------------------------------------------------------------------------
function ItemChecksRow({ item, onChange, parts, inputCls }) {
  const e = React.createElement;
  if (!usesGuidedChecks(item)) return null;
  const vc = item.visualChecks || {};
  const status = itemStatus(item);
  const missing = missingReadings(item);
  const fNeeds = failNeeds(item);
  const warnings = itemWarnings(item);
  const lead = isLeadItem(item);
  const setCheck = (k, v) => onChange({ visualChecks: Object.assign({}, vc, { [k]: vc[k] === v ? "" : v }) });
  const chip = (on, tone) => "px-2 py-1 rounded-md border text-xs font-semibold min-w-[2.25rem] " + (on
    ? (tone === "bad" ? "bg-red-600 border-red-600 text-white" : "bg-emerald-600 border-emerald-600 text-white")
    : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50");
  const lbl = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const plugParts = (parts || []).filter(p => p.active !== false && !p.consumable &&
    (item.repairType === "socket" ? /socket/i : /plug/i).test(p.name || "") &&
    (!item.plugRating || new RegExp("\\b" + item.plugRating + "\\s?A\\b", "i").test(p.name || "")));

  const tips = [];
  if (item.equipmentClass === "I" && !hasReading(item.earthContinuity) && !visualFailed(item)) {
    tips.push(e("div", { key: "c1", className: "flex flex-wrap items-center gap-2" },
      e("span", null, "Class I: check the rating plate for the ", e("strong", null, "⧈ double-insulated symbol"), " first. If it's there the item is Class II and there's no earth to bond."),
      e("button", { type: "button", onClick: () => onChange({ equipmentClass: "II", earthContinuity: "" }), className: "text-xs font-semibold underline text-blue-700" }, "It's Class II")));
  }
  if (item.equipmentClass === "I" && earthOpen(item.earthContinuity)) {
    tips.push(e("div", { key: "ol" },
      e("strong", { className: "text-red-700" }, "No earth reading. Before you fail it:"),
      e("ol", { className: "list-decimal pl-5 mt-1 space-y-0.5" },
        e("li", null, "Is it actually Class II? Look for the ⧈ symbol. ", e("button", { type: "button", onClick: () => onChange({ equipmentClass: "II", earthContinuity: "" }), className: "underline font-semibold text-blue-700" }, "Mark Class II")),
        e("li", null, "Clip on bare metal. Paint, powder coat and anodising insulate: try a screw head or the frame."),
        e("li", null, "Not every metal part is earthed. Try the motor housing or gearcase, not a bed or guard."),
        e("li", null, "Flex the cord along its length while testing to catch a broken earth core."),
        e("li", null, "Null the test leads against the tester's earth pin to rule out the lead."),
        e("li", null, "Still open on an earthed part: it's a fail. Danger tag it."))));
  }
  if (item.equipmentClass === "II" && !hasReading(item.insulationResistance) && !hasReading(item.leakageCurrent) && !visualFailed(item)) {
    tips.push(e("div", { key: "c2" }, "Class II: no earth bond. Test insulation (or leakage with the item running)."));
  }
  if (item.equipmentClass === "III") {
    tips.push(e("div", { key: "c3" }, "Class III (extra-low voltage): visual check only. Test the plug-pack or transformer that supplies it as its own item."));
  }
  if (likelySurgeProtected(item) && String(item.insulationTestVoltage || "500") === "500") {
    tips.push(e("div", { key: "mov", className: "flex flex-wrap items-center gap-2" },
      e("span", null, "Surge-protected or electronic: test insulation at 250 V, or use leakage."),
      e("button", { type: "button", onClick: () => onChange({ insulationTestVoltage: "250" }), className: "text-xs font-semibold underline text-blue-700" }, "Use 250 V")));
  }

  return e("tr", { className: "border-b border-slate-100 " + (status === "fail" ? "bg-red-50/40" : status === "pending" ? "bg-amber-50/40" : "bg-white") },
    e("td", null),
    e("td", { colSpan: 9, className: "py-2 px-2" },
      e("div", { className: "flex flex-col gap-2 text-xs text-slate-700" },
        // Visual checklist
        e("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1.5" },
          e("span", { className: "font-semibold text-slate-500 uppercase tracking-wide text-[10px]" }, "Visual"),
          VISUAL_CHECKS.map(c => e("span", { key: c.k, className: "inline-flex items-center gap-1" },
            e("span", { className: vc[c.k] === "fail" ? "text-red-700 font-semibold" : "" }, c.label),
            e("button", { type: "button", "aria-label": c.label + " OK", onClick: () => setCheck(c.k, "ok"), className: chip(vc[c.k] === "ok", "good") }, "✓"),
            e("button", { type: "button", "aria-label": c.label + " fail", onClick: () => setCheck(c.k, "fail"), className: chip(vc[c.k] === "fail", "bad") }, "✗"))),
          e("button", { type: "button", onClick: () => onChange({ visualChecks: VISUAL_CHECKS.reduce((o, c) => Object.assign(o, { [c.k]: "ok" }), {}) }),
            className: "text-xs font-semibold underline text-emerald-700" }, "All OK")),
        // Leads: polarity and length
        lead && e("div", { className: "flex flex-wrap items-end gap-3" },
          e("div", null, e("span", { className: lbl }, "Polarity / continuity"),
            e("div", { className: "flex gap-1" },
              e("button", { type: "button", onClick: () => onChange({ polarity: item.polarity === "pass" ? "" : "pass" }), className: chip(item.polarity === "pass", "good") }, "Pass"),
              e("button", { type: "button", onClick: () => onChange({ polarity: item.polarity === "fail" ? "" : "fail" }), className: chip(item.polarity === "fail", "bad") }, "Fail"))),
          e("div", { className: "w-24" }, e("label", { className: lbl, htmlFor: "len-" + item.id }, "Length (m)"),
            e("input", { id: "len-" + item.id, className: inputCls + " py-1 text-xs", inputMode: "decimal", value: item.cordLength || "", onChange: ev => onChange({ cordLength: ev.target.value }) }))),
        // Tips
        tips.length > 0 && e("div", { className: "bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-3 py-2 space-y-1.5" }, tips),
        warnings.filter(w => !/surge-protected/.test(w)).map((w, i) => e("div", { key: "w" + i, className: "bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-1.5" }, "⚠ " + w)),
        // Fail handling + repairs
        (status === "fail" || item.repairType) && e("div", { className: "border border-red-200 bg-white rounded-lg p-2.5 flex flex-col gap-2" },
          e("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" },
            e("div", null, e("label", { className: lbl, htmlFor: "fd-" + item.id }, "Fault found"),
              e("input", { id: "fd-" + item.id, list: "fault-presets", className: inputCls + " py-1 text-xs", value: item.faultDescription || "", placeholder: "e.g. Damaged plug top",
                onChange: ev => onChange({ faultDescription: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "rp-" + item.id }, "Repaired on site"),
              e("select", { id: "rp-" + item.id, className: inputCls + " py-1 text-xs", value: item.repairType || "",
                onChange: ev => onChange({ repairType: ev.target.value, plugRating: "", partId: "" }) },
                REPAIR_TYPES.map(r => e("option", { key: r.value, value: r.value }, r.label))))),
          (item.repairType === "plug" || item.repairType === "socket") && e("div", { className: "flex flex-col gap-1.5" },
            e("div", { className: "flex flex-wrap items-center gap-2" },
              e("span", { className: "font-semibold" }, item.repairType === "plug" ? "Plug top rating:" : "Socket rating:"),
              ["10", "15"].map(a => e("button", { key: a, type: "button", onClick: () => {
                  const match = (parts || []).filter(p => p.active !== false && !p.consumable && (item.repairType === "socket" ? /socket/i : /plug/i).test(p.name || "") && new RegExp("\\b" + a + "\\s?A\\b", "i").test(p.name || ""));
                  onChange({ plugRating: a, partId: match.length === 1 ? match[0].id : "",
                    repairDetails: (item.repairType === "plug" ? "Plug top" : "Extension socket") + " replaced (" + a + " A), retested" });
                }, className: chip(item.plugRating === a, "good") + " px-3" }, a + " A")),
              !item.plugRating && e("span", { className: "text-amber-700 font-semibold" }, "Pick 10 A or 15 A")),
            e("p", { className: "text-slate-500" }, "Match the original: a 15 A appliance has the wider earth pin and must get a 15 A plug. Never fit a 10 A plug to a 15 A appliance."),
            item.plugRating && e("div", { className: "max-w-sm" },
              e("label", { className: lbl, htmlFor: "pp-" + item.id }, "Part used"),
              e("select", { id: "pp-" + item.id, className: inputCls + " py-1 text-xs", value: item.partId || "", onChange: ev => onChange({ partId: ev.target.value }) },
                e("option", { value: "" }, plugParts.length ? "Choose the part" : "None in stock at " + item.plugRating + " A"),
                plugParts.map(p => e("option", { key: p.id, value: p.id }, p.name + (p.onHand <= 0 ? " (none in stock)" : "")))),
              !plugParts.length && e("p", { className: "text-amber-700 mt-0.5" }, "No " + item.plugRating + " A " + (item.repairType === "plug" ? "plug tops" : "sockets") + " in your parts list. Add them on the Parts screen.")),
            item.repairType && e("p", { className: "text-slate-600" }, "After the repair, re-tick the visual checks and retest: the readings you enter are the after-repair readings.")),
          item.repairType === "cord" && e("p", { className: "text-slate-600" }, "After replacing the cord, retest earth, insulation and polarity and enter the new readings."),
          status === "fail" && e("label", { className: "inline-flex items-center gap-2 font-semibold text-red-800" },
            e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.removedFromService, onChange: ev => onChange({ removedFromService: ev.target.checked }) }),
            "Danger tag fitted and item removed from service")),
        // Status line
        status === "pending" && missing.length > 0 && e("div", { className: "font-semibold text-amber-800" }, "Pending. Still needs: " + missing.join(", ")),
        status === "fail" && fNeeds.length > 0 && e("div", { className: "font-semibold text-red-800" }, "To finish this fail: " + fNeeds.join(", "))
      )));
}

// One shared list for the fault field's suggestions.
function FaultPresetList() {
  return React.createElement("datalist", { id: "fault-presets" }, FAULT_PRESETS.map(f => React.createElement("option", { key: f, value: f })));
}

// ---------------------------------------------------------------------------
// UI: readiness panels
// ---------------------------------------------------------------------------
function JobReadinessPanel({ job, compact }) {
  const e = React.createElement;
  const r = jobReadiness(job);
  if (!r.blocking.length && !r.warnings.length) return null;
  return e("div", { className: "rounded-xl border p-4 mb-4 text-sm " + (r.blocking.length ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200") },
    r.blocking.length > 0 && e("div", null,
      e("div", { className: "font-semibold text-amber-900 mb-1" }, "Not ready for a certificate (" + r.blocking.length + ")"),
      e("ul", { className: "list-disc pl-5 space-y-0.5 text-amber-900" }, r.blocking.slice(0, compact ? 8 : 100).map((m, i) => e("li", { key: i }, m))),
      compact && r.blocking.length > 8 && e("div", { className: "text-amber-800 mt-1" }, "and " + (r.blocking.length - 8) + " more")),
    r.warnings.length > 0 && e("div", { className: r.blocking.length ? "mt-3" : "" },
      e("div", { className: "font-semibold text-slate-700 mb-1" }, "Worth a second look"),
      e("ul", { className: "list-disc pl-5 space-y-0.5 text-slate-600" }, r.warnings.slice(0, compact ? 6 : 100).map((m, i) => e("li", { key: i }, m)))));
}

// Certificate HTML gets a DRAFT banner if it's exported while not ready
// (ZIP export, folder save), so an unfinished one can't pass as issued.
function draftBannerHtml(job) {
  const r = jobReadiness(job);
  if (r.ready) return "";
  return `<div style="border:2px solid #b45309;background:#fffbeb;color:#92400e;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px">
    <strong style="font-size:15px">DRAFT &mdash; not a valid certificate.</strong> Testing isn't finished:
    <ul style="margin:6px 0 0;padding-left:18px">${r.blocking.slice(0, 12).map(m => "<li>" + escapeHtml(m) + "</li>").join("")}</ul>
  </div>`;
}
