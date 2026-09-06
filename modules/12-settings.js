// ======================================================================
// 12-settings.js
// Tester defaults, retest scheduling, CSV register
// ======================================================================

const TESTER_SETTINGS_KEY = "zoltanstudios-tester-settings-v1";

function loadTesterSettings() {
  try {
    const raw = window.localStorage.getItem(TESTER_SETTINGS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch { return null; }
}

function saveTesterSettings(sett) {
  try {
    window.localStorage.setItem(TESTER_SETTINGS_KEY, JSON.stringify(sett));
    return true;
  } catch { return false; }
}

function effectiveTester() {
  const s = loadTesterSettings() || {};
  return {
    name: s.name || DEFAULT_TESTER.name,
    license: s.license || DEFAULT_TESTER.license,
    testEquipment: s.testEquipment || "Wavecom TnT RCD",
    testEquipmentCalibrationDate: s.testEquipmentCalibrationDate || "",
    meggerEquipment: s.meggerEquipment || "",
    meggerCalibrationDate: s.meggerCalibrationDate || "",
  };
}

// ---------------------------------------------------------------------------
// Retest scheduling helpers
// ---------------------------------------------------------------------------
function daysUntilRetest(job) {
  const due = addMonths(job.testDate, job.retestMonths);
  if (!due) return null;
  const d = new Date(due);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// 'overdue' | 'due-soon' (<=60d) | 'upcoming' (<=120d) | 'ok'
function retestStatus(job) {
  const n = daysUntilRetest(job);
  if (n === null) return "ok";
  if (n < 0) return "overdue";
  if (n <= 60) return "due-soon";
  if (n <= 120) return "upcoming";
  return "ok";
}

function retestLabel(job) {
  const n = daysUntilRetest(job);
  if (n === null) return "";
  if (n < 0) return `Overdue by ${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}`;
  if (n === 0) return "Due today";
  if (n <= 60) return `Due in ${n} day${n === 1 ? "" : "s"}`;
  return `Due ${formatDisplayDate(addMonths(job.testDate, job.retestMonths))}`;
}

// ---------------------------------------------------------------------------
// CSV asset register export
// ---------------------------------------------------------------------------
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildAssetRegisterCSV(jobs) {
  const head = [
    "Certificate No", "Client", "Company", "Site Address", "Test Date", "Next Test Due",
    "Tag Number", "QR ID", "Description", "Make/Model", "Serial No", "Location",
    "Class", "Visual", "Polarity", "Earth (Ohm)", "Insulation (MOhm)", "Insul Test V",
    "Leakage (mA)", "RCD", "Operation", "Fuse", "Result", "Fault", "Repair", "Notes",
  ];
  const rows = [head.map(csvCell).join(",")];

  jobs.forEach((job) => {
    const due = addMonths(job.testDate, job.retestMonths);
    (job.items || []).forEach((it) => {
      rows.push([
        job.certNumber, job.clientName, job.clientCompany, job.siteAddress,
        job.testDate, due,
        it.assetId, it.qrId, it.description, it.makeModel, it.serialNumber, it.location,
        it.equipmentClass, it.visual,
        it.polarity && it.polarity !== "n/a" ? it.polarity : "",
        it.equipmentClass === "I" ? it.earthContinuity : "n/a",
        it.insulationResistance, it.insulationTestVoltage,
        it.leakageCurrent, it.rcdTest,
        it.operationTest && it.operationTest !== "n/a" ? it.operationTest : "",
        it.fuseCheck && it.fuseCheck !== "n/a" ? it.fuseCheck : "",
        it.overallResult, it.faultDescription, it.repairDetails, it.notes,
      ].map(csvCell).join(","));
    });
  });

  // BOM so Excel opens UTF-8 correctly
  return "\ufeff" + rows.join("\r\n");
}

function downloadCSV(content, filename) {
  // Desktop shell: no download manager. Show the CSV in a window so it can
  // be selected and copied into a spreadsheet.
  if (isDesktopShell()) {
    const esc = String(content).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const page =
      '<title>' + filename + '</title>' +
      '<div style="font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;padding:16px">' +
      '<p style="margin:0 0 10px">Select all (Ctrl+A) and copy, then paste into Excel. ' +
      'Or open the app in your browser to download the file directly.</p>' +
      '<textarea style="width:100%;height:70vh;font:12px monospace">' + esc + '</textarea></div>';
    if (openHtmlInWindow(page, filename)) return;
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Older jobs were saved with the unit codes instead of the cert number.
// Any job still carrying one of these strings gets silently upgraded to
// the current licence on load (localStorage AND folder sync both pass
// through normalizeJobLicense), so re-exported certificates come out right.
const LEGACY_LICENSES = ["UEECD0007, UEERL0003, UEERL0004, UEERL0005"];
function normalizeJobLicense(job) {
  if (job && LEGACY_LICENSES.includes(job.testerLicense)) {
    return {
      ...job,
      testerLicense: DEFAULT_TESTER.license
    };
  }
  return job;
}

// Generates a short unique QR ID for an item. Format: ZS- + 4 chars from a
// 32-char alphabet that avoids visually confusing characters (0/O, 1/I/L).
const QR_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateQrId() {
  let id = "ZS-";
  for (let i = 0; i < 4; i++) {
    id += QR_ALPHABET[Math.floor(Math.random() * QR_ALPHABET.length)];
  }
  return id;
}

// Verify URL for a given QR ID
const VERIFY_BASE_URL = "https://zoltanstudios.au/verify?id=";

// Practical retest intervals — aligned with the AS/NZS 3760:2022 table and
// the ZoltanStudios pricing model (quarterly = construction/demolition,
// 6-monthly = industrial/hostile, 12-monthly = office/school/rental, etc.)
const ENVIRONMENTS = [{
  value: "construction",
  label: "Construction / Demolition Site",
  months: 3
}, {
  value: "hostile",
  label: "Factory / Industrial / Mining / Hostile",
  months: 6
}, {
  value: "workshop",
  label: "Workshop / Trade Tools",
  months: 12
}, {
  value: "hospitality",
  label: "Hospitality / Commercial Kitchen",
  months: 12
}, {
  value: "office",
  label: "Office / Retail / General Business",
  months: 12
}, {
  value: "school",
  label: "School / Education Facility",
  months: 12
}, {
  value: "rental",
  label: "Rental Property",
  months: 12
}, {
  value: "custom",
  label: "Custom Interval",
  months: 12
}];

// Item types for pricing categorisation
const ITEM_TYPES = [{
  value: "standard",
  label: "Standard appliance (Class I/II, office, leads)"
}, {
  value: "power_tool",
  label: "Power tool / heavy equipment (Class I, 3-phase)"
}, {
  value: "rcd",
  label: "RCD / safety switch test"
}, {
  value: "microwave",
  label: "Microwave leakage test"
}];
const EQUIPMENT_CLASSES = ["I", "II", "III"];
const JOB_TYPES = [{
  value: "test_tag",
  label: "Test & Tag (AS/NZS 3760)"
}, {
  value: "generator_inspection",
  label: "Generator Inspection Report (AS/NZS 3010 observations)"
}];
const blankGenerator = () => ({
  // Identification
  make: "",
  model: "",
  serialNumber: "",
  ratedOutputKva: "",
  ratedVoltage: "230",
  generatorType: "conventional",
  // 'conventional' | 'inverter'
  hoursRun: "",
  // Safety pre-checks
  electronicsDisconnected: false,
  // MUST be confirmed before megging
  visualCondition: "pass",
  outletCondition: "pass",
  cordGlandCondition: "pass",
  earthStakeFitted: "n/a",
  // 'yes' | 'no' | 'n/a'

  // Insulation resistance (megger) — generator OFF, isolated, unloaded
  irTestVoltage: "500",
  // 250 / 500 / 1000
  irWindingToEarth: "",
  // MΩ
  irLineToEarth: "",
  // MΩ
  irNeutralToEarth: "",
  // MΩ
  irNotMeasured: false,
  // inverter gensets often can't be megged

  // Earth continuity (low-ohm)
  ecFrameToOutletEarth: "",
  // Ω
  ecFrameToEarthStake: "",
  // Ω

  // The critical finding — neutral/earth bond
  neBondResistance: "",
  // Ω measured N→E at outlet, genset off
  neBondStatus: "unknown",
  // 'bonded' | 'floating' | 'unknown'

  // Outcome
  overallAssessment: "satisfactory",
  // 'satisfactory' | 'attention' | 'unsafe'
  findings: "",
  recommendations: ""
});
function buildGeneratorReportHTML(job) {
  const g = job.generator || {};
  const val = (v, unit) => v !== "" && v != null ? `${escapeHtml(v)}${unit ? " " + unit : ""}` : "&mdash;";
  const ASSESSMENT = {
    satisfactory: {
      label: "Satisfactory",
      bg: "#d1fae5",
      fg: "#047857",
      note: "No defects identified at the time of inspection within the scope of the measurements taken."
    },
    attention: {
      label: "Requires Attention",
      bg: "#fef3c7",
      fg: "#b45309",
      note: "One or more items require attention. Refer to findings and recommendations below."
    },
    unsafe: {
      label: "Unsafe - Do Not Use",
      bg: "#fee2e2",
      fg: "#b91c1c",
      note: "Defects identified that present a risk of injury. The generating set should not be used until assessed by a licensed electrician."
    }
  };
  const assess = ASSESSMENT[g.overallAssessment] || ASSESSMENT.satisfactory;

  // Neutral-earth bond is the single most important finding on a genset
  const NE = {
    bonded: {
      label: "Bonded (MEN)",
      bg: "#d1fae5",
      fg: "#047857",
      note: "Neutral is bonded to earth. RCD protection downstream will operate as intended on a first earth fault."
    },
    floating: {
      label: "Floating (IT system)",
      bg: "#fef3c7",
      fg: "#b45309",
      note: "No neutral-earth bond detected. On a floating supply an RCD may NOT trip on a first earth fault, as there is no return path to create an imbalance. Protection strategy must be confirmed by a licensed electrician before this generating set is relied upon for RCD-protected equipment."
    },
    unknown: {
      label: "Not determined",
      bg: "#f1f5f9",
      fg: "#475569",
      note: "Neutral-earth bond status was not determined during this inspection."
    }
  };
  const ne = NE[g.neBondStatus] || NE.unknown;
  const condRow = (label, v) => {
    const ok = v === "pass";
    const na = !v || v === "n/a";
    return `<tr><td>${label}</td><td><span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${na ? "#f1f5f9" : ok ? "#d1fae5" : "#fee2e2"};color:${na ? "#64748b" : ok ? "#047857" : "#b91c1c"}">${na ? "N/A" : ok ? "PASS" : "FAIL"}</span></td></tr>`;
  };
  const irSection = g.irNotMeasured ? `<div class="callout" style="background:#fffbeb;border-color:#fde68a">
         <h3 style="color:#b45309">&#9888; Insulation Resistance Not Measured</h3>
         <p style="font-size:12px;color:#78350f">Insulation resistance testing was not performed on this generating set. Inverter-type generators contain electronic output stages (AVR / inverter board) that can be damaged by insulation testing voltages, and cannot be safely tested without disconnecting those components.</p>
       </div>` : `<h2>Insulation Resistance <span class="sub">(generator off, isolated, unloaded &mdash; tested at ${escapeHtml(g.irTestVoltage || "500")}V DC)</span></h2>
       <table>
         <thead><tr><th>Measurement</th><th>Reading</th><th>Minimum</th><th>Assessment</th></tr></thead>
         <tbody>
           ${[["Winding to frame / earth", g.irWindingToEarth], ["Line to earth (at outlet)", g.irLineToEarth], ["Neutral to earth (at outlet)", g.irNeutralToEarth]].map(([label, v]) => {
    const num = parseFloat(v);
    const has = v !== "" && !isNaN(num);
    const ok = has && num >= 1;
    return `<tr><td>${label}</td><td><strong>${val(v, "M&Omega;")}</strong></td><td>&ge; 1 M&Omega;</td><td>${!has ? "&mdash;" : `<span style="color:${ok ? "#047857" : "#b91c1c"};font-weight:700">${ok ? "PASS" : "BELOW MINIMUM"}</span>`}</td></tr>`;
  }).join("")}
         </tbody>
       </table>
       ${g.electronicsDisconnected ? `<p style="font-size:11px;color:#64748b;margin-top:6px;">AVR / electronic control components were disconnected prior to insulation testing.</p>` : `<p style="font-size:11px;color:#b45309;margin-top:6px;">&#9888; Note: disconnection of AVR / electronic components was not recorded.</p>`}`;
  const body = `
    ${letterheadHtml("Generator Inspection Report")}

    <div style="display:flex;align-items:center;justify-content:space-between;background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:10px 16px;margin-bottom:16px;">
      <span style="font-size:11px;color:#b45309;font-weight:700;letter-spacing:0.05em;">INSPECTION REPORT &mdash; NOT A COMPLIANCE CERTIFICATE</span>
      ${job.certNumber ? `<span style="font-family:monospace;font-size:18px;font-weight:800;color:#92400e;letter-spacing:0.12em;">${escapeHtml(job.certNumber)}</span>` : ""}
    </div>

    <div style="text-align:center;background:${assess.bg};border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:${assess.fg};letter-spacing:0.03em;">${assess.label.toUpperCase()}</div>
      <div style="font-size:12px;color:${assess.fg};opacity:0.85;margin-top:4px;">${assess.note}</div>
    </div>

    <div class="details-grid">
      <div><span class="lbl">Client:</span> <span class="val">${escapeHtml(job.clientName) || "&mdash;"}</span></div>
      <div><span class="lbl">Company:</span> <span class="val">${escapeHtml(job.clientCompany) || "&mdash;"}</span></div>
      <div class="full"><span class="lbl">Site Address:</span> <span class="val">${escapeHtml(job.siteAddress) || "&mdash;"}</span></div>
      <div><span class="lbl">Inspection Date:</span> <span class="val">${escapeHtml(formatDisplayDate(job.testDate))}</span></div>
      <div><span class="lbl">Inspected By:</span> <span class="val">${escapeHtml(job.testerName)}</span></div>
      <div><span class="lbl">Cert. / Qual. No.:</span> <span class="val">${escapeHtml(job.testerLicense)}</span></div>
      <div><span class="lbl">Test Equipment:</span> <span class="val">${escapeHtml(job.meggerEquipment) || "&mdash;"}${job.meggerCalibrationDate ? ` (cal. ${escapeHtml(formatDisplayDate(job.meggerCalibrationDate))})` : ""}</span></div>
    </div>

    <h2>Generating Set Details</h2>
    <table>
      <tbody>
        <tr><td style="width:40%">Make / Model</td><td><strong>${escapeHtml(g.make) || "&mdash;"} ${escapeHtml(g.model) || ""}</strong></td></tr>
        <tr><td>Serial Number</td><td>${val(g.serialNumber)}</td></tr>
        <tr><td>Type</td><td style="text-transform:capitalize">${escapeHtml(g.generatorType) || "&mdash;"}</td></tr>
        <tr><td>Rated Output</td><td>${val(g.ratedOutputKva, "kVA")}</td></tr>
        <tr><td>Rated Voltage</td><td>${val(g.ratedVoltage, "V")}</td></tr>
        <tr><td>Hours Run</td><td>${val(g.hoursRun, "hrs")}</td></tr>
      </tbody>
    </table>

    <h2>Visual Inspection</h2>
    <table>
      <tbody>
        ${condRow("General condition / enclosure", g.visualCondition)}
        ${condRow("Outlet sockets", g.outletCondition)}
        ${condRow("Cord glands / entries", g.cordGlandCondition)}
        <tr><td>Earth stake fitted &amp; connected</td><td style="text-transform:capitalize">${g.earthStakeFitted === "yes" ? '<span style="color:#047857;font-weight:700">YES</span>' : g.earthStakeFitted === "no" ? '<span style="color:#b45309;font-weight:700">NO</span>' : "N/A"}</td></tr>
      </tbody>
    </table>

    ${irSection}

    <h2>Earth Continuity</h2>
    <table>
      <thead><tr><th>Measurement</th><th>Reading</th><th>Maximum</th><th>Assessment</th></tr></thead>
      <tbody>
        ${[["Frame to outlet earth pin", g.ecFrameToOutletEarth], ["Frame to earth stake terminal", g.ecFrameToEarthStake]].map(([label, v]) => {
    const num = parseFloat(v);
    const has = v !== "" && !isNaN(num);
    const ok = has && num <= 1;
    return `<tr><td>${label}</td><td><strong>${val(v, "&Omega;")}</strong></td><td>&le; 1 &Omega;</td><td>${!has ? "&mdash;" : `<span style="color:${ok ? "#047857" : "#b91c1c"};font-weight:700">${ok ? "PASS" : "ABOVE MAXIMUM"}</span>`}</td></tr>`;
  }).join("")}
      </tbody>
    </table>

    <h2>Neutral / Earth Bond &mdash; Supply Configuration</h2>
    <div style="background:${ne.bg};border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-weight:800;color:${ne.fg};font-size:14px;margin-bottom:4px;">${ne.label}${g.neBondResistance !== "" ? ` &mdash; measured ${escapeHtml(g.neBondResistance)}&Omega; N&rarr;E` : ""}</div>
      <div style="font-size:12px;color:${ne.fg};opacity:0.9;line-height:1.5;">${ne.note}</div>
    </div>

    ${g.findings ? `<h2>Findings</h2><p style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(g.findings)}</p>` : ""}
    ${g.recommendations ? `<h2>Recommendations</h2><p style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(g.recommendations)}</p>` : ""}

    <div class="declaration">
      <h3>Scope &amp; Limitations</h3>
      <p>
        This document is an <strong>inspection report</strong>, not a certificate of compliance.
        It records measured values and visual observations taken at the date and time of inspection.
        Generating sets are covered by AS/NZS 3010 (and AS/NZS 3012 where used on construction and
        demolition sites); verification against those standards includes earth fault loop impedance
        and RCD performance testing on the generating set's own supply, which requires an installation
        tester and an A-grade electrical licence. Those tests were <strong>not</strong> performed and
        are outside the scope of this report.
      </p>
      <p style="margin-top:8px;">
        Any cord-connected equipment and cord assemblies supplied by this generating set have been
        separately inspected and tested to AS/NZS 3760:2022 where listed on the accompanying
        Test &amp; Tag certificate. This report does not certify the generating set as safe or
        compliant, and does not substitute for inspection by a licensed electrical contractor.
      </p>
    </div>

    <div class="signatures">
      <div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(job.testerName)}</div>
        <div class="sig-label">Inspected By &mdash; Signature &amp; Date</div>
      </div>
      ${clientSignatureBlockHtml(job)}
    </div>

    <div class="footer-note">
      Generated by the ZoltanStudios Test &amp; Tag Records app on ${escapeHtml(formatDisplayDate(new Date().toISOString().slice(0, 10)))}.
      ${job.meggerEquipment ? `Insulation/continuity testing performed with ${escapeHtml(job.meggerEquipment)}.` : ""}
    </div>`;
  return docShell(`Generator Inspection - ${job.clientName || "Untitled"} - ${job.testDate}`, body);
}
function GeneratorPanel({
  generator,
  onChange,
  inputCls
}) {
  // Older saved jobs won't have a generator object, or may have a partial one.
  // Merge over defaults so every field is always defined.
  const g = {
    ...blankGenerator(),
    ...(generator || {})
  };
  const [showGenSteps, setShowGenSteps] = React.useState(false);
  const set = k => e => onChange({
    [k]: e.target.value
  });
  const setBool = k => e => onChange({
    [k]: e.target.checked
  });
  const lbl = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const isInverter = g.generatorType === "inverter";

  // Live threshold feedback
  const irCheck = v => {
    const n = parseFloat(v);
    if (v === "" || isNaN(n)) return null;
    return n >= 1 ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-emerald-600 font-semibold"
    }, "✓ ≥1MΩ") : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-red-600 font-semibold"
    }, "⚠ below 1MΩ minimum");
  };
  const ecCheck = v => {
    const n = parseFloat(v);
    if (v === "" || isNaN(n)) return null;
    return n <= 1 ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-emerald-600 font-semibold"
    }, "✓ ≤1Ω") : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-red-600 font-semibold"
    }, "⚠ above 1Ω maximum");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Generator Inspection")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5"
  }, "⚠ This produces an ", /*#__PURE__*/React.createElement("strong", null, "inspection report"), ", not a compliance certificate. Loop impedance and RCD performance testing on the generating set’s own supply require an installation tester and an A-grade licence, and are outside this scope."), (function () {
  var S = function (p) {
    return React.createElement('div', {
      className: 'mb-4'
    }, React.createElement('div', {
      className: 'font-semibold text-slate-800 text-sm mb-1'
    }, p.n), React.createElement('div', {
      className: 'text-slate-600 leading-relaxed'
    }, p.children));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      setShowGenSteps(function (v) {
        return !v;
      });
    },
    className: "w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-900 text-sm flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15,
    className: "text-amber-600"
  }), "Step-by-Step: How to Inspect a Generator"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, showGenSteps ? "Hide" : "Show")), showGenSteps && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-4 text-sm space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-red-800 mb-1"
  }, "Before you start"), /*#__PURE__*/React.createElement("div", {
    className: "text-red-700 text-xs leading-relaxed"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("strong", null, "1. Stop the engine and make sure it cannot restart."), " Shut it down and let it cool. On a petrol set, pull the ", /*#__PURE__*/React.createElement("strong", null, "spark plug lead"), " \u2014 the rubber boot that pushes onto the spark plug on the engine \u2014 so it physically cannot fire while you work. On a diesel set there is no spark plug: turn the key off and pull the battery isolator or the negative terminal instead."), /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("strong", null, "2. Unplug everything from the 240V outlets."), " Every reading below must be taken with the sockets ", /*#__PURE__*/React.createElement("strong", null, "empty"), ". Anything left plugged in will skew the insulation reading (you would be measuring the appliance, not the generator) and the megger voltage can damage it."), /*#__PURE__*/React.createElement("div", null, "Every test below is done with the machine ", /*#__PURE__*/React.createElement("strong", null, "off, not running, and nothing plugged in"), ". Never megger a running generator."))), /*#__PURE__*/React.createElement(S, {
    n: "1. Visual inspection"
  }, "Check the enclosure, frame and handles for cracks or damage. Look closely at every outlet socket for burn marks, cracked plastic, or bent/loose pins. Check the cord glands where any flexible cord enters the machine — the gland should be tight and the cord should not move or show cracking at the entry. Look for an earth stake terminal and note whether a stake is actually fitted and connected on site. Anything damaged, mark it fail and describe it in Findings."), /*#__PURE__*/React.createElement(S, {
    n: "2. Is it an inverter generator?"
  }, "This decides whether you can megger it at all. Inverter sets (Honda EU-series, Yamaha EF-i, most small quiet suitcase gensets) have an electronic inverter board on the output. Conventional sets have an AVR (automatic voltage regulator). ", /*#__PURE__*/React.createElement("strong", null, "A megger will destroy either one"), " if it is still connected. Set the Type field accordingly."), /*#__PURE__*/React.createElement(S, {
    n: "3. Insulation resistance — only if you can disconnect the electronics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, "You have two honest options here, and the two tick boxes match them:"), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3 mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-700 text-xs mb-1"
  }, "Option A — you CAN disconnect it"), "Open the control panel and physically unplug or unbolt the AVR / inverter board from the stator windings. Now the megger only sees copper and insulation, nothing electronic. Tick ", /*#__PURE__*/React.createElement("strong", null, "“I have physically disconnected the AVR / inverter board”"), " and record your readings. Reconnect it when you are done."), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-700 text-xs mb-1"
  }, "Option B — you CANNOT disconnect it"), "On many sealed inverter gensets the board is not practically removable on site.", /*#__PURE__*/React.createElement("strong", null, " Do not test."), " Tick ", /*#__PURE__*/React.createElement("strong", null, "“Skip insulation test”"), " instead. The report will state plainly why it was not measured. That is a perfectly professional outcome — guessing and frying a customer’s inverter board is not.")), /*#__PURE__*/React.createElement(S, {
    n: "4. Taking the insulation readings"
  }, "Leads: megger negative/earth to the generator frame, positive to the winding or outlet pin. Test voltage: use ", /*#__PURE__*/React.createElement("strong", null, "500V"), " as standard. Drop to ", /*#__PURE__*/React.createElement("strong", null, "250V"), " if there is any electronics you could not fully isolate. Use ", /*#__PURE__*/React.createElement("strong", null, "1000V"), " only on larger industrial sets with no attached electronics. Apply for about 60 seconds and let the reading settle before recording it.", /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, "Take three readings: winding to frame/earth, then line to earth and neutral to earth at the outlet (nothing plugged in). ", /*#__PURE__*/React.createElement("strong", null, "Minimum is 1 MΩ."), " A healthy set reads tens to hundreds of MΩ. Anything sliding toward 1–5 MΩ means moisture or degrading winding insulation — note it, because that machine is on its way out.")), /*#__PURE__*/React.createElement(S, {
    n: "5. Earth continuity"
  }, "Low-ohm meter. One probe on bare metal of the frame, the other on the earth pin inside each outlet socket. You want ", /*#__PURE__*/React.createElement("strong", null, "1Ω or less"), " — ideally under 0.5Ω. Do the same from frame to the earth stake terminal. A high or open reading means the earth path is broken, which is the one thing standing between the operator and a live frame."), /*#__PURE__*/React.createElement(S, {
    n: "6. Neutral / earth bond — the one that matters most"
  }, "Still with the generator off, measure resistance from ", /*#__PURE__*/React.createElement("strong", null, "neutral to earth"), " at the outlet (probe the N pin and the E pin).", /*#__PURE__*/React.createElement("div", {
    className: "mt-2 bg-emerald-50 rounded-lg p-2 text-xs"
  }, /*#__PURE__*/React.createElement("strong", null, "Near 0Ω"), " → bonded (MEN). Normal. An RCD downstream will trip properly on an earth fault."), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 bg-amber-50 rounded-lg p-2 text-xs"
  }, /*#__PURE__*/React.createElement("strong", null, "Open circuit / megohms"), " → floating (IT system). This is the finding worth flagging. On a floating supply a first earth fault creates no return path, so the RCD sees no imbalance and ", /*#__PURE__*/React.createElement("strong", null, "may never trip"), ". Anyone relying on a plug-in RCD on that genset may have no protection at all. Record it and refer it on.")), /*#__PURE__*/React.createElement(S, {
    n: "7. Test the leads and appliances"
  }, "Everything cord-connected that runs off the generator gets tested normally to AS/NZS 3760 with the Wavecom, at the bench on mains — not off the generator. Add them under “Leads & Appliances” below and they will appear on a standard compliance certificate alongside this inspection report."), /*#__PURE__*/React.createElement(S, {
    n: "8. Write the outcome"
  }, "Pick an overall assessment, then write Findings (what you saw and measured) and Recommendations (what should happen next). Be specific — “no N-E bond detected, refer to licensed electrician to confirm earthing arrangement under AS/NZS 3010” is useful; “needs checking” is not."), /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800 leading-relaxed"
  }, /*#__PURE__*/React.createElement("strong", null, "Scope reminder."), " You are recording measurements and observations, not certifying the generating set. Earth fault loop impedance and RCD performance testing on the generator’s own supply need an installation tester and an A-grade licence. Always refer the earthing arrangement on rather than signing off on it.")));
})(), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Generating Set Details"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 gap-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Make"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.make,
    onChange: set("make"),
    placeholder: "e.g. Honda"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Model"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.model,
    onChange: set("model"),
    placeholder: "e.g. EU22i"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Serial No."), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.serialNumber,
    onChange: set("serialNumber")
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.generatorType,
    onChange: set("generatorType")
  }, /*#__PURE__*/React.createElement("option", {
    value: "conventional"
  }, "Conventional (AVR)"), /*#__PURE__*/React.createElement("option", {
    value: "inverter"
  }, "Inverter"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Rated Output (kVA)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.ratedOutputKva,
    onChange: set("ratedOutputKva"),
    placeholder: "2.2"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Hours Run"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.hoursRun,
    onChange: set("hoursRun"),
    placeholder: "340"
  }))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Visual Inspection"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, [["visualCondition", "General / Enclosure"], ["outletCondition", "Outlet Sockets"], ["cordGlandCondition", "Cord Glands"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} ${g[k] === "fail" ? "border-red-400 bg-red-50" : ""}`,
    value: g[k],
    onChange: set(k)
  }, /*#__PURE__*/React.createElement("option", {
    value: "pass"
  }, "Pass"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Fail"), /*#__PURE__*/React.createElement("option", {
    value: "n/a"
  }, "N/A")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Earth Stake Fitted"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.earthStakeFitted,
    onChange: set("earthStakeFitted")
  }, /*#__PURE__*/React.createElement("option", {
    value: "n/a"
  }, "N/A"), /*#__PURE__*/React.createElement("option", {
    value: "yes"
  }, "Yes"), /*#__PURE__*/React.createElement("option", {
    value: "no"
  }, "No")))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Insulation Resistance (Megger)"), isInverter && !g.irNotMeasured && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
  }, "⚠ ", /*#__PURE__*/React.createElement("strong", null, "Inverter generator."), " Insulation testing can destroy the inverter board. Do not meg the output unless the electronics are physically disconnected — otherwise tick \"not measured\" below."), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-600 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!g.irNotMeasured,
    onChange: setBool("irNotMeasured")
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Skip insulation test"), " — I could not safely disconnect the electronics, so no megger test was performed")), !g.irNotMeasured && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-600 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!g.electronicsDisconnected,
    onChange: setBool("electronicsDisconnected")
  }), /*#__PURE__*/React.createElement("span", null, "I have physically disconnected the AVR / inverter board ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-600 font-semibold"
  }, "(required)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Test Voltage"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.irTestVoltage,
    onChange: set("irTestVoltage")
  }, /*#__PURE__*/React.createElement("option", {
    value: "250"
  }, "250V (electronics present)"), /*#__PURE__*/React.createElement("option", {
    value: "500"
  }, "500V (standard)"), /*#__PURE__*/React.createElement("option", {
    value: "1000"
  }, "1000V (large sets)"))), [["irWindingToEarth", "Winding → Earth"], ["irLineToEarth", "Line → Earth"], ["irNeutralToEarth", "Neutral → Earth"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label, " (MΩ)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g[k],
    onChange: set(k),
    placeholder: ">99"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-0.5"
  }, irCheck(g[k])))))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Earth Continuity"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mb-5"
  }, [["ecFrameToOutletEarth", "Frame → Outlet Earth Pin"], ["ecFrameToEarthStake", "Frame → Earth Stake"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label, " (Ω)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g[k],
    onChange: set(k),
    placeholder: "0.15"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-0.5"
  }, ecCheck(g[k]))))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Neutral / Earth Bond"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mb-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Measured N → E (Ω)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.neBondResistance,
    onChange: set("neBondResistance"),
    placeholder: "0.2 or O/L"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Bond Status"), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} ${g.neBondStatus === "floating" ? "border-amber-400 bg-amber-50" : ""}`,
    value: g.neBondStatus,
    onChange: set("neBondStatus")
  }, /*#__PURE__*/React.createElement("option", {
    value: "unknown"
  }, "Not determined"), /*#__PURE__*/React.createElement("option", {
    value: "bonded"
  }, "Bonded (MEN) — near 0Ω"), /*#__PURE__*/React.createElement("option", {
    value: "floating"
  }, "Floating (IT) — open circuit")))), g.neBondStatus === "floating" && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5"
  }, "⚠ ", /*#__PURE__*/React.createElement("strong", null, "Floating supply."), " An RCD downstream may not trip on a first earth fault — there's no return path to create an imbalance. Flag this to the client; the protection strategy needs a licensed electrician before RCD-protected gear is relied on."), g.neBondStatus !== "floating" && /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Assessment"), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Overall Assessment"), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} font-semibold ${g.overallAssessment === "unsafe" ? "border-red-400 bg-red-50 text-red-700" : g.overallAssessment === "attention" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`,
    value: g.overallAssessment,
    onChange: set("overallAssessment")
  }, /*#__PURE__*/React.createElement("option", {
    value: "satisfactory"
  }, "Satisfactory"), /*#__PURE__*/React.createElement("option", {
    value: "attention"
  }, "Requires Attention"), /*#__PURE__*/React.createElement("option", {
    value: "unsafe"
  }, "Unsafe — Do Not Use"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Findings"), /*#__PURE__*/React.createElement("textarea", {
    className: `${inputCls} min-h-[70px]`,
    value: g.findings,
    onChange: set("findings"),
    placeholder: "What you observed and measured — e.g. no neutral-earth bond detected at outlet; earth stake not fitted at time of inspection."
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Recommendations"), /*#__PURE__*/React.createElement("textarea", {
    className: `${inputCls} min-h-[70px]`,
    value: g.recommendations,
    onChange: set("recommendations"),
    placeholder: "e.g. Refer to licensed electrician to confirm earthing arrangement per AS/NZS 3010 before RCD-protected equipment is used on this supply."
  }))));
}

const blankItem = () => ({
  id: uuid(),
  qrId: generateQrId(),
  // permanent QR identity — never changes on retest
  itemType: "standard",
  // drives pricing category
  assetId: "",
  followUp: false,
  description: "",
  makeModel: "",
  serialNumber: "",
  location: "",
  equipmentClass: "I",
  visual: "pass",
  earthContinuity: "",
  insulationResistance: "",
  insulationTestVoltage: "500",
  leakageCurrent: "",
  rcdTest: "n/a",
  rcdTripTestEnabled: false,
  rcdType: "II",
  rcdTestMode: "time",
  rcdTripCurrentSetting: "30",
  rcdMeasuredTripTimeMs: "",
  rcdMeasuredTripCurrentMa: "",
  overallResult: "pass",
  overrideResult: false,
  notes: ""
});

// ---------------------------------------------------------------------------
// Auto tag numbering. A job carries a tag prefix and a starting number; each
// new item gets the next one in sequence. Handles any format the tester likes
// ("T-001", "ZS100", "A1") by splitting into prefix + numeric tail and
// preserving the original zero-padding width.
// ---------------------------------------------------------------------------

// The tag roll is continuous across jobs, so remember where the last job
// started and default new jobs to that. Falls back to "T-001" only if the
// tester has never set one.
const TAG_START_KEY = "zoltanstudios-last-tag-start-v1";

function lastTagStart() {
  try {
    const v = window.localStorage.getItem(TAG_START_KEY);
    return v === null ? "T-001" : v;
  } catch { return "T-001"; }
}

function rememberTagStart(v) {
  try { window.localStorage.setItem(TAG_START_KEY, String(v)); } catch {}
}

function parseTagPattern(tag) {
  const m = String(tag || "").match(/^(.*?)(\d+)\s*$/);
  if (!m) return null;
  return { prefix: m[1], num: parseInt(m[2], 10), width: m[2].length };
}

function formatTag(prefix, num, width) {
  return prefix + String(num).padStart(width || 1, "0");
}

// Next tag for a job: continues from the highest numbered tag already used,
// otherwise starts from the job's configured start tag.
function nextTagFor(job) {
  const raw = (job.tagStart === undefined || job.tagStart === null) ? "T-001" : String(job.tagStart);
  const start = parseTagPattern(raw) || { prefix: "", num: 1, width: 1 };
  let best = null;
  (job.items || []).forEach((it) => {
    const p = parseTagPattern(it.assetId);
    if (p && p.prefix === start.prefix && (best === null || p.num > best)) best = p.num;
  });
  const next = best === null ? start.num : best + 1;
  return formatTag(start.prefix, next, start.width);
}

// Fields worth inheriting from the previous item — the things that rarely
// change when you're working through one room.
function carryForwardFrom(prev) {
  if (!prev) return {};
  return {
    location: prev.location || "",
    equipmentClass: prev.equipmentClass || "I",
    itemType: prev.itemType || "standard",
    makeModel: prev.makeModel || "",
    insulationTestVoltage: prev.insulationTestVoltage || "500",
    cordLength: prev.cordLength || "",
  };
}

// Tag numbers used more than once in the same job.
function duplicateTags(items) {
  const seen = {}, dupes = {};
  (items || []).forEach((it) => {
    const t = String(it.assetId || "").trim().toLowerCase();
    if (!t) return;
    if (seen[t]) dupes[t] = true;
    seen[t] = true;
  });
  return dupes;
}
