// ======================================================================
// 13-job-model.js
// Job and item model, tag numbering
// ======================================================================

const blankJob = () => ({
  id: uuid(),
  jobType: "test_tag",
  tagStart: lastTagStart(),
  autoTag: true,
  generator: blankGenerator(),
  attachments: [],
  meggerEquipment: effectiveTester().meggerEquipment,
  meggerCalibrationDate: effectiveTester().meggerCalibrationDate,
  certNumber: null,
  // assigned properly in createJob after registry check
  status: "draft",
  folderName: null,
  clientName: "",
  clientCompany: "",
  clientEmail: "",
  clientPhone: "",
  siteAddress: "",
  environment: "office",
  retestMonths: 12,
  testDate: new Date().toISOString().slice(0, 10),
  testerName: effectiveTester().name,
  testerLicense: effectiveTester().license,
  items: [{ ...blankItem(), assetId: lastTagStart() }],
  createdAt: Date.now()
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Looks up the RGBY colour for a given month (0-11), Southern Hemisphere
// seasons: Summer Dec-Feb (Red), Autumn Mar-May (Green), Winter Jun-Aug
// (Blue), Spring Sep-Nov (Yellow).
function rgbyForMonth(month) {
  if (month === 11 || month === 0 || month === 1) {
    return {
      name: "Red",
      hex: "#dc2626",
      bg: "#fef2f2",
      season: "Summer"
    };
  }
  if (month >= 2 && month <= 4) {
    return {
      name: "Green",
      hex: "#16a34a",
      bg: "#f0fdf4",
      season: "Autumn"
    };
  }
  if (month >= 5 && month <= 7) {
    return {
      name: "Blue",
      hex: "#2563eb",
      bg: "#eff6ff",
      season: "Winter"
    };
  }
  return {
    name: "Yellow",
    hex: "#ca8a04",
    bg: "#fefce8",
    season: "Spring"
  };
}

// Tag colour guidance, based on the job's actual retest interval:
//  - <=3 months: the RGBY quarterly system - mandatory under AS/NZS 3012
//    for construction/demolition/mining, common practice elsewhere for
//    genuinely quarterly testing.
//  - 6 months: no legal requirement. Proper convention is Orange or White,
//    but as a TEMPORARY stand-in while those aren't in stock, this reuses
//    the RGBY colour for 3 months from now - deliberately offset so it
//    doesn't collide with whatever colour is being used for real quarterly
//    testing happening right now.
//  - 12 months: no legal requirement - Black is the common convention.
//  - Longer (24/60 months): no real convention exists - pick your own
//    and stay consistent.
function getTagColour(dateStr, retestMonths) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.getMonth(); // 0-11
  const months = retestMonths || 12;
  if (months <= 3) {
    const rgby = rgbyForMonth(month);
    return {
      ...rgby,
      note: `${rgby.season} - RGBY quarterly system`
    };
  }
  if (months <= 6) {
    // Pure month-index arithmetic (not Date.setMonth) - avoids day-of-month
    // overflow bugs, e.g. Nov 30 + 3 calendar months would otherwise roll
    // into March instead of February, since February doesn't have 30 days.
    const futureMonth = (month + 3) % 12;
    const rgby = rgbyForMonth(futureMonth);
    return {
      name: rgby.name,
      hex: rgby.hex,
      bg: rgby.bg,
      note: `Temporary stand-in for 6-monthly (no orange/white in stock) - using the ${rgby.season} RGBY colour, 3 months ahead so it won't be mistaken for a quarterly-tested item`
    };
  }
  if (months <= 12) {
    return {
      name: "Black",
      hex: "#1e293b",
      bg: "#f1f5f9",
      note: "Common convention for 12-monthly testing (not legally required)"
    };
  }
  return {
    name: "Your choice",
    hex: "#6b7280",
    bg: "#f9fafb",
    note: "No fixed convention beyond 12 months - pick a colour and stay consistent"
  };
}

// Suggests a pass/fail based on the Wavecom TnT RCD's documented limits
// (Earth Bond <1.0Ω @200mA, Insulation >1MΩ @250V/500V, Leakage Class I
// <=5mA / Class II <=1mA, RCD Type I <40ms or <10mA / Type II <300ms or
// <30mA). This is a starting point only - the tester's judgement always
// overrides it.
function suggestResult(item) {
  if (item.visual === "fail") return "fail";
  if (item.equipmentClass === "I") {
    const earth = parseFloat(item.earthContinuity);
    if (item.earthContinuity !== "" && !isNaN(earth) && earth > 1) return "fail";
  }
  const insulation = parseFloat(item.insulationResistance);
  if (item.insulationResistance !== "" && !isNaN(insulation) && insulation < 1) return "fail";
  const leakage = parseFloat(item.leakageCurrent);
  if (item.leakageCurrent !== "" && !isNaN(leakage)) {
    const leakageLimit = item.equipmentClass === "II" ? 1 : 5; // mA - per Wavecom spec
    if (leakage > leakageLimit) return "fail";
  }
  if (item.rcdTest === "fail") return "fail";
  if (item.rcdTripTestEnabled) {
    const isTypeI = item.rcdType === "I";
    if (item.rcdTestMode === "time") {
      const tripTime = parseFloat(item.rcdMeasuredTripTimeMs);
      const limit = isTypeI ? 40 : 300; // ms
      if (item.rcdMeasuredTripTimeMs !== "" && !isNaN(tripTime) && tripTime > limit) return "fail";
    } else if (item.rcdTestMode === "ramp") {
      const tripCurrentRaw = parseFloat(item.rcdMeasuredTripCurrentMa);
      const limit = isTypeI ? 10 : 30; // mA
      if (item.rcdMeasuredTripCurrentMa !== "" && !isNaN(tripCurrentRaw)) {
        const compensated = tripCurrentRaw + 2; // tester's nominal 2mA leakage, per manual
        if (compensated > limit) return "fail";
      }
    }
  }
  return "pass";
}
async function loadJobs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function persistJobs(jobs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------------------

function ResultBadge({
  result
}) {
  const isPass = result === "pass";
  return /*#__PURE__*/React.createElement("span", {
    className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`
  }, isPass ? /*#__PURE__*/React.createElement(CheckCircle2, {
    size: 13
  }) : /*#__PURE__*/React.createElement(XCircle, {
    size: 13
  }), isPass ? "PASS" : "FAIL");
}
function Field({
  label,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `flex flex-col gap-1 ${className}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-500 uppercase tracking-wide"
  }, label), children);
}
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// ---------------------------------------------------------------------------
// Job List View
// ---------------------------------------------------------------------------

function TesterSettingsModal({
  onClose
}) {
  var init = effectiveTester();
  var st = React.useState(init);
  var f = st[0],
    setF = st[1];
  var sv = React.useState(false);
  var saved = sv[0],
    setSaved = sv[1];
  var lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';
  var inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  function set(k) {
    return function (e) {
      setF(Object.assign({}, f, {
        [k]: e.target.value
      }));
      setSaved(false);
    };
  }
  function doSave() {
    saveTesterSettings(f);
    setSaved(true);
    setTimeout(onClose, 700);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg",
    onClick: function (e) {
      e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-slate-200 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-slate-900 text-lg"
  }, "Tester Defaults"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-0.5"
  }, "Used to pre-fill every new job. Existing jobs are not changed.")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-slate-600 text-xl leading-none"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Tester Name"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.name,
    onChange: set('name')
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Licence / Certificate No."), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.license,
    onChange: set('license')
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Test Equipment"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.testEquipment,
    onChange: set('testEquipment'),
    placeholder: "Wavecom TnT RCD"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Calibration Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inp,
    value: f.testEquipmentCalibrationDate,
    onChange: set('testEquipmentCalibrationDate')
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Insulation Tester (Megger)"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.meggerEquipment,
    onChange: set('meggerEquipment'),
    placeholder: "e.g. Kyoritsu 3005A"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Megger Calibration Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inp,
    value: f.meggerCalibrationDate,
    onChange: set('meggerCalibrationDate')
  }))), (function () {
  return React.createElement('div', null, React.createElement('label', {
    className: lbl
  }, 'Your Signature'), React.createElement(SignaturePad, {
    value: f.signature,
    onChange: function (v) {
      setF(Object.assign({}, f, {
        signature: v
      }));
      setSaved(false);
    }
  }), React.createElement('p', {
    className: 'text-xs text-slate-400 mt-1'
  }, 'Drawn once and applied to every certificate you issue.'));
})()), /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-4 border-t border-slate-100 flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: doSave,
    className: "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg"
  }, saved ? 'Saved' : 'Save defaults'))));
}
