// ======================================================================
// 16-report-view.js
// Certificate / report view
// ======================================================================

function ReportView({
  job,
  onBack
}) {
  const certCounts = certificateCounts(job);
  const shownItems = certItems(job);
  const passCount = certCounts.pass;
  const failCount = certCounts.fail;
  const passRate = certCounts.rate;
  const nextTestDate = addMonths(job.testDate, job.retestMonths);
  const failedItems = shownItems.filter(i => i.overallResult === "fail");
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto p-4 md:p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-6 print:hidden flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    size: 16
  }), " Back to job"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 justify-end"
  }, job.jobType === "generator_inspection" && /*#__PURE__*/React.createElement("button", {
  onClick: function () {
    downloadSingleFile(buildGeneratorReportHTML(job), "generator-inspection-report.html");
  },
  className: "inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm"
}, /*#__PURE__*/React.createElement(FileText, {
  size: 15
}), " Generator Report"), (function () {
  return React.createElement(EmailCertButton, {
    job: job
  });
})(), (function () {
  return React.createElement(PdfButtons, {
    job: job
  });
})(), /*#__PURE__*/React.createElement("button", {
    onClick: () => downloadSingleFile(buildRecordHTML(job), "record.html"),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm",
    title: "Download the full working record as a single HTML file"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15
  }), " Record"), /*#__PURE__*/React.createElement("button", {
    onClick: () => downloadSingleFile(buildCertificateHTML(job), "certificate.html"),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm",
    title: "Download just the certificate as a single HTML file"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15
  }), " Certificate"), /*#__PURE__*/React.createElement("button", {
    onClick: () => downloadSingleFile(buildAssetRegisterCSV(job), "asset-register.csv", "text/csv;charset=utf-8"),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm",
    title: "Download every item as a spreadsheet-ready CSV"
  }, /*#__PURE__*/React.createElement(ClipboardList, {
    size: 15
  }), " CSV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => exportJobAsZip(job),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm",
    title: "Download both files together in one job folder"
  }, /*#__PURE__*/React.createElement(ClipboardList, {
    size: 15
  }), " Both (ZIP)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm"
  }, /*#__PURE__*/React.createElement(Printer, {
    size: 16
  }), " Print / Save as PDF"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-6 md:p-10 print:border-0 print:rounded-none print:p-0 text-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_DATA_URI,
    alt: "ZoltanStudios",
    className: "w-12 h-12 rounded-lg shadow-sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold text-slate-900"
  }, "ZoltanStudios"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, "Test & Tag Compliance Certificate"))), /*#__PURE__*/React.createElement("div", {
    className: "text-right text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement("p", null, "Melbourne, Victoria, Australia"), /*#__PURE__*/React.createElement("p", null, "zoltan@zoltanstudios.au"))), job.certNumber && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-blue-600 uppercase tracking-wide"
  }, "Certificate No."), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-xl font-bold text-blue-800 tracking-widest"
  }, job.certNumber)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-slate-900"
  }, certCounts.total), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 uppercase tracking-wide"
  }, "Tested"), certCounts.breakdown && /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-slate-500"
  }, certCounts.breakdown)), /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 rounded-lg p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-emerald-700"
  }, passCount), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-emerald-600 uppercase tracking-wide"
  }, "Passed")), /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 rounded-lg p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-red-700"
  }, failCount), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-600 uppercase tracking-wide"
  }, "Failed")), /*#__PURE__*/React.createElement("div", {
    className: "bg-blue-50 rounded-lg p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-blue-700"
  }, passRate, "%"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-blue-600 uppercase tracking-wide"
  }, "Pass Rate"))), (() => {
    const certTagColour = getTagColour(job.testDate, job.retestMonths);
    return /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Client:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, job.clientName || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Company:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, job.clientCompany || "—")), /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Site Address:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, job.siteAddress || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Test Date:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, formatDisplayDate(job.testDate))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Next Test Due:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, formatDisplayDate(nextTestDate))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Tested By:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, job.testerName)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Licence / Qual. No.:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, job.testerLicense)), certTagColour && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "Tag Colour:"), " ", /*#__PURE__*/React.createElement("span", {
      className: "font-medium inline-flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-block w-2.5 h-2.5 rounded-full border border-black/10",
      style: {
        backgroundColor: certTagColour.hex
      }
    }), certTagColour.name)));
  })(), failedItems.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "flex items-center gap-2 font-semibold text-red-700 mb-2"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    size: 16
  }), " Items Requiring Attention"), /*#__PURE__*/React.createElement("ul", {
    className: "text-sm text-red-700 space-y-1 list-disc list-inside"
  }, failedItems.map(i => /*#__PURE__*/React.createElement("li", {
    key: i.id
  }, i.assetId || "Unlabelled", " — ", i.description || "No description", i.location ? ` (${i.location})` : "")))), /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs border-collapse mb-6"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left border-b-2 border-slate-300"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Tag Number"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Description"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Class"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Location"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Visual"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Earth (Ω)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Insul. (MΩ)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-2"
  }, "Result"))), /*#__PURE__*/React.createElement("tbody", null, shownItems.map(item => /*#__PURE__*/React.createElement("tr", {
    key: item.id,
    className: "border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.assetId || "—"), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.description || "—"), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.equipmentClass), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.location || "—"), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2 capitalize"
  }, item.visual), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.equipmentClass === "I" ? item.earthContinuity || "—" : "n/a"), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, item.insulationResistance || "—"), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 pr-2"
  }, /*#__PURE__*/React.createElement(ResultBadge, {
    result: item.overallResult
  })))))), /*#__PURE__*/React.createElement(FixedRcdReportSection, {
    job: job
  }), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-slate-200 pt-4 mb-8 text-xs text-slate-600 leading-relaxed"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-800 mb-2"
  }, "Statutory Declaration"), /*#__PURE__*/React.createElement("p", null, "I declare that the electrical equipment listed in this report has been inspected and tested in accordance with AS/NZS 3760, and that the results recorded above are a true and accurate account of the condition of each item at the time of testing. This testing has been carried out with regard to the duties and obligations set out under the Occupational Health and Safety Act 2004 (Vic) and the Occupational Health and Safety Regulations 2017. Equipment marked \"Fail\" should be removed from service, repaired, or replaced before further use.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-8 text-sm"
  }, (function () {
  var sig = '';
  try {
    sig = (effectiveTester() || {}).signature || '';
  } catch (e) {}
  return React.createElement('div', null, React.createElement('div', {
    className: 'border-b border-slate-400 h-12 relative'
  }, sig ? React.createElement('img', {
    src: sig,
    alt: 'Tester signature',
    className: 'absolute bottom-0.5 left-0 max-h-11 max-w-[230px]'
  }) : null), React.createElement('p', {
    className: 'mt-1 font-medium'
  }, job.testerName), React.createElement('p', {
    className: 'text-xs text-slate-400'
  }, sig ? 'Tester Signature \u2014 ' + formatDisplayDate(job.testDate) : 'Tester Signature & Date'));
})(), (function () {
  var sig = latestSignature(job);
  var name = sig && sig.note ? sig.note : job.clientName || 'Client Representative';
  var when = sig && sig.createdAt ? formatDisplayDate(String(sig.createdAt).slice(0, 10)) : '';
  return React.createElement('div', null, React.createElement('div', {
    className: 'border-b border-slate-400 h-12 relative'
  }, sig ? React.createElement('img', {
    src: sig.dataUrl,
    alt: 'Client signature',
    className: 'absolute bottom-0.5 left-0 max-h-11 max-w-[230px]'
  }) : null), React.createElement('p', {
    className: 'mt-1 font-medium'
  }, name), React.createElement('p', {
    className: 'text-xs text-slate-400'
  }, sig ? 'Client Signature' + (when ? ' — signed ' + when : '') : 'Client Signature & Date'));
})())));
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

function EmailCertButton({
  job
}) {
  var o = React.useState(false);
  var open = o[0],
    setOpen = o[1];
  var t = React.useState(job.clientEmail || '');
  var to = t[0],
    setTo = t[1];
  var m = React.useState('');
  var msg = m[0],
    setMsg = m[1];
  var k = React.useState(job.jobType === 'generator_inspection' ? 'generator' : 'certificate');
  var kind = k[0],
    setKind = k[1];
  var b = React.useState(false);
  var busy = b[0],
    setBusy = b[1];
  var e = React.useState('');
  var err = e[0],
    setErr = e[1];
  var d = React.useState('');
  var done = d[0],
    setDone = d[1];
  function send() {
    setBusy(true);
    setErr('');
    setDone('');
    emailDocumentToClient(job, {
      to: to.trim(),
      message: msg.trim(),
      kind: kind
    }).then(function (r) {
      setDone('Sent to ' + r.to);
      setTimeout(function () {
        setOpen(false);
        setDone('');
      }, 1800);
    }).catch(function (ex) {
      setErr(ex.message);
    }).finally(function () {
      setBusy(false);
    });
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setOpen(true);
    },
    title: "Email this document to the client",
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm"
  }, "\u2709 Email to client"), open && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden",
    onClick: function () {
      if (!busy) setOpen(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-md",
    onClick: function (ev) {
      ev.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-slate-900 text-lg"
  }, "Email to client"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-0.5"
  }, "The document is attached as a file they can open in any browser.")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 space-y-3"
  }, err && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
  }, err), done && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
  }, done), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "To"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: to,
    placeholder: "client@example.com",
    onChange: function (ev) {
      setTo(ev.target.value);
    },
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Document"), /*#__PURE__*/React.createElement("select", {
    value: kind,
    onChange: function (ev) {
      setKind(ev.target.value);
    },
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "certificate"
  }, "Compliance certificate"), job.jobType === 'generator_inspection' && /*#__PURE__*/React.createElement("option", {
    value: "generator"
  }, "Generator inspection report"), /*#__PURE__*/React.createElement("option", {
    value: "record"
  }, "Full job record (internal detail)"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"
  }, "Message (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: msg,
    rows: 3,
    placeholder: "e.g. Two items failed and were removed from service - details are in the certificate.",
    onChange: function (ev) {
      setMsg(ev.target.value);
    },
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-4 border-t border-slate-100 flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setOpen(false);
    },
    disabled: busy,
    className: "text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    disabled: busy || !to.trim(),
    className: "bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg"
  }, busy ? "Sending\u2026" : "Send email")))));
}

function PdfButtons({
  job
}) {
  var b = React.useState('');
  var busy = b[0],
    setBusy = b[1];
  function make(kind) {
    setBusy(kind);
    downloadJobPdf(job, kind).catch(function (e) {
      alert('Could not create the PDF: ' + e.message);
    }).finally(function () {
      setBusy('');
    });
  }
  var cls = "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50";
  var isGen = job.jobType === 'generator_inspection';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      make(isGen ? 'generator' : 'certificate');
    },
    disabled: !!busy,
    className: cls,
    title: "Download as a PDF"
  }, busy === 'certificate' || busy === 'generator' ? 'Creating PDF\u2026' : 'PDF'));
}
