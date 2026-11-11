// ======================================================================
// 22-services.js
// Extra services a test and tag technician can do in Victoria without an
// electrical licence: hire equipment (before each hire), second-hand goods
// for sale (AS/NZS 5761), construction sites (AS/NZS 3012), medical items
// referred to biomedical (AS/NZS 3551), and emergency / exit light testing
// (AS/NZS 2293.2 - testing only; repairs to fixed fittings are electrical work).
// ======================================================================

const SITE_MODES = [
  { value: "standard", label: "Workplace", sub: "AS/NZS 3760:2022" },
  { value: "construction", label: "Construction site", sub: "AS/NZS 3760 + AS/NZS 3012, 3-monthly" },
  { value: "hire", label: "Hire equipment", sub: "Tested before each hire" },
  { value: "resale", label: "Second-hand for sale", sub: "AS/NZS 5761 before sale" },
];
const EMERGENCY_LIGHT_PRICE = 10.00; // per fitting, 6-monthly test

function siteModeOf(job) {
  const m = job && job.siteMode;
  return SITE_MODES.some(x => x.value === m) ? m : (job && job.environment === "construction" ? "construction" : "standard");
}

function certificateTitle(job) {
  const m = siteModeOf(job);
  if (m === "resale") return "Second-hand Equipment Safety Test (AS/NZS 5761)";
  if (m === "hire") return "Hire Equipment Test &amp; Tag Certificate";
  if (m === "construction") return "Construction Site Test &amp; Tag Certificate";
  return "Test &amp; Tag Compliance Certificate";
}

// What the certificate says under "Next Test Due".
function nextTestText(job) {
  const m = siteModeOf(job);
  if (m === "hire") return "Before each hire";
  if (m === "resale") return "Not applicable (tested prior to sale)";
  return formatDisplayDate(addMonths(job.testDate, job.retestMonths));
}

function standardsLine(job) {
  const m = siteModeOf(job);
  if (m === "resale") return "AS/NZS 5761 (in-service safety inspection and testing of second-hand equipment prior to sale)";
  if (m === "construction") return "AS/NZS 3760:2022 and AS/NZS 3012 (construction and demolition sites)";
  if (m === "hire") return "AS/NZS 3760:2022 (hire equipment, inspected and tested before each hire)";
  return "AS/NZS 3760:2022";
}

// ---------------------------------------------------------------------------
// Items that are not graded: medical (referred) and resale items sold untested
// ---------------------------------------------------------------------------
function isReferredItem(it) { return !!(it && it.medical); }
function isUntestedSaleItem(it, job) { return !!(it && it.saleUntested) && siteModeOf(job || {}) === "resale"; }
function referredItems(job) { return certItems(job).filter(isReferredItem); }
function untestedSaleItems(job) { return certItems(job).filter(it => !isReferredItem(it) && isUntestedSaleItem(it, job)); }
function gradedItems(job) { return certItems(job).filter(it => !isReferredItem(it) && !isUntestedSaleItem(it, job)); }

function ServicesItemFlags({ item, job, onChange }) {
  const e = React.createElement;
  const resale = siteModeOf(job) === "resale";
  return e("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1" },
    e("label", { className: "inline-flex items-center gap-1.5 text-slate-600" },
      e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.medical, onChange: ev => onChange({ medical: ev.target.checked }) }),
      "Medical device: refer to biomedical, don't test"),
    resale && e("label", { className: "inline-flex items-center gap-1.5 text-slate-600" },
      e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.saleUntested, onChange: ev => onChange({ saleUntested: ev.target.checked }) }),
      "Not tested: sell labelled \"used\""),
    item.medical && e("span", { className: "text-slate-500" }, "Listed on the certificate as referred under AS/NZS 3551. Visual-only defects can still be noted."));
}

// ---------------------------------------------------------------------------
// Emergency & exit lighting log (AS/NZS 2293.2, 6-monthly discharge test)
// ---------------------------------------------------------------------------
const EL_TYPES = [
  { value: "exit", label: "Exit sign" },
  { value: "emergency", label: "Emergency light" },
  { value: "combined", label: "Combined exit / emergency" },
];
function emergencyLightsOf(job) {
  const x = job && job.emergencyLights;
  return { rows: x && Array.isArray(x.rows) ? x.rows : [] };
}
function blankLightRow(prev) {
  return { id: uuid(), location: "", fittingId: "", type: prev ? prev.type || "exit" : "exit", minutes: "", result: "", notes: "" };
}
// "pass" | "fail" | "" ; a pass needs the light to have stayed on for 90 min.
function gradeLight(r) {
  if (!r) return "";
  if (r.result === "fail") return "fail";
  if (r.result === "pass") {
    const m = readingNum(r.minutes);
    return m !== null && m < 90 ? "fail" : "pass";
  }
  return "";
}
function lightsSummary(job) {
  const g = emergencyLightsOf(job).rows.map(gradeLight);
  return { total: g.length, pass: g.filter(x => x === "pass").length, fail: g.filter(x => x === "fail").length, pending: g.filter(x => x === "").length };
}
function lightsTotalPrice(job) { const s = lightsSummary(job); return (s.pass + s.fail) * EMERGENCY_LIGHT_PRICE; }

function EmergencyLightsPanel({ job, onChange }) {
  const e = React.createElement;
  const rows = emergencyLightsOf(job).rows;
  const [open, setOpen] = useState(rows.length > 0);
  const s = lightsSummary(job);
  const inp = "w-full border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lbl = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const set = list => onChange({ rows: list });
  const setRow = (id, p) => set(rows.map(r => (r.id === id ? Object.assign({}, r, p) : r)));
  const chip = (on, bad) => "px-3 py-2 rounded-lg border text-sm font-semibold " + (on ? (bad ? "bg-red-600 border-red-600 text-white" : "bg-emerald-600 border-emerald-600 text-white") : "bg-white border-slate-300 text-slate-600");
  return e("div", { className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden" },
    e("button", { type: "button", onClick: () => setOpen(o => !o), "aria-expanded": open, className: "w-full flex items-center justify-between gap-3 p-4 md:px-6 text-left hover:bg-slate-50" },
      e("span", null,
        e("span", { className: "block font-semibold text-slate-900" }, "Emergency & exit lights"),
        e("span", { className: "block text-xs text-slate-500 mt-0.5" }, s.total ? `${s.total} logged · ${s.pass} pass · ${s.fail} fail${s.pending ? " · " + s.pending + " to finish" : ""}` : "6-monthly discharge test, AS/NZS 2293.2")),
      e("span", { className: "text-xs text-slate-400" }, open ? "Hide" : "Show")),
    open && e("div", { className: "px-4 md:px-6 pb-5 space-y-3" },
      e("details", { className: "text-sm bg-slate-50 border border-slate-200 rounded-lg p-3" },
        e("summary", { className: "font-semibold text-slate-700 cursor-pointer" }, "How to run the 6-monthly test"),
        e("ol", { className: "list-decimal pl-5 mt-2 space-y-1 text-slate-600" },
          e("li", null, "Check every fitting is lit and its charge indicator is on before you start."),
          e("li", null, "Switch to battery with the test switch (or the circuit's test key) and start a 90-minute timer."),
          e("li", null, "At 90 minutes walk the site: every fitting must still be lit. Note any that dimmed or went out and when."),
          e("li", null, "Restore mains and check the charge indicators come back on."),
          e("li", null, "Failed fittings go to a licensed electrician. Replacing batteries, lamps or fittings in fixed wiring is electrical work."))),
      rows.map((r, i) => {
        const g = gradeLight(r);
        return e("div", { key: r.id, className: "border border-slate-200 border-l-4 rounded-lg p-3 space-y-2 " + (g === "pass" ? "border-l-emerald-500" : g === "fail" ? "border-l-red-500" : "border-l-slate-300") },
          e("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" },
            e("div", { className: "col-span-2" }, e("label", { className: lbl, htmlFor: "ell-" + r.id }, "Location"),
              e("input", { id: "ell-" + r.id, className: inp, value: r.location, placeholder: "e.g. Rear exit, kitchen", onChange: ev => setRow(r.id, { location: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "eli-" + r.id }, "Fitting ID"),
              e("input", { id: "eli-" + r.id, className: inp, value: r.fittingId, placeholder: "EL-01", onChange: ev => setRow(r.id, { fittingId: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "elt-" + r.id }, "Type"),
              e("select", { id: "elt-" + r.id, className: inp, value: r.type, onChange: ev => setRow(r.id, { type: ev.target.value }) }, EL_TYPES.map(t => e("option", { key: t.value, value: t.value }, t.label))))),
          e("div", { className: "flex flex-wrap items-end gap-2" },
            e("div", { className: "w-28" }, e("label", { className: lbl, htmlFor: "elm-" + r.id }, "Lasted (min)"),
              e("input", { id: "elm-" + r.id, className: inp + " font-mono", inputMode: "numeric", value: r.minutes, placeholder: "90", onChange: ev => setRow(r.id, { minutes: ev.target.value.replace(/[^0-9]/g, "") }) })),
            e("button", { type: "button", onClick: () => setRow(r.id, { result: r.result === "pass" ? "" : "pass" }), className: chip(r.result === "pass") }, "Stayed lit"),
            e("button", { type: "button", onClick: () => setRow(r.id, { result: r.result === "fail" ? "" : "fail" }), className: chip(r.result === "fail", true) }, "Failed"),
            e("div", { className: "flex-1 min-w-[10rem]" }, e("label", { className: lbl, htmlFor: "eln-" + r.id }, "Notes"),
              e("input", { id: "eln-" + r.id, className: inp, value: r.notes, placeholder: g === "fail" ? "e.g. Went out at 40 min" : "", onChange: ev => setRow(r.id, { notes: ev.target.value }) })),
            e("button", { type: "button", onClick: () => set(rows.filter(x => x.id !== r.id)), className: "text-xs text-slate-400 hover:text-red-600 underline py-2" }, "Remove " + (i + 1))),
          r.result === "pass" && g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Under 90 minutes is a fail, even if it's still lit."),
          g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Refer to a licensed electrician for repair."));
      }),
      e("div", { className: "flex flex-wrap gap-2 items-center" },
        e("button", { type: "button", onClick: () => set(rows.concat([blankLightRow(rows[rows.length - 1])])), className: "inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg" }, e(Plus, { size: 16 }), " Add fitting"),
        e("span", { className: "text-xs text-slate-400" }, "$" + EMERGENCY_LIGHT_PRICE.toFixed(2) + " per fitting on the estimate."))));
}

function lightsSectionHtml(job) {
  const rows = emergencyLightsOf(job).rows;
  if (!rows.length) return "";
  const s = lightsSummary(job);
  const failed = rows.filter(r => gradeLight(r) === "fail");
  const typeLabel = v => (EL_TYPES.find(t => t.value === v) || EL_TYPES[0]).label;
  return `
    <h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Emergency &amp; Exit Lighting Test Log</h2>
    <p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5">
      Six-monthly discharge test to AS/NZS 2293.2: each fitting run on battery and required to stay lit for at least 90 minutes.
      ${s.pass} passed, ${s.fail} failed of ${s.total}.
    </p>
    ${failed.length ? `<div class="callout"><h3>&#9888; Fittings requiring attention</h3><ul>${failed.map(r => `<li>${escapeHtml(r.fittingId || "Fitting")}${r.location ? " &mdash; " + escapeHtml(r.location) : ""}${r.notes ? ": " + escapeHtml(r.notes) : ""}. Refer to a licensed electrician.</li>`).join("")}</ul></div>` : ""}
    <table>
      <thead><tr><th>Fitting</th><th>Location</th><th>Type</th><th>Duration (min)</th><th>Result</th><th>Notes</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.fittingId) || "&mdash;"}</td><td>${escapeHtml(r.location) || "&mdash;"}</td><td>${typeLabel(r.type)}</td><td style="font-family:monospace">${escapeHtml(r.minutes) || "&mdash;"}</td><td>${fixedRcdBadgeHtml(gradeLight(r))}</td><td>${escapeHtml(r.notes) || ""}</td></tr>`).join("")}</tbody>
    </table>`;
}

// Medical referrals and resale "used, untested" lists for the certificate.
function servicesItemSectionsHtml(job) {
  let out = "";
  const med = referredItems(job);
  if (med.length) {
    out += `<h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Medical Equipment Referred</h2>
      <p style="font-size:12px;color:#475569;margin:0 0 10px">Not tested under this certificate. Medical electrical equipment is managed under AS/NZS 3551; refer these items to a biomedical engineering service.</p>
      <table><thead><tr><th>Tag Number</th><th>Description</th><th>Location</th><th>Notes</th></tr></thead><tbody>
      ${med.map(i => `<tr><td>${escapeHtml(i.assetId) || "&mdash;"}</td><td>${escapeHtml(i.description) || "&mdash;"}</td><td>${escapeHtml(i.location) || "&mdash;"}</td><td>${escapeHtml(i.faultDescription || i.notes) || ""}</td></tr>`).join("")}
      </tbody></table>`;
  }
  const un = untestedSaleItems(job);
  if (un.length) {
    out += `<h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Not Safety Tested &mdash; to be sold as "used"</h2>
      <p style="font-size:12px;color:#475569;margin:0 0 10px">Under Victorian rules these items must be labelled as second-hand ("used") and sold with information stating they have not been safety tested.</p>
      <table><thead><tr><th>Tag Number</th><th>Description</th><th>Notes</th></tr></thead><tbody>
      ${un.map(i => `<tr><td>${escapeHtml(i.assetId) || "&mdash;"}</td><td>${escapeHtml(i.description) || "&mdash;"}</td><td>${escapeHtml(i.notes) || ""}</td></tr>`).join("")}
      </tbody></table>`;
  }
  return out;
}

// In-app certificate view: the same extra sections, as React.
function ServicesReportSections({ job }) {
  const e = React.createElement;
  const rows = emergencyLightsOf(job).rows;
  const med = referredItems(job), un = untestedSaleItems(job);
  if (!rows.length && !med.length && !un.length) return null;
  const tbl = (heads, body) => e("div", { className: "overflow-x-auto mb-2" }, e("table", { className: "w-full text-xs border-collapse" },
    e("thead", null, e("tr", { className: "text-left border-b-2 border-slate-300" }, heads.map(h => e("th", { key: h, className: "py-2 pr-2" }, h)))),
    e("tbody", null, body)));
  return e("div", { className: "mb-6 space-y-4" },
    rows.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Emergency & Exit Lighting Test Log"),
      e("p", { className: "text-xs text-slate-500 mb-2" }, "AS/NZS 2293.2 six-monthly discharge test, 90 minutes minimum."),
      tbl(["Fitting", "Location", "Duration", "Result"], rows.map(r => e("tr", { key: r.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, r.fittingId || "—"), e("td", { className: "py-1.5 pr-2" }, r.location || "—"),
        e("td", { className: "py-1.5 pr-2 font-mono" }, r.minutes ? r.minutes + " min" : "—"),
        e("td", { className: "py-1.5 pr-2" }, gradeLight(r) ? e(ResultBadge, { result: gradeLight(r) }) : e(ResultBadge, { result: "pending" })))))),
    med.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Medical equipment referred"),
      e("p", { className: "text-xs text-slate-500 mb-2" }, "Not tested here. Refer to biomedical engineering (AS/NZS 3551)."),
      tbl(["Tag", "Description", "Location"], med.map(i => e("tr", { key: i.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, i.assetId || "—"), e("td", { className: "py-1.5 pr-2" }, i.description || "—"), e("td", { className: "py-1.5 pr-2" }, i.location || "—"))))),
    un.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Not safety tested: sell labelled \"used\""),
      tbl(["Tag", "Description"], un.map(i => e("tr", { key: i.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, i.assetId || "—"), e("td", { className: "py-1.5 pr-2" }, i.description || "—"))))));
}

// Site mode picker for the job form.
function SiteModePicker({ job, update }) {
  const e = React.createElement;
  const cur = siteModeOf(job);
  return e("div", { className: "mt-4" },
    e("div", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2" }, "Where is the equipment?"),
    e("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2" }, SITE_MODES.map(m => e("button", {
      key: m.value, type: "button",
      onClick: () => update(Object.assign({ siteMode: m.value }, m.value === "construction" ? { environment: "construction", retestMonths: 3 } : {})),
      className: "text-left px-3 py-2.5 rounded-lg border-2 " + (cur === m.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"),
    }, e("div", { className: "font-semibold text-sm " + (cur === m.value ? "text-blue-800" : "text-slate-700") }, m.label),
       e("div", { className: "text-[11px] text-slate-500" }, m.sub)))),
    cur === "construction" && e("p", { className: "text-xs text-slate-500 mt-2" }, "AS/NZS 3012: retest every 3 months with RGBY tags. All site equipment should be RCD protected; portable RCDs push-button tested by the user daily."),
    cur === "hire" && e("p", { className: "text-xs text-slate-500 mt-2" }, "Hire equipment is inspected and tested before each hire. The certificate shows \"Next test: before each hire\"."),
    cur === "resale" && e("p", { className: "text-xs text-slate-500 mt-2" }, "AS/NZS 5761: test before sale. Anything you don't test gets ticked \"Not tested\" and must be sold labelled \"used\" with a note that it hasn't been safety tested."));
}
