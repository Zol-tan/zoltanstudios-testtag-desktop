// ======================================================================
// 10-server-sync.js
// Server config, push/pull, capture relay
// ======================================================================

const IS_HOSTED = typeof window !== "undefined" && window.location.protocol !== "file:";
function loadServerConfig() {
  let cfg = {
    url: "https://zoltanstudios.au",
    token: ""
  };
  try {
    const raw = window.localStorage.getItem(SERVER_CONFIG_KEY);
    if (raw) cfg = JSON.parse(raw);
  } catch (e) {}
  if (IS_HOSTED) {
    // Same-origin: use this site and the logged-in admin session.
    cfg.url = window.location.origin;
    cfg.session = true;
  }
  return cfg;
}
function saveServerConfig(cfg) {
  window.localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(cfg));
}

// Map a local job to the server's expected shape. Keeps qrId + id so the
// server can dedupe (by externalId) and preserve QR codes.
function jobToServerPayload(job) {
  return {
    jobType: job.jobType || "test_tag",
    generator: job.generator || null,
    fixedRcd: job.fixedRcd || null,
    attachments: job.attachments || [],
    meggerEquipment: job.meggerEquipment || "",
    meggerCalibrationDate: job.meggerCalibrationDate || "",
    id: job.id,
    externalId: job.id,
    certNumber: job.certNumber || "",
    status: job.status || "draft",
    clientName: job.clientName || "",
    clientCompany: job.clientCompany || "",
    clientEmail: job.clientEmail || "",
    clientPhone: job.clientPhone || "",
    siteAddress: job.siteAddress || "",
    environment: job.environment || "",
    retestMonths: job.retestMonths || 12,
    testDate: job.testDate,
    testerName: job.testerName || "",
    testerLicense: job.testerLicense || "",
    items: (job.items || []).map(it => ({
      qrId: it.qrId || "",
      itemType: it.itemType || "standard",
      assetId: it.assetId || "",
      description: it.description || "",
      makeModel: it.makeModel || "",
      serialNumber: it.serialNumber || "",
      location: it.location || "",
      equipmentClass: it.equipmentClass || "",
      visual: it.visual || "pass",
      earthContinuity: it.earthContinuity || "",
      insulationResistance: it.insulationResistance || "",
      insulationTestVoltage: it.insulationTestVoltage || "",
      leakageCurrent: it.leakageCurrent || "",
      rcdTest: it.rcdTest || "n/a",
      rcdTripTestEnabled: !!it.rcdTripTestEnabled,
      rcdType: it.rcdType || "",
      rcdTestMode: it.rcdTestMode || "time",
      rcdTripCurrentSetting: it.rcdTripCurrentSetting || "",
      rcdMeasuredTripTimeMs: it.rcdMeasuredTripTimeMs || "",
      rcdMeasuredTripCurrentMa: it.rcdMeasuredTripCurrentMa || "",
      overallResult: it.overallResult || "pass",
      overrideResult: !!it.overrideResult,
      notes: it.notes || "",
      partId: it.partId || ""
    }))
  };
}

// Map a server job (from action=pull) back to the app's local shape.
// The server stores the app's original UUID as externalId, so round-trips
// keep the same identity and nothing duplicates.
function serverJobToLocal(j) {
  return {
    jobType: j.jobType || "test_tag",
    generator: j.generator || blankGenerator(),
    // Older server copies have none; fixedRcdOf() fills the defaults on use.
    fixedRcd: j.fixedRcd || null,
    attachments: j.attachments || [],
    meggerEquipment: j.meggerEquipment || "",
    meggerCalibrationDate: j.meggerCalibrationDate || "",
    id: j.externalId || j.id,
    serverId: j.id,
    certNumber: j.certNumber || "",
    status: j.status || "draft",
    clientName: j.clientName || "",
    clientCompany: j.clientCompany || "",
    clientEmail: j.clientEmail || "",
    clientPhone: j.clientPhone || "",
    siteAddress: j.siteAddress || "",
    environment: j.environment || "",
    retestMonths: j.retestMonths || 12,
    testDate: j.testDate,
    nextTestDate: j.nextTestDate || "",
    testerName: j.testerName || "",
    testerLicense: j.testerLicense || "",
    items: (j.items || []).map(it => ({
      id: it.id,
      qrId: it.qrId || "",
      itemType: it.itemType || "standard",
      assetId: it.assetId || "",
      description: it.description || "",
      makeModel: it.makeModel || "",
      serialNumber: it.serialNumber || "",
      location: it.location || "",
      equipmentClass: it.equipmentClass || "",
      visual: it.visual || "pass",
      earthContinuity: it.earthContinuity || "",
      insulationResistance: it.insulationResistance || "",
      insulationTestVoltage: it.insulationTestVoltage || "",
      leakageCurrent: it.leakageCurrent || "",
      rcdTest: it.rcdTest || "n/a",
      rcdTripTestEnabled: !!it.rcdTripTestEnabled,
      rcdType: it.rcdType || "",
      rcdTestMode: it.rcdTestMode || "time",
      rcdTripCurrentSetting: it.rcdTripCurrentSetting || "",
      rcdMeasuredTripTimeMs: it.rcdMeasuredTripTimeMs || "",
      rcdMeasuredTripCurrentMa: it.rcdMeasuredTripCurrentMa || "",
      overallResult: it.overallResult || "pass",
      overrideResult: !!it.overrideResult,
      notes: it.notes || "",
      partId: it.partId || ""
    }))
  };
}
async function pullJobsFromServer(cfg) {
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) return null;
  if (!cfg.session && !cfg.token) return null;
  // Try the session first, then fall back to the token. In the desktop /
  // mobile shell the app runs on its own origin, so the PHP session cookie
  // often isn't sent — the token is the intended path there.
  const attempt = async (useSession) => {
    const res = await fetch(base + "/api/services.php?resource=testtag&action=pull", useSession ? {
      credentials: "include",
      cache: "no-store"
    } : {
      headers: {
        "Authorization": "Bearer " + cfg.token
      },
      cache: "no-store"
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return null;
    const list = data.data.map(serverJobToLocal);
    // Jobs deleted on the server (from any device or the admin panel).
    list.deleted = Array.isArray(data.deleted) ? data.deleted : [];
    return list;
  };

  if (cfg.session) {
    try {
      const viaSession = await attempt(true);
      if (viaSession) return viaSession;
    } catch (e) { /* fall through to the token */ }
  }
  if (!cfg.token) return null;
  try {
    return await attempt(false);
  } catch (e) {
    return null;
  }
}

// Fetch a CSRF token for session-authenticated (hosted) requests.
async function getCsrf(base) {
  const r = await fetch(base + "/api/auth.php?action=me", {
    credentials: "include",
    cache: "no-store"
  });
  const d = await r.json();
  // auth.php returns the user under .data (json_ok payload); older/other
  // shapes may use .user. Accept either so a shape change can't lock us out.
  const usr = d && (d.data || d.user);
  if (!d || !d.ok || !usr) throw new Error("Please sign in to the admin panel first.");
  return d.csrf || (d.meta && d.meta.csrf) || "";
}
async function pushJobToServer(job, cfg) {
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) throw new Error("No server URL configured.");

  // Hosted: try the session-authenticated endpoint first (no token needed).
  // In a browser tab on zoltanstudios.au this is the normal path. In the
  // desktop/mobile shell the app runs on its own origin, so the PHP session
  // cookie may not be present — in that case fall through to the token path
  // below rather than failing outright.
  if (cfg.session) {
    try {
      const csrf = await getCsrf(base);
      const res2 = await fetch(base + "/api/services.php?resource=testtag&action=job_save", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body: JSON.stringify({
          job: jobToServerPayload(job)
        })
      });
      const d2 = await res2.json();
      if (!res2.ok || !d2.ok) throw new Error(d2 && d2.error ? d2.error : "Save failed.");
      return d2.data;
    } catch (sessionErr) {
      // No usable session. If a token is configured, use it; otherwise
      // report the original problem.
      if (!cfg.token) throw sessionErr;
    }
  }
  if (!cfg.token) throw new Error("No API token configured.");
  const res = await fetch(base + "/api/services.php?resource=testtag&action=push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + cfg.token
    },
    body: JSON.stringify({
      job: jobToServerPayload(job)
    })
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Server returned an unexpected response.");
  }
  if (!res.ok || !data.ok) {
    throw new Error(data && data.error ? data.error : "Push failed (HTTP " + res.status + ").");
  }
  return data.data;
}

// ---------------------------------------------------------------------------
// Deleting jobs on the server
// ---------------------------------------------------------------------------
// Deleting a job used to remove it from this device only, so the next pull
// brought it straight back. Now the server copy is deleted too (session or
// API token), and a delete made offline is queued and retried.
const PENDING_DELETES_KEY = "zoltanstudios-pending-deletes-v1";
function loadPendingDeletes() {
  try {
    const v = JSON.parse(window.localStorage.getItem(PENDING_DELETES_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}
function savePendingDeletes(list) {
  try {
    window.localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(list));
  } catch (e) {}
}
function queuePendingDelete(job) {
  const list = loadPendingDeletes().filter(d => d.id !== job.id);
  list.push({
    id: job.id,
    serverId: job.serverId || "",
    certNumber: job.certNumber || ""
  });
  savePendingDeletes(list);
}
async function deleteJobOnServer(job, cfg) {
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) throw new Error("No server URL configured.");
  const body = JSON.stringify({
    id: job.serverId || "",
    externalId: job.id
  });
  const url = base + "/api/services.php?resource=testtag&action=delete";
  const check = async res => {
    let d = null;
    try {
      d = await res.json();
    } catch (e) {}
    if (!res.ok || !d || !d.ok) throw new Error(d && d.error ? d.error : "Delete failed (HTTP " + res.status + ").");
    return d.data;
  };
  if (cfg.session) {
    try {
      const csrf = await getCsrf(base);
      return await check(await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body
      }));
    } catch (sessionErr) {
      if (!cfg.token) throw sessionErr;
    }
  }
  if (!cfg.token) throw new Error("No API token configured.");
  return await check(await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + cfg.token
    },
    body
  }));
}
// Retries deletes that couldn't reach the server. Returns the ones still waiting.
async function flushPendingDeletes(cfg) {
  const pending = loadPendingDeletes();
  if (pending.length === 0) return pending;
  const left = [];
  for (const d of pending) {
    try {
      await deleteJobOnServer(d, cfg);
    } catch (e) {
      left.push(d);
    }
  }
  savePendingDeletes(left);
  return left;
}
// Merges the server's job list into the local one: the server copy wins,
// jobs deleted on the server are dropped here, and jobs deleted here but not
// yet on the server stay deleted.
function mergeServerJobs(localJobs, serverJobs, pending) {
  const pendingIds = new Set((pending || []).map(d => d.id));
  const tomb = new Set();
  (serverJobs.deleted || []).forEach(d => {
    if (d && d.id) tomb.add(d.id);
    if (d && d.externalId) tomb.add(d.externalId);
  });
  const fromServer = serverJobs.filter(j => !pendingIds.has(j.id));
  const serverIds = new Set(serverJobs.map(j => j.id));
  const serverKeys = new Set(serverJobs.map(j => j.serverId).filter(Boolean));
  const localOnly = localJobs.filter(j => {
    if (serverIds.has(j.id) || pendingIds.has(j.id)) return false;
    if (tomb.has(j.id) || j.serverId && tomb.has(j.serverId)) return false; // deleted elsewhere
    // Came from the server once but isn't there now: deleted before tombstones existed.
    if (j.serverId && !serverKeys.has(j.serverId)) return false;
    return true; // never been on the server - keep it
  });
  return [...fromServer, ...localOnly];
}

// ---------------------------------------------------------------------------
// Certificate number registry
// ---------------------------------------------------------------------------
// Each entry: { certNumber, jobId, status, assignedAt, closedAt? }
// status: 'active' | 'deleted' | 'expired'
// Numbers with status 'deleted' or 'expired' are available for reuse.
// The registry is stored independently of jobs so the audit trail survives
// job deletions.

async function loadCertRegistry() {
  try {
    const raw = window.localStorage.getItem(CERT_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function persistCertRegistry(registry) {
  try {
    window.localStorage.setItem(CERT_REGISTRY_KEY, JSON.stringify(registry));
    return true;
  } catch {
    return false;
  }
}

// Returns the registry with any 'active' entries whose jobs have passed their
// next test date updated to 'expired'. Call this before generating new numbers
// so recently-expired numbers can be recycled if needed.
function markExpiredEntries(registry, jobs) {
  const today = new Date().toISOString().slice(0, 10);
  const jobMap = {};
  for (const j of jobs) {
    if (j.certNumber) jobMap[j.certNumber] = j;
  }
  return registry.map(entry => {
    if (entry.status !== "active") return entry;
    const job = jobMap[entry.certNumber];
    if (!job) return entry;
    const nextDue = addMonths(job.testDate, job.retestMonths);
    if (nextDue && nextDue < today) {
      return {
        ...entry,
        status: "expired",
        closedAt: today
      };
    }
    return entry;
  });
}

// Generates a new unique ZS-prefix cert number. Random 6-digit, avoids any
// currently-active entry in the registry, retries up to 1000 times (in
// practice will always succeed well under that).
function generateCertNumber(registry) {
  const activeNumbers = new Set(registry.filter(e => e.status === "active").map(e => e.certNumber));
  let attempts = 0;
  while (attempts < 1000) {
    const digits = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const candidate = "ZS" + digits;
    if (!activeNumbers.has(candidate)) return candidate;
    attempts++;
  }
  // Extremely unlikely to hit this, but fall back to a UUID-derived number
  return "ZS" + String(Date.now()).slice(-6);
}

// Adds a new 'active' entry for a cert number. Call when a job is created.
async function registerCertNumber(certNumber, jobId) {
  const registry = await loadCertRegistry();
  const updated = [...registry.filter(e => e.certNumber !== certNumber || e.jobId !== jobId), {
    certNumber,
    jobId,
    status: "active",
    assignedAt: new Date().toISOString().slice(0, 10)
  }];
  await persistCertRegistry(updated);
  return updated;
}

// Marks an entry as deleted. Call when a job is removed.
async function releaseCertNumber(certNumber, jobId) {
  const registry = await loadCertRegistry();
  const updated = registry.map(e => e.certNumber === certNumber && e.jobId === jobId && e.status === "active" ? {
    ...e,
    status: "deleted",
    closedAt: new Date().toISOString().slice(0, 10)
  } : e);
  await persistCertRegistry(updated);
  return updated;
}

// Fallback UUID generator in case crypto.randomUUID isn't available
// in this browser/context (e.g. very old browsers).
function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}
const DEFAULT_TESTER = {
  name: "Benjamin Cross",
  license: "14403607-9901941",
  company: "ZoltanStudios"
};



// ---------------------------------------------------------------------------
// Phone capture relay — mint a token on the laptop, show a QR code, then
// poll for photos/signatures the phone uploads against this job.
// ---------------------------------------------------------------------------
async function startCaptureSession(jobId) {
  const cfg = loadServerConfig();
  const base = (cfg.url || '').replace(/\/+$/, '');
  if (!base) throw new Error('No server configured.');

  // In a browser tab on the site the PHP session is available. In the
  // desktop / mobile shell the app runs on its own origin and the session
  // cookie isn't sent, so fall back to the API token.
  try {
    const csrf = await getCsrf(base);
    const res = await fetch(base + '/api/capture.php?action=start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf },
      body: new URLSearchParams({ jobId: jobId, csrf: csrf }).toString(),
    });
    const d = await res.json();
    if (!d || !d.ok) throw new Error((d && d.error) || 'Could not start a capture session.');
    return d.data || d;
  } catch (sessionErr) {
    if (!cfg.token) throw sessionErr;
    const res = await fetch(base + '/api/capture.php?action=start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + cfg.token,
      },
      body: new URLSearchParams({ jobId: jobId }).toString(),
    });
    const d = await res.json();
    if (!d || !d.ok) throw new Error((d && d.error) || 'Could not start a capture session.');
    return d.data || d;
  }
}

async function pollCaptures(jobId, since) {
  const cfg = loadServerConfig();
  const base = (cfg.url || '').replace(/\/+$/, '');
  if (!base) return [];
  const qs = new URLSearchParams({ jobId: jobId });
  if (since) qs.set('since', since);
  const cfg2 = loadServerConfig();
  const hdrs = cfg2.token ? { 'Authorization': 'Bearer ' + cfg2.token } : {};
  const res = await fetch(base + '/api/capture.php?action=poll&' + qs.toString(), {
    credentials: 'include', cache: 'no-store', headers: hdrs,
  });
  const d = await res.json();
  if (!d || !d.ok) return [];
  return d.data || [];
}

// ---------------------------------------------------------------------------
// The tester's signature, shared through the server (api/files.php) with the
// Business Suite and every phone: draw it once anywhere and it's used
// everywhere. "signatureVersion" is the server's version last seen;
// "signaturePending" means a change here still has to be sent.
// ---------------------------------------------------------------------------
async function filesCall(cfg, action, body) {
  const base = (cfg.url || '').replace(/\/+$/, '');
  if (!base) throw new Error('No server configured.');
  const url = base + '/api/files.php?action=' + action;
  const go = async (useSession) => {
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (useSession) { if (body) headers['X-CSRF-Token'] = await getCsrf(base); }
    else headers['Authorization'] = 'Bearer ' + cfg.token;
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      credentials: useSession ? 'include' : 'omit',
      cache: 'no-store',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let d = null;
    try { d = await res.json(); } catch (e) {}
    if (!res.ok || !d || !d.ok) throw new Error((d && d.error) || ('HTTP ' + res.status));
    return d.data || {};
  };
  if (cfg.session) {
    try { return await go(true); } catch (e) { if (!cfg.token) throw e; }
  }
  if (!cfg.token) throw new Error('Not connected to the server.');
  return go(false);
}

async function syncTesterSignature(cfg) {
  if (!cfg || !(cfg.token || cfg.session)) return false;
  const s = loadTesterSettings() || {};
  const keep = (d) => saveTesterSettings(Object.assign({}, loadTesterSettings() || {}, {
    signature: d.dataUrl || '', signatureVersion: d.version || '', signaturePending: false,
  }));
  try {
    if (s.signaturePending) {
      keep(await filesCall(cfg, 'tester_set', { dataUrl: s.signature || '' }));
      return true;
    }
    const d = await filesCall(cfg, 'tester_get');
    if (!d.version) {
      // Nothing on the server yet: give it this device's signature.
      if (s.signature) { keep(await filesCall(cfg, 'tester_set', { dataUrl: s.signature })); return true; }
      return false;
    }
    if (d.version === s.signatureVersion) return false;
    keep(d);
    return true;
  } catch (e) {
    return false; // offline, or a server without files.php: this device's copy stands
  }
}

// Render a QR code to an SVG data URI using the vendored generator.
function qrDataUri(text) {
  try {
    const gen = (typeof qrcode !== 'undefined') ? qrcode : window.qrcode;
    const q = gen(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    const cell = 6, quiet = 4;
    const size = (n + quiet * 2) * cell;
    let rects = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (q.isDark(r, c)) {
          rects += '<rect x="' + ((c + quiet) * cell) + '" y="' + ((r + quiet) * cell) +
                   '" width="' + cell + '" height="' + cell + '" fill="#0f172a"/>';
        }
      }
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
                '" viewBox="0 0 ' + size + ' ' + size + '"><rect width="100%" height="100%" fill="#fff"/>' +
                rects + '</svg>';
    return 'data:image/svg+xml;base64,' + btoa(svg);
  } catch (e) {
    return '';
  }
}


// ---------------------------------------------------------------------------
// Backup and restore.
//
// Everything the app owns lives in four localStorage keys. A backup captures
// all of them plus the server-held jobs, so a browser wipe, a new laptop, or
// a bad upgrade can't lose real client records.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Emailing a certificate to the client.
//
// The document HTML is built here and posted to the server, so what the
// client receives is exactly what the tester saw on screen. Auth follows the
// same session-then-token pattern as the rest of the sync layer.
// ---------------------------------------------------------------------------
async function emailDocumentToClient(job, opts) {
  const cfg = loadServerConfig();
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) throw new Error("No server configured.");

  const kind = (opts && opts.kind) || "certificate";

  // Attach a real PDF. The certificate uses flexbox, which server-side PHP
  // PDF libraries can't render, so it's produced here in the browser where
  // the layout already works.
  const pdf = await jobPdfBase64(job, kind);

  const payload = {
    to: (opts && opts.to) || job.clientEmail || "",
    kind: kind,
    pdfBase64: pdf.base64,
    filename: pdf.filename,
    certNumber: job.certNumber || "",
    clientName: job.clientName || "",
    siteAddress: job.siteAddress || "",
    nextTestDue: formatDisplayDate(addMonths(job.testDate, job.retestMonths)) || "",
    message: (opts && opts.message) || "",
  };

  const post = async (headers) => {
    const res = await fetch(base + "/api/email.php?action=send", {
      method: "POST",
      credentials: "include",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!d || !d.ok) throw new Error((d && d.error) || "The email could not be sent.");
    return d.data || d;
  };

  // Session first (browser on the site), then token (desktop / mobile shell).
  try {
    const csrf = await getCsrf(base);
    return await post({ "X-CSRF-Token": csrf });
  } catch (sessionErr) {
    if (!cfg.token) throw sessionErr;
    return await post({ "Authorization": "Bearer " + cfg.token });
  }
}
