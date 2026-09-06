// ======================================================================
// 05-zip-export.js
// Per-job ZIP export
// ======================================================================

// ---------------------------------------------------------------------------
// Export helpers - turn one or many jobs into a ZIP with a folder per job.
// ---------------------------------------------------------------------------

function sanitizeFolderName(str) {
  return String(str || "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, " ").trim().slice(0, 80);
}
function jobFolderName(job) {
  const client = sanitizeFolderName(job.clientName) || "Untitled Client";
  const date = job.testDate || "no-date";
  const shortId = job.id ? job.id.slice(0, 8) : "";
  return `${client} - ${date} - ${shortId}`;
}
function jobToZipEntries(job) {
  const folder = job.folderName || jobFolderName(job);
  const jobWithFolder = {
    ...job,
    folderName: folder
  };
  return [...(job.jobType === "generator_inspection" ? [{
    path: `${folder}/generator-inspection-report.html`,
    content: buildGeneratorReportHTML(job)
  }] : []), {
    path: `${folder}/certificate.html`,
    content: buildCertificateHTML(job)
  }, {
    path: `${folder}/record.html`,
    content: buildRecordHTML(job)
  }, {
    path: `${folder}/asset-register.csv`,
    content: buildAssetRegisterCSV(job)
  }, {
    path: `${folder}/qr-labels.html`,
    content: buildLabelSheetHTML(job)
  }, {
    path: `${folder}/job.json`,
    content: JSON.stringify(jobWithFolder, null, 2)
  }];
}
function exportJobAsZip(job) {
  const entries = jobToZipEntries(job);
  const folder = job.folderName || jobFolderName(job);
  downloadZip(entries, `${folder}.zip`);
}
function exportAllAsZip(jobs) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = jobs.flatMap(job => jobToZipEntries(job));
  downloadZip(entries, `Test & Tag Records - ${today}.zip`);
}
