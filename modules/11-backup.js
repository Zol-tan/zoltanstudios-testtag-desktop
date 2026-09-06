// ======================================================================
// 11-backup.js
// Backup and restore
// ======================================================================

const BACKUP_FORMAT = "zoltanstudios-testtag-backup";
const BACKUP_VERSION = 1;

function buildBackup(extraJobs) {
  const read = (k) => {
    try { return window.localStorage.getItem(k); } catch { return null; }
  };
  const parse = (raw, fallback) => {
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const localJobs = parse(read(STORAGE_KEY), []);

  // Merge in anything only present on the server, matched on job id.
  let jobs = localJobs;
  if (Array.isArray(extraJobs) && extraJobs.length) {
    const seen = {};
    localJobs.forEach((j) => { if (j && j.id) seen[j.id] = true; });
    jobs = localJobs.concat(extraJobs.filter((j) => j && j.id && !seen[j.id]));
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    counts: { jobs: jobs.length },
    jobs: jobs,
    certRegistry: parse(read(CERT_REGISTRY_KEY), []),
    testerSettings: parse(read(TESTER_SETTINGS_KEY), null),
    lastTagStart: read(TAG_START_KEY),
  };
}

// Restores a backup. Jobs are MERGED by id rather than replacing what's
// there, so restoring an older backup can't delete newer work.
function restoreBackup(data) {
  if (!data || data.format !== BACKUP_FORMAT) {
    throw new Error("That file isn't a ZoltanStudios Test and Tag backup.");
  }
  if (!Array.isArray(data.jobs)) {
    throw new Error("That backup file looks damaged - no job list found.");
  }

  let existing = [];
  try { existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"); } catch {}
  if (!Array.isArray(existing)) existing = [];

  const byId = {};
  existing.forEach((j) => { if (j && j.id) byId[j.id] = j; });

  let added = 0, updated = 0;
  data.jobs.forEach((j) => {
    if (!j || !j.id) return;
    if (byId[j.id]) {
      // Keep whichever was edited most recently.
      const a = byId[j.id].createdAt || 0, b = j.createdAt || 0;
      if (b >= a) { byId[j.id] = j; updated += 1; }
    } else {
      byId[j.id] = j;
      added += 1;
    }
  });

  const merged = Object.keys(byId).map((k) => byId[k]);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

  if (Array.isArray(data.certRegistry)) {
    window.localStorage.setItem(CERT_REGISTRY_KEY, JSON.stringify(data.certRegistry));
  }
  if (data.testerSettings) {
    window.localStorage.setItem(TESTER_SETTINGS_KEY, JSON.stringify(data.testerSettings));
  }
  if (typeof data.lastTagStart === "string") {
    window.localStorage.setItem(TAG_START_KEY, data.lastTagStart);
  }

  return { added: added, updated: updated, total: merged.length };
}

// ---------------------------------------------------------------------------
// Tester settings — editable defaults, persisted in localStorage so the
// tester name / licence / equipment / calibration date can be changed
// without rebuilding the app.
// ---------------------------------------------------------------------------
