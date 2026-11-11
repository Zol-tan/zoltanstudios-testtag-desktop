// ======================================================================
// 20-fixed-rcd.js
// Fixed RCD (switchboard safety switch) test log
// ======================================================================
//
// Fixed RCDs are tested from a power point on the protected circuit, not in
// the appliance socket: plug the Wavecom TnT RCD's own mains lead into the
// GPO, Menu B > F3 > F1 (time test), 30 mA, PRCD off, trip at 0 deg then
// 180 deg. The TnT RCD has no x1/2 or x5 multiplier, so only the 1x
// operating time is logged (AS/NZS 3760:2022). Hard-wired circuits with no
// power point (lighting, cool rooms, HWU) get a push-button test at the board.
//
// Stored on the job as job.fixedRcd and sent to the server inside extra_json,
// so the desktop suite (which doesn't send it) can never wipe it.

const FIXED_RCD_PRICE = 8.00; // published "RCD / safety switch test" rate
const FIXED_RCD_LIMIT_MS = { I: 40, II: 300 };

const FIXED_RCD_METHODS = [
  { value: "time", label: "Trip time (TnT RCD)" },
  { value: "push", label: "Push-button only" },
  { value: "nt", label: "Not tested (trading)" },
];

function blankFixedRcdRow(prev) {
  return {
    id: uuid(),
    board: prev ? prev.board || "" : "",
    circuit: "",
    location: "",
    method: prev ? prev.method || "time" : "time",
    rcdType: prev ? prev.rcdType || "II" : "II",
    t0: "",
    t180: "",
    noTrip: false,
    manual: "",
    notes: "",
  };
}

function blankFixedRcd() {
  const t = effectiveTester();
  return {
    instrument: t.testEquipment || "Wavecom TnT RCD",
    serial: t.testEquipmentSerial || "",
    calDate: t.testEquipmentCalibrationDate || "",
    rated: "30",
    rows: [],
  };
}

// Older jobs and jobs from the desktop suite have no fixedRcd at all.
function fixedRcdOf(job) {
  const f = job && job.fixedRcd;
  if (!f || typeof f !== "object") return Object.assign(blankFixedRcd(), { rows: [] });
  return Object.assign(blankFixedRcd(), f, { rows: Array.isArray(f.rows) ? f.rows : [] });
}

// "pass" | "fail" | "nt" | "" (not finished yet)
function gradeFixedRcd(r) {
  if (!r) return "";
  if (r.method === "nt") return "nt";
  if (r.method === "push") return r.manual === "pass" ? "pass" : r.manual === "fail" ? "fail" : "";
  if (r.noTrip) return "fail";
  const lim = FIXED_RCD_LIMIT_MS[r.rcdType === "I" ? "I" : "II"];
  const a = parseFloat(r.t0), b = parseFloat(r.t180);
  if ((!isNaN(a) && a > lim) || (!isNaN(b) && b > lim)) return "fail";
  if (!isNaN(a) && !isNaN(b)) return "pass";
  return "";
}

function fixedRcdSummary(job) {
  const rows = fixedRcdOf(job).rows;
  const g = rows.map(gradeFixedRcd);
  const pass = g.filter(x => x === "pass").length;
  const fail = g.filter(x => x === "fail").length;
  const nt = g.filter(x => x === "nt").length;
  const pending = g.filter(x => x === "").length;
  return { total: rows.length, pass, fail, nt, pending, tested: pass + fail };
}

function fixedRcdTotalPriceAll(job) { return fixedRcdTotalPrice(job) + lightsTotalPrice(job); }
function fixedRcdTotalPrice(job) {
  return fixedRcdSummary(job).tested * FIXED_RCD_PRICE;
}

// The blank row every new job starts with, never filled in. It must not be
// printed or counted as a pass: it has no description and no readings.
function isUnusedItem(it) {
  if (!it) return true;
  const blank = v => v === undefined || v === null || String(v).trim() === "";
  return blank(it.description) && blank(it.makeModel) && blank(it.serialNumber) && blank(it.location) &&
    blank(it.earthContinuity) && blank(it.insulationResistance) && blank(it.leakageCurrent) &&
    blank(it.notes) && blank(it.partId) && (it.rcdTest || "n/a") === "n/a" && !it.rcdTripTestEnabled &&
    (it.visual || "pass") === "pass" &&
    !Object.values(it.visualChecks || {}).some(Boolean) && blank(it.polarity) && blank(it.cordLength) &&
    blank(it.faultDescription) && blank(it.repairType);
}
function certItems(job) {
  return (job.items || []).filter(it => !isUnusedItem(it));
}

// Headline numbers for the certificate: items AND fixed RCDs, so a failed
// safety switch can never sit under "0 failed, 100% pass".
function certificateCounts(job) {
  const items = gradedItems(job);
  const r = fixedRcdSummary(job);
  const itemPass = items.filter(i => i.overallResult === "pass").length;
  const itemFail = items.filter(i => i.overallResult === "fail").length;
  const pass = itemPass + r.pass, fail = itemFail + r.fail, total = items.length + r.tested;
  return {
    items: items.length, rcds: r.tested, total, pass, fail,
    rate: total ? Math.round(pass / total * 100) : 0,
    breakdown: !r.tested ? "" : !items.length ? "fixed RCD" + (r.tested === 1 ? "" : "s")
      : items.length + " item" + (items.length === 1 ? "" : "s") + " + " + r.tested + " RCD" + (r.tested === 1 ? "" : "s"),
  };
}

// Test current follows the RCD type: Type I = 10 mA, Type II = 30 mA.
function fixedRcdMa(r) { return r && r.rcdType === "I" ? 10 : 30; }

const FIXED_RCD_LABEL = { pass: "PASS", fail: "FAIL", nt: "NOT TESTED", "": "PENDING" };

function fixedRcdReadings(r) {
  if (r.method === "push") return { t0: "Mt", t180: "Mt" };
  if (r.method === "nt") return { t0: "NT", t180: "NT" };
  if (r.noTrip) return { t0: "No trip", t180: "No trip" };
  return { t0: r.t0 || "", t180: r.t180 || "" };
}

// ---------------------------------------------------------------------------
// Certificate / record HTML
// ---------------------------------------------------------------------------
function fixedRcdBadgeHtml(g) {
  if (g === "pass" || g === "fail") return resultBadgeHtml(g);
  const bg = g === "nt" ? "#fef3c7" : "#f1f5f9", fg = g === "nt" ? "#92400e" : "#64748b";
  return `<span class="badge" style="background:${bg};color:${fg}">${FIXED_RCD_LABEL[g]}</span>`;
}

function fixedRcdSectionHtml(job) {
  const f = fixedRcdOf(job);
  if (!f.rows.length) return "";
  const s = fixedRcdSummary(job);
  const failed = f.rows.filter(r => gradeFixedRcd(r) === "fail");
  const instrument = [f.instrument, f.serial ? "s/n " + f.serial : "", f.calDate ? "calibrated " + formatDisplayDate(f.calDate) : ""]
    .filter(Boolean).map(escapeHtml).join(" &middot; ");
  const rows = f.rows.map(r => {
    const g = gradeFixedRcd(r);
    const v = fixedRcdReadings(r);
    const ms = x => (x && !isNaN(parseFloat(x)) ? escapeHtml(x) : escapeHtml(x) || "&mdash;");
    return `
      <tr>
        <td>${escapeHtml(r.board) || "&mdash;"}</td>
        <td>${escapeHtml(r.circuit) || "&mdash;"}</td>
        <td>${escapeHtml(r.location) || "&mdash;"}</td>
        <td>${r.method === "time" ? "Type " + escapeHtml(r.rcdType === "I" ? "I" : "II") + " &middot; " + fixedRcdMa(r) + " mA" : "&mdash;"}</td>
        <td style="font-family:monospace">${ms(v.t0)}</td>
        <td style="font-family:monospace">${ms(v.t180)}</td>
        <td>${fixedRcdBadgeHtml(g)}</td>
        <td>${escapeHtml(r.notes) || ""}</td>
      </tr>`;
  }).join("");
  const callout = failed.length ? `<div class="callout">
      <h3>&#9888; Safety switches requiring attention</h3>
      <ul>${failed.map(r => `<li>${escapeHtml(r.board || "Board")} circuit ${escapeHtml(r.circuit || "?")}${r.location ? " &mdash; " + escapeHtml(r.location) : ""}: refer to a licensed electrician for repair or replacement.</li>`).join("")}</ul>
    </div>` : "";
  return `
    <h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Fixed RCD (Safety Switch) Test Log</h2>
    <p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5">
      Operating-time test at 1&times; the RCD's rated residual current (Type II 30 mA, Type I 10 mA), at 0&deg; and 180&deg;, from a socket outlet on each protected circuit (AS/NZS 3760:2022).
      Pass: Type II &le; 300 ms, Type I &le; 40 ms. &frac12;&times; and 5&times; tests not available on the instrument.<br/>
      Instrument: ${instrument || "&mdash;"}.
      ${s.pass} passed, ${s.fail} failed${s.nt ? ", " + s.nt + " not tested" : ""} of ${s.total}.
    </p>
    ${callout}
    <table>
      <thead>
        <tr><th>Board</th><th>Circuit</th><th>Location</th><th>Type</th><th>1&times; 0&deg; (ms)</th><th>1&times; 180&deg; (ms)</th><th>Result</th><th>Notes</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#94a3b8;margin:-16px 0 24px">Mt = manual push-button test (hard-wired circuit, no socket outlet). NT = not tested, with reason in notes.</p>`;
}

// Tab-separated copy of the log, for pasting into an email or a spreadsheet.
function fixedRcdLogText(job) {
  const f = fixedRcdOf(job);
  const s = fixedRcdSummary(job);
  const head = [
    "RCD TEST LOG - trip test times at 1x rated current (Type II 30 mA, Type I 10 mA)",
    "Testing company: ZoltanStudios",
    "Tested by: " + (job.testerName || "") + " (" + (job.testerLicense || "") + ")",
    "Instrument: " + [f.instrument, f.serial ? "s/n " + f.serial : "", f.calDate ? "calibrated " + f.calDate : ""].filter(Boolean).join(", "),
    "Client & premises: " + [job.clientCompany || job.clientName, job.siteAddress].filter(Boolean).join(", "),
    "Test date: " + (job.testDate || ""),
    "",
    ["Board", "Circuit", "Location", "Type / mA", "1x 0deg ms", "1x 180deg ms", "x1/2", "x5", "Result", "Notes"].join("\t"),
  ];
  const lines = f.rows.map(r => {
    const v = fixedRcdReadings(r);
    return [r.board, r.circuit, r.location, r.method === "time" ? (r.rcdType === "I" ? "I" : "II") + " / " + fixedRcdMa(r) : "", v.t0, v.t180, "N/A", "N/A", FIXED_RCD_LABEL[gradeFixedRcd(r)], r.notes]
      .map(x => String(x || "").replace(/[\t\n]/g, " ")).join("\t");
  });
  return head.concat(lines, ["", "Pass " + s.pass + " / Fail " + s.fail + " / Not tested " + s.nt + " / Total " + s.total,
    "Mt = manual (push-button) test. NT = not tested. x1/2 and x5 not available on instrument."]).join("\n");
}

// ---------------------------------------------------------------------------
// Job form panel
// ---------------------------------------------------------------------------
function FixedRcdPanel({ job, onChange }) {
  const f = fixedRcdOf(job);
  const [open, setOpen] = useState(f.rows.length > 0);
  const [copied, setCopied] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const s = fixedRcdSummary(job);
  const inp = "w-full border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lbl = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  const setF = patch => onChange(Object.assign({}, f, patch));
  const setRow = (id, patch) => setF({ rows: f.rows.map(r => (r.id === id ? Object.assign({}, r, patch) : r)) });
  const addRow = () => setF({ rows: f.rows.concat([blankFixedRcdRow(f.rows[f.rows.length - 1])]) });
  const removeRow = id => setF({ rows: f.rows.filter(r => r.id !== id) });
  const setSerial = e => {
    const v = e.target.value;
    setF({ serial: v });
    // Remember it for the next job.
    try { saveTesterSettings(Object.assign({}, loadTesterSettings() || {}, { testEquipmentSerial: v })); } catch (err) {}
  };
  const copyLog = () => {
    const txt = fixedRcdLogText(job);
    const done = () => { setCopied("Log copied"); setTimeout(() => setCopied(""), 2000); };
    try {
      navigator.clipboard.writeText(txt).then(done, () => setCopied("Copy blocked - use the record download instead"));
    } catch (e) { setCopied("Copy blocked - use the record download instead"); }
  };

  const pillCls = g => "text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap " + (
    g === "pass" ? "bg-emerald-100 text-emerald-700" :
    g === "fail" ? "bg-red-100 text-red-700" :
    g === "nt" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500");
  const edge = g => g === "pass" ? "border-l-emerald-500" : g === "fail" ? "border-l-red-500" : g === "nt" ? "border-l-amber-500" : "border-l-slate-300";
  const e = React.createElement;

  return e("div", { className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden" },
    e("button", {
      type: "button",
      onClick: () => setOpen(o => !o),
      className: "w-full flex items-center justify-between gap-3 p-4 md:px-6 text-left hover:bg-slate-50",
      "aria-expanded": open,
    },
      e("span", { className: "min-w-0" },
        e("span", { className: "block font-semibold text-slate-900" }, "Fixed RCDs (switchboard safety switches)"),
        e("span", { className: "block text-xs text-slate-500 mt-0.5" },
          s.total ? `${s.total} logged · ${s.pass} pass · ${s.fail} fail${s.nt ? " · " + s.nt + " not tested" : ""}${s.pending ? " · " + s.pending + " to finish" : ""}`
                  : "Trip-time test each fixed RCD from a power point on its circuit")),
      e("span", { className: "text-xs text-slate-400 shrink-0" }, open ? "Hide" : "Show")),
    open && e("div", { className: "px-4 md:px-6 pb-5 space-y-4" },
      e("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3" },
        e("div", { className: "sm:col-span-2" }, e("label", { className: lbl, htmlFor: "frcd-inst" }, "Instrument"),
          e("input", { id: "frcd-inst", className: inp, value: f.instrument, onChange: ev => setF({ instrument: ev.target.value }) })),
        e("div", null, e("label", { className: lbl, htmlFor: "frcd-serial" }, "Serial No."),
          e("input", { id: "frcd-serial", className: inp, value: f.serial, onChange: setSerial, placeholder: "On the back of the tester" })),
        e("div", null, e("label", { className: lbl, htmlFor: "frcd-cal" }, "Calibrated"),
          e("input", { id: "frcd-cal", type: "date", className: inp, value: f.calDate, onChange: ev => setF({ calDate: ev.target.value }) }))),
      e("details", { className: "text-sm bg-slate-50 border border-slate-200 rounded-lg p-3" },
        e("summary", { className: "font-semibold text-slate-700 cursor-pointer" }, "How to test a fixed RCD with the TnT RCD"),
        e("ol", { className: "list-decimal pl-5 mt-2 space-y-1 text-slate-600" },
          e("li", null, "Battery isolation switch ON, so the tester stays on when the RCD trips."),
          e("li", null, "Plug the tester's own mains lead into a power point on the circuit. Nothing in the appliance socket."),
          e("li", null, "Enter → Menu B → F3 (RCD) → F1 (Time test). F3 for options: Type II at 30 mA (Type I at 10 mA), PRCD off."),
          e("li", null, "0° → F3 to trip, read the ms. Reset at the board, switch to 180°, test again."),
          e("li", null, "Pass: Type II ≤ 300 ms, Type I ≤ 40 ms. A fail stays a fail: don't retest for a pass, refer it to a licensed electrician."),
          e("li", null, "No power point on the circuit (lighting, cool rooms, HWU)? Push-button test it at the board."))),
      f.rows.length === 0 && e("p", { className: "text-sm text-slate-500" }, "No fixed RCDs on this job yet. Add one per RCD or RCBO on the board."),
      e("div", { className: "space-y-3" },
        f.rows.map((r, i) => {
          const g = gradeFixedRcd(r);
          const lim = FIXED_RCD_LIMIT_MS[r.rcdType === "I" ? "I" : "II"];
          return e("div", { key: r.id, className: "border border-slate-200 border-l-4 rounded-lg p-3 space-y-3 " + edge(g) },
            e("div", { className: "grid grid-cols-2 sm:grid-cols-[6rem_6rem_1fr_auto] gap-2 items-end" },
              e("div", null, e("label", { className: lbl, htmlFor: "frb-" + r.id }, "Board"),
                e("input", { id: "frb-" + r.id, className: inp, value: r.board, placeholder: "MSB", onChange: ev => setRow(r.id, { board: ev.target.value }) })),
              e("div", null, e("label", { className: lbl, htmlFor: "frc-" + r.id }, "Circuit"),
                e("input", { id: "frc-" + r.id, className: inp + " font-mono", value: r.circuit, placeholder: "21", onChange: ev => setRow(r.id, { circuit: ev.target.value }) })),
              e("div", { className: "col-span-2 sm:col-span-1 min-w-0" }, e("label", { className: lbl, htmlFor: "frl-" + r.id }, "Location"),
                e("input", { id: "frl-" + r.id, className: inp, value: r.location, placeholder: "Office power", onChange: ev => setRow(r.id, { location: ev.target.value }) })),
              e("span", { className: pillCls(g) + " justify-self-start sm:mb-2" }, FIXED_RCD_LABEL[g])),
            e("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 items-end" },
              e("div", { className: "col-span-2 sm:col-span-1" }, e("label", { className: lbl, htmlFor: "frm-" + r.id }, "Test"),
                e("select", { id: "frm-" + r.id, className: inp, value: r.method, onChange: ev => setRow(r.id, { method: ev.target.value }) },
                  FIXED_RCD_METHODS.map(m => e("option", { key: m.value, value: m.value }, m.label)))),
              r.method === "time" && e(React.Fragment, null,
                e("div", { className: "col-span-2 sm:col-span-1" }, e("label", { className: lbl, htmlFor: "frt-" + r.id }, "Type"),
                  e("select", { id: "frt-" + r.id, className: inp, value: r.rcdType, onChange: ev => setRow(r.id, { rcdType: ev.target.value }) },
                    e("option", { value: "II" }, "II · 30 mA · ≤ 300 ms"), e("option", { value: "I" }, "I · 10 mA · ≤ 40 ms"))),
                e("div", null, e("label", { className: lbl, htmlFor: "fr0-" + r.id }, "1× 0° (ms)"),
                  e("input", { id: "fr0-" + r.id, className: inp + " font-mono", inputMode: "decimal", value: r.t0, disabled: r.noTrip, placeholder: "< " + lim,
                    onChange: ev => setRow(r.id, { t0: ev.target.value.replace(/[^0-9.]/g, "") }) })),
                e("div", null, e("label", { className: lbl, htmlFor: "fr1-" + r.id }, "1× 180° (ms)"),
                  e("input", { id: "fr1-" + r.id, className: inp + " font-mono", inputMode: "decimal", value: r.t180, disabled: r.noTrip, placeholder: "< " + lim,
                    onChange: ev => setRow(r.id, { t180: ev.target.value.replace(/[^0-9.]/g, "") }) }))),
              r.method === "push" && e("div", { className: "col-span-2 sm:col-span-3" }, e("label", { className: lbl, htmlFor: "frp-" + r.id }, "Push-button at the board"),
                e("select", { id: "frp-" + r.id, className: inp, value: r.manual, onChange: ev => setRow(r.id, { manual: ev.target.value }) },
                  e("option", { value: "" }, "—"), e("option", { value: "pass" }, "Tripped (pass)"), e("option", { value: "fail" }, "Did not trip (fail)")))),
            e("div", { className: "flex flex-wrap items-end gap-3" },
              e("div", { className: "flex-1 min-w-[12rem]" }, e("label", { className: lbl, htmlFor: "frn-" + r.id }, r.method === "nt" ? "Reason not tested" : "Notes"),
                e("input", { id: "frn-" + r.id, className: inp, value: r.notes, placeholder: r.method === "nt" ? "e.g. Cool room - manager declined during trade" : "",
                  onChange: ev => setRow(r.id, { notes: ev.target.value }) })),
              r.method === "time" && e("label", { className: "inline-flex items-center gap-2 text-sm text-slate-600 py-2" },
                e("input", { type: "checkbox", className: "w-5 h-5", checked: !!r.noTrip, onChange: ev => setRow(r.id, { noTrip: ev.target.checked }) }), "Did not trip"),
              e("button", { type: "button", onClick: () => removeRow(r.id), className: "text-xs text-slate-400 hover:text-red-600 underline py-2" }, "Remove RCD " + (i + 1))),
            g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Failed. Tell the site contact now and refer to a licensed electrician. Don't reset and retest for a pass."));
        })),
      e("div", { className: "flex flex-wrap items-center gap-2" },
        e("button", { type: "button", onClick: addRow, className: "inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg" },
          e(Plus, { size: 16 }), " Add fixed RCD"),
        f.rows.length > 0 && e("button", { type: "button", onClick: copyLog, className: "border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-lg" }, "Copy RCD log"),
        f.rows.length > 0 && !confirmClear && e("button", { type: "button", onClick: () => setConfirmClear(true), className: "text-sm text-slate-400 hover:text-red-600 underline px-2" }, "Clear all"),
        confirmClear && e("span", { className: "inline-flex items-center gap-2 text-sm" }, "Remove every fixed RCD?",
          e("button", { type: "button", onClick: () => { setF({ rows: [] }); setConfirmClear(false); }, className: "text-red-700 font-semibold underline" }, "Yes, clear"),
          e("button", { type: "button", onClick: () => setConfirmClear(false), className: "text-slate-600 underline" }, "Keep")),
        copied && e("span", { className: "text-sm text-emerald-700 font-medium", role: "status" }, copied)),
      e("p", { className: "text-xs text-slate-400" },
        "Each tested RCD is charged at $" + FIXED_RCD_PRICE.toFixed(2) + " on the estimate. The log prints on the certificate and the job record. Only test from power points; switchboard repairs or replacing a failed RCD is licensed electrical work.")));
}

// ---------------------------------------------------------------------------
// In-app certificate view
// ---------------------------------------------------------------------------
function FixedRcdReportSection({ job }) {
  const f = fixedRcdOf(job);
  if (!f.rows.length) return null;
  const s = fixedRcdSummary(job);
  const e = React.createElement;
  const badge = g => g === "pass" || g === "fail" ? e(ResultBadge, { result: g }) :
    e("span", { className: "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold " + (g === "nt" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500") }, FIXED_RCD_LABEL[g]);
  return e("div", { className: "mb-6" },
    e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Fixed RCD (Safety Switch) Test Log"),
    e("p", { className: "text-xs text-slate-500 mb-3" },
      `1× rated current (Type II 30 mA, Type I 10 mA) at 0° and 180° from a socket outlet. Instrument: ${[f.instrument, f.serial && "s/n " + f.serial, f.calDate && "cal. " + formatDisplayDate(f.calDate)].filter(Boolean).join(", ")}. ${s.pass} passed, ${s.fail} failed${s.nt ? ", " + s.nt + " not tested" : ""} of ${s.total}.`),
    e("div", { className: "overflow-x-auto" },
      e("table", { className: "w-full text-xs border-collapse" },
        e("thead", null, e("tr", { className: "text-left border-b-2 border-slate-300" },
          ["Board", "Circuit", "Location", "Type", "1× 0° (ms)", "1× 180° (ms)", "Result"].map(h => e("th", { key: h, className: "py-2 pr-2 whitespace-nowrap" }, h)))),
        e("tbody", null, f.rows.map(r => {
          const v = fixedRcdReadings(r);
          return e("tr", { key: r.id, className: "border-b border-slate-100" },
            e("td", { className: "py-1.5 pr-2" }, r.board || "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, r.circuit || "—"),
            e("td", { className: "py-1.5 pr-2" }, r.location || "—"),
            e("td", { className: "py-1.5 pr-2 whitespace-nowrap" }, r.method === "time" ? "Type " + (r.rcdType === "I" ? "I" : "II") + " · " + fixedRcdMa(r) + " mA" : "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, v.t0 || "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, v.t180 || "—"),
            e("td", { className: "py-1.5 pr-2" }, badge(gradeFixedRcd(r))));
        })))),
    e("p", { className: "text-[11px] text-slate-400 mt-1" }, "Mt = manual push-button test. NT = not tested."));
}
