// ======================================================================
// 17-app.js
// Root component and state
// ======================================================================

function TestTagRecordsApp() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [activeJobId, setActiveJobId] = useState(null);
  const [error, setError] = useState("");
  const [certRegistry, setCertRegistry] = useState([]);

  // Folder connection state
  const [folderStatus, setFolderStatus] = useState(FS_ACCESS_SUPPORTED ? "checking" : "unsupported"); // 'checking' | 'unsupported' | 'disconnected' | 'needs-permission' | 'connected'
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [folderMessage, setFolderMessage] = useState("");

  // Unsubscribe handle for the Firestore real-time listener
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Load localStorage first so the UI shows something immediately
      //    (fast, works offline, acts as the cache)
      const cached = await loadJobs();
      let registry = await loadCertRegistry();

      // 2. Migrate: assign cert numbers to any jobs that predate this feature
      registry = markExpiredEntries(registry, cached);
      let migrated = false;
      const migratedCached = cached.map(rawJob => {
        let job = normalizeJobLicense(rawJob);
        if (job !== rawJob) migrated = true;
        if (job.certNumber) return job;
        const certNumber = generateCertNumber(registry);
        registry = [...registry, {
          certNumber,
          jobId: job.id,
          status: "active",
          assignedAt: new Date().toISOString().slice(0, 10)
        }];
        migrated = true;
        return {
          ...job,
          certNumber
        };
      });
      if (migrated) {
        await persistCertRegistry(registry);
        await persistJobs(migratedCached);
      }
      if (!cancelled) {
        setJobs(migratedCached);
        setCertRegistry(registry);
        setLoading(false);
      }

      // 2b. Server sync: if a server connection is configured, load all jobs
      // from the ZoltanStudios server and merge (server version wins by id).
      try {
        const cfg = loadServerConfig();
        // Hosted on the website a signed-in session is enough; before, a
        // phone with no token never loaded the server's jobs at all.
        if (cfg.token || cfg.session) {
          const pending = await flushPendingDeletes(cfg);
          // The shared tester signature (set here, in the suite, or on another phone).
          await syncTesterSignature(cfg);
          const serverJobs = await pullJobsFromServer(cfg);
          if (serverJobs && !cancelled) {
            const mergedWithServer = mergeServerJobs(migratedCached, serverJobs, pending);
            setJobs(mergedWithServer);
            await persistJobs(mergedWithServer);
          }
        }
      } catch (e) {/* offline or server unreachable - local copy stands */}

      // Launch parameters from the admin panel:
      //   ?new=1        -> open straight into a brand new job
      //   ?cert=ZS1234  -> open that job for editing
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('new') === '1') {
          setTimeout(() => {
            try {
              createJob();
            } catch (e) {}
          }, 80);
        } else if (params.get('cert')) {
          const want = params.get('cert').toUpperCase();
          setTimeout(() => {
            setJobs(cur => {
              const hit = cur.find(j => (j.certNumber || '').toUpperCase() === want);
              if (hit) {
                setActiveJobId(hit.id);
                setView('form');
              }
              return cur;
            });
          }, 120);
        }
      } catch (e) {}

      // 3. Try to reconnect the folder (desktop only)
      if (!FS_ACCESS_SUPPORTED || cancelled) return;
      const stored = await getStoredFolder();
      if (!stored) {
        setFolderStatus("disconnected");
        return;
      }
      setFolderHandle(stored.handle);
      setFolderName(stored.handle.name || "");
      if (stored.granted) {
        setFolderStatus("connected");
      } else {
        setFolderStatus("needs-permission");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-reads every job.json from the connected folder, MERGES it with
  // whatever's already in the app (by job id - folder version wins if a
  // job exists in both places), and writes any local-only jobs into the
  // folder too so they're captured going forward. Nothing that was already
  // visible in the app ever silently disappears just because the folder
  // didn't happen to have it yet.
  const syncJobsFromFolder = async (handle, currentJobs) => {
    try {
      const folderJobs = await readJobsFromFolder(handle);
      const folderIds = new Set(folderJobs.map(j => j.id));
      const localOnly = (currentJobs ?? jobs).filter(j => !folderIds.has(j.id));

      // Migrate local-only jobs into the folder so they show up on the
      // next connect too, instead of staying invisible to the folder.
      for (const job of localOnly) {
        try {
          const usedFolderName = await saveJobToFolder(handle, job);
          job.folderName = job.folderName || usedFolderName;
        } catch {
          // If one job fails to migrate, keep going with the rest rather
          // than aborting the whole sync.
        }
      }
      const merged = [...folderJobs, ...localOnly];
      setJobs(merged);
      await persistJobs(merged);
      setLoading(false);
    } catch (e) {
      setError("Couldn't read jobs from the connected folder (" + (e && e.message ? e.message : "unknown error") + ").");
    }
  };
  const openJob = id => {
    setActiveJobId(id);
    setView("form");
  };
  const createJob = async () => {
    const registry = await loadCertRegistry();
    const updatedRegistry = markExpiredEntries(registry, jobs);
    const certNumber = generateCertNumber(updatedRegistry);
    const job = {
      ...blankJob(),
      certNumber
    };
    const newRegistry = await registerCertNumber(certNumber, job.id);
    setCertRegistry(newRegistry);
    setJobs(js => [...js, job]);
    setActiveJobId(job.id);
    setView("form");
  };
  const deleteJob = useCallback(async id => {
    const job = jobs.find(j => j.id === id);
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);

    // Release the cert number back into the available pool
    if (job && job.certNumber) {
      const newRegistry = await releaseCertNumber(job.certNumber, job.id);
      setCertRegistry(newRegistry);
    }
    if (folderHandle && folderStatus === "connected" && job && job.folderName) {
      try {
        await deleteJobFolder(folderHandle, job.folderName);
      } catch (e) {
        setError("Removed from the list, but couldn't delete its folder on disk (" + (e && e.message ? e.message : "unknown error") + "). You may need to delete it manually.");
      }
    }
    const ok = await persistJobs(updated);
    if (!ok) {
      setError("Could not delete the job - please try again.");
      return;
    }

    // Delete the server copy too, or the next sync brings it back.
    const cfg = loadServerConfig();
    if (job && (cfg.token || cfg.session)) {
      try {
        await deleteJobOnServer(job, cfg);
      } catch (e) {
        queuePendingDelete(job);
        setError("Deleted on this device. The server copy couldn't be deleted yet (" + (e && e.message ? e.message : "offline") + ") - it will be retried next time the app opens with a connection.");
      }
    }
  }, [jobs, folderHandle, folderStatus]);

  // Saves to Firestore + localStorage cache + optional local folder
  const saveJob = useCallback(async job => {
    let jobToPersist = job;
    if (folderHandle && folderStatus === "connected") {
      try {
        const usedFolderName = await saveJobToFolder(folderHandle, job);
        if (!job.folderName) {
          jobToPersist = {
            ...job,
            folderName: usedFolderName
          };
        }
        setFolderMessage(`Saved to folder: ${usedFolderName}`);
      } catch (e) {
        setFolderMessage("");
        setError("Saved in the app, but couldn't write to your connected folder (" + (e && e.message ? e.message : "unknown error") + "). Try reconnecting the folder.");
      }
    }
    setJobs(prev => {
      const exists = prev.some(j => j.id === jobToPersist.id);
      const updated = exists ? prev.map(j => j.id === jobToPersist.id ? jobToPersist : j) : [...prev, jobToPersist];
      persistJobs(updated).then(ok => {
        if (!ok) setError("Could not save the job - please try again.");
      });
      return updated;
    });

    // Hosted on the website: the server IS the storage, so every save goes
    // straight up. Offline (file://) copies stay local until pushed.
    if (IS_HOSTED) {
      try {
        const cfg = loadServerConfig();
        const saved = await pushJobToServer(jobToPersist, cfg);
        setFolderMessage("Saved to server" + (saved && saved.certNumber ? " (" + saved.certNumber + ")" : ""));
        setTimeout(() => setFolderMessage(""), 4000);
      } catch (e) {
        setError("Saved on this device, but the server save failed: " + (e && e.message ? e.message : "unknown error") + (String(e && e.message).indexOf("sign in") >= 0 ? "" : " It will retry next time you save."));
      }
    }
  }, [folderHandle, folderStatus]);
  const handleConnectFolder = async () => {
    try {
      const handle = await pickFolder();
      setFolderHandle(handle);
      setFolderName(handle.name || "");
      setFolderStatus("connected");
      setFolderMessage(`Connected to "${handle.name}". Reading existing jobs from this folder...`);
      await syncJobsFromFolder(handle, jobs);
      setFolderMessage(`Connected to "${handle.name}". Jobs will save here automatically.`);
    } catch (e) {
      // User cancelled the picker, or the browser blocked it - not a real error.
      if (e && e.name !== "AbortError") {
        setError("Couldn't connect the folder: " + (e && e.message ? e.message : "unknown error"));
      }
    }
  };
  const handleReconnectFolder = async () => {
    if (!folderHandle) return;
    try {
      const granted = await reconnectFolder(folderHandle);
      setFolderStatus(granted ? "connected" : "needs-permission");
      if (granted) {
        setFolderMessage(`Reconnected to "${folderHandle.name}".`);
        await syncJobsFromFolder(folderHandle, jobs);
      }
    } catch (e) {
      setError("Couldn't reconnect: " + (e && e.message ? e.message : "unknown error"));
    }
  };
  const handleRefreshFromFolder = async () => {
    if (!folderHandle || folderStatus !== "connected") return;
    setFolderMessage("Refreshing from folder...");
    await syncJobsFromFolder(folderHandle, jobs);
    setFolderMessage("Refreshed from folder.");
  };
  const handleDisconnectFolder = async () => {
    await forgetFolder();
    setFolderHandle(null);
    setFolderName("");
    setFolderStatus("disconnected");
    setFolderMessage("");
  };
  const activeJob = jobs.find(j => j.id === activeJobId);
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen flex items-center justify-center bg-slate-50"
    }, /*#__PURE__*/React.createElement(Loader2, {
      className: "animate-spin text-blue-600",
      size: 28
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-slate-50 font-sans"
  }, error && /*#__PURE__*/React.createElement("div", {
    className: "bg-red-600 text-white text-sm text-center py-2 px-4 print:hidden"
  }, error, " ", /*#__PURE__*/React.createElement("button", {
    className: "underline ml-2",
    onClick: () => setError("")
  }, "Dismiss")), view === "list" && /*#__PURE__*/React.createElement(JobListView, {
    jobs: jobs,
    onNew: createJob,
    onOpen: openJob,
    onDelete: deleteJob,
    folderStatus: folderStatus,
    folderName: folderName,
    folderMessage: folderMessage,
    onConnectFolder: handleConnectFolder,
    onReconnectFolder: handleReconnectFolder,
    onDisconnectFolder: handleDisconnectFolder,
    onRefreshFolder: handleRefreshFromFolder,
    certRegistry: certRegistry,
    onOpenParts: () => setView("parts")
  }), view === "parts" && /*#__PURE__*/React.createElement(PartsView, {
    onBack: () => setView("list")
  }), view === "form" && activeJob && /*#__PURE__*/React.createElement(JobFormView, {
    job: activeJob,
    onCancel: () => setView("list"),
    onSave: saveJob,
    folderStatus: folderStatus,
    folderName: folderName,
    onViewReport: id => {
      setActiveJobId(id);
      setView("report");
    }
  }), view === "report" && activeJob && /*#__PURE__*/React.createElement(ReportView, {
    job: activeJob,
    onBack: () => setView("form")
  }));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(TestTagRecordsApp, null));
