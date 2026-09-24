// ======================================================================
// 14-job-list.js
// Job list view
// ======================================================================

function JobListView({
  jobs,
  onNew,
  onOpen,
  onDelete,
  folderStatus,
  folderName,
  folderMessage,
  onConnectFolder,
  onReconnectFolder,
  onDisconnectFolder,
  onRefreshFolder,
  certRegistry,
  onOpenParts
}) {
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showRegistry, setShowRegistry] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverCfg, setServerCfg] = useState(loadServerConfig);
  const [pushingAll, setPushingAll] = useState(false);
  const [pushStatus, setPushStatus] = useState("");
  const [pushingId, setPushingId] = useState(null);
  const persistServerCfg = cfg => {
    setServerCfg(cfg);
    saveServerConfig(cfg);
  };
  const handlePushOne = async (job, e) => {
    if (e) e.stopPropagation();
    if (!serverCfg.token) {
      setShowServerSettings(true);
      return;
    }
    setPushingId(job.id);
    setPushStatus("");
    try {
      const saved = await pushJobToServer(job, serverCfg);
      setPushStatus(`Pushed ${saved.certNumber} (${saved.itemCount} items) to the server.`);
    } catch (err) {
      setPushStatus("Error: " + err.message);
    } finally {
      setPushingId(null);
      setTimeout(() => setPushStatus(""), 6000);
    }
  };
  const handlePushAll = async () => {
    if (jobs.length === 0) return;
    if (!serverCfg.token) {
      setShowServerSettings(true);
      return;
    }
    setPushingAll(true);
    setPushStatus("");
    let ok = 0,
      fail = 0;
    for (const job of jobs) {
      try {
        await pushJobToServer(job, serverCfg);
        ok++;
      } catch (err) {
        fail++;
      }
    }
    setPushStatus(`Pushed ${ok} job${ok === 1 ? "" : "s"} to the server${fail ? `, ${fail} failed` : ""}.`);
    setPushingAll(false);
    setTimeout(() => setPushStatus(""), 8000);
  };
  const handleExportAll = () => {
    if (jobs.length === 0) return;
    setExporting(true);
    try {
      exportAllAsZip(jobs);
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
  };
  const [retestFilter, setRetestFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const dueCounts = useMemo(() => {
    var c = { overdue: 0, 'due-soon': 0, upcoming: 0 };
    jobs.forEach(function(j){ var st = retestStatus(j); if (c[st] !== undefined) c[st]++; });
    return c;
  }, [jobs]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    var list = jobs;
    if (retestFilter === 'due') {
      list = list.filter(function(j){ var st = retestStatus(j); return st === 'overdue' || st === 'due-soon'; });
      list = list.slice().sort(function(a,b){ return (daysUntilRetest(a) ?? 99999) - (daysUntilRetest(b) ?? 99999); });
    }
    if (!q) return list;
    return list.filter(j => j.clientName.toLowerCase().includes(q) || j.clientCompany.toLowerCase().includes(q) || j.siteAddress.toLowerCase().includes(q) || j.certNumber && j.certNumber.toLowerCase().includes(q));
  }, [jobs, query, retestFilter]);
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto p-4 md:p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl md:text-3xl font-bold text-slate-900"
  }, "Test & Tag Records"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 text-sm mt-1"
  }, "AS/NZS 3760 compliance record-keeping — ZoltanStudios")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 items-center flex-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleExportAll,
    disabled: jobs.length === 0 || exporting,
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold px-4 py-2.5 rounded-lg transition-colors",
    title: jobs.length === 0 ? "No jobs to export yet" : "Download every job as a ZIP, one folder per job"
  }, exporting ? /*#__PURE__*/React.createElement(Loader2, {
    size: 18,
    className: "animate-spin"
  }) : /*#__PURE__*/React.createElement(FileText, {
    size: 18
  }), "Export All (ZIP)"), /*#__PURE__*/React.createElement("button", {
    onClick: handlePushAll,
    disabled: jobs.length === 0 || pushingAll,
    className: "inline-flex items-center gap-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 font-semibold px-4 py-2.5 rounded-lg transition-colors",
    title: serverCfg.token ? "Push every job to the ZoltanStudios admin panel" : "Set up your server connection first"
  }, pushingAll ? /*#__PURE__*/React.createElement(Loader2, {
    size: 18,
    className: "animate-spin"
  }) : /*#__PURE__*/React.createElement(CloudUpload, {
    size: 18
  }), "Push All to Server"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowServerSettings(true),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold p-2.5 rounded-lg transition-colors",
    title: "Server connection settings"
  }, /*#__PURE__*/React.createElement(Settings, {
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
  }, /*#__PURE__*/React.createElement(Plus, {
    size: 18
  }), " New Job"), (function () {
  return React.createElement(React.Fragment, null, React.createElement('button', {
    type: 'button',
    onClick: function () {
      setShowSettings(true);
    },
    title: 'Tester defaults',
    className: 'p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
  }, React.createElement('svg', {
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    viewBox: '0 0 24 24'
  }, React.createElement('circle', {
    cx: 12,
    cy: 12,
    r: 3
  }), React.createElement('path', {
    d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
  }))), showSettings && React.createElement(TesterSettingsModal, {
    onClose: function () {
      setShowSettings(false);
    }
  }));
})())), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 -mt-3 mb-4"
  }, "\"Export All\" bundles every job into a .zip, one folder per job (certificate.html + record.html inside) - handy as a portable backup or for browsers that can't connect a folder directly."), IS_HOSTED && /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(CloudUpload, {
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "Jobs are saved to your ZoltanStudios server — available from any device, including your phone.")), !IS_HOSTED && folderStatus === "unsupported" && /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800"
  }, "Your browser can't save straight into a folder (that needs Chrome or Edge). Use", " ", /*#__PURE__*/React.createElement("strong", null, "Export All (ZIP)"), " above, or the export buttons on each job, then unzip into your ", /*#__PURE__*/React.createElement("strong", null, "Test & Tag"), " folder."), !IS_HOSTED && folderStatus === "disconnected" && /*#__PURE__*/React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-blue-800"
  }, "Connect your ", /*#__PURE__*/React.createElement("strong", null, "Test & Tag"), " folder so every job saves its own certificate.html + record.html straight to disk - no exporting or unzipping needed."), /*#__PURE__*/React.createElement("button", {
    onClick: onConnectFolder,
    className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
  }, /*#__PURE__*/React.createElement(ClipboardList, {
    size: 15
  }), " Connect Folder")), !IS_HOSTED && folderStatus === "needs-permission" && /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-amber-800"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    size: 14,
    className: "inline mr-1"
  }), "Your browser needs you to re-approve access to", " ", /*#__PURE__*/React.createElement("strong", null, folderName || "your connected folder"), " (it forgets between browser restarts). Nothing is lost - just reconnect to keep saving there."), /*#__PURE__*/React.createElement("button", {
    onClick: onReconnectFolder,
    className: "inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
  }, "Reconnect")), folderStatus === "connected" && /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex items-center justify-between gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-emerald-800"
  }, /*#__PURE__*/React.createElement(CheckCircle2, {
    size: 14,
    className: "inline mr-1"
  }), "Connected to ", /*#__PURE__*/React.createElement("strong", null, folderName), " - jobs save here automatically.", folderMessage && /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-600"
  }, " ", folderMessage)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onRefreshFolder,
    className: "text-xs text-emerald-700 underline hover:no-underline whitespace-nowrap",
    title: "Re-scan the folder in case jobs were added, edited, or deleted outside this app"
  }, "Refresh from folder"), /*#__PURE__*/React.createElement("button", {
    onClick: onDisconnectFolder,
    className: "text-xs text-emerald-700 underline hover:no-underline whitespace-nowrap"
  }, "Disconnect"))), onOpenParts && /*#__PURE__*/React.createElement(PartsSummaryCard, {
    onOpen: onOpenParts
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative mb-4"
  }, /*#__PURE__*/React.createElement(Search, {
    size: 16,
    className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search by client, company, or site address...",
    className: `${inputCls} pl-9`
  })), (function () {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap mb-4"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      setRetestFilter('all');
    },
    className: 'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ' + (retestFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50')
  }, "All jobs (", jobs.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      setRetestFilter(retestFilter === 'due' ? 'all' : 'due');
    },
    className: 'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ' + (retestFilter === 'due' ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50')
  }, "Retest due (", dueCounts.overdue + dueCounts['due-soon'], ")"), dueCounts.overdue > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700"
  }, dueCounts.overdue, " overdue"), dueCounts.upcoming > 0 && retestFilter === 'all' && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, dueCounts.upcoming, " due in 2–4 months"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      downloadCSV(buildAssetRegisterCSVForJobs(filtered), 'asset-register-' + new Date().toISOString().slice(0, 10) + '.csv');
    },
    disabled: filtered.length === 0,
    className: "ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors",
    title: "Export every item in the listed jobs as a CSV asset register"
  }, "Export CSV"), (function () {
  return React.createElement(React.Fragment, null, React.createElement('button', {
    type: 'button',
    title: 'Download a backup of every job, certificate number and setting',
    onClick: function () {
      try {
        var data = buildBackup(jobs);
        var json = JSON.stringify(data, null, 2);
        var name = 'testtag-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        if (isDesktopShell()) {
          var esc = json.replace(/&/g, '&amp;').replace(/</g, '&lt;');
          openHtmlInWindow('<title>' + name + '</title>' + '<div style="font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;padding:16px">' + '<p style="margin:0 0 10px"><strong>' + data.counts.jobs + ' jobs.</strong> ' + 'Select all (Ctrl+A), copy, and save into a file named <code>' + name + '</code>.</p>' + '<textarea style="width:100%;height:70vh;font:12px monospace">' + esc + '</textarea></div>', name);
        } else {
          downloadSingleFile(json, name, 'application/json');
        }
      } catch (e) {
        alert('Backup failed: ' + e.message);
      }
    },
    className: 'text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors'
  }, 'Backup'), React.createElement('label', {
    title: 'Restore jobs from a backup file. Existing jobs are kept.',
    className: 'text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer'
  }, 'Restore', React.createElement('input', {
    type: 'file',
    accept: '.json,application/json',
    style: {
      display: 'none'
    },
    onChange: function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var res = restoreBackup(JSON.parse(String(r.result)));
          alert('Restored. ' + res.added + ' added, ' + res.updated + ' updated, ' + res.total + ' jobs total.');
          window.location.reload();
        } catch (err) {
          alert('Restore failed: ' + err.message);
        }
      };
      r.readAsText(f);
      e.target.value = '';
    }
  })));
})());
})(), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 border-2 border-dashed border-slate-200 rounded-xl"
  }, /*#__PURE__*/React.createElement(ClipboardList, {
    size: 36,
    className: "mx-auto text-slate-300 mb-3"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500"
  }, jobs.length === 0 ? "No jobs yet. Create your first test & tag record." : "No jobs match your search.")) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, filtered.slice().sort((a, b) => b.createdAt - a.createdAt).map(job => {
    const failCount = job.items.filter(i => i.overallResult === "fail").length;
    return /*#__PURE__*/React.createElement("div", {
      key: job.id,
      className: "bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors cursor-pointer",
      onClick: () => onOpen(job.id)
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-semibold text-slate-900 truncate"
    }, job.clientName || "Untitled client"), job.clientCompany && /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 text-sm truncate"
    }, "· ", job.clientCompany), job.certNumber && /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
    }, job.certNumber)), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-500 truncate"
    }, job.siteAddress || "No site address"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-slate-400 mt-1"
    }, "Tested ", formatDisplayDate(job.testDate), " · ", job.items.length, " item", job.items.length === 1 ? "" : "s", (function () {
  var st = retestStatus(job);
  if (st === 'ok') return null;
  var cls = st === 'overdue' ? 'bg-red-100 text-red-700' : st === 'due-soon' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500';
  return React.createElement('span', {
    className: 'ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ' + cls
  }, retestLabel(job));
})(), failCount > 0 && /*#__PURE__*/React.createElement("span", {
      className: "text-red-500 font-medium"
    }, " · ", failCount, " failed"))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 shrink-0"
    }, failCount > 0 && /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full"
    }, /*#__PURE__*/React.createElement(AlertTriangle, {
      size: 12
    }), " ", failCount), /*#__PURE__*/React.createElement("button", {
      onClick: e => handlePushOne(job, e),
      disabled: pushingId === job.id,
      className: "p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40",
      title: "Push this job to the server"
    }, pushingId === job.id ? /*#__PURE__*/React.createElement(Loader2, {
      size: 16,
      className: "animate-spin"
    }) : /*#__PURE__*/React.createElement(CloudUpload, {
      size: 16
    })), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        if (confirm(`Delete the record for ${job.clientName || "this job"}? This can't be undone.`)) {
          onDelete(job.id);
        }
      },
      className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors",
      title: "Delete job"
    }, /*#__PURE__*/React.createElement(Trash2, {
      size: 16
    }))));
  })), pushStatus && /*#__PURE__*/React.createElement("div", {
    className: `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${pushStatus.startsWith("Error") ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`
  }, pushStatus), showServerSettings && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
    onClick: () => setShowServerSettings(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl w-full max-w-md p-6",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement(CloudUpload, {
    size: 20,
    className: "text-emerald-600"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-slate-900"
  }, "Server Connection")), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 text-sm mb-4"
  }, "Push jobs straight to your ZoltanStudios admin panel. Generate a token in the panel under", /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, " Test & Tag → Desktop App Tokens"), ", then paste it here."), /*#__PURE__*/React.createElement("label", {
    className: "block text-slate-600 text-sm mb-1"
  }, "Server URL"), /*#__PURE__*/React.createElement("input", {
    value: serverCfg.url,
    onChange: e => setServerCfg({
      ...serverCfg,
      url: e.target.value
    }),
    placeholder: "https://zoltanstudios.au",
    className: "w-full p-2 rounded-lg border border-slate-300 mb-3 text-slate-800"
  }), /*#__PURE__*/React.createElement("label", {
    className: "block text-slate-600 text-sm mb-1"
  }, "API Token"), /*#__PURE__*/React.createElement("input", {
    value: serverCfg.token,
    onChange: e => setServerCfg({
      ...serverCfg,
      token: e.target.value
    }),
    placeholder: "zst_...",
    type: "password",
    className: "w-full p-2 rounded-lg border border-slate-300 mb-4 font-mono text-sm text-slate-800"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      persistServerCfg(serverCfg);
      setShowServerSettings(false);
      setPushStatus("Server settings saved.");
      setTimeout(() => setPushStatus(""), 3000);
    },
    className: "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg"
  }, "Save"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowServerSettings(false),
    className: "flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg"
  }, "Cancel")))), certRegistry && certRegistry.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowRegistry(s => !s),
    className: "text-xs text-slate-400 hover:text-slate-600 underline"
  }, showRegistry ? "Hide" : "Show", " certificate number registry (", certRegistry.length, " entries)"), showRegistry && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-600 uppercase tracking-wide"
  }, "Certificate Number Registry"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, "Audit trail · numbers marked deleted/expired can be reused")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-500 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-semibold"
  }, "Cert No."), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-semibold"
  }, "Job ID"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-semibold"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-semibold"
  }, "Assigned"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-semibold"
  }, "Closed"))), /*#__PURE__*/React.createElement("tbody", null, certRegistry.slice().sort((a, b) => (b.assignedAt || "").localeCompare(a.assignedAt || "")).map((entry, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "border-b border-slate-50 hover:bg-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-2 font-mono font-semibold text-blue-700"
  }, entry.certNumber), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-2 font-mono text-slate-400"
  }, entry.jobId ? entry.jobId.slice(0, 8) + "…" : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-0.5 rounded-full font-semibold ${entry.status === "active" ? "bg-emerald-100 text-emerald-700" : entry.status === "deleted" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`
  }, entry.status)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-2 text-slate-500"
  }, entry.assignedAt || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-2 text-slate-500"
  }, entry.closedAt || "—")))))))));
}

// ---------------------------------------------------------------------------
// Job Form View (client/site details + item table)
// ---------------------------------------------------------------------------


// Small tap-to-fill chips for the readings you enter over and over.
function PresetChips({ values, onPick }) {
  return React.createElement("div", { className: "flex gap-1 mt-0.5" },
    values.map(function (v) {
      return React.createElement("button", {
        key: v,
        type: "button",
        onClick: function () { onPick(v); },
        className: "text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-500 font-medium transition-colors"
      }, v);
    })
  );
}

function CapturePanel({
  job,
  onAttach
}) {
  var st = React.useState(null);
  var sess = st[0],
    setSess = st[1];
  var bs = React.useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var er = React.useState('');
  var err = er[0],
    setErr = er[1];
  var lastRef = React.useRef('');
  var atts = job.attachments || [];

  // Poll for new uploads while a session is live
  React.useEffect(function () {
    if (!sess) return;
    var stop = false;
    var timer = setInterval(function () {
      pollCaptures(job.id, lastRef.current).then(function (list) {
        if (stop || !list || !list.length) return;
        lastRef.current = list[list.length - 1].createdAt || lastRef.current;
        onAttach(list);
      }).catch(function () {});
    }, 4000);
    return function () {
      stop = true;
      clearInterval(timer);
    };
  }, [sess, job.id]);
  function start() {
    setBusy(true);
    setErr('');
    startCaptureSession(job.id).then(function (d) {
      setSess(d);
    }).catch(function (e) {
      setErr(e.message);
    }).finally(function () {
      setBusy(false);
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1 flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Photos & Signature"), !sess && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: start,
    disabled: busy,
    className: "inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
  }, busy ? 'Starting…' : '📱 Capture from phone')), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-3"
  }, "Use your phone to photograph faults and collect the client’s signature. They appear here automatically."), err && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
  }, err), sess && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row gap-4 items-center bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: qrDataUri(sess.url),
    alt: "Scan to capture",
    className: "w-40 h-40 rounded-lg bg-white shrink-0"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-600"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Scan with your phone camera"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs leading-relaxed mb-2"
  }, "Opens a capture page — no login needed. Take photos or hand the phone to the client to sign. Anything you send appears here within a few seconds."), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, "Link expires in ", sess.expiresIn || 60, " minutes."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      setSess(null);
    },
    className: "mt-2 text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
  }, "Done capturing"))), atts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg py-6 text-center"
  }, "No photos or signatures yet.") : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 sm:grid-cols-5 gap-2"
  }, atts.map(function (a) {
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: "relative group"
    }, /*#__PURE__*/React.createElement("img", {
      src: a.dataUrl,
      alt: a.kind,
      className: 'w-full h-24 object-cover rounded-lg border ' + (a.kind === 'signature' ? 'border-emerald-300 bg-white' : 'border-slate-200')
    }), /*#__PURE__*/React.createElement("span", {
      className: "absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white uppercase"
    }, a.kind === 'signature' ? 'Sign' : 'Photo'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      title: "Remove",
      onClick: function () {
        onAttach(null, a.id);
      },
      className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
    }, "✕"));
  })));
}
