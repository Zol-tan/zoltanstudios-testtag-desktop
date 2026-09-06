// ======================================================================
// 07-qr-labels.js
// A4 QR label sheet
// ======================================================================

// ---------------------------------------------------------------------------
// QR label sheet generator.
// Produces a print-ready A4 HTML page with 24 labels per sheet.
// Each label has a QR code, the QR ID, item description, and job details.
// Uses the QRServer API for QR code images (requires internet at print time).
// ---------------------------------------------------------------------------

function qrImageUrl(qrId, size = 80) {
  const url = VERIFY_BASE_URL + encodeURIComponent(qrId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=4&color=1e293b`;
}
function buildLabelSheetHTML(job) {
  const testerShort = job.testerName ? job.testerName.split(" ").map((w, i) => i === 0 ? w[0] + "." : w).join(" ") : "B. Cross";
  const nextDue = addMonths(job.testDate, job.retestMonths);
  const labels = job.items.map(item => {
    const qrId = item.qrId || "ZS-????";
    const isPass = item.overallResult === "pass";
    const resultColor = isPass ? "#047857" : "#b91c1c";
    const resultBg = isPass ? "#d1fae5" : "#fee2e2";
    const resultText = isPass ? "PASS" : "FAIL";
    return `
      <div class="label">
        <div class="label-inner">
          <div class="label-left">
            <div class="result-badge" style="background:${resultBg};color:${resultColor}">
              ${resultText}
            </div>
            <div class="qr-id">${escapeHtml(qrId)}</div>
            <div class="label-detail truncate">${escapeHtml(item.description) || "—"}</div>
            <div class="label-detail truncate">${item.location ? "📍 " + escapeHtml(item.location) : ""}</div>
          </div>
          <div class="label-right">
            <img src="${qrImageUrl(qrId)}" alt="${escapeHtml(qrId)}" width="68" height="68" />
          </div>
        </div>
        <div class="label-footer">
          <span>${escapeHtml(formatDisplayDate(job.testDate))}</span>
          <span>Due: ${escapeHtml(formatDisplayDate(nextDue))}</span>
          <span>${escapeHtml(testerShort)}</span>
        </div>
      </div>`;
  });

  // Pad to a multiple of 24 so the sheet looks complete
  while (labels.length % 24 !== 0) {
    labels.push(`<div class="label label-blank"></div>`);
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>QR Labels — ${escapeHtml(job.clientName || "Job")} ${job.testDate}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Job header — only shown on screen, hidden on print */
  .sheet-header {
    padding: 16px 24px;
    background: #1e293b;
    color: white;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .sheet-header strong { font-size: 15px; }
  .print-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }
  @media print { .sheet-header { display: none !important; } }

  /* Label grid — Avery L7160 / equivalent (70mm × 37mm, 3 wide × 8 tall = 24 per A4) */
  .sheet {
    width: 210mm;
    margin: 0 auto;
    padding: 14mm 7mm;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  .label {
    width: 70mm;
    height: 37mm;
    border: 0.3px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: 7.5px;
  }
  .label-blank {
    border: 0.3px dashed #e2e8f0;
    opacity: 0.3;
  }
  .label-inner {
    display: flex;
    flex: 1;
    gap: 4px;
    padding: 4px 5px 2px 5px;
    min-height: 0;
  }
  .label-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .label-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .result-badge {
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.08em;
    padding: 1px 5px;
    border-radius: 3px;
    align-self: flex-start;
  }
  .qr-id {
    font-family: monospace;
    font-weight: 700;
    font-size: 9.5px;
    color: #1e3a5f;
    letter-spacing: 0.05em;
    margin-top: 1px;
  }
  .label-detail {
    color: #475569;
    font-size: 7px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label-footer {
    background: #1e293b;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
    padding: 2px 5px;
    font-size: 6.5px;
    letter-spacing: 0.01em;
    flex-shrink: 0;
  }

  @media print {
    html, body { width: 210mm; }
    .sheet {
      width: 210mm;
      padding: 14mm 7mm;
      page-break-after: always;
    }
  }
</style>
</head>
<body>

<div class="sheet-header">
  <div>
    <strong>QR Labels — ${escapeHtml(job.clientName || "Job")}</strong>
    <span style="margin-left:12px;opacity:0.7">${escapeHtml(job.siteAddress || "")} · ${labels.filter(l => !l.includes("label-blank")).length} items</span>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 Print</button>
</div>

<div class="sheet">
  ${labels.join("\n")}
</div>

</body>
</html>`;
}
function printQrLabels(job) {
  const html = buildLabelSheetHTML(job);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups to print QR labels.");
    return;
  }
  w.document.write(html);
  w.document.close();
}
