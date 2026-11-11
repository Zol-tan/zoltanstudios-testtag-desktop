// ======================================================================
// 15-job-form.js
// Job form and item table
// ======================================================================

function JobFormView({
  job: initialJob,
  onCancel,
  onSave,
  onViewReport,
  folderStatus,
  folderName
}) {
  const [job, setJob] = useState(initialJob);
  // Repair parts - shared with the desktop app via the server.
  const partsCat = usePartsCatalogue();
  const [saving, setSaving] = useState(false);
  const [showQuickRef, setShowQuickRef] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [pickerItemId, setPickerItemId] = useState(null); // which item row has the picker open

  // --- Unsaved-changes guard -------------------------------------------
  // Track whether the in-memory job differs from what was last saved, and
  // warn before the tab/window closes. Losing a 40-item job hurts.
  const [dirty, setDirty] = useState(false);
  const savedSnapshot = React.useRef(JSON.stringify(initialJob));

  React.useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const guardedCancel = () => {
    if (dirty && !window.confirm("You have unsaved changes on this job. Leave without saving?")) return;
    onCancel();
  };

  const update = patch => setJob(j => {
    const next = { ...j, ...patch };
    if (JSON.stringify(next) !== savedSnapshot.current) setDirty(true);
    return next;
  });
  const setEnvironment = value => {
    const env = ENVIRONMENTS.find(e => e.value === value);
    update({
      environment: value,
      retestMonths: env ? env.months : job.retestMonths
    });
  };
  const updateItem = (id, patch) => {
    setDirty(true);
    setJob(j => ({
      ...j,
      items: j.items.map(it => {
        if (it.id !== id) return it;
        const merged = {
          ...it,
          ...patch
        };
        if (!merged.overrideResult) {
          merged.overallResult = suggestResult(merged);
        }
        return merged;
      })
    }));
  };
  const addItem = () => setJob(j => {
    const prev = j.items && j.items.length ? j.items[j.items.length - 1] : null;
    const fresh = {
      ...blankItem(),
      ...(j.autoTag !== false ? { assetId: nextTagFor(j) } : {}),
      ...carryForwardFrom(prev),
    };
    return { ...j, items: [...j.items, fresh] };
  });
  const removeItem = id => setJob(j => ({
    ...j,
    items: j.items.filter(it => it.id !== id)
  }));
  const nextTestDate = addMonths(job.testDate, job.retestMonths);
  const tagColour = getTagColour(job.testDate, job.retestMonths);
  const failCount = job.items.filter(i => i.overallResult === "fail").length;
  const dupTags = duplicateTags(job.items);
  const handleSave = async goToReport => {
    setSaving(true);
    await onSave(job);
    savedSnapshot.current = JSON.stringify(job);
    setDirty(false);
    setSaving(false);
    if (goToReport) onViewReport(job.id);
  };
  const handleExportZip = async () => {
    setSaving(true);
    await onSave(job);
    savedSnapshot.current = JSON.stringify(job);
    setDirty(false);
    setSaving(false);
    exportJobAsZip(job);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, pickerItemId && /*#__PURE__*/React.createElement(AppliancePickerModal, {
    onSelect: appliance => {
      updateItem(pickerItemId, Object.assign({
        description: appliance.label,
        equipmentClass: appliance.equipmentClass,
        itemType: appliance.itemType
      }, likelySurgeProtected({ description: appliance.label }) ? { insulationTestVoltage: "250" } : {}));
    },
    onClose: () => setPickerItemId(null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto p-4 md:p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: guardedCancel,
    className: "inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    size: 16
  }), " Back to all jobs"), dirty && /*#__PURE__*/React.createElement("span", {
  className: "ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
}, "Unsaved"), job.certNumber && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, "Certificate No."), /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-sm tracking-widest"
  }, job.certNumber))), (function () {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900 mb-3"
  }, "Job Type"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, JOB_TYPES.map(function (t) {
    var active = (job.jobType || "test_tag") === t.value;
    var isGen = t.value === "generator_inspection";
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: function () {
        update({
          jobType: t.value
        });
      },
      className: "text-left px-4 py-3 rounded-xl border-2 transition-colors " + (active ? isGen ? "border-amber-500 bg-amber-50" : "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-semibold text-sm " + (active ? isGen ? "text-amber-800" : "text-blue-800" : "text-slate-700")
    }, isGen ? "⚙️ Generator Inspection" : "⚡ Test & Tag"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500 mt-0.5"
    }, isGen ? "Inspection report — AS/NZS 3010 observations" : "Compliance certificate — AS/NZS 3760:2022"));
  })), /*#__PURE__*/React.createElement(SiteModePicker, {
    job: job,
    update: update
  }));
})(), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Client & Site Details"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500 uppercase tracking-wide"
  }, "Cert #"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-slate-800 text-sm"
  }, job.certNumber || "—"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
  }, (function () {
  return React.createElement(Field, {
    label: 'Tag Numbering'
  }, React.createElement('div', {
    className: 'flex gap-2 items-center'
  }, React.createElement('input', {
    className: inputCls + ' flex-1',
    value: job.tagStart === undefined ? 'T-001' : job.tagStart,
    onChange: function (e) {
      update({
        tagStart: (rememberTagStart(e.target.value), e.target.value),
        items: (function () {
          const pat = parseTagPattern(e.target.value);
          if (!pat) return job.items;
          // Renumber sequentially from the new start. Items the tester has
          // typed a tag into by hand are left alone.
          let n = pat.num;
          return job.items.map(function (it) {
            if (it._tagManual) return it;
            const tag = formatTag(pat.prefix, n, pat.width);
            n += 1;
            return { ...it, assetId: tag };
          });
        })()
      });
    },
    placeholder: 'T-001',
    title: 'Starting tag number. New items continue the sequence automatically.'
  }), React.createElement('label', {
    className: 'flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap'
  }, React.createElement('input', {
    type: 'checkbox',
    checked: job.autoTag !== false,
    onChange: function (e) {
      update({
        autoTag: e.target.checked
      });
    }
  }), 'Auto')), React.createElement('p', {
    className: 'text-xs text-slate-400 mt-1'
  }, job.autoTag !== false ? 'Next tag: ' + nextTagFor(job) : 'Auto numbering off — enter tag numbers manually'));
})(), /*#__PURE__*/React.createElement(Field, {
    label: "Client Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.clientName,
    onChange: e => update({
      clientName: e.target.value
    }),
    placeholder: "Jane Smith"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Company / Business Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.clientCompany,
    onChange: e => update({
      clientCompany: e.target.value
    }),
    placeholder: "Smith & Co Pty Ltd"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Site Address"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.siteAddress,
    onChange: e => update({
      siteAddress: e.target.value
    }),
    placeholder: "123 Example St, Melbourne VIC"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Client Email"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "email",
    value: job.clientEmail,
    onChange: e => update({
      clientEmail: e.target.value
    }),
    placeholder: "jane@example.com"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Client Phone"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.clientPhone,
    onChange: e => update({
      clientPhone: e.target.value
    }),
    placeholder: "04XX XXX XXX"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Test Date"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inputCls,
    value: job.testDate,
    onChange: e => update({
      testDate: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Environment Type"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: job.environment,
    onChange: e => setEnvironment(e.target.value)
  }, ENVIRONMENTS.map(e => /*#__PURE__*/React.createElement("option", {
    key: e.value,
    value: e.value
  }, e.label)))), /*#__PURE__*/React.createElement(Field, {
    label: "Retest Interval (months)"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    className: inputCls,
    value: job.retestMonths,
    onChange: e => update({
      retestMonths: parseInt(e.target.value) || 1
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Next Test Due"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center h-[38px] px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
  }, formatDisplayDate(nextTestDate))), /*#__PURE__*/React.createElement(Field, {
    label: "Tag Colour to Use"
  }, tagColour ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 h-[38px] px-3 rounded-lg border text-sm font-semibold",
    style: {
      backgroundColor: tagColour.bg,
      borderColor: tagColour.hex,
      color: tagColour.hex
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-3 h-3 rounded-full border border-black/10",
    style: {
      backgroundColor: tagColour.hex
    }
  }), tagColour.name), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-400 mt-1"
  }, tagColour.note)) : /*#__PURE__*/React.createElement("div", {
    className: "flex items-center h-[38px] px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-400"
  }, "Set a test date first")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900 mb-4"
  }, "Tester Details"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Tester Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.testerName,
    onChange: e => update({
      testerName: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Licence / Qualification No."
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: job.testerLicense,
    onChange: e => update({
      testerLicense: e.target.value
    })
  })), job.jobType === "generator_inspection" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
  label: "Insulation Tester (Megger)"
}, /*#__PURE__*/React.createElement("input", {
  className: inputCls,
  value: job.meggerEquipment || "",
  placeholder: "e.g. Kyoritsu 3005A 1000V",
  onChange: function (e) {
    update({
      meggerEquipment: e.target.value
    });
  }
})), /*#__PURE__*/React.createElement(Field, {
  label: "Megger Calibration Date"
}, /*#__PURE__*/React.createElement("input", {
  type: "date",
  className: inputCls,
  value: job.meggerCalibrationDate || "",
  onChange: function (e) {
    update({
      meggerCalibrationDate: e.target.value
    });
  }
}))))), job.jobType === "generator_inspection" && /*#__PURE__*/React.createElement(GeneratorPanel, {
  generator: job.generator || blankGenerator(),
  inputCls: inputCls,
  onChange: function (patch) {
    update({
      generator: Object.assign({}, blankGenerator(), job.generator || {}, patch)
    });
  }
}), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowQuickRef(s => !s),
    className: "w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-900 text-sm flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(ClipboardList, {
    size: 15,
    className: "text-blue-600"
  }), "Wavecom TnT RCD Quick Reference"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, showQuickRef ? "Hide" : "Show")), showQuickRef && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-4 text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "Earth Bond (Class I only)"), /*#__PURE__*/React.createElement("div", null, "200mA test current · pass < 1.0Ω")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "Insulation Resistance"), /*#__PURE__*/React.createElement("div", null, "500VDC (or 250V for surge-protected/MOV gear) · pass > 1MΩ")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "Leakage Current"), /*#__PURE__*/React.createElement("div", null, "Class I: pass ≤ 5mA · Class II: pass ≤ 1mA")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "Extension Lead Continuity/Polarity"), /*#__PURE__*/React.createElement("div", null, "250VAC check · pass/fail only, no numeric reading")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "RCD Type I (medical circuits, AS3551)"), /*#__PURE__*/React.createElement("div", null, "Trip time < 40ms · trip current < 10mA")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800"
  }, "RCD Type II (standard, default)"), /*#__PURE__*/React.createElement("div", null, "Trip time < 300ms · trip current < 30mA")), /*#__PURE__*/React.createElement("div", {
    className: "sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-amber-800"
  }, "⚠ N-E Indicator LED"), /*#__PURE__*/React.createElement("div", {
    className: "text-amber-700"
  }, "If the centre N-E LED is red, DO NOT PROCEED with load/leakage tests - this means a voltage difference between neutral and earth, or no earth connected. Visual/Earth Bond/Insulation tests are generally still safe to run. Consult a licensed electrician if unsure.")), /*#__PURE__*/React.createElement("div", {
    className: "sm:col-span-2 text-xs text-slate-400"
  }, "Ramp test note: the tester has a nominal 2mA leakage - add this to your reading before comparing to the trip current limit (handled automatically if you use the RCD Trip Test fields below). Always complete the Visual Inspection first - a visual fail means no further tests are needed; tag DANGER and remove from service immediately."))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowSteps(s => !s),
    className: "w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-900 text-sm flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15,
    className: "text-blue-600"
  }), "Step-by-Step: How to Run Each Test"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, showSteps ? "Hide" : "Show")), showSteps && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-4 text-sm text-slate-600 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-amber-800 mb-1"
  }, "0. Visual Inspection (always first)"), /*#__PURE__*/React.createElement("div", {
    className: "text-amber-700"
  }, "Check cord, plug, casing, switches for damage. Fail here = stop completely, tag DANGER, remove from service - no other tests needed.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Class I / Earthed Test — Menu A, F1"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Plug the appliance into the tester's appliance socket"), /*#__PURE__*/React.createElement("li", null, "Clip the earth lead onto exposed metal on the appliance (or use a metal mesh braid)"), /*#__PURE__*/React.createElement("li", null, "Menu A → press F1 to start"), /*#__PURE__*/React.createElement("li", null, "Runs Earth Bond + Insulation automatically - read and record the result"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Class II / Double Insulated Test — Menu A, F2"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Check the compliance plate for the double-insulated (□ inside □) symbol"), /*#__PURE__*/React.createElement("li", null, "Plug the appliance into the appliance socket"), /*#__PURE__*/React.createElement("li", null, "Menu A → press F2 to start"), /*#__PURE__*/React.createElement("li", null, "Read and record the result"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Extension Lead / Power Board Test — Menu A, F3"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Uncoil the lead fully before testing"), /*#__PURE__*/React.createElement("li", null, "Plug the orange IEC-550 adaptor lead into the tester's IEC socket"), /*#__PURE__*/React.createElement("li", null, "Plug the lead/power board's male end into the appliance socket, and connect the orange lead to the far end"), /*#__PURE__*/React.createElement("li", null, "Menu A → press F3 to start"), /*#__PURE__*/React.createElement("li", null, "Runs Earth Bond + Insulation + Continuity/Polarity automatically"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Leakage Test — Menu B, F2"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Make sure the appliance is secured - it will power on and operate during this test"), /*#__PURE__*/React.createElement("li", null, "Plug into the appliance socket (plus earth clip if it's Class I)"), /*#__PURE__*/React.createElement("li", null, "Menu B → F2, then pick F1 (earth leakage), F2 (double insulated/leads), or F3 (RCD leakage)"), /*#__PURE__*/React.createElement("li", null, "Confirm the on-screen safety warning, press F3 to power the appliance and run the test"), /*#__PURE__*/React.createElement("li", null, "Read and record the leakage reading in mA"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "RCD Trip Time Test — Menu B, F3 then F1"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Menu B → F3 to open the RCD menu, then F1 for Time Test"), /*#__PURE__*/React.createElement("li", null, "Press F3 to open options - set the trip current and RCD Type (I or II)"), /*#__PURE__*/React.createElement("li", null, "Select the phase to test (0° or 180°) - test both phases"), /*#__PURE__*/React.createElement("li", null, "Press F3 to trip the RCD - trip time in ms is recorded automatically"), /*#__PURE__*/React.createElement("li", null, "Retest the other phase before printing/recording"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "RCD Ramp Test — Menu B, F3 then F2"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-inside space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, "Menu B → F3 to open the RCD menu, then F2 for Ramp Test"), /*#__PURE__*/React.createElement("li", null, "Press F2 to set RCD Type (I or II) and turn Portable RCD (PRCD) on if testing a portable unit"), /*#__PURE__*/React.createElement("li", null, "Press F3 - current ramps up until the RCD trips, trip current is shown on screen"), /*#__PURE__*/React.createElement("li", null, "Add 2mA to the displayed reading (tester's nominal leakage) before comparing to the pass/fail limit"))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 border-t border-slate-100 pt-3"
  }, "Use the Enter button on the tester to switch between Menu A and Menu B. All Menu B tests require mains power - they won't run on battery."))), IS_HOSTED && /*#__PURE__*/React.createElement(CapturePanel, {
  job: job,
  onAttach: function (list, removeId) {
    if (removeId) {
      update({
        attachments: (job.attachments || []).filter(function (a) {
          return a.id !== removeId;
        })
      });
      return;
    }
    var existing = job.attachments || [];
    var have = {};
    existing.forEach(function (a) {
      have[a.id] = true;
    });
    var add = list.filter(function (a) {
      return !have[a.id];
    });
    if (add.length) update({
      attachments: existing.concat(add)
    });
  }
}), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4 flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Equipment Items ", /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 font-normal"
  }, "(", job.items.length, ")")), failCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    size: 14
  }), " ", failCount, " item", failCount === 1 ? "" : "s", " failed")), (function () {
  var flagged = (job.items || []).filter(function (i) {
    return i.followUp;
  });
  if (!flagged.length) return null;
  return React.createElement('div', {
    className: 'bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 flex items-start gap-2'
  }, React.createElement('span', {
    className: 'text-amber-600 text-sm'
  }, '⚑'), React.createElement('div', {
    className: 'text-xs text-amber-800 leading-relaxed'
  }, React.createElement('strong', null, flagged.length + ' item' + (flagged.length === 1 ? '' : 's') + ' flagged to come back to: '), flagged.map(function (i) {
    return (i.assetId || 'untagged') + (i.description ? ' (' + i.description + ')' : '');
  }).join(', ')));
})(), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm border-collapse",
    style: {
      minWidth: "780px"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-8"
  }, "#"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Description"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-20"
  }, "Tag No."), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-16"
  }, "Class"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-20"
  }, "Visual"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-24"
  }, "Earth (Ω)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-24"
  }, "Insul. (MΩ)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-20"
  }, "RCD"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2 w-24"
  }, "Result"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 w-8"
  }))), /*#__PURE__*/React.createElement("tbody", null, job.items.map((item, idx) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: item.id
  }, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 align-top"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-1 text-xs text-slate-400 font-medium"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateItem(item.id, {
      _expanded: !item._expanded
    }),
    className: "w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100",
    title: "Show/hide extra fields (make, model, serial, location, type, part fitted)"
  }, item._expanded ? "▾" : "▸"), (function () {
  return React.createElement('button', {
    type: 'button',
    title: item.followUp ? 'Flagged to come back to — click to clear' : 'Flag to come back to this item',
    onClick: function () {
      updateItem(item.id, {
        followUp: !item.followUp
      });
    },
    className: 'w-6 h-5 rounded flex items-center justify-center text-xs transition-colors ' + (item.followUp ? 'text-amber-600' : 'text-slate-200 hover:text-amber-400')
  }, item.followUp ? '⚑' : '⚐');
})()), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPickerItemId(item.id),
    className: "shrink-0 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors",
    title: "Pick appliance from list — auto-fills description, class and pricing"
  }, "Pick"), /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 flex-1`,
    value: item.description,
    onChange: e => updateItem(item.id, {
      description: e.target.value
    }),
    placeholder: "e.g. Kettle — or click Pick"
  }))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 ${dupTags[String(item.assetId||"").trim().toLowerCase()] ? "border-red-400 bg-red-50 text-red-700 font-semibold" : ""}`,
    value: item.assetId,
    onChange: e => updateItem(item.id, {
      assetId: e.target.value,
      _tagManual: true
    }),
    title: dupTags[String(item.assetId||"").trim().toLowerCase()] ? "This tag number is used more than once in this job" : "",
    placeholder: `T-${String(idx + 1).padStart(3, "0")}`
  }), dupTags[String(item.assetId||"").trim().toLowerCase()] && /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-red-600 font-semibold mt-0.5"
  }, "Duplicate")), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1.5`,
    value: item.equipmentClass,
    onChange: e => updateItem(item.id, {
      equipmentClass: e.target.value
    })
  }, EQUIPMENT_CLASSES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1.5`,
    value: item.visual,
    onChange: e => updateItem(item.id, {
      visual: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "pass"
  }, "Pass"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Fail"))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5`,
    value: item.earthContinuity,
    onChange: e => updateItem(item.id, {
      earthContinuity: e.target.value
    }),
    disabled: item.equipmentClass !== "I",
    placeholder: item.equipmentClass === "I" ? "0.xx" : "n/a"
  }), item.equipmentClass === "I" && /*#__PURE__*/React.createElement(PresetChips, {
    values: ["0.05", "0.1", "0.2"],
    onPick: function (v) { updateItem(item.id, { earthContinuity: v }); }
  })), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 mb-1`,
    value: item.insulationResistance,
    onChange: e => updateItem(item.id, {
      insulationResistance: e.target.value
    }),
    placeholder: ">1"
  }), /*#__PURE__*/React.createElement(PresetChips, {
    values: [">99", "50", "10"],
    onPick: function (v) { updateItem(item.id, { insulationResistance: v }); }
  }), /*#__PURE__*/React.createElement("select", {
    className: "w-full text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-500",
    value: item.insulationTestVoltage,
    onChange: e => updateItem(item.id, {
      insulationTestVoltage: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "500"
  }, "500V"), /*#__PURE__*/React.createElement("option", {
    value: "250"
  }, "250V (MOV)"))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1.5 mb-1`,
    value: item.rcdTest,
    onChange: e => updateItem(item.id, {
      rcdTest: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "n/a"
  }, "N/A"), /*#__PURE__*/React.createElement("option", {
    value: "pass"
  }, "Pass"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Fail")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateItem(item.id, {
      rcdTripTestEnabled: !item.rcdTripTestEnabled
    }),
    className: `w-full text-[10px] rounded px-1 py-0.5 font-semibold transition-colors ${item.rcdTripTestEnabled ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`
  }, item.rcdTripTestEnabled ? "Trip ✓" : "+ Trip")), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/React.createElement(ResultBadge, {
    result: itemStatus(item)
  }), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1 text-[10px] text-slate-400"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: item.overrideResult,
    onChange: e => updateItem(item.id, {
      overrideResult: e.target.checked
    })
  }), "Override"), item.overrideResult && /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1 text-xs`,
    value: item.overallResult,
    onChange: e => updateItem(item.id, {
      overallResult: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "pass"
  }, "Pass"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Fail")))), /*#__PURE__*/React.createElement("td", {
    className: "py-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => removeItem(item.id),
    className: "p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors",
    title: "Remove item"
  }, /*#__PURE__*/React.createElement(Trash2, {
    size: 15
  })))), /*#__PURE__*/React.createElement(ItemChecksRow, {
    item: item,
    job: job,
    parts: partsCat,
    inputCls: inputCls,
    onChange: patch => updateItem(item.id, patch)
  }), item._expanded && /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-slate-50"
  }, /*#__PURE__*/React.createElement("td", null), /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    className: "py-3 px-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs"
  }, QR_LABELS_ENABLED && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "QR ID"), /*#__PURE__*/React.createElement("div", {
    className: "font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-center"
  }, item.qrId || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Item Type (pricing)"), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1 text-xs`,
    value: item.itemType || "standard",
    onChange: e => updateItem(item.id, {
      itemType: e.target.value
    })
  }, ITEM_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.value,
    value: t.value
  }, t.label.split(" (")[0])))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Make / Model"), /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1`,
    value: item.makeModel,
    onChange: e => updateItem(item.id, {
      makeModel: e.target.value
    }),
    placeholder: "e.g. Breville"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Serial No."), /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1`,
    value: item.serialNumber,
    onChange: e => updateItem(item.id, {
      serialNumber: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Location"), /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1`,
    value: item.location,
    onChange: e => updateItem(item.id, {
      location: e.target.value
    }),
    placeholder: "e.g. Kitchen"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Leakage (mA)"), /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1`,
    value: item.leakageCurrent,
    onChange: e => updateItem(item.id, {
      leakageCurrent: e.target.value
    })
  })), /*#__PURE__*/React.createElement(PartFittedSelect, {
    item: item,
    parts: partsCat,
    inputCls: inputCls,
    onChange: partId => updateItem(item.id, { partId: partId })
  })))), item.rcdTripTestEnabled && /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-blue-50/50"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 10,
    className: "py-3 px-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-semibold text-blue-800 uppercase tracking-wide flex items-center gap-1 self-center"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    size: 12
  }), " RCD Trip Test"), /*#__PURE__*/React.createElement(Field, {
    label: "RCD Type",
    className: "w-32"
  }, /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1.5 text-sm`,
    value: item.rcdType,
    onChange: e => updateItem(item.id, {
      rcdType: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "II"
  }, "Type II (standard, <300ms / <30mA)"), /*#__PURE__*/React.createElement("option", {
    value: "I"
  }, "Type I (medical, <40ms / <10mA)"))), /*#__PURE__*/React.createElement(Field, {
    label: "Test Mode",
    className: "w-36"
  }, /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} py-1.5 text-sm`,
    value: item.rcdTestMode,
    onChange: e => updateItem(item.id, {
      rcdTestMode: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "time"
  }, "Trip Time Test"), /*#__PURE__*/React.createElement("option", {
    value: "ramp"
  }, "Ramp Test"))), item.rcdTestMode === "time" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Trip Current Set (mA)",
    className: "w-32"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 text-sm`,
    value: item.rcdTripCurrentSetting,
    onChange: e => updateItem(item.id, {
      rcdTripCurrentSetting: e.target.value
    }),
    placeholder: "30"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Measured Trip Time (ms)",
    className: "w-36"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 text-sm`,
    value: item.rcdMeasuredTripTimeMs,
    onChange: e => updateItem(item.id, {
      rcdMeasuredTripTimeMs: e.target.value
    }),
    placeholder: item.rcdType === "I" ? "<40" : "<300"
  }))) : /*#__PURE__*/React.createElement(Field, {
    label: "Measured Trip Current (mA)",
    className: "w-40"
  }, /*#__PURE__*/React.createElement("input", {
    className: `${inputCls} py-1.5 text-sm`,
    value: item.rcdMeasuredTripCurrentMa,
    onChange: e => updateItem(item.id, {
      rcdMeasuredTripCurrentMa: e.target.value
    }),
    placeholder: "reading before +2mA"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateItem(item.id, {
      rcdTripTestEnabled: false
    }),
    className: "text-xs text-slate-400 hover:text-red-600 underline"
  }, "Remove trip test")), item.rcdTestMode === "ramp" && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-blue-700 mt-2"
  }, "The tester has a nominal 2mA leakage - this is added to your reading automatically when checking pass/fail (e.g. tripped at 22mA reads as 24mA).")))))))), /*#__PURE__*/React.createElement("button", {
    onClick: addItem,
    className: "mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm"
  }, /*#__PURE__*/React.createElement(Plus, {
    size: 16
  }), " Add item"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3"
  }, "Pass/fail suggestions use general thresholds (earth continuity ≤ 1Ω, insulation resistance ≥ 1MΩ, leakage current ≤ 5mA) as a starting point only. Always apply your own professional judgement and the current AS/NZS 3760 requirements — use \"Override\" for any item where your assessment differs.")), /*#__PURE__*/React.createElement(FixedRcdPanel, {
    job: job,
    onChange: v => update({
      fixedRcd: v
    })
  }), /*#__PURE__*/React.createElement(EmergencyLightsPanel, {
    job: job,
    onChange: v => update({
      emergencyLights: v
    })
  }), (job.items.length > 0 || fixedRcdSummary(job).tested > 0 || lightsSummary(job).total > 0) && (() => {
    const counts = {
      standard: 0,
      power_tool: 0,
      rcd: 0,
      microwave: 0
    };
    job.items.forEach(i => {
      counts[i.itemType || "standard"] = (counts[i.itemType || "standard"] || 0) + 1;
    });
    const totalItems = job.items.length;
    // Volume tiers replace the standard rate outright, and the call-out
    // covers the first 20 standard items - matching the published pricing
    // and the desktop invoice, so the two can't disagree.
    const volumeRate = totalItems >= 200 ? 2.50 : totalItems >= 100 ? 2.90 : 3.50;
    const callOut = 120;
    const chargeableStd = Math.max(0, counts.standard - 20);
    const partsTotal = partsTotalFor(job.items, partsCat);
    const partsCount = job.items.filter(i => { const p = partById(partsCat, i.partId); return p && !p.consumable; }).length;
    const itemTotal = chargeableStd * volumeRate + counts.power_tool * 5.00 + counts.rcd * 8.00 + counts.microwave * 12.00;
    const fixedRcdCount = fixedRcdSummary(job).tested;
    const fixedRcdTotal = fixedRcdTotalPrice(job);
    const lightsCount = lightsSummary(job).pass + lightsSummary(job).fail;
    const lightsTotal = lightsTotalPrice(job);
    const estimatedTotal = callOut + itemTotal + partsTotal + fixedRcdTotal + lightsTotal;
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between flex-wrap gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-semibold text-slate-700"
    }, "Estimated invoice"), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-4 flex-wrap text-slate-600 text-xs"
    }, /*#__PURE__*/React.createElement("span", null, "Call-out: ", /*#__PURE__*/React.createElement("strong", null, "$120")), chargeableStd > 0 && /*#__PURE__*/React.createElement("span", null, "Standard ×", chargeableStd, " after first 20: ", /*#__PURE__*/React.createElement("strong", null, "$", (chargeableStd * volumeRate).toFixed(2))), partsCount > 0 && /*#__PURE__*/React.createElement("span", null, "Parts ×", partsCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", partsTotal.toFixed(2))), counts.power_tool > 0 && /*#__PURE__*/React.createElement("span", null, "Power tools ×", counts.power_tool, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.power_tool * 5.00).toFixed(2))), counts.rcd > 0 && /*#__PURE__*/React.createElement("span", null, "RCD ×", counts.rcd, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.rcd * 8.00).toFixed(2))), fixedRcdCount > 0 && /*#__PURE__*/React.createElement("span", null, "Fixed RCDs ×", fixedRcdCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", fixedRcdTotal.toFixed(2))), lightsCount > 0 && /*#__PURE__*/React.createElement("span", null, "Emergency lights ×", lightsCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", lightsTotal.toFixed(2))), counts.microwave > 0 && /*#__PURE__*/React.createElement("span", null, "Microwave ×", counts.microwave, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.microwave * 12.00).toFixed(2))), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-blue-700"
    }, "Total: $", estimatedTotal.toFixed(2)))), totalItems >= 100 && /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-amber-600 mt-1"
    }, "⚠ Volume tier applies for standard items (", totalItems >= 200 ? "$2.50" : "$2.90", "/item for ", totalItems >= 200 ? "200+" : "100–199", " items) applied."));
  })(), /*#__PURE__*/React.createElement(FaultPresetList, null), /*#__PURE__*/React.createElement(JobReadinessPanel, {
    job: job,
    compact: true
  }), folderStatus === "connected" && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-emerald-600 text-right mb-2"
  }, /*#__PURE__*/React.createElement(CheckCircle2, {
    size: 12,
    className: "inline mr-1"
  }), "Saving will also write straight to ", /*#__PURE__*/React.createElement("strong", null, folderName), "."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row gap-3 sm:justify-end"
  }, QR_LABELS_ENABLED && /*#__PURE__*/React.createElement("button", {
    onClick: () => printQrLabels(job),
    className: "inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors",
    title: "Print A4 QR label sheet for all items in this job"
  }, /*#__PURE__*/React.createElement(Printer, {
    size: 16
  }), " Print QR Labels"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSave(false),
    disabled: saving,
    className: "inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors"
  }, saving ? /*#__PURE__*/React.createElement(Loader2, {
    size: 16,
    className: "animate-spin"
  }) : /*#__PURE__*/React.createElement(Save, {
    size: 16
  }), "Save Job"), /*#__PURE__*/React.createElement("button", {
    onClick: handleExportZip,
    disabled: saving,
    className: "inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors",
    title: "Saves the job, then also downloads a portable ZIP copy (certificate.html + record.html)"
  }, saving ? /*#__PURE__*/React.createElement(Loader2, {
    size: 16,
    className: "animate-spin"
  }) : /*#__PURE__*/React.createElement(ClipboardList, {
    size: 16
  }), "Save & Download ZIP Copy"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSave(true),
    disabled: saving,
    className: "inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 16
  }), " Save & View Certificate"))));
}

// ---------------------------------------------------------------------------
// Printable Compliance Report / Certificate
// ---------------------------------------------------------------------------
