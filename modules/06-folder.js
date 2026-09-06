// ======================================================================
// 06-folder.js
// File System Access folder saving
// ======================================================================

// ---------------------------------------------------------------------------
// Direct-to-folder saving using the File System Access API.
// Lets the user connect their real "Test & Tag" folder once; after that,
// every save writes certificate.html + record.html straight into that job's
// own subfolder - no manual export/unzip step needed.
//
// Only Chrome/Edge (and other Chromium browsers) support this API today.
// Firefox and Safari don't, so those users fall back to the ZIP export
// buttons, which always remain available regardless.
// ---------------------------------------------------------------------------

const FS_ACCESS_SUPPORTED = typeof window !== "undefined" && "showDirectoryPicker" in window;
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("testtag-app-db", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("handles")) {
        req.result.createObjectStore("handles");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readonly");
    const req = tx.objectStore("handles").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    const req = tx.objectStore("handles").put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    const req = tx.objectStore("handles").delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Lets the user pick their "Test & Tag" folder. Requires a real user
// gesture (must be called directly from a click handler).
async function pickFolder() {
  const handle = await window.showDirectoryPicker({
    mode: "readwrite"
  });
  await idbSet("rootHandle", handle);
  return handle;
}

// Tries to reuse a previously-picked folder without prompting again.
// Returns { handle, granted } or null if nothing was ever picked.
async function getStoredFolder() {
  if (!FS_ACCESS_SUPPORTED) return null;
  const handle = await idbGet("rootHandle");
  if (!handle) return null;
  try {
    const perm = await handle.queryPermission({
      mode: "readwrite"
    });
    return {
      handle,
      granted: perm === "granted"
    };
  } catch {
    return null;
  }
}

// Must be called from a real user gesture (e.g. a button click) - browsers
// block silent permission re-requests.
async function reconnectFolder(handle) {
  const perm = await handle.requestPermission({
    mode: "readwrite"
  });
  return perm === "granted";
}
async function forgetFolder() {
  await idbDelete("rootHandle");
}
async function writeFileToDir(dirHandle, filename, content) {
  const fileHandle = await dirHandle.getFileHandle(filename, {
    create: true
  });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

// Writes/overwrites this job's certificate.html + record.html + job.json into
// its own subfolder under the connected root. Reuses the SAME subfolder
// across repeated saves (even if the client name changes later) via
// job.folderName, which is assigned once and kept stable. job.json is what
// lets the app read jobs back OUT of the folder later (see
// readJobsFromFolder below) - certificate.html/record.html are for humans,
// job.json is for the app.
async function saveJobToFolder(rootHandle, job) {
  const folderName = job.folderName || jobFolderName(job);
  const dirHandle = await rootHandle.getDirectoryHandle(folderName, {
    create: true
  });
  if (job.jobType === "generator_inspection") { await writeFileToDir(dirHandle, "generator-inspection-report.html", buildGeneratorReportHTML(job)); }
  await writeFileToDir(dirHandle, "certificate.html", buildCertificateHTML(job));
  await writeFileToDir(dirHandle, "record.html", buildRecordHTML(job));
  await writeFileToDir(dirHandle, "asset-register.csv", buildAssetRegisterCSV(job));
  await writeFileToDir(dirHandle, "qr-labels.html", buildLabelSheetHTML(job));
  await writeFileToDir(dirHandle, "job.json", JSON.stringify({
    ...job,
    folderName
  }, null, 2));
  return folderName;
}

// Scans every subfolder of the connected root and reads back the job.json
// inside each one, reconstructing the full jobs list straight from disk.
// Subfolders with no valid job.json (e.g. something a person dropped in by
// hand) are silently skipped rather than failing the whole scan.
async function readJobsFromFolder(rootHandle) {
  const jobs = [];
  for await (const [name, handle] of rootHandle.entries()) {
    if (handle.kind !== "directory") continue;
    try {
      const fileHandle = await handle.getFileHandle("job.json");
      const file = await fileHandle.getFile();
      const text = await file.text();
      const job = normalizeJobLicense(JSON.parse(text));
      job.folderName = name; // the real folder name on disk always wins
      jobs.push(job);
    } catch (e) {
      // No job.json in this folder (or it's not valid JSON) - skip it.
    }
  }
  return jobs;
}

// Deletes a job's entire subfolder (certificate, record, job.json - all of
// it) from disk. Safe to call even if the folder was already removed by
// hand; only re-throws genuinely unexpected errors.
async function deleteJobFolder(rootHandle, folderName) {
  if (!folderName) return;
  try {
    await rootHandle.removeEntry(folderName, {
      recursive: true
    });
  } catch (e) {
    if (e && e.name !== "NotFoundError") throw e;
  }
}
