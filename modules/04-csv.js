// ======================================================================
// 04-csv.js
// CSV cell escaping
// ======================================================================

// ---------------------------------------------------------------------------
// CSV asset register - spreadsheet-friendly export of every item in a job.
// Included in ZIP exports and folder saves alongside the HTML files.
// ---------------------------------------------------------------------------

function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildAssetRegisterCSV(job) {
  const nextDue = addMonths(job.testDate, job.retestMonths);
  const header = ["QR ID", "Asset ID", "Description", "Make / Model", "Serial No.", "Location", "Class", "Visual", "Earth Continuity (Ω)", "Insulation (MΩ)", "Test Voltage (V)", "Leakage (mA)", "RCD Trip Time (ms)", "RCD Trip Current (mA)", "Result", "Notes", "Test Date", "Next Due", "Client", "Site", "Cert No.", "Tested By", "Licence"];
  const rows = job.items.map(i => [i.qrId, i.assetId, i.description, i.makeModel, i.serialNumber, i.location, i.equipmentClass, i.visual, i.earthContinuity, i.insulationResistance, i.insulationTestVoltage, i.leakageCurrent, i.rcdMeasuredTripTimeMs, i.rcdMeasuredTripCurrentMa, i.overallResult ? i.overallResult.toUpperCase() : "", i.notes, job.testDate, nextDue, job.clientName, job.siteAddress, job.certNumber || "", job.testerName, job.testerLicense]);
  const table = QR_LABELS_ENABLED ? [header, ...rows] : [header, ...rows].map(r => r.slice(1)); // QR ID is column 0
  // \uFEFF BOM so Excel opens it as UTF-8 without mangling characters.
  return "\uFEFF" + table.map(r => r.map(csvCell).join(",")).join("\r\n");
}

