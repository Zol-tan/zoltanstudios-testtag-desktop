// ======================================================================
// 00-preamble.js
// React destructure
// ======================================================================

const {
  useState,
  useEffect,
  useCallback,
  useMemo
} = React;

// ======================================================================
// 01-icons.js
// Inline SVG icon components
// ======================================================================

// ---------------------------------------------------------------------------
// Minimal inline icon set (no external icon library needed for a standalone
// file). Same visual language as lucide: 24x24, stroke-based, currentColor.
// ---------------------------------------------------------------------------

function IconBase({
  children,
  size = 16,
  className = "",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    style: style
  }, children);
}
function Plus(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  }));
}
function Trash2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 11v6M14 11v6"
  }));
}
function Printer(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "14",
    width: "12",
    height: "8"
  }));
}
function ArrowLeft(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }));
}
function CheckCircle2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 12 2 2 4-4"
  }));
}
function XCircle(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  }));
}
function AlertTriangle(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  }));
}
function ClipboardList(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "2",
    width: "8",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 12h6M9 16h6M9 8h1"
  }));
}
function Save(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-8H7v8M7 3v5h8"
  }));
}
function Loader2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  }));
}
function FileText(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6M8 13h8M8 17h8M8 9h2"
  }));
}
function CloudUpload(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 12v9M8 17l4-4 4 4"
  }));
}
function Settings(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  }));
}
function Search(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  }));
}

// ======================================================================
// 02-zip-download.js
// ZIP builder, download and desktop-shell helpers
// ======================================================================

// ---------------------------------------------------------------------------
// Minimal in-browser ZIP writer (STORE method - no compression needed).
// No external library required. Produces a standard, valid .zip that any
// OS's built-in "Extract All" can open.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ crc >>> 8;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function strToBytes(str) {
  return new TextEncoder().encode(str);
}
function writeUint32LE(view, offset, value) {
  view.setUint32(offset, value, true);
}
function writeUint16LE(view, offset, value) {
  view.setUint16(offset, value, true);
}

// DOS date/time encoding (fixed, doesn't need to be accurate for our purposes)
function dosDateTime() {
  const now = new Date();
  const time = now.getHours() << 11 | now.getMinutes() << 5 | Math.floor(now.getSeconds() / 2);
  const date = now.getFullYear() - 1980 << 9 | now.getMonth() + 1 << 5 | now.getDate();
  return {
    time,
    date
  };
}

/**
 * Build a ZIP archive (Uint8Array) from a list of { path, content } entries.
 * `path` uses forward slashes for folder separators, e.g. "Job Name/certificate.html".
 * `content` is a string (will be UTF-8 encoded).
 */
function buildZip(entries) {
  const {
    time,
    date
  } = dosDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = strToBytes(entry.path);
    const dataBytes = strToBytes(entry.content);
    const crc = crc32(dataBytes);
    const localHeader = new ArrayBuffer(30);
    const lv = new DataView(localHeader);
    writeUint32LE(lv, 0, 0x04034b50);
    writeUint16LE(lv, 4, 20); // version needed
    writeUint16LE(lv, 6, 0); // flags
    writeUint16LE(lv, 8, 0); // compression: store
    writeUint16LE(lv, 10, time);
    writeUint16LE(lv, 12, date);
    writeUint32LE(lv, 14, crc);
    writeUint32LE(lv, 18, dataBytes.length); // compressed size
    writeUint32LE(lv, 22, dataBytes.length); // uncompressed size
    writeUint16LE(lv, 26, nameBytes.length);
    writeUint16LE(lv, 28, 0); // extra field length

    localParts.push(new Uint8Array(localHeader), nameBytes, dataBytes);
    const centralHeader = new ArrayBuffer(46);
    const cv = new DataView(centralHeader);
    writeUint32LE(cv, 0, 0x02014b50);
    writeUint16LE(cv, 4, 20); // version made by
    writeUint16LE(cv, 6, 20); // version needed
    writeUint16LE(cv, 8, 0); // flags
    writeUint16LE(cv, 10, 0); // compression: store
    writeUint16LE(cv, 12, time);
    writeUint16LE(cv, 14, date);
    writeUint32LE(cv, 16, crc);
    writeUint32LE(cv, 20, dataBytes.length);
    writeUint32LE(cv, 24, dataBytes.length);
    writeUint16LE(cv, 28, nameBytes.length);
    writeUint16LE(cv, 30, 0); // extra length
    writeUint16LE(cv, 32, 0); // comment length
    writeUint16LE(cv, 34, 0); // disk number start
    writeUint16LE(cv, 36, 0); // internal attrs
    writeUint32LE(cv, 38, 0); // external attrs
    writeUint32LE(cv, 42, offset); // offset of local header

    centralParts.push(new Uint8Array(centralHeader), nameBytes);
    offset += localHeader.byteLength + nameBytes.length + dataBytes.length;
  }
  const centralDirSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const centralDirOffset = offset;
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  writeUint32LE(ev, 0, 0x06054b50);
  writeUint16LE(ev, 4, 0); // disk number
  writeUint16LE(ev, 6, 0); // disk with central dir
  writeUint16LE(ev, 8, entries.length); // entries on this disk
  writeUint16LE(ev, 10, entries.length); // total entries
  writeUint32LE(ev, 12, centralDirSize);
  writeUint32LE(ev, 16, centralDirOffset);
  writeUint16LE(ev, 20, 0); // comment length

  const allParts = [...localParts, ...centralParts, new Uint8Array(eocd)];
  const totalLength = allParts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of allParts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}
function downloadZip(entries, filename) {
  const bytes = buildZip(entries);
  const blob = new Blob([bytes], {
    type: "application/zip"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // The desktop shell has no download manager, so a ZIP can't be saved from
  // it. Say so plainly rather than appearing to do nothing.
  if (isDesktopShell()) {
    setTimeout(function () {
      alert(
        "ZIP downloads aren't supported in the desktop app.\n\n" +
        "Use the Certificate or Record buttons to open the document and save " +
        "it with Ctrl+S, or open the app in your browser at " +
        "zoltanstudios.au/testtag-app.html to download the ZIP."
      );
    }, 300);
  }
}
// True when running inside the Tauri desktop shell rather than a browser.
// Tauri's webview has no download manager, so a blob download silently does
// nothing there and we have to fall back to opening the document instead.
function isDesktopShell() {
  try {
    if (window.__TAURI__ || window.__TAURI_INTERNALS__) return true;
    // The shell reports its own origin rather than the site's.
    if (window.location.protocol === "tauri:") return true;
    return /Tauri|wry/i.test(navigator.userAgent || "");
  } catch { return false; }
}

// Opens HTML in a new window so it can be read, printed, or saved with
// Ctrl+S. Used as the desktop fallback for downloads.
function openHtmlInWindow(content, title) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(content);
  w.document.close();
  try { w.document.title = title || "Document"; } catch {}
  return true;
}

function downloadSingleFile(content, filename, mime = "text/html") {
  // Desktop shell: no download manager, so present the document instead and
  // let the tester print it or save with Ctrl+S.
  if (isDesktopShell() && /html/i.test(mime)) {
    if (openHtmlInWindow(content, filename)) return;
  }

  const blob = new Blob([content], {
    type: mime
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // If nothing happened (desktop shell, popup blocked, non-HTML content),
  // fall back to showing the content so the work isn't lost.
  if (isDesktopShell() && !/html/i.test(mime)) {
    setTimeout(function () {
      openHtmlInWindow(
        "<pre style=\"white-space:pre-wrap;font:13px/1.5 monospace;padding:16px\">" +
        String(content).replace(/&/g, "&amp;").replace(/</g, "&lt;") +
        "</pre>",
        filename
      );
    }, 400);
  }
}

// ======================================================================
// 03-templates.js
// Logo, certificate, record and signature templates
// ======================================================================

// ---------------------------------------------------------------------------
// Standalone HTML export templates (certificate + full record).
// These are hand-built HTML strings (not React) so the exported files are
// fully self-contained - no CDN, no framework, opens correctly forever.
// ---------------------------------------------------------------------------

const LOGO_DATA_URI = "data:image/png;base64,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";
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function docShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    margin: 0;
    padding: 32px 16px;
  }
  .sheet {
    max-width: 860px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #1e293b;
    padding-bottom: 16px;
    margin-bottom: 24px;
    gap: 16px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 48px; height: 48px; border-radius: 8px; }
  .brand-name {
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .brand-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
  .letterhead-right { text-align: right; font-size: 12px; color: #64748b; line-height: 1.6; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .tile { background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; }
  .tile.pass { background: #ecfdf5; }
  .tile.fail { background: #fef2f2; }
  .tile.rate { background: #eff6ff; }
  .tile-num { font-size: 26px; font-weight: 800; color: #0f172a; }
  .tile.pass .tile-num { color: #047857; }
  .tile.fail .tile-num { color: #b91c1c; }
  .tile.rate .tile-num { color: #1d4ed8; }
  .tile-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 4px; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; font-size: 14px; margin-bottom: 24px; }
  .details-grid .full { grid-column: 1 / -1; }
  .details-grid .lbl { color: #94a3b8; }
  .details-grid .val { font-weight: 600; }
  .callout {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 24px;
  }
  .callout h3 { margin: 0 0 8px; color: #b91c1c; font-size: 14px; }
  .callout ul { margin: 0; padding-left: 20px; color: #b91c1c; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
  th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 8px 6px; color: #475569; }
  td { border-bottom: 1px solid #e2e8f0; padding: 6px; vertical-align: top; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  }
  .badge.pass { background: #d1fae5; color: #047857; }
  .badge.fail { background: #fee2e2; color: #b91c1c; }
  .declaration { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 32px; font-size: 12px; color: #475569; line-height: 1.6; }
  .declaration h3 { color: #1e293b; font-size: 13px; margin-bottom: 8px; }
  .declaration .fine-print { font-style: italic; color: #94a3b8; margin-top: 8px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-size: 13px; }
  .sig-line { border-bottom: 1px solid #94a3b8; height: 48px; }
  .sig-name { margin-top: 4px; font-weight: 600; }
  .sig-label { font-size: 11px; color: #94a3b8; }
  .footer-note { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
  @media print {
    body { background: white; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; padding: 0; max-width: none; }
  }
</style>
</head>
<body>
  <div class="sheet">
    ${bodyHtml}
  </div>
</body>
</html>`;
}
function letterheadHtml(subtitle) {
  return `
    <div class="letterhead">
      <div class="brand">
        <img src="${LOGO_DATA_URI}" alt="ZoltanStudios logo" />
        <div>
          <div class="brand-name">ZoltanStudios</div>
          <div class="brand-sub">${subtitle}</div>
        </div>
      </div>
      <div class="letterhead-right">
        Melbourne, Victoria, Australia<br />
        zoltan@zoltanstudios.au
      </div>
    </div>`;
}
function detailsGridHtml(job, nextTestDate) {
  const tagColour = getTagColour(job.testDate, job.retestMonths);
  return `
    <div class="details-grid">
      <div><span class="lbl">Client:</span> <span class="val">${escapeHtml(job.clientName) || "&mdash;"}</span></div>
      <div><span class="lbl">Company:</span> <span class="val">${escapeHtml(job.clientCompany) || "&mdash;"}</span></div>
      <div class="full"><span class="lbl">Site Address:</span> <span class="val">${escapeHtml(job.siteAddress) || "&mdash;"}</span></div>
      <div><span class="lbl">Test Date:</span> <span class="val">${escapeHtml(formatDisplayDate(job.testDate))}</span></div>
      <div><span class="lbl">Next Test Due:</span> <span class="val">${escapeHtml(nextTestText(job))}</span></div>
      <div><span class="lbl">Tested By:</span> <span class="val">${escapeHtml(job.testerName)}</span></div>
      <div><span class="lbl">Licence / Qual. No.:</span> <span class="val">${escapeHtml(job.testerLicense)}</span></div>
      <div class="full"><span class="lbl">Standard:</span> <span class="val">${standardsLine(job)}</span></div>
      ${tagColour ? `<div><span class="lbl">Tag Colour:</span> <span class="val">${escapeHtml(tagColour.name)}</span></div>` : ""}
    </div>`;
}
function resultBadgeHtml(result) {
  const isPass = result === "pass";
  return `<span class="badge ${isPass ? "pass" : "fail"}">${isPass ? "PASS" : "FAIL"}</span>`;
}

// Photos and client signature, rendered into the certificate / record.
// Returns the most recent captured client signature, or null.
function latestSignature(job) {
  const sigs = (job.attachments || []).filter((a) => a.kind === "signature");
  return sigs.length ? sigs[sigs.length - 1] : null;
}

// The client half of the signature block. If a signature was captured on the
// phone it's drawn onto the line along with the date it was collected;
// otherwise a blank ruled line is left for signing a printout by hand.
// The tester half of the signature block. Uses the signature drawn once in
// Tester Defaults, so an emailed certificate isn't sent with a blank line.
function testerSignatureBlockHtml(job, label) {
  let sig = "";
  try { sig = (effectiveTester() || {}).signature || ""; } catch (e) { sig = ""; }

  if (!sig) {
    return `<div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(job.testerName)}</div>
        <div class="sig-label">${label || "Tester Signature"} &amp; Date</div>
      </div>`;
  }
  const when = escapeHtml(formatDisplayDate(job.testDate));
  return `<div>
        <div class="sig-line" style="position:relative;border-bottom:1px solid #94a3b8;height:48px;">
          <img src="${sig}" alt="Tester signature"
               style="position:absolute;bottom:2px;left:0;max-height:46px;max-width:230px;" />
        </div>
        <div class="sig-name">${escapeHtml(job.testerName)}</div>
        <div class="sig-label">${label || "Tester Signature"} &mdash; ${when}</div>
      </div>`;
}

function clientSignatureBlockHtml(job) {
  const sig = latestSignature(job);
  const name = escapeHtml(sig && sig.note ? sig.note : job.clientName) || "Client Representative";

  if (!sig) {
    return `<div>
        <div class="sig-line"></div>
        <div class="sig-name">${name}</div>
        <div class="sig-label">Client Signature &amp; Date</div>
      </div>`;
  }

  const when = sig.createdAt ? formatDisplayDate(String(sig.createdAt).slice(0, 10)) : "";
  return `<div>
        <div class="sig-line" style="position:relative;border-bottom:1px solid #94a3b8;height:48px;">
          <img src="${sig.dataUrl}" alt="Client signature"
               style="position:absolute;bottom:2px;left:0;max-height:46px;max-width:230px;" />
        </div>
        <div class="sig-name">${name}</div>
        <div class="sig-label">Client Signature${when ? " &mdash; signed " + escapeHtml(when) : ""}</div>
      </div>`;
}

function attachmentsHtml(job) {
  const atts = job.attachments || [];
  if (!atts.length) return "";
  const photos = atts.filter((a) => a.kind !== "signature");
  const sigs = atts.filter((a) => a.kind === "signature");
  let out = "";

  if (photos.length) {
    out += '<h2>Site Photographs</h2><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px;">'
        + photos.map((p) =>
            '<figure style="margin:0;width:170px;">'
          + '<img src="' + p.dataUrl + '" alt="Site photograph" '
          + 'style="width:170px;height:130px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px;display:block;" />'
          + (p.note ? '<figcaption style="font-size:10px;color:#64748b;margin-top:3px;">' + escapeHtml(p.note) + '</figcaption>' : '')
          + '</figure>').join("")
        + '</div>';
  }

  // The signature itself is drawn into the signature block at the foot of
  // the certificate (see clientSignatureBlockHtml), so it is deliberately
  // not repeated here.
  return out;
}

function buildCertificateHTML(job) {
  const nextTestDate = addMonths(job.testDate, job.retestMonths);
  const items = gradedItems(job);
  const cc = certificateCounts(job);
  const failedItems = items.filter(i => i.overallResult === "fail");
  const tiles = `
    <div class="tiles">
      <div class="tile"><div class="tile-num">${cc.total}</div><div class="tile-label">Tested</div>${cc.breakdown ? `<div class="tile-label" style="text-transform:none;letter-spacing:0">${cc.breakdown}</div>` : ""}</div>
      <div class="tile pass"><div class="tile-num">${cc.pass}</div><div class="tile-label">Passed</div></div>
      <div class="tile fail"><div class="tile-num">${cc.fail}</div><div class="tile-label">Failed</div></div>
      <div class="tile rate"><div class="tile-num">${cc.rate}%</div><div class="tile-label">Pass Rate</div></div>
    </div>`;
  const failedCallout = failedItems.length ? `<div class="callout">
        <h3>&#9888; Items Requiring Attention</h3>
        <ul>${failedItems.map(i => `<li>${escapeHtml(i.assetId) || "Unlabelled"} &mdash; ${escapeHtml(i.description) || "No description"}${i.location ? ` (${escapeHtml(i.location)})` : ""}${i.faultDescription ? `: ${escapeHtml(i.faultDescription)}` : ""}${i.removedFromService ? " &mdash; danger tagged, removed from service" : ""}</li>`).join("")}</ul>
      </div>` : "";
  const rows = items.map(item => `
      <tr>
        <td>${escapeHtml(item.assetId) || "&mdash;"}</td>
        <td>${escapeHtml(item.description) || "&mdash;"}${item.repairDetails ? `<br/><span style="font-size:10px;color:#1d4ed8">Repaired on site: ${escapeHtml(item.repairDetails)}</span>` : ""}</td>
        <td>${escapeHtml(item.equipmentClass)}</td>
        <td>${escapeHtml(item.location) || "&mdash;"}</td>
        <td style="text-transform:capitalize">${escapeHtml(item.visual)}</td>
        <td>${item.equipmentClass === "I" ? escapeHtml(item.earthContinuity) || "&mdash;" : "n/a"}</td>
        <td>${escapeHtml(item.insulationResistance) || "&mdash;"}</td>
        <td>${resultBadgeHtml(item.overallResult)}</td>
      </tr>`).join("");
  const certNumBanner = job.certNumber ? `<div style="display:flex;align-items:center;justify-content:space-between;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:10px 16px;margin-bottom:16px;">
        <span style="font-size:12px;color:#3b82f6;font-weight:600;letter-spacing:0.05em;">CERTIFICATE NUMBER</span>
        <span style="font-family:monospace;font-size:22px;font-weight:800;color:#1d4ed8;letter-spacing:0.15em;">${escapeHtml(job.certNumber)}</span>
       </div>` : "";
  const body = `
    ${letterheadHtml(certificateTitle(job))}
    ${draftBannerHtml(job)}
    ${certNumBanner}
    ${tiles}
    ${detailsGridHtml(job, nextTestDate)}
    ${failedCallout}
    ${items.length ? `<table>
      <thead>
        <tr>
          <th>Tag Number</th><th>Description</th><th>Class</th><th>Location</th>
          <th>Visual</th><th>Earth (&Omega;)</th><th>Insul. (M&Omega;)</th><th>Result</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>` : ""}
    ${fixedRcdSectionHtml(job)}
    ${lightsSectionHtml(job)}
    ${servicesItemSectionsHtml(job)}
    <div class="declaration">
      <h3>Statutory Declaration</h3>
      <p>
        I declare that the electrical equipment listed in this report has been inspected and
        tested in accordance with ${standardsLine(job)}, and that the results recorded above are a true and
        accurate account of the condition of each item at the time of testing. This testing has
        been carried out with regard to the duties and obligations set out under the Occupational
        Health and Safety Act 2004 (Vic) and the Occupational Health and Safety Regulations 2017.
        Equipment marked "Fail" should be removed from service, repaired, or replaced before further use.
      </p>
    </div>
    ${attachmentsHtml(job)}
    <div class="signatures">
      ${testerSignatureBlockHtml(job)}
      ${clientSignatureBlockHtml(job)}
    </div>
    <div class="footer-note">Generated by the ZoltanStudios Test &amp; Tag Records app on ${escapeHtml(formatDisplayDate(new Date().toISOString().slice(0, 10)))}</div>`;
  return docShell(`Certificate - ${job.clientName || "Untitled"} - ${job.testDate}`, body);
}
function buildRecordHTML(job) {
  const nextTestDate = addMonths(job.testDate, job.retestMonths);
  const items = certItems(job);
  const failedItems = items.filter(i => i.overallResult === "fail");
  const failedCallout = failedItems.length ? `<div class="callout">
        <h3>&#9888; Items Requiring Attention</h3>
        <ul>${failedItems.map(i => `<li>${escapeHtml(i.assetId) || "Unlabelled"} &mdash; ${escapeHtml(i.description) || "No description"}${i.location ? ` (${escapeHtml(i.location)})` : ""}${i.faultDescription ? `: ${escapeHtml(i.faultDescription)}` : ""}${i.removedFromService ? " &mdash; danger tagged, removed from service" : ""}</li>`).join("")}</ul>
      </div>` : "";
  const rcdTripSummary = item => {
    if (!item.rcdTripTestEnabled) return "&mdash;";
    const typeLabel = `Type ${escapeHtml(item.rcdType)}`;
    if (item.rcdTestMode === "time") {
      const val = item.rcdMeasuredTripTimeMs || "?";
      return `${typeLabel}, Time: ${escapeHtml(val)}ms @ ${escapeHtml(item.rcdTripCurrentSetting)}mA`;
    }
    const raw = parseFloat(item.rcdMeasuredTripCurrentMa);
    const compensated = !isNaN(raw) ? ` (${(raw + 2).toFixed(1)}mA w/ +2mA)` : "";
    return `${typeLabel}, Ramp: ${escapeHtml(item.rcdMeasuredTripCurrentMa || "?")}mA${compensated}`;
  };
  const rows = items.map(item => `
      <tr>
        <td>${escapeHtml(item.assetId) || "&mdash;"}</td>
        <td>${escapeHtml(item.description) || "&mdash;"}</td>
        <td>${escapeHtml(item.makeModel) || "&mdash;"}</td>
        <td>${escapeHtml(item.serialNumber) || "&mdash;"}</td>
        <td>${escapeHtml(item.location) || "&mdash;"}</td>
        <td>${escapeHtml(item.equipmentClass)}</td>
        <td style="text-transform:capitalize">${escapeHtml(item.visual)}</td>
        <td>${item.equipmentClass === "I" ? escapeHtml(item.earthContinuity) || "&mdash;" : "n/a"}</td>
        <td>${escapeHtml(item.insulationResistance) || "&mdash;"} <span style="color:#94a3b8">@${escapeHtml(item.insulationTestVoltage || "500")}V</span></td>
        <td>${escapeHtml(item.leakageCurrent) || "&mdash;"}</td>
        <td style="text-transform:uppercase">${escapeHtml(item.rcdTest)}</td>
        <td style="font-size:11px">${rcdTripSummary(item)}</td>
        <td>${resultBadgeHtml(item.overallResult)}</td>
        <td>${escapeHtml(item.notes) || "&mdash;"}${(function () {
          const bits = [];
          if (item.faultDescription) bits.push("Fault: " + escapeHtml(item.faultDescription));
          if (item.repairDetails) bits.push("Repair: " + escapeHtml(item.repairDetails));
          if (item.removedFromService) bits.push("Danger tagged, removed from service");
          if (item.polarity) bits.push("Polarity: " + escapeHtml(item.polarity));
          if (item.cordLength) bits.push("Length: " + escapeHtml(item.cordLength) + " m");
          const vc = item.visualChecks || {};
          const vf = (typeof VISUAL_CHECKS !== "undefined" ? VISUAL_CHECKS : []).filter(c => vc[c.k] === "fail").map(c => c.label);
          if (vf.length) bits.push("Visual fail: " + vf.join(", "));
          return bits.length ? '<br/><span style="font-size:10px;color:#475569">' + bits.join("<br/>") + "</span>" : "";
        })()}${(function () {
          // Internal record only - the client certificate doesn't list parts.
          const p = item.partId && typeof partById === "function" ? partById(cachedParts(), item.partId) : null;
          return p ? '<br/><span style="color:#1d4ed8;font-size:10px">&#128295; Part fitted: ' + escapeHtml(p.name) + '</span>' : "";
        })()}</td>
      </tr>`).join("");
  const recordTagColour = getTagColour(job.testDate, job.retestMonths);
  const body = `
    ${letterheadHtml("Complete Job Record (internal)")}
    <div class="details-grid">
      <div><span class="lbl">Certificate No.:</span> <span class="val" style="font-family:monospace;letter-spacing:0.05em">${escapeHtml(job.certNumber) || "&mdash;"}</span></div>
      <div><span class="lbl">Company:</span> <span class="val">${escapeHtml(job.clientCompany) || "&mdash;"}</span></div>
      <div><span class="lbl">Client:</span> <span class="val">${escapeHtml(job.clientName) || "&mdash;"}</span></div>
      <div><span class="lbl">Client Phone:</span> <span class="val">${escapeHtml(job.clientPhone) || "&mdash;"}</span></div>
      <div><span class="lbl">Client Email:</span> <span class="val">${escapeHtml(job.clientEmail) || "&mdash;"}</span></div>
      <div class="full"><span class="lbl">Site Address:</span> <span class="val">${escapeHtml(job.siteAddress) || "&mdash;"}</span></div>
      <div><span class="lbl">Environment Type:</span> <span class="val">${escapeHtml(job.environment)}</span></div>
      <div><span class="lbl">Retest Interval:</span> <span class="val">${escapeHtml(job.retestMonths)} months</span></div>
      <div><span class="lbl">Test Date:</span> <span class="val">${escapeHtml(formatDisplayDate(job.testDate))}</span></div>
      <div><span class="lbl">Next Test Due:</span> <span class="val">${escapeHtml(formatDisplayDate(nextTestDate))}</span></div>
      <div><span class="lbl">Tested By:</span> <span class="val">${escapeHtml(job.testerName)}</span></div>
      <div><span class="lbl">Licence / Qual. No.:</span> <span class="val">${escapeHtml(job.testerLicense)}</span></div>
      <div><span class="lbl">Tag Colour:</span> <span class="val">${recordTagColour ? escapeHtml(recordTagColour.name) : "&mdash;"}</span></div>
      ${recordTagColour ? `<div class="full" style="font-size:12px;color:#94a3b8">${escapeHtml(recordTagColour.note)}</div>` : ""}
    </div>
    ${failedCallout}
    <table>
      <thead>
        <tr>
          <th>Tag Number</th><th>Description</th><th>Make/Model</th><th>Serial</th><th>Location</th>
          <th>Class</th><th>Visual</th><th>Earth (&Omega;)</th><th>Insul. (M&Omega;)</th>
          <th>Leakage (mA)</th><th>RCD</th><th>RCD Trip Test</th><th>Result</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${fixedRcdSectionHtml(job)}
    ${lightsSectionHtml(job)}
    ${servicesItemSectionsHtml(job)}
    <div class="footer-note">
      Internal working record &mdash; not a signed compliance certificate. Job ID: ${escapeHtml(job.id)}.
      Exported ${escapeHtml(formatDisplayDate(new Date().toISOString().slice(0, 10)))}.
    </div>`;
  return docShell(`Record - ${job.clientName || "Untitled"} - ${job.testDate}`, body);
}

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

// ======================================================================
// 08-appliance-db.js
// Appliance database and picker modal
// ======================================================================

// ---------------------------------------------------------------------------
// Appliance database — used by the quick-pick modal to auto-fill item rows.
// Each category has a default itemType (drives pricing) and each appliance
// has a default equipmentClass. Both can be overridden by the technician.
// ---------------------------------------------------------------------------

const APPLIANCE_DB = [{
  category: "Office & IT",
  icon: "💻",
  defaultType: "standard",
  items: [{
    label: "Desktop Computer",
    class: "I"
  }, {
    label: "Laptop Charger / Power Brick",
    class: "II"
  }, {
    label: "Monitor / Screen",
    class: "II"
  }, {
    label: "Printer (inkjet)",
    class: "II"
  }, {
    label: "Printer (laser)",
    class: "I"
  }, {
    label: "Printer (multifunction)",
    class: "I"
  }, {
    label: "Photocopier",
    class: "I"
  }, {
    label: "Scanner",
    class: "II"
  }, {
    label: "Shredder",
    class: "I"
  }, {
    label: "UPS / Battery Backup",
    class: "I"
  }, {
    label: "Network Switch / Hub",
    class: "II"
  }, {
    label: "Modem / Router",
    class: "II"
  }, {
    label: "Electric Stapler",
    class: "II"
  }, {
    label: "Label Printer",
    class: "II"
  }, {
    label: "Cash Register / POS Terminal",
    class: "II"
  }, {
    label: "Barcode Scanner (powered)",
    class: "II"
  }, {
    label: "Projector",
    class: "I"
  }, {
    label: "Interactive Whiteboard",
    class: "I"
  }, {
    label: "Desk Phone (powered)",
    class: "II"
  }, {
    label: "EFTPOS Terminal",
    class: "II"
  }]
}, {
  category: "Kitchen & Hospitality",
  icon: "🍳",
  defaultType: "standard",
  items: [{
    label: "Kettle (domestic)",
    class: "I"
  }, {
    label: "Kettle / Urn (commercial)",
    class: "I"
  }, {
    label: "Toaster (2-slice)",
    class: "II"
  }, {
    label: "Toaster (4-slice)",
    class: "II"
  }, {
    label: "Toaster Oven / Benchtop Oven",
    class: "I"
  }, {
    label: "Coffee Machine (domestic)",
    class: "I"
  }, {
    label: "Coffee Machine (commercial)",
    class: "I"
  }, {
    label: "Coffee Grinder",
    class: "I"
  }, {
    label: "Espresso Machine",
    class: "I"
  }, {
    label: "Blender",
    class: "I"
  }, {
    label: "Food Processor",
    class: "I"
  }, {
    label: "Bar Fridge / Refrigerator",
    class: "I"
  }, {
    label: "Refrigerator (full-size)",
    class: "I"
  }, {
    label: "Sandwich Press / Jaffle Maker",
    class: "I"
  }, {
    label: "Panini Press / Contact Grill",
    class: "I"
  }, {
    label: "Electric Frypan",
    class: "I"
  }, {
    label: "Electric Wok",
    class: "I"
  }, {
    label: "Rice Cooker",
    class: "I"
  }, {
    label: "Slow Cooker / Crockpot",
    class: "I"
  }, {
    label: "Deep Fryer",
    class: "I"
  }, {
    label: "Pie Warmer",
    class: "I"
  }, {
    label: "Bain Marie / Food Warmer",
    class: "I"
  }, {
    label: "Hot Dog / Sausage Warmer",
    class: "I"
  }, {
    label: "Waffle Maker",
    class: "I"
  }, {
    label: "Popcorn Machine",
    class: "I"
  }, {
    label: "Milkshake Maker",
    class: "I"
  }, {
    label: "Juicer / Citrus Press",
    class: "I"
  }, {
    label: "Electric Can Opener",
    class: "II"
  }, {
    label: "Sous Vide Machine",
    class: "I"
  }, {
    label: "Induction Cooktop (portable)",
    class: "I"
  }, {
    label: "Hot Plate / Electric Hotplate",
    class: "I"
  }, {
    label: "Water Boiler / Instant Hot Water",
    class: "I"
  }, {
    label: "Dishwasher",
    class: "I"
  }]
}, {
  category: "Microwave",
  icon: "📡",
  defaultType: "microwave",
  items: [{
    label: "Microwave Oven (domestic)",
    class: "I"
  }, {
    label: "Microwave Oven (commercial)",
    class: "I"
  }, {
    label: "Combination Microwave / Convection",
    class: "I"
  }]
}, {
  category: "Extension Leads & Boards",
  icon: "🔌",
  defaultType: "standard",
  items: [{
    label: "Extension Lead (single outlet)",
    class: "I"
  }, {
    label: "Power Board (multi-outlet, no surge)",
    class: "I"
  }, {
    label: "Power Board (with surge protection / MOV)",
    class: "I"
  }, {
    label: "Power Board (RCD-protected)",
    class: "I"
  }, {
    label: "Extension Lead (industrial, 3-pin)",
    class: "I"
  }, {
    label: "Extension Lead (industrial, 4-pin)",
    class: "I"
  }, {
    label: "Piggyback Plug / Adaptor",
    class: "I"
  }, {
    label: "Retractable Extension Lead",
    class: "I"
  }, {
    label: "Cable Reel / Drum",
    class: "I"
  }]
}, {
  category: "Safety Switches / RCD",
  icon: "⚡",
  defaultType: "rcd",
  items: [{
    label: "Portable RCD (inline safety switch)",
    class: "I"
  }, {
    label: "Portable RCD (socket outlet type)",
    class: "I"
  }, {
    label: "RCD Adaptor Plug",
    class: "I"
  }]
}, {
  category: "Cleaning Equipment",
  icon: "🧹",
  defaultType: "standard",
  items: [{
    label: "Vacuum Cleaner (upright)",
    class: "II"
  }, {
    label: "Vacuum Cleaner (barrel / cylinder)",
    class: "I"
  }, {
    label: "Vacuum Cleaner (backpack)",
    class: "I"
  }, {
    label: "Vacuum Cleaner (robotic, charger)",
    class: "II"
  }, {
    label: "Wet / Dry Vacuum (workshop vac)",
    class: "I"
  }, {
    label: "Carpet Cleaner / Shampooer",
    class: "I"
  }, {
    label: "Steam Cleaner",
    class: "I"
  }, {
    label: "Steam Mop",
    class: "I"
  }, {
    label: "Floor Polisher / Buffer",
    class: "I"
  }, {
    label: "Pressure Washer (electric)",
    class: "I"
  }, {
    label: "Window Vac",
    class: "II"
  }]
}, {
  category: "Heating & Cooling",
  icon: "🌡️",
  defaultType: "standard",
  items: [{
    label: "Pedestal Fan",
    class: "I"
  }, {
    label: "Desk Fan",
    class: "I"
  }, {
    label: "Tower Fan",
    class: "I"
  }, {
    label: "Box Fan / Window Fan",
    class: "I"
  }, {
    label: "Portable Air Conditioner",
    class: "I"
  }, {
    label: "Evaporative Cooler (portable)",
    class: "I"
  }, {
    label: "Dehumidifier",
    class: "I"
  }, {
    label: "Humidifier",
    class: "I"
  }, {
    label: "Air Purifier",
    class: "I"
  }, {
    label: "Bar Heater / Radiant Heater",
    class: "I"
  }, {
    label: "Fan Heater",
    class: "I"
  }, {
    label: "Oil Column Heater",
    class: "I"
  }, {
    label: "Panel Heater",
    class: "I"
  }, {
    label: "Infrared Heater",
    class: "I"
  }, {
    label: "Convection Heater",
    class: "I"
  }, {
    label: "Heated Towel Rail (portable)",
    class: "I"
  }]
}, {
  category: "Hair & Beauty",
  icon: "💇",
  defaultType: "standard",
  items: [{
    label: "Hair Dryer",
    class: "II"
  }, {
    label: "Hair Straightener / Flat Iron",
    class: "II"
  }, {
    label: "Curling Iron / Wand",
    class: "II"
  }, {
    label: "Hair Clippers (corded)",
    class: "II"
  }, {
    label: "Electric Shaver (corded)",
    class: "II"
  }, {
    label: "Beard Trimmer (corded)",
    class: "II"
  }, {
    label: "Nail Drill / File",
    class: "II"
  }, {
    label: "UV / LED Nail Lamp",
    class: "II"
  }, {
    label: "Facial Steamer",
    class: "I"
  }, {
    label: "Massage Chair / Massager",
    class: "I"
  }]
}, {
  category: "Laundry",
  icon: "👕",
  defaultType: "standard",
  items: [{
    label: "Washing Machine",
    class: "I"
  }, {
    label: "Clothes Dryer (electric)",
    class: "I"
  }, {
    label: "Washer / Dryer Combo",
    class: "I"
  }, {
    label: "Iron (clothes)",
    class: "I"
  }, {
    label: "Garment Steamer",
    class: "I"
  }, {
    label: "Ironing Press",
    class: "I"
  }]
}, {
  category: "Audio Visual & Entertainment",
  icon: "📺",
  defaultType: "standard",
  items: [{
    label: "Television",
    class: "I"
  }, {
    label: "Large Format Display",
    class: "I"
  }, {
    label: "DVD / Blu-ray Player",
    class: "II"
  }, {
    label: "Streaming Device (powered)",
    class: "II"
  }, {
    label: "Set Top Box",
    class: "II"
  }, {
    label: "Gaming Console",
    class: "II"
  }, {
    label: "Soundbar",
    class: "II"
  }, {
    label: "Amplifier / Receiver (hi-fi)",
    class: "I"
  }, {
    label: "Active Speakers / Powered Speakers",
    class: "I"
  }, {
    label: "Subwoofer (powered)",
    class: "I"
  }, {
    label: "Guitar Amplifier",
    class: "I"
  }, {
    label: "Bass Amplifier",
    class: "I"
  }, {
    label: "Keyboard Amplifier",
    class: "I"
  }, {
    label: "PA / Public Address System",
    class: "I"
  }, {
    label: "DJ Mixer",
    class: "I"
  }, {
    label: "Karaoke Machine",
    class: "I"
  }, {
    label: "Electric Keyboard / Piano",
    class: "I"
  }, {
    label: "Electronic Drum Kit",
    class: "I"
  }]
}, {
  category: "Power Tools",
  icon: "🔧",
  defaultType: "power_tool",
  items: [{
    label: "Angle Grinder",
    class: "I"
  }, {
    label: "Circular Saw",
    class: "I"
  }, {
    label: "Jigsaw",
    class: "I"
  }, {
    label: "Reciprocating Saw / Sabre Saw",
    class: "I"
  }, {
    label: "Drill (corded)",
    class: "I"
  }, {
    label: "Hammer Drill / Rotary Hammer",
    class: "I"
  }, {
    label: "Impact Wrench (corded)",
    class: "I"
  }, {
    label: "Orbital Sander",
    class: "I"
  }, {
    label: "Belt Sander",
    class: "I"
  }, {
    label: "Disc Sander",
    class: "I"
  }, {
    label: "Router (wood)",
    class: "I"
  }, {
    label: "Planer (electric)",
    class: "I"
  }, {
    label: "Biscuit Joiner",
    class: "I"
  }, {
    label: "Heat Gun",
    class: "I"
  }, {
    label: "Soldering Iron (corded)",
    class: "I"
  }, {
    label: "Hot Glue Gun (industrial)",
    class: "I"
  }, {
    label: "Mitre Saw / Drop Saw",
    class: "I"
  }, {
    label: "Table Saw / Bench Saw",
    class: "I"
  }, {
    label: "Scroll Saw",
    class: "I"
  }, {
    label: "Band Saw (portable)",
    class: "I"
  }, {
    label: "Electric Hedge Trimmer",
    class: "I"
  }, {
    label: "Electric Lawn Mower",
    class: "I"
  }, {
    label: "Electric Chainsaw",
    class: "I"
  }, {
    label: "Electric Leaf Blower",
    class: "I"
  }, {
    label: "Core Drill",
    class: "I"
  }, {
    label: "Demolition Hammer / Jackhammer",
    class: "I"
  }, {
    label: "Tile Cutter (electric)",
    class: "I"
  }, {
    label: "Wet Tile Saw",
    class: "I"
  }, {
    label: "Concrete Mixer (electric)",
    class: "I"
  }, {
    label: "Concrete Vibrator",
    class: "I"
  }, {
    label: "Rebar Cutter (electric)",
    class: "I"
  }, {
    label: "Pipe Threader (electric)",
    class: "I"
  }]
}, {
  category: "Industrial / Workshop",
  icon: "🏭",
  defaultType: "power_tool",
  items: [{
    label: "MIG Welder",
    class: "I"
  }, {
    label: "TIG Welder",
    class: "I"
  }, {
    label: "Arc / Stick Welder",
    class: "I"
  }, {
    label: "Plasma Cutter",
    class: "I"
  }, {
    label: "Spot Welder",
    class: "I"
  }, {
    label: "Bench Grinder",
    class: "I"
  }, {
    label: "Pedestal Drill / Drill Press",
    class: "I"
  }, {
    label: "Lathe (metal, electric)",
    class: "I"
  }, {
    label: "Surface Grinder",
    class: "I"
  }, {
    label: "Metal Band Saw",
    class: "I"
  }, {
    label: "Metal Cutting Saw",
    class: "I"
  }, {
    label: "Air Compressor (electric)",
    class: "I"
  }, {
    label: "3D Printer",
    class: "I"
  }, {
    label: "Laser Engraver / Cutter",
    class: "I"
  }, {
    label: "CNC Router (electric)",
    class: "I"
  }, {
    label: "Electric Hoist / Winch",
    class: "I"
  }, {
    label: "Industrial Fan (large)",
    class: "I"
  }, {
    label: "Submersible Pump",
    class: "I"
  }, {
    label: "Water Pump (electric)",
    class: "I"
  }, {
    label: "Ultrasonic Cleaner",
    class: "I"
  }]
}, {
  category: "Trade & Automotive",
  icon: "🚗",
  defaultType: "standard",
  items: [{
    label: "Battery Charger (automotive)",
    class: "I"
  }, {
    label: "Jump Starter (plug-in)",
    class: "I"
  }, {
    label: "Car Polisher / Buffer",
    class: "I"
  }, {
    label: "Tyre Inflator (electric)",
    class: "II"
  }, {
    label: "Soldering Station (bench)",
    class: "I"
  }, {
    label: "Bench Power Supply",
    class: "I"
  }, {
    label: "Oscilloscope (bench)",
    class: "I"
  }, {
    label: "Spot Welder (automotive)",
    class: "I"
  }, {
    label: "Pressure Washer (heavy duty)",
    class: "I"
  }, {
    label: "Parts Washer (electric)",
    class: "I"
  }]
}, {
  category: "Medical & Care",
  icon: "🏥",
  defaultType: "standard",
  items: [{
    label: "CPAP / BiPAP Machine",
    class: "II"
  }, {
    label: "Nebuliser",
    class: "II"
  }, {
    label: "Blood Pressure Monitor (electric)",
    class: "II"
  }, {
    label: "Electric Blanket",
    class: "I"
  }, {
    label: "Heating Pad / Heat Pack",
    class: "I"
  }, {
    label: "Infrared Lamp",
    class: "I"
  }, {
    label: "Tens Machine",
    class: "II"
  }, {
    label: "Air Mattress Pump (electric)",
    class: "II"
  }, {
    label: "Stair Lift (powered)",
    class: "I"
  }]
}, {
  category: "Other",
  icon: "📦",
  defaultType: "standard",
  items: [{
    label: "Sewing Machine",
    class: "I"
  }, {
    label: "Embroidery Machine",
    class: "I"
  }, {
    label: "Laminator",
    class: "I"
  }, {
    label: "Binding Machine",
    class: "I"
  }, {
    label: "Electric Scissors",
    class: "II"
  }, {
    label: "Franking Machine",
    class: "I"
  }, {
    label: "Coin Counter / Cash Counter",
    class: "II"
  }, {
    label: "Vending Machine (internal unit)",
    class: "I"
  }, {
    label: "Fish Tank / Aquarium Pump",
    class: "I"
  }, {
    label: "Smoke Machine / Fog Machine",
    class: "I"
  }, {
    label: "Hot Press (signage)",
    class: "I"
  }, {
    label: "Ticket Printer",
    class: "I"
  }]
}];

// Flat list of all appliances with their category metadata - used for search
const APPLIANCE_FLAT = APPLIANCE_DB.flatMap(cat => cat.items.map(item => ({
  label: item.label,
  category: cat.category,
  icon: cat.icon,
  equipmentClass: item.class,
  itemType: cat.defaultType
})));

// Quick-pick modal component
function AppliancePickerModal({
  onSelect,
  onClose
}) {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !selectedCategory) return APPLIANCE_FLAT;
    return APPLIANCE_FLAT.filter(a => {
      const matchesQuery = !q || a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      const matchesCat = !selectedCategory || a.category === selectedCategory;
      return matchesQuery && matchesCat;
    });
  }, [query, selectedCategory]);
  const ITEM_TYPE_LABELS = {
    standard: "Standard ($5.00)",
    power_tool: "Power Tool ($8.00)",
    rcd: "RCD ($10.00)",
    microwave: "Microwave ($12.00)"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-slate-900 text-lg flex-1"
  }, "Quick Pick Appliance"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-slate-600 text-xl leading-none"
  }, "✕")), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: query,
    onChange: e => {
      setQuery(e.target.value);
      setSelectedCategory(null);
    },
    placeholder: "Search appliances... e.g. kettle, drill, fan",
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  })), !query && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3 flex gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedCategory(null),
    className: `text-xs px-3 py-1 rounded-full font-medium transition-colors ${!selectedCategory ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
  }, "All"), APPLIANCE_DB.map(cat => /*#__PURE__*/React.createElement("button", {
    key: cat.category,
    onClick: () => setSelectedCategory(selectedCategory === cat.category ? null : cat.category),
    className: `text-xs px-3 py-1 rounded-full font-medium transition-colors ${selectedCategory === cat.category ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
  }, cat.icon, " ", cat.category))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-4"
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-slate-400 text-sm"
  }, "No appliances match \"", query, "\" — type freely in the description field instead.") : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, filtered.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => {
      onSelect(a);
      onClose();
    },
    className: "text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800 text-sm"
  }, a.label), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, a.icon, " ", a.category), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-blue-600"
  }, "Class ", a.equipmentClass), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600"
  }, ITEM_TYPE_LABELS[a.itemType])))))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 border-t border-slate-100 text-xs text-slate-400"
  }, filtered.length, " appliances · Selecting auto-fills description, class and pricing type")));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ======================================================================
// 09-storage.js
// localStorage keys and job persistence
// ======================================================================

const STORAGE_KEY = "zoltanstudios-testtag-jobs-v1";
const CERT_REGISTRY_KEY = "zoltanstudios-cert-registry-v1";

// ---------------------------------------------------------------------------
// Server sync - push jobs to the ZoltanStudios admin panel (MySQL backend).
// Config (server URL + API token) is stored locally. The token is generated
// in the admin panel under Test & Tag > Desktop App Tokens.
// ---------------------------------------------------------------------------
const SERVER_CONFIG_KEY = "zoltanstudios-server-config-v1";

// When the app is served from the website it is "hosted": the server is the
// storage, it authenticates with the admin session (works on a phone), and
// all local-folder features are hidden. Opened from a file:// copy on the PC
// it stays in offline mode: local folder + token push when internet returns.

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
    siteMode: job.siteMode || "",
    emergencyLights: job.emergencyLights || null,
    // App-only item fields (visual checklist, polarity, fault, repair...).
    itemExtras: itemExtrasFor(job.items),
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
    siteMode: j.siteMode || "",
    emergencyLights: j.emergencyLights || null,
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
    items: applyItemExtras((j.items || []).map(it => ({
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
    })), j.itemExtras)
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

// ======================================================================
// 12-settings.js
// Tester defaults, retest scheduling, CSV register
// ======================================================================

const TESTER_SETTINGS_KEY = "zoltanstudios-tester-settings-v1";

function loadTesterSettings() {
  try {
    const raw = window.localStorage.getItem(TESTER_SETTINGS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch { return null; }
}

function saveTesterSettings(sett) {
  try {
    window.localStorage.setItem(TESTER_SETTINGS_KEY, JSON.stringify(sett));
    return true;
  } catch { return false; }
}

function effectiveTester() {
  const s = loadTesterSettings() || {};
  return {
    name: s.name || DEFAULT_TESTER.name,
    license: s.license || DEFAULT_TESTER.license,
    testEquipment: s.testEquipment || "Wavecom TnT RCD",
    testEquipmentCalibrationDate: s.testEquipmentCalibrationDate || "",
    testEquipmentSerial: s.testEquipmentSerial || "",
    meggerEquipment: s.meggerEquipment || "",
    meggerCalibrationDate: s.meggerCalibrationDate || "",
    // Drawn once in Tester Defaults and applied to every certificate, so the
    // tester line isn't left blank on an emailed PDF.
    signature: s.signature || "",
  };
}

// ---------------------------------------------------------------------------
// Retest scheduling helpers
// ---------------------------------------------------------------------------
function daysUntilRetest(job) {
  const due = addMonths(job.testDate, job.retestMonths);
  if (!due) return null;
  const d = new Date(due);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// 'overdue' | 'due-soon' (<=60d) | 'upcoming' (<=120d) | 'ok'
function retestStatus(job) {
  const n = daysUntilRetest(job);
  if (n === null) return "ok";
  if (n < 0) return "overdue";
  if (n <= 60) return "due-soon";
  if (n <= 120) return "upcoming";
  return "ok";
}

function retestLabel(job) {
  const n = daysUntilRetest(job);
  if (n === null) return "";
  if (n < 0) return `Overdue by ${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}`;
  if (n === 0) return "Due today";
  if (n <= 60) return `Due in ${n} day${n === 1 ? "" : "s"}`;
  return `Due ${formatDisplayDate(addMonths(job.testDate, job.retestMonths))}`;
}

// ---------------------------------------------------------------------------
// CSV asset register export
// ---------------------------------------------------------------------------

function buildAssetRegisterCSVForJobs(jobs) {
  const head = [
    "Certificate No", "Client", "Company", "Site Address", "Test Date", "Next Test Due",
    "Tag Number", "QR ID", "Description", "Make/Model", "Serial No", "Location",
    "Class", "Visual", "Polarity", "Earth (Ohm)", "Insulation (MOhm)", "Insul Test V",
    "Leakage (mA)", "RCD", "Operation", "Fuse", "Result", "Fault", "Repair", "Notes",
  ];
  // Kept as arrays of cells until the end, so a column can be removed
  // before anything is joined - removing it from joined text is error-prone.
  const table = [head];

  jobs.forEach((job) => {
    const due = addMonths(job.testDate, job.retestMonths);
    (job.items || []).forEach((it) => {
      table.push([
        job.certNumber, job.clientName, job.clientCompany, job.siteAddress,
        job.testDate, due,
        it.assetId, it.qrId, it.description, it.makeModel, it.serialNumber, it.location,
        it.equipmentClass, it.visual,
        it.polarity && it.polarity !== "n/a" ? it.polarity : "",
        it.equipmentClass === "I" ? it.earthContinuity : "n/a",
        it.insulationResistance, it.insulationTestVoltage,
        it.leakageCurrent, it.rcdTest,
        it.operationTest && it.operationTest !== "n/a" ? it.operationTest : "",
        it.fuseCheck && it.fuseCheck !== "n/a" ? it.fuseCheck : "",
        it.overallResult, it.faultDescription, it.repairDetails, it.notes,
      ]);
    });
  });

  // No QR column while labels are off - a code that isn't on any tag would
  // only confuse whoever reads the spreadsheet.
  const qrCol = head.indexOf("QR ID");
  const cells = QR_LABELS_ENABLED ? table : table.map(r => r.filter((_, i) => i !== qrCol));
  // BOM so Excel opens UTF-8 correctly
  return "\ufeff" + cells.map(r => r.map(csvCell).join(",")).join("\r\n");
}

function downloadCSV(content, filename) {
  // Desktop shell: no download manager. Show the CSV in a window so it can
  // be selected and copied into a spreadsheet.
  if (isDesktopShell()) {
    const esc = String(content).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const page =
      '<title>' + filename + '</title>' +
      '<div style="font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;padding:16px">' +
      '<p style="margin:0 0 10px">Select all (Ctrl+A) and copy, then paste into Excel. ' +
      'Or open the app in your browser to download the file directly.</p>' +
      '<textarea style="width:100%;height:70vh;font:12px monospace">' + esc + '</textarea></div>';
    if (openHtmlInWindow(page, filename)) return;
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Older jobs were saved with the unit codes instead of the cert number.
// Any job still carrying one of these strings gets silently upgraded to
// the current licence on load (localStorage AND folder sync both pass
// through normalizeJobLicense), so re-exported certificates come out right.
const LEGACY_LICENSES = ["UEECD0007, UEERL0003, UEERL0004, UEERL0005"];
function normalizeJobLicense(job) {
  if (job && LEGACY_LICENSES.includes(job.testerLicense)) {
    return {
      ...job,
      testerLicense: DEFAULT_TESTER.license
    };
  }
  return job;
}

// Generates a short unique QR ID for an item. Format: ZS- + 4 chars from a
// 32-char alphabet that avoids visually confusing characters (0/O, 1/I/L).
const QR_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateQrId() {
  let id = "ZS-";
  for (let i = 0; i < 4; i++) {
    id += QR_ALPHABET[Math.floor(Math.random() * QR_ALPHABET.length)];
  }
  return id;
}

// QR labels are switched off until a label printer is in use. Every item
// still gets its permanent QR ID in the background, so switching this back
// on shows the same IDs on existing items - nothing to regenerate or re-tag.
// The phone-capture QR code is unrelated and stays on regardless.
const QR_LABELS_ENABLED = false;

// Verify URL for a given QR ID
const VERIFY_BASE_URL = "https://zoltanstudios.au/verify?id=";

// Practical retest intervals — aligned with the AS/NZS 3760:2022 table and
// the ZoltanStudios pricing model (quarterly = construction/demolition,
// 6-monthly = industrial/hostile, 12-monthly = office/school/rental, etc.)
const ENVIRONMENTS = [{
  value: "construction",
  label: "Construction / Demolition Site",
  months: 3
}, {
  value: "hostile",
  label: "Factory / Industrial / Mining / Hostile",
  months: 6
}, {
  value: "workshop",
  label: "Workshop / Trade Tools",
  months: 12
}, {
  value: "hospitality",
  label: "Hospitality / Commercial Kitchen",
  months: 12
}, {
  value: "office",
  label: "Office / Retail / General Business",
  months: 12
}, {
  value: "school",
  label: "School / Education Facility",
  months: 12
}, {
  value: "rental",
  label: "Rental Property",
  months: 12
}, {
  value: "custom",
  label: "Custom Interval",
  months: 12
}];

// Published test and tag rates (test-and-tag.html), ex GST.
const TT_PRICES = {
  callOut: 30.00,
  standard: 5.00,
  power_tool: 8.00,
  rcd: 10.00,
  microwave: 12.00
};

// Item types for pricing categorisation
const ITEM_TYPES = [{
  value: "standard",
  label: "Standard appliance (Class I/II, office, leads)"
}, {
  value: "power_tool",
  label: "Power tool / heavy equipment (Class I, 3-phase)"
}, {
  value: "rcd",
  label: "RCD / safety switch test"
}, {
  value: "microwave",
  label: "Microwave leakage test"
}];
const EQUIPMENT_CLASSES = ["I", "II", "III"];
const JOB_TYPES = [{
  value: "test_tag",
  label: "Test & Tag (AS/NZS 3760)"
}, {
  value: "generator_inspection",
  label: "Generator Inspection Report (AS/NZS 3010 observations)"
}];
const blankGenerator = () => ({
  // Identification
  make: "",
  model: "",
  serialNumber: "",
  ratedOutputKva: "",
  ratedVoltage: "230",
  generatorType: "conventional",
  // 'conventional' | 'inverter'
  hoursRun: "",
  // Safety pre-checks
  electronicsDisconnected: false,
  // MUST be confirmed before megging
  visualCondition: "pass",
  outletCondition: "pass",
  cordGlandCondition: "pass",
  earthStakeFitted: "n/a",
  // 'yes' | 'no' | 'n/a'

  // Insulation resistance (megger) — generator OFF, isolated, unloaded
  irTestVoltage: "500",
  // 250 / 500 / 1000
  irWindingToEarth: "",
  // MΩ
  irLineToEarth: "",
  // MΩ
  irNeutralToEarth: "",
  // MΩ
  irNotMeasured: false,
  // inverter gensets often can't be megged

  // Earth continuity (low-ohm)
  ecFrameToOutletEarth: "",
  // Ω
  ecFrameToEarthStake: "",
  // Ω

  // The critical finding — neutral/earth bond
  neBondResistance: "",
  // Ω measured N→E at outlet, genset off
  neBondStatus: "unknown",
  // 'bonded' | 'floating' | 'unknown'

  // Outcome
  overallAssessment: "satisfactory",
  // 'satisfactory' | 'attention' | 'unsafe'
  findings: "",
  recommendations: ""
});
function buildGeneratorReportHTML(job) {
  const g = job.generator || {};
  const val = (v, unit) => v !== "" && v != null ? `${escapeHtml(v)}${unit ? " " + unit : ""}` : "&mdash;";
  const ASSESSMENT = {
    satisfactory: {
      label: "Satisfactory",
      bg: "#d1fae5",
      fg: "#047857",
      note: "No defects identified at the time of inspection within the scope of the measurements taken."
    },
    attention: {
      label: "Requires Attention",
      bg: "#fef3c7",
      fg: "#b45309",
      note: "One or more items require attention. Refer to findings and recommendations below."
    },
    unsafe: {
      label: "Unsafe - Do Not Use",
      bg: "#fee2e2",
      fg: "#b91c1c",
      note: "Defects identified that present a risk of injury. The generating set should not be used until assessed by a licensed electrician."
    }
  };
  const assess = ASSESSMENT[g.overallAssessment] || ASSESSMENT.satisfactory;

  // Neutral-earth bond is the single most important finding on a genset
  const NE = {
    bonded: {
      label: "Bonded (MEN)",
      bg: "#d1fae5",
      fg: "#047857",
      note: "Neutral is bonded to earth. RCD protection downstream will operate as intended on a first earth fault."
    },
    floating: {
      label: "Floating (IT system)",
      bg: "#fef3c7",
      fg: "#b45309",
      note: "No neutral-earth bond detected. On a floating supply an RCD may NOT trip on a first earth fault, as there is no return path to create an imbalance. Protection strategy must be confirmed by a licensed electrician before this generating set is relied upon for RCD-protected equipment."
    },
    unknown: {
      label: "Not determined",
      bg: "#f1f5f9",
      fg: "#475569",
      note: "Neutral-earth bond status was not determined during this inspection."
    }
  };
  const ne = NE[g.neBondStatus] || NE.unknown;
  const condRow = (label, v) => {
    const ok = v === "pass";
    const na = !v || v === "n/a";
    return `<tr><td>${label}</td><td><span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${na ? "#f1f5f9" : ok ? "#d1fae5" : "#fee2e2"};color:${na ? "#64748b" : ok ? "#047857" : "#b91c1c"}">${na ? "N/A" : ok ? "PASS" : "FAIL"}</span></td></tr>`;
  };
  const irSection = g.irNotMeasured ? `<div class="callout" style="background:#fffbeb;border-color:#fde68a">
         <h3 style="color:#b45309">&#9888; Insulation Resistance Not Measured</h3>
         <p style="font-size:12px;color:#78350f">Insulation resistance testing was not performed on this generating set. Inverter-type generators contain electronic output stages (AVR / inverter board) that can be damaged by insulation testing voltages, and cannot be safely tested without disconnecting those components.</p>
       </div>` : `<h2>Insulation Resistance <span class="sub">(generator off, isolated, unloaded &mdash; tested at ${escapeHtml(g.irTestVoltage || "500")}V DC)</span></h2>
       <table>
         <thead><tr><th>Measurement</th><th>Reading</th><th>Minimum</th><th>Assessment</th></tr></thead>
         <tbody>
           ${[["Winding to frame / earth", g.irWindingToEarth], ["Line to earth (at outlet)", g.irLineToEarth], ["Neutral to earth (at outlet)", g.irNeutralToEarth]].map(([label, v]) => {
    const num = parseFloat(v);
    const has = v !== "" && !isNaN(num);
    const ok = has && num >= 1;
    return `<tr><td>${label}</td><td><strong>${val(v, "M&Omega;")}</strong></td><td>&ge; 1 M&Omega;</td><td>${!has ? "&mdash;" : `<span style="color:${ok ? "#047857" : "#b91c1c"};font-weight:700">${ok ? "PASS" : "BELOW MINIMUM"}</span>`}</td></tr>`;
  }).join("")}
         </tbody>
       </table>
       ${g.electronicsDisconnected ? `<p style="font-size:11px;color:#64748b;margin-top:6px;">AVR / electronic control components were disconnected prior to insulation testing.</p>` : `<p style="font-size:11px;color:#b45309;margin-top:6px;">&#9888; Note: disconnection of AVR / electronic components was not recorded.</p>`}`;
  const body = `
    ${letterheadHtml("Generator Inspection Report")}

    <div style="display:flex;align-items:center;justify-content:space-between;background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:10px 16px;margin-bottom:16px;">
      <span style="font-size:11px;color:#b45309;font-weight:700;letter-spacing:0.05em;">INSPECTION REPORT &mdash; NOT A COMPLIANCE CERTIFICATE</span>
      ${job.certNumber ? `<span style="font-family:monospace;font-size:18px;font-weight:800;color:#92400e;letter-spacing:0.12em;">${escapeHtml(job.certNumber)}</span>` : ""}
    </div>

    <div style="text-align:center;background:${assess.bg};border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:${assess.fg};letter-spacing:0.03em;">${assess.label.toUpperCase()}</div>
      <div style="font-size:12px;color:${assess.fg};opacity:0.85;margin-top:4px;">${assess.note}</div>
    </div>

    <div class="details-grid">
      <div><span class="lbl">Client:</span> <span class="val">${escapeHtml(job.clientName) || "&mdash;"}</span></div>
      <div><span class="lbl">Company:</span> <span class="val">${escapeHtml(job.clientCompany) || "&mdash;"}</span></div>
      <div class="full"><span class="lbl">Site Address:</span> <span class="val">${escapeHtml(job.siteAddress) || "&mdash;"}</span></div>
      <div><span class="lbl">Inspection Date:</span> <span class="val">${escapeHtml(formatDisplayDate(job.testDate))}</span></div>
      <div><span class="lbl">Inspected By:</span> <span class="val">${escapeHtml(job.testerName)}</span></div>
      <div><span class="lbl">Cert. / Qual. No.:</span> <span class="val">${escapeHtml(job.testerLicense)}</span></div>
      <div><span class="lbl">Test Equipment:</span> <span class="val">${escapeHtml(job.meggerEquipment) || "&mdash;"}${job.meggerCalibrationDate ? ` (cal. ${escapeHtml(formatDisplayDate(job.meggerCalibrationDate))})` : ""}</span></div>
    </div>

    <h2>Generating Set Details</h2>
    <table>
      <tbody>
        <tr><td style="width:40%">Make / Model</td><td><strong>${escapeHtml(g.make) || "&mdash;"} ${escapeHtml(g.model) || ""}</strong></td></tr>
        <tr><td>Serial Number</td><td>${val(g.serialNumber)}</td></tr>
        <tr><td>Type</td><td style="text-transform:capitalize">${escapeHtml(g.generatorType) || "&mdash;"}</td></tr>
        <tr><td>Rated Output</td><td>${val(g.ratedOutputKva, "kVA")}</td></tr>
        <tr><td>Rated Voltage</td><td>${val(g.ratedVoltage, "V")}</td></tr>
        <tr><td>Hours Run</td><td>${val(g.hoursRun, "hrs")}</td></tr>
      </tbody>
    </table>

    <h2>Visual Inspection</h2>
    <table>
      <tbody>
        ${condRow("General condition / enclosure", g.visualCondition)}
        ${condRow("Outlet sockets", g.outletCondition)}
        ${condRow("Cord glands / entries", g.cordGlandCondition)}
        <tr><td>Earth stake fitted &amp; connected</td><td style="text-transform:capitalize">${g.earthStakeFitted === "yes" ? '<span style="color:#047857;font-weight:700">YES</span>' : g.earthStakeFitted === "no" ? '<span style="color:#b45309;font-weight:700">NO</span>' : "N/A"}</td></tr>
      </tbody>
    </table>

    ${irSection}

    <h2>Earth Continuity</h2>
    <table>
      <thead><tr><th>Measurement</th><th>Reading</th><th>Maximum</th><th>Assessment</th></tr></thead>
      <tbody>
        ${[["Frame to outlet earth pin", g.ecFrameToOutletEarth], ["Frame to earth stake terminal", g.ecFrameToEarthStake]].map(([label, v]) => {
    const num = parseFloat(v);
    const has = v !== "" && !isNaN(num);
    const ok = has && num <= 1;
    return `<tr><td>${label}</td><td><strong>${val(v, "&Omega;")}</strong></td><td>&le; 1 &Omega;</td><td>${!has ? "&mdash;" : `<span style="color:${ok ? "#047857" : "#b91c1c"};font-weight:700">${ok ? "PASS" : "ABOVE MAXIMUM"}</span>`}</td></tr>`;
  }).join("")}
      </tbody>
    </table>

    <h2>Neutral / Earth Bond &mdash; Supply Configuration</h2>
    <div style="background:${ne.bg};border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-weight:800;color:${ne.fg};font-size:14px;margin-bottom:4px;">${ne.label}${g.neBondResistance !== "" ? ` &mdash; measured ${escapeHtml(g.neBondResistance)}&Omega; N&rarr;E` : ""}</div>
      <div style="font-size:12px;color:${ne.fg};opacity:0.9;line-height:1.5;">${ne.note}</div>
    </div>

    ${g.findings ? `<h2>Findings</h2><p style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(g.findings)}</p>` : ""}
    ${g.recommendations ? `<h2>Recommendations</h2><p style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(g.recommendations)}</p>` : ""}

    <div class="declaration">
      <h3>Scope &amp; Limitations</h3>
      <p>
        This document is an <strong>inspection report</strong>, not a certificate of compliance.
        It records measured values and visual observations taken at the date and time of inspection.
        Generating sets are covered by AS/NZS 3010 (and AS/NZS 3012 where used on construction and
        demolition sites); verification against those standards includes earth fault loop impedance
        and RCD performance testing on the generating set's own supply, which requires an installation
        tester and an A-grade electrical licence. Those tests were <strong>not</strong> performed and
        are outside the scope of this report.
      </p>
      <p style="margin-top:8px;">
        Any cord-connected equipment and cord assemblies supplied by this generating set have been
        separately inspected and tested to AS/NZS 3760:2022 where listed on the accompanying
        Test &amp; Tag certificate. This report does not certify the generating set as safe or
        compliant, and does not substitute for inspection by a licensed electrical contractor.
      </p>
    </div>

    <div class="signatures">
      ${testerSignatureBlockHtml(job, "Inspected By")}
      ${clientSignatureBlockHtml(job)}
    </div>

    <div class="footer-note">
      Generated by the ZoltanStudios Test &amp; Tag Records app on ${escapeHtml(formatDisplayDate(new Date().toISOString().slice(0, 10)))}.
      ${job.meggerEquipment ? `Insulation/continuity testing performed with ${escapeHtml(job.meggerEquipment)}.` : ""}
    </div>`;
  return docShell(`Generator Inspection - ${job.clientName || "Untitled"} - ${job.testDate}`, body);
}
function GeneratorPanel({
  generator,
  onChange,
  inputCls
}) {
  // Older saved jobs won't have a generator object, or may have a partial one.
  // Merge over defaults so every field is always defined.
  const g = {
    ...blankGenerator(),
    ...(generator || {})
  };
  const [showGenSteps, setShowGenSteps] = React.useState(false);
  const set = k => e => onChange({
    [k]: e.target.value
  });
  const setBool = k => e => onChange({
    [k]: e.target.checked
  });
  const lbl = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const isInverter = g.generatorType === "inverter";

  // Live threshold feedback
  const irCheck = v => {
    const n = parseFloat(v);
    if (v === "" || isNaN(n)) return null;
    return n >= 1 ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-emerald-600 font-semibold"
    }, "✓ ≥1MΩ") : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-red-600 font-semibold"
    }, "⚠ below 1MΩ minimum");
  };
  const ecCheck = v => {
    const n = parseFloat(v);
    if (v === "" || isNaN(n)) return null;
    return n <= 1 ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-emerald-600 font-semibold"
    }, "✓ ≤1Ω") : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-red-600 font-semibold"
    }, "⚠ above 1Ω maximum");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Generator Inspection")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5"
  }, "⚠ This produces an ", /*#__PURE__*/React.createElement("strong", null, "inspection report"), ", not a compliance certificate. Loop impedance and RCD performance testing on the generating set’s own supply require an installation tester and an A-grade licence, and are outside this scope."), (function () {
  var S = function (p) {
    return React.createElement('div', {
      className: 'mb-4'
    }, React.createElement('div', {
      className: 'font-semibold text-slate-800 text-sm mb-1'
    }, p.n), React.createElement('div', {
      className: 'text-slate-600 leading-relaxed'
    }, p.children));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function () {
      setShowGenSteps(function (v) {
        return !v;
      });
    },
    className: "w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-900 text-sm flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15,
    className: "text-amber-600"
  }), "Step-by-Step: How to Inspect a Generator"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, showGenSteps ? "Hide" : "Show")), showGenSteps && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-4 text-sm space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-red-800 mb-1"
  }, "Before you start"), /*#__PURE__*/React.createElement("div", {
    className: "text-red-700 text-xs leading-relaxed"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("strong", null, "1. Stop the engine and make sure it cannot restart."), " Shut it down and let it cool. On a petrol set, pull the ", /*#__PURE__*/React.createElement("strong", null, "spark plug lead"), " \u2014 the rubber boot that pushes onto the spark plug on the engine \u2014 so it physically cannot fire while you work. On a diesel set there is no spark plug: turn the key off and pull the battery isolator or the negative terminal instead."), /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("strong", null, "2. Unplug everything from the 240V outlets."), " Every reading below must be taken with the sockets ", /*#__PURE__*/React.createElement("strong", null, "empty"), ". Anything left plugged in will skew the insulation reading (you would be measuring the appliance, not the generator) and the megger voltage can damage it."), /*#__PURE__*/React.createElement("div", null, "Every test below is done with the machine ", /*#__PURE__*/React.createElement("strong", null, "off, not running, and nothing plugged in"), ". Never megger a running generator."))), /*#__PURE__*/React.createElement(S, {
    n: "1. Visual inspection"
  }, "Check the enclosure, frame and handles for cracks or damage. Look closely at every outlet socket for burn marks, cracked plastic, or bent/loose pins. Check the cord glands where any flexible cord enters the machine — the gland should be tight and the cord should not move or show cracking at the entry. Look for an earth stake terminal and note whether a stake is actually fitted and connected on site. Anything damaged, mark it fail and describe it in Findings."), /*#__PURE__*/React.createElement(S, {
    n: "2. Is it an inverter generator?"
  }, "This decides whether you can megger it at all. Inverter sets (Honda EU-series, Yamaha EF-i, most small quiet suitcase gensets) have an electronic inverter board on the output. Conventional sets have an AVR (automatic voltage regulator). ", /*#__PURE__*/React.createElement("strong", null, "A megger will destroy either one"), " if it is still connected. Set the Type field accordingly."), /*#__PURE__*/React.createElement(S, {
    n: "3. Insulation resistance — only if you can disconnect the electronics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, "You have two honest options here, and the two tick boxes match them:"), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3 mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-700 text-xs mb-1"
  }, "Option A — you CAN disconnect it"), "Open the control panel and physically unplug or unbolt the AVR / inverter board from the stator windings. Now the megger only sees copper and insulation, nothing electronic. Tick ", /*#__PURE__*/React.createElement("strong", null, "“I have physically disconnected the AVR / inverter board”"), " and record your readings. Reconnect it when you are done."), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-700 text-xs mb-1"
  }, "Option B — you CANNOT disconnect it"), "On many sealed inverter gensets the board is not practically removable on site.", /*#__PURE__*/React.createElement("strong", null, " Do not test."), " Tick ", /*#__PURE__*/React.createElement("strong", null, "“Skip insulation test”"), " instead. The report will state plainly why it was not measured. That is a perfectly professional outcome — guessing and frying a customer’s inverter board is not.")), /*#__PURE__*/React.createElement(S, {
    n: "4. Taking the insulation readings"
  }, "Leads: megger negative/earth to the generator frame, positive to the winding or outlet pin. Test voltage: use ", /*#__PURE__*/React.createElement("strong", null, "500V"), " as standard. Drop to ", /*#__PURE__*/React.createElement("strong", null, "250V"), " if there is any electronics you could not fully isolate. Use ", /*#__PURE__*/React.createElement("strong", null, "1000V"), " only on larger industrial sets with no attached electronics. Apply for about 60 seconds and let the reading settle before recording it.", /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, "Take three readings: winding to frame/earth, then line to earth and neutral to earth at the outlet (nothing plugged in). ", /*#__PURE__*/React.createElement("strong", null, "Minimum is 1 MΩ."), " A healthy set reads tens to hundreds of MΩ. Anything sliding toward 1–5 MΩ means moisture or degrading winding insulation — note it, because that machine is on its way out.")), /*#__PURE__*/React.createElement(S, {
    n: "5. Earth continuity"
  }, "Low-ohm meter. One probe on bare metal of the frame, the other on the earth pin inside each outlet socket. You want ", /*#__PURE__*/React.createElement("strong", null, "1Ω or less"), " — ideally under 0.5Ω. Do the same from frame to the earth stake terminal. A high or open reading means the earth path is broken, which is the one thing standing between the operator and a live frame."), /*#__PURE__*/React.createElement(S, {
    n: "6. Neutral / earth bond — the one that matters most"
  }, "Still with the generator off, measure resistance from ", /*#__PURE__*/React.createElement("strong", null, "neutral to earth"), " at the outlet (probe the N pin and the E pin).", /*#__PURE__*/React.createElement("div", {
    className: "mt-2 bg-emerald-50 rounded-lg p-2 text-xs"
  }, /*#__PURE__*/React.createElement("strong", null, "Near 0Ω"), " → bonded (MEN). Normal. An RCD downstream will trip properly on an earth fault."), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 bg-amber-50 rounded-lg p-2 text-xs"
  }, /*#__PURE__*/React.createElement("strong", null, "Open circuit / megohms"), " → floating (IT system). This is the finding worth flagging. On a floating supply a first earth fault creates no return path, so the RCD sees no imbalance and ", /*#__PURE__*/React.createElement("strong", null, "may never trip"), ". Anyone relying on a plug-in RCD on that genset may have no protection at all. Record it and refer it on.")), /*#__PURE__*/React.createElement(S, {
    n: "7. Test the leads and appliances"
  }, "Everything cord-connected that runs off the generator gets tested normally to AS/NZS 3760 with the Wavecom, at the bench on mains — not off the generator. Add them under “Leads & Appliances” below and they will appear on a standard compliance certificate alongside this inspection report."), /*#__PURE__*/React.createElement(S, {
    n: "8. Write the outcome"
  }, "Pick an overall assessment, then write Findings (what you saw and measured) and Recommendations (what should happen next). Be specific — “no N-E bond detected, refer to licensed electrician to confirm earthing arrangement under AS/NZS 3010” is useful; “needs checking” is not."), /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800 leading-relaxed"
  }, /*#__PURE__*/React.createElement("strong", null, "Scope reminder."), " You are recording measurements and observations, not certifying the generating set. Earth fault loop impedance and RCD performance testing on the generator’s own supply need an installation tester and an A-grade licence. Always refer the earthing arrangement on rather than signing off on it.")));
})(), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Generating Set Details"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 gap-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Make"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.make,
    onChange: set("make"),
    placeholder: "e.g. Honda"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Model"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.model,
    onChange: set("model"),
    placeholder: "e.g. EU22i"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Serial No."), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.serialNumber,
    onChange: set("serialNumber")
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.generatorType,
    onChange: set("generatorType")
  }, /*#__PURE__*/React.createElement("option", {
    value: "conventional"
  }, "Conventional (AVR)"), /*#__PURE__*/React.createElement("option", {
    value: "inverter"
  }, "Inverter"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Rated Output (kVA)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.ratedOutputKva,
    onChange: set("ratedOutputKva"),
    placeholder: "2.2"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Hours Run"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.hoursRun,
    onChange: set("hoursRun"),
    placeholder: "340"
  }))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Visual Inspection"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, [["visualCondition", "General / Enclosure"], ["outletCondition", "Outlet Sockets"], ["cordGlandCondition", "Cord Glands"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} ${g[k] === "fail" ? "border-red-400 bg-red-50" : ""}`,
    value: g[k],
    onChange: set(k)
  }, /*#__PURE__*/React.createElement("option", {
    value: "pass"
  }, "Pass"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Fail"), /*#__PURE__*/React.createElement("option", {
    value: "n/a"
  }, "N/A")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Earth Stake Fitted"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.earthStakeFitted,
    onChange: set("earthStakeFitted")
  }, /*#__PURE__*/React.createElement("option", {
    value: "n/a"
  }, "N/A"), /*#__PURE__*/React.createElement("option", {
    value: "yes"
  }, "Yes"), /*#__PURE__*/React.createElement("option", {
    value: "no"
  }, "No")))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Insulation Resistance (Megger)"), isInverter && !g.irNotMeasured && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
  }, "⚠ ", /*#__PURE__*/React.createElement("strong", null, "Inverter generator."), " Insulation testing can destroy the inverter board. Do not meg the output unless the electronics are physically disconnected — otherwise tick \"not measured\" below."), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-600 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!g.irNotMeasured,
    onChange: setBool("irNotMeasured")
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Skip insulation test"), " — I could not safely disconnect the electronics, so no megger test was performed")), !g.irNotMeasured && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-600 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!g.electronicsDisconnected,
    onChange: setBool("electronicsDisconnected")
  }), /*#__PURE__*/React.createElement("span", null, "I have physically disconnected the AVR / inverter board ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-600 font-semibold"
  }, "(required)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Test Voltage"), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: g.irTestVoltage,
    onChange: set("irTestVoltage")
  }, /*#__PURE__*/React.createElement("option", {
    value: "250"
  }, "250V (electronics present)"), /*#__PURE__*/React.createElement("option", {
    value: "500"
  }, "500V (standard)"), /*#__PURE__*/React.createElement("option", {
    value: "1000"
  }, "1000V (large sets)"))), [["irWindingToEarth", "Winding → Earth"], ["irLineToEarth", "Line → Earth"], ["irNeutralToEarth", "Neutral → Earth"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label, " (MΩ)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g[k],
    onChange: set(k),
    placeholder: ">99"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-0.5"
  }, irCheck(g[k])))))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Earth Continuity"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mb-5"
  }, [["ecFrameToOutletEarth", "Frame → Outlet Earth Pin"], ["ecFrameToEarthStake", "Frame → Earth Stake"]].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, label, " (Ω)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g[k],
    onChange: set(k),
    placeholder: "0.15"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-0.5"
  }, ecCheck(g[k]))))), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Neutral / Earth Bond"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mb-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Measured N → E (Ω)"), /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: g.neBondResistance,
    onChange: set("neBondResistance"),
    placeholder: "0.2 or O/L"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Bond Status"), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} ${g.neBondStatus === "floating" ? "border-amber-400 bg-amber-50" : ""}`,
    value: g.neBondStatus,
    onChange: set("neBondStatus")
  }, /*#__PURE__*/React.createElement("option", {
    value: "unknown"
  }, "Not determined"), /*#__PURE__*/React.createElement("option", {
    value: "bonded"
  }, "Bonded (MEN) — near 0Ω"), /*#__PURE__*/React.createElement("option", {
    value: "floating"
  }, "Floating (IT) — open circuit")))), g.neBondStatus === "floating" && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5"
  }, "⚠ ", /*#__PURE__*/React.createElement("strong", null, "Floating supply."), " An RCD downstream may not trip on a first earth fault — there's no return path to create an imbalance. Flag this to the client; the protection strategy needs a licensed electrician before RCD-protected gear is relied on."), g.neBondStatus !== "floating" && /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wide mb-2"
  }, "Assessment"), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Overall Assessment"), /*#__PURE__*/React.createElement("select", {
    className: `${inputCls} font-semibold ${g.overallAssessment === "unsafe" ? "border-red-400 bg-red-50 text-red-700" : g.overallAssessment === "attention" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`,
    value: g.overallAssessment,
    onChange: set("overallAssessment")
  }, /*#__PURE__*/React.createElement("option", {
    value: "satisfactory"
  }, "Satisfactory"), /*#__PURE__*/React.createElement("option", {
    value: "attention"
  }, "Requires Attention"), /*#__PURE__*/React.createElement("option", {
    value: "unsafe"
  }, "Unsafe — Do Not Use"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Findings"), /*#__PURE__*/React.createElement("textarea", {
    className: `${inputCls} min-h-[70px]`,
    value: g.findings,
    onChange: set("findings"),
    placeholder: "What you observed and measured — e.g. no neutral-earth bond detected at outlet; earth stake not fitted at time of inspection."
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Recommendations"), /*#__PURE__*/React.createElement("textarea", {
    className: `${inputCls} min-h-[70px]`,
    value: g.recommendations,
    onChange: set("recommendations"),
    placeholder: "e.g. Refer to licensed electrician to confirm earthing arrangement per AS/NZS 3010 before RCD-protected equipment is used on this supply."
  }))));
}

const blankItem = () => ({
  id: uuid(),
  qrId: generateQrId(),
  // permanent QR identity — never changes on retest
  itemType: "standard",
  // drives pricing category
  assetId: "",
  followUp: false,
  partId: "",
  description: "",
  makeModel: "",
  serialNumber: "",
  location: "",
  equipmentClass: "I",
  visual: "pass",
  earthContinuity: "",
  insulationResistance: "",
  insulationTestVoltage: "500",
  leakageCurrent: "",
  rcdTest: "n/a",
  rcdTripTestEnabled: false,
  rcdType: "II",
  rcdTestMode: "time",
  rcdTripCurrentSetting: "30",
  rcdMeasuredTripTimeMs: "",
  rcdMeasuredTripCurrentMa: "",
  overallResult: "pass",
  overrideResult: false,
  notes: "",
  // Guided checks (21-item-checks.js). Older items have no checksVersion.
  checksVersion: CHECKS_VERSION,
  visualChecks: {},
  polarity: "",
  cordLength: "",
  faultDescription: "",
  repairType: "",
  plugRating: "",
  repairDetails: "",
  removedFromService: false
});

// ---------------------------------------------------------------------------
// Auto tag numbering. A job carries a tag prefix and a starting number; each
// new item gets the next one in sequence. Handles any format the tester likes
// ("T-001", "ZS100", "A1") by splitting into prefix + numeric tail and
// preserving the original zero-padding width.
// ---------------------------------------------------------------------------

// The tag roll is continuous across jobs, so remember where the last job
// started and default new jobs to that. Falls back to "T-001" only if the
// tester has never set one.
const TAG_START_KEY = "zoltanstudios-last-tag-start-v1";

function lastTagStart() {
  try {
    const v = window.localStorage.getItem(TAG_START_KEY);
    return v === null ? "T-001" : v;
  } catch { return "T-001"; }
}

function rememberTagStart(v) {
  try { window.localStorage.setItem(TAG_START_KEY, String(v)); } catch {}
}

function parseTagPattern(tag) {
  const m = String(tag || "").match(/^(.*?)(\d+)\s*$/);
  if (!m) return null;
  return { prefix: m[1], num: parseInt(m[2], 10), width: m[2].length };
}

function formatTag(prefix, num, width) {
  return prefix + String(num).padStart(width || 1, "0");
}

// Next tag for a job: continues from the highest numbered tag already used,
// otherwise starts from the job's configured start tag.
function nextTagFor(job) {
  const raw = (job.tagStart === undefined || job.tagStart === null) ? "T-001" : String(job.tagStart);
  const start = parseTagPattern(raw) || { prefix: "", num: 1, width: 1 };
  let best = null;
  (job.items || []).forEach((it) => {
    const p = parseTagPattern(it.assetId);
    if (p && p.prefix === start.prefix && (best === null || p.num > best)) best = p.num;
  });
  const next = best === null ? start.num : best + 1;
  return formatTag(start.prefix, next, start.width);
}

// Fields worth inheriting from the previous item — the things that rarely
// change when you're working through one room.
function carryForwardFrom(prev) {
  if (!prev) return {};
  return {
    location: prev.location || "",
    equipmentClass: prev.equipmentClass || "I",
    itemType: prev.itemType || "standard",
    makeModel: prev.makeModel || "",
    insulationTestVoltage: prev.insulationTestVoltage || "500",
    cordLength: prev.cordLength || "",
  };
}

// Tag numbers used more than once in the same job.
function duplicateTags(items) {
  const seen = {}, dupes = {};
  (items || []).forEach((it) => {
    const t = String(it.assetId || "").trim().toLowerCase();
    if (!t) return;
    if (seen[t]) dupes[t] = true;
    seen[t] = true;
  });
  return dupes;
}

// A small draw-with-mouse-or-finger signature pad. Used in Tester Defaults
// so the tester signs once rather than on every certificate.
function SignaturePad({
  value,
  onChange
}) {
  var ref = React.useRef(null);
  var d = React.useState(false);
  var drawing = d[0],
    setDrawing = d[1];
  React.useEffect(function () {
    var c = ref.current;
    if (!c) return;
    var r = c.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    // Redraw an existing signature so reopening settings doesn't look blank.
    if (value) {
      var img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, r.width, r.height);
      };
      img.src = value;
    }
  }, []);
  function pos(e) {
    var c = ref.current;
    var r = c.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return {
      x: p.clientX - r.left,
      y: p.clientY - r.top
    };
  }
  function start(e) {
    e.preventDefault();
    var ctx = ref.current.getContext('2d');
    var p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
  }
  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    var ctx = ref.current.getContext('2d');
    var p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function end() {
    if (!drawing) return;
    setDrawing(false);
    // Flatten onto white so it prints and emails properly.
    var c = ref.current;
    var out = document.createElement('canvas');
    out.width = c.width;
    out.height = c.height;
    var o = out.getContext('2d');
    o.fillStyle = '#fff';
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(c, 0, 0);
    onChange(out.toDataURL('image/png'));
  }
  function clear() {
    var c = ref.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    onChange('');
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-300 rounded-lg bg-white overflow-hidden"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    style: {
      display: 'block',
      width: '100%',
      height: '110px',
      touchAction: 'none',
      cursor: 'crosshair'
    },
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mt-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, value ? 'Signature saved' : 'Draw your signature above'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: clear,
    className: "text-xs text-slate-500 hover:text-slate-700 underline"
  }, "Clear")));
}

// ======================================================================
// 13-job-model.js
// Job and item model, tag numbering
// ======================================================================

const blankJob = () => ({
  id: uuid(),
  jobType: "test_tag",
  tagStart: lastTagStart(),
  autoTag: true,
  generator: blankGenerator(),
  fixedRcd: blankFixedRcd(),
  attachments: [],
  meggerEquipment: effectiveTester().meggerEquipment,
  meggerCalibrationDate: effectiveTester().meggerCalibrationDate,
  certNumber: null,
  // assigned properly in createJob after registry check
  status: "draft",
  folderName: null,
  clientName: "",
  clientCompany: "",
  clientEmail: "",
  clientPhone: "",
  siteAddress: "",
  environment: "office",
  retestMonths: 12,
  testDate: new Date().toISOString().slice(0, 10),
  testerName: effectiveTester().name,
  testerLicense: effectiveTester().license,
  items: [{ ...blankItem(), assetId: lastTagStart() }],
  createdAt: Date.now()
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Looks up the RGBY colour for a given month (0-11), Southern Hemisphere
// seasons: Summer Dec-Feb (Red), Autumn Mar-May (Green), Winter Jun-Aug
// (Blue), Spring Sep-Nov (Yellow).
function rgbyForMonth(month) {
  if (month === 11 || month === 0 || month === 1) {
    return {
      name: "Red",
      hex: "#dc2626",
      bg: "#fef2f2",
      season: "Summer"
    };
  }
  if (month >= 2 && month <= 4) {
    return {
      name: "Green",
      hex: "#16a34a",
      bg: "#f0fdf4",
      season: "Autumn"
    };
  }
  if (month >= 5 && month <= 7) {
    return {
      name: "Blue",
      hex: "#2563eb",
      bg: "#eff6ff",
      season: "Winter"
    };
  }
  return {
    name: "Yellow",
    hex: "#ca8a04",
    bg: "#fefce8",
    season: "Spring"
  };
}

// Tag colour guidance, based on the job's actual retest interval:
//  - <=3 months: the RGBY quarterly system - mandatory under AS/NZS 3012
//    for construction/demolition/mining, common practice elsewhere for
//    genuinely quarterly testing.
//  - 6 months: no legal requirement. Proper convention is Orange or White,
//    but as a TEMPORARY stand-in while those aren't in stock, this reuses
//    the RGBY colour for 3 months from now - deliberately offset so it
//    doesn't collide with whatever colour is being used for real quarterly
//    testing happening right now.
//  - 12 months: no legal requirement - Black is the common convention.
//  - Longer (24/60 months): no real convention exists - pick your own
//    and stay consistent.
function getTagColour(dateStr, retestMonths) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.getMonth(); // 0-11
  const months = retestMonths || 12;
  if (months <= 3) {
    const rgby = rgbyForMonth(month);
    return {
      ...rgby,
      note: `${rgby.season} - RGBY quarterly system`
    };
  }
  if (months <= 6) {
    // Pure month-index arithmetic (not Date.setMonth) - avoids day-of-month
    // overflow bugs, e.g. Nov 30 + 3 calendar months would otherwise roll
    // into March instead of February, since February doesn't have 30 days.
    const futureMonth = (month + 3) % 12;
    const rgby = rgbyForMonth(futureMonth);
    return {
      name: rgby.name,
      hex: rgby.hex,
      bg: rgby.bg,
      note: `Temporary stand-in for 6-monthly (no orange/white in stock) - using the ${rgby.season} RGBY colour, 3 months ahead so it won't be mistaken for a quarterly-tested item`
    };
  }
  if (months <= 12) {
    return {
      name: "Black",
      hex: "#1e293b",
      bg: "#f1f5f9",
      note: "Common convention for 12-monthly testing (not legally required)"
    };
  }
  return {
    name: "Your choice",
    hex: "#6b7280",
    bg: "#f9fafb",
    note: "No fixed convention beyond 12 months - pick a colour and stay consistent"
  };
}

// Suggests a pass/fail based on the Wavecom TnT RCD's documented limits
// (Earth Bond <1.0Ω @200mA, Insulation >1MΩ @250V/500V, Leakage Class I
// <=5mA / Class II <=1mA, RCD Type I <40ms or <10mA / Type II <300ms or
// <30mA). This is a starting point only - the tester's judgement always
// overrides it.
function suggestResult(item) {
  if (item.visual === "fail") return "fail";
  if (Object.values(item.visualChecks || {}).includes("fail")) return "fail";
  if (item.polarity === "fail") return "fail";
  if (item.equipmentClass === "I" && earthOpen(item.earthContinuity)) return "fail";
  if (item.equipmentClass === "I") {
    const earth = parseFloat(item.earthContinuity);
    if (item.earthContinuity !== "" && !isNaN(earth) && earth > 1) return "fail";
  }
  const insulation = parseFloat(item.insulationResistance);
  if (item.insulationResistance !== "" && !isNaN(insulation) && insulation < 1) return "fail";
  const leakage = parseFloat(item.leakageCurrent);
  if (item.leakageCurrent !== "" && !isNaN(leakage)) {
    const leakageLimit = item.equipmentClass === "II" ? 1 : 5; // mA - per Wavecom spec
    if (leakage > leakageLimit) return "fail";
  }
  if (item.rcdTest === "fail") return "fail";
  if (item.rcdTripTestEnabled) {
    const isTypeI = item.rcdType === "I";
    if (item.rcdTestMode === "time") {
      const tripTime = parseFloat(item.rcdMeasuredTripTimeMs);
      const limit = isTypeI ? 40 : 300; // ms
      if (item.rcdMeasuredTripTimeMs !== "" && !isNaN(tripTime) && tripTime > limit) return "fail";
    } else if (item.rcdTestMode === "ramp") {
      const tripCurrentRaw = parseFloat(item.rcdMeasuredTripCurrentMa);
      const limit = isTypeI ? 10 : 30; // mA
      if (item.rcdMeasuredTripCurrentMa !== "" && !isNaN(tripCurrentRaw)) {
        const compensated = tripCurrentRaw + 2; // tester's nominal 2mA leakage, per manual
        if (compensated > limit) return "fail";
      }
    }
  }
  return "pass";
}
async function loadJobs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function persistJobs(jobs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------------------

function ResultBadge({
  result
}) {
  if (result === "referred" || result === "untested") return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700"
  }, result === "referred" ? "REFER" : "UNTESTED");
  if (result === "pending") return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
  }, "PENDING");
  const isPass = result === "pass";
  return /*#__PURE__*/React.createElement("span", {
    className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`
  }, isPass ? /*#__PURE__*/React.createElement(CheckCircle2, {
    size: 13
  }) : /*#__PURE__*/React.createElement(XCircle, {
    size: 13
  }), isPass ? "PASS" : "FAIL");
}
function Field({
  label,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `flex flex-col gap-1 ${className}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-500 uppercase tracking-wide"
  }, label), children);
}
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// ---------------------------------------------------------------------------
// Job List View
// ---------------------------------------------------------------------------

function TesterSettingsModal({
  onClose
}) {
  var init = effectiveTester();
  var st = React.useState(init);
  var f = st[0],
    setF = st[1];
  var sv = React.useState(false);
  var saved = sv[0],
    setSaved = sv[1];
  var lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';
  var inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  function set(k) {
    return function (e) {
      setF(Object.assign({}, f, {
        [k]: e.target.value
      }));
      setSaved(false);
    };
  }
  function doSave() {
    const prev = loadTesterSettings() || {};
    // Keep the sync bookkeeping the form doesn't know about.
    const next = Object.assign({ signatureVersion: prev.signatureVersion || '', signaturePending: !!prev.signaturePending }, f);
    // A new or cleared signature goes to the server for every other device.
    if ((next.signature || '') !== (prev.signature || '')) next.signaturePending = true;
    saveTesterSettings(next);
    if (next.signaturePending) syncTesterSignature(loadServerConfig());
    setSaved(true);
    setTimeout(onClose, 700);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg",
    onClick: function (e) {
      e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-slate-200 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-slate-900 text-lg"
  }, "Tester Defaults"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-0.5"
  }, "Used to pre-fill every new job. Existing jobs are not changed.")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-slate-600 text-xl leading-none"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Tester Name"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.name,
    onChange: set('name')
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Licence / Certificate No."), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.license,
    onChange: set('license')
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Test Equipment"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.testEquipment,
    onChange: set('testEquipment'),
    placeholder: "Wavecom TnT RCD"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Calibration Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inp,
    value: f.testEquipmentCalibrationDate,
    onChange: set('testEquipmentCalibrationDate')
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Test Equipment Serial No."), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.testEquipmentSerial || "",
    onChange: set('testEquipmentSerial'),
    placeholder: "Printed on the back of the tester"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Insulation Tester (Megger)"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: f.meggerEquipment,
    onChange: set('meggerEquipment'),
    placeholder: "e.g. Kyoritsu 3005A"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Megger Calibration Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inp,
    value: f.meggerCalibrationDate,
    onChange: set('meggerCalibrationDate')
  }))), (function () {
  return React.createElement('div', null, React.createElement('label', {
    className: lbl
  }, 'Your Signature'), React.createElement(SignaturePad, {
    value: f.signature,
    onChange: function (v) {
      setF(Object.assign({}, f, {
        signature: v
      }));
      setSaved(false);
    }
  }), React.createElement('p', {
    className: 'text-xs text-slate-400 mt-1'
  }, 'Drawn once and applied to every certificate you issue.'));
})()), /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-4 border-t border-slate-100 flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: doSave,
    className: "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg"
  }, saved ? 'Saved' : 'Save defaults'))));
}

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
    const failCount = job.items.filter(i => i.overallResult === "fail").length + fixedRcdSummary(job).fail;
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

// ======================================================================
// 19-parts.js
// Repair parts: shared catalogue, on-item picker, and a manager window
// ======================================================================
//
// The catalogue and the stock count live on the server (api/parts.php), so
// the web app and the desktop suite always agree. Stock is only changed by
// saving a job - the server works out which parts the job uses - so nothing
// here ever decrements stock directly. That's what stops a part fitted from
// the phone being counted again when the job is opened on the laptop.
//
// The list is cached locally so the picker still works with no signal.

const PARTS_CACHE_KEY = "zoltanstudios-parts-cache-v1";

function cachedParts() {
  try {
    const raw = window.localStorage.getItem(PARTS_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function cacheParts(list) {
  try {
    window.localStorage.setItem(PARTS_CACHE_KEY, JSON.stringify(list || []));
  } catch (e) { /* storage full - the list is re-fetched next time anyway */ }
}

/** Parts that can be billed as fitted. Consumable kits are excluded. */
function fittableParts(list) {
  return (list || []).filter(p => p.active !== false && !p.consumable);
}

function partById(list, id) {
  if (!id) return null;
  return (list || []).find(p => p.id === id) || null;
}

/**
 * Calls parts.php using the same rule as the rest of the sync layer:
 * the admin session first (browser on the site), then the API token
 * (desktop / mobile shell, which runs on its own origin).
 */
async function partsFetch(path, opts) {
  const cfg = loadServerConfig();
  const base = (cfg.url || "").replace(/\/+$/, "");
  if (!base) throw new Error("No server configured.");
  const method = (opts && opts.method) || "GET";
  const body = opts && opts.body;

  const attempt = async useSession => {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (useSession) {
      if (method !== "GET") headers["X-CSRF-Token"] = await getCsrf(base);
    } else {
      if (!cfg.token) throw new Error("No API token configured.");
      headers["Authorization"] = "Bearer " + cfg.token;
    }
    const res = await fetch(base + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: useSession ? "include" : "omit",
      cache: "no-store"
    });
    const d = await res.json();
    if (!d || !d.ok) throw new Error(d && d.error || "The parts request failed.");
    return d.data;
  };

  if (cfg.session) {
    try {
      return await attempt(true);
    } catch (e) {
      if (!cfg.token) throw e;
    }
  }
  return await attempt(false);
}

/** Fetches the catalogue, falling back to the cached copy when offline. */
async function fetchParts() {
  try {
    const list = await partsFetch("/api/parts.php?action=list");
    if (Array.isArray(list)) {
      cacheParts(list);
      return list;
    }
  } catch (e) { /* offline or signed out - use the cache */ }
  return cachedParts();
}

async function savePartToServer(part) {
  const saved = await partsFetch("/api/parts.php?action=save", {
    method: "POST",
    body: part
  });
  const list = cachedParts().filter(p => p.id !== saved.id).concat([saved]);
  list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  cacheParts(list);
  return saved;
}

/** React hook: the catalogue, served from cache at once and refreshed in the background. */
function usePartsCatalogue() {
  const [parts, setParts] = React.useState(cachedParts);
  React.useEffect(() => {
    let alive = true;
    fetchParts().then(list => { if (alive) setParts(list); });
    return () => { alive = false; };
  }, []);
  return parts;
}

/** Sell price of the parts fitted across a job's items, for the estimate. */
function partsTotalFor(items, parts) {
  let total = 0;
  (items || []).forEach(i => {
    const p = partById(parts, i.partId);
    if (p && !p.consumable) total += Number(p.sell) || 0;
  });
  return total;
}

// ---------------------------------------------------------- item picker

function PartFittedSelect({ item, parts, onChange, inputCls }) {
  const options = fittableParts(parts);
  const current = partById(parts, item.partId);
  const low = current && current.onHand <= 0;

  return React.createElement("div", null,
    React.createElement("div", {
      className: "font-semibold text-slate-500 uppercase tracking-wide mb-1"
    }, "Part fitted"),
    React.createElement("select", {
      className: `${inputCls} py-1 text-xs`,
      value: item.partId || "",
      onChange: e => onChange(e.target.value)
    },
      React.createElement("option", { value: "" }, "(none)"),
      options.map(p => React.createElement("option", { key: p.id, value: p.id },
        p.name + " — $" + Number(p.sell).toFixed(2) + (p.onHand <= 0 ? "  (none in stock)" : "")))
    ),
    low && React.createElement("div", {
      className: "text-[10px] text-amber-700 mt-0.5"
    }, "None left in stock"),
    options.length === 0 && React.createElement("div", {
      className: "text-[10px] text-slate-400 mt-0.5"
    }, "Parts list not loaded yet")
  );
}

// ------------------------------------------------------- helpers for views

const PART_FIELDS = ["name", "sku", "cost", "sell", "onHand", "lowAt", "consumable", "active"];
const PARTS_MARKUP = 2.5; // matches the server: cost plus 250%

function suggestedSell(cost) {
  const c = Number(cost) || 0;
  return c > 0 ? Math.ceil(c * (1 + PARTS_MARKUP)) : 0;
}

function money(n) {
  return "$" + (Number(n) || 0).toFixed(2);
}

function partStatus(p) {
  if (p.active === false) return { key: "archived", label: "Archived", cls: "bg-slate-100 text-slate-500" };
  const on = Number(p.onHand) || 0;
  if (on <= 0) return { key: "out", label: "Out", cls: "bg-red-100 text-red-700" };
  if (on <= (Number(p.lowAt) || 0)) return { key: "low", label: "Low", cls: "bg-amber-100 text-amber-800" };
  return { key: "ok", label: "OK", cls: "bg-emerald-100 text-emerald-700" };
}

function restockText(list) {
  const lines = list.map(p =>
    (p.sku ? p.sku : "").padEnd(9) + p.name + "  —  " + (Number(p.onHand) || 0) + " left");
  return "Restock list — ZoltanStudios — " + new Date().toLocaleDateString("en-AU") + "\n\n" + lines.join("\n");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to the old method */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

// ------------------------------------------------------ main-page panel

/**
 * Stock at a glance on the job list, so running low is noticed before a job
 * rather than on site. Opens the full Parts screen.
 */
function PartsSummaryCard({ onOpen }) {
  const h = React.createElement;
  const parts = usePartsCatalogue();
  const active = parts.filter(p => p.active !== false);
  const billable = active.filter(p => !p.consumable);
  const kits = active.filter(p => p.consumable);
  const low = active.filter(p => ["low", "out"].includes(partStatus(p).key));
  const out = low.filter(p => partStatus(p).key === "out");

  return h("button", {
    type: "button",
    onClick: onOpen,
    className: "w-full text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-4 mb-4 transition-all group"
  },
    h("div", { className: "flex items-start gap-3" },
      h("div", {
        className: "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 " +
          (out.length ? "bg-red-50" : low.length ? "bg-amber-50" : "bg-slate-100")
      }, "\uD83D\uDD27"),
      h("div", { className: "flex-1 min-w-0" },
        h("div", { className: "flex items-center justify-between gap-2" },
          h("div", { className: "font-semibold text-slate-900" }, "Repair Parts"),
          h("span", { className: "text-xs font-semibold text-blue-600 group-hover:underline whitespace-nowrap" },
            "Open parts \u2192")),
        parts.length === 0
          ? h("div", { className: "text-xs text-slate-500 mt-0.5" },
              "Stock list not loaded yet \u2014 open to load it from the server.")
          : h(React.Fragment, null,
              h("div", { className: "text-xs text-slate-500 mt-0.5" },
                billable.length + " part" + (billable.length === 1 ? "" : "s") + " \u00B7 " +
                kits.length + " kit" + (kits.length === 1 ? "" : "s")),
              h("div", { className: "flex flex-wrap gap-1.5 mt-2" },
                low.length === 0
                  ? h("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700" },
                      "All stocked")
                  : h(React.Fragment, null,
                      out.length > 0 && h("span", {
                        className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
                      }, out.length + " out of stock"),
                      low.length - out.length > 0 && h("span", {
                        className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                      }, (low.length - out.length) + " running low"),
                      low.slice(0, 3).map(p => h("span", {
                        key: p.id,
                        className: "text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate max-w-[220px]"
                      }, p.name)),
                      low.length > 3 && h("span", { className: "text-xs text-slate-400 px-1" },
                        "+" + (low.length - 3) + " more")))))));
}

// --------------------------------------------------------- parts screen

function PartsView({ onBack }) {
  const h = React.createElement;
  const [parts, setParts] = React.useState(cachedParts);
  const [drafts, setDrafts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [offline, setOffline] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [note, setNote] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const blankNew = { name: "", sku: "", cost: "", sell: "", onHand: "1", lowAt: "2", consumable: false };
  const [fresh, setFresh] = React.useState(blankNew);

  const load = () => {
    setLoading(true);
    partsFetch("/api/parts.php?action=list")
      .then(list => { cacheParts(list); setParts(list); setOffline(false); })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  };
  React.useEffect(load, []);

  const flash = (kind, text) => {
    setNote({ kind: kind, text: text });
    if (kind === "ok") setTimeout(() => setNote(n => (n && n.text === text ? null : n)), 2500);
  };

  // ---- editing ------------------------------------------------------
  const current = p => drafts[p.id] || p;
  const edit = (p, patch) => setDrafts(d => Object.assign({}, d, { [p.id]: Object.assign({}, d[p.id] || p, patch) }));
  const isDirty = p => {
    const d = drafts[p.id];
    return !!d && PART_FIELDS.some(f => String(d[f]) !== String(p[f]));
  };
  const dirty = parts.filter(isDirty);
  const bump = (p, delta) => edit(p, { onHand: Math.max(0, (Number(current(p).onHand) || 0) + delta) });

  const bodyFor = (p, d) => {
    const body = {
      id: p.id,
      sku: String(d.sku || "").trim(),
      name: String(d.name || "").trim(),
      cost: Number(d.cost) || 0,
      sell: d.consumable ? 0 : (d.sell === "" || d.sell === null ? "" : Number(d.sell) || 0),
      lowAt: Math.max(0, Number(d.lowAt) || 0),
      active: d.active !== false,
      consumable: !!d.consumable
    };
    // Only send the count when it was changed here - a price edit must not
    // put back parts fitted from another device since this screen loaded.
    if (Number(d.onHand) !== Number(p.onHand)) body.onHand = Math.max(0, Number(d.onHand) || 0);
    return body;
  };

  const commit = saved => {
    setParts(list => list.map(x => (x.id === saved.id ? saved : x)));
    setDrafts(d => { const n = Object.assign({}, d); delete n[saved.id]; return n; });
  };

  const saveRow = async p => {
    const d = current(p);
    if (!String(d.name || "").trim()) { flash("err", "A part needs a name."); return; }
    setBusy(p.id);
    try {
      commit(await savePartToServer(bodyFor(p, d)));
      flash("ok", "Saved " + d.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  const saveAll = async () => {
    setBusy("all");
    let failed = 0;
    for (const p of dirty) {
      try { commit(await savePartToServer(bodyFor(p, current(p)))); } catch (e) { failed++; }
    }
    setBusy("");
    failed ? flash("err", failed + " change(s) couldn't be saved - check your connection.") : flash("ok", "All changes saved");
  };

  const setActive = async (p, active) => {
    setBusy(p.id);
    try {
      commit(await savePartToServer(Object.assign(bodyFor(p, p), { active: active })));
      flash("ok", (active ? "Restored " : "Archived ") + p.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  const addPart = async () => {
    if (!fresh.name.trim()) { flash("err", "Give the part a name."); return; }
    setBusy("add");
    try {
      const saved = await savePartToServer({
        name: fresh.name.trim(),
        sku: fresh.sku.trim(),
        cost: Number(fresh.cost) || 0,
        sell: fresh.consumable ? 0 : (fresh.sell === "" ? "" : Number(fresh.sell) || 0),
        onHand: Math.max(0, Number(fresh.onHand) || 0),
        lowAt: Math.max(0, Number(fresh.lowAt) || 0),
        consumable: fresh.consumable
      });
      setParts(list => list.concat([saved]).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      setFresh(blankNew);
      setShowAdd(false);
      flash("ok", "Added " + saved.name);
    } catch (e) {
      flash("err", e.message);
    } finally {
      setBusy("");
    }
  };

  // ---- figures ------------------------------------------------------
  const active = parts.filter(p => p.active !== false);
  const low = active.filter(p => ["low", "out"].includes(partStatus(p).key));
  const valueCost = active.reduce((s, p) => s + (Number(p.cost) || 0) * (Number(p.onHand) || 0), 0);
  const valueSell = active.filter(p => !p.consumable)
    .reduce((s, p) => s + (Number(p.sell) || 0) * (Number(p.onHand) || 0), 0);

  const q = query.trim().toLowerCase();
  const shown = (filter === "archived" ? parts.filter(p => p.active === false)
    : filter === "low" ? low
    : filter === "kits" ? active.filter(p => p.consumable)
    : active)
    .filter(p => !q || String(p.name).toLowerCase().includes(q) || String(p.sku || "").includes(q));

  const input = "w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400";
  const label = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  const chip = (key, text, count) => h("button", {
    key: key,
    type: "button",
    onClick: () => setFilter(key),
    className: "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors " +
      (filter === key ? "bg-slate-800 text-white border-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50")
  }, text + (count !== undefined ? " (" + count + ")" : ""));

  const tile = (value, text, tone) => h("div", {
    className: "bg-white border border-slate-200 rounded-xl px-4 py-3"
  },
    h("div", { className: "text-xl font-bold " + (tone || "text-slate-900") }, value),
    h("div", { className: "text-xs text-slate-500 mt-0.5" }, text));

  const stepper = (p, big) => {
    const d = current(p);
    const btn = "flex items-center justify-center font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors " +
      (big ? "w-11 h-11 text-xl rounded-lg" : "w-7 h-7 text-base rounded");
    return h("div", { className: "flex items-center gap-1.5" },
      h("button", { type: "button", onClick: () => bump(p, -1), className: btn, title: "One fewer" }, "\u2212"),
      h("input", {
        type: "number", min: 0, value: d.onHand,
        onChange: e => edit(p, { onHand: e.target.value }),
        className: "border border-slate-300 rounded-lg text-center font-semibold " + (big ? "w-16 h-11 text-lg" : "w-14 h-7 text-sm")
      }),
      h("button", { type: "button", onClick: () => bump(p, 1), className: btn, title: "One more" }, "+"));
  };

  const actions = p => h("div", { className: "flex items-center gap-2 justify-end" },
    isDirty(p) && h("button", {
      type: "button", onClick: () => saveRow(p), disabled: !!busy,
      className: "text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
    }, busy === p.id ? "Saving\u2026" : "Save"),
    p.active === false
      ? h("button", {
          type: "button", onClick: () => setActive(p, true), disabled: !!busy,
          className: "text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
        }, "Restore")
      : !isDirty(p) && h("button", {
          type: "button", onClick: () => setActive(p, false), disabled: !!busy,
          title: "Hide from the picker without losing its history",
          className: "text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        }, "Archive"));

  return h("div", { className: "max-w-6xl mx-auto p-4 md:p-8 pb-28" },

    // ---- header
    h("button", {
      type: "button", onClick: onBack,
      className: "inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-4"
    }, h(ArrowLeft, { size: 16 }), " Back to jobs"),

    h("div", { className: "flex flex-wrap items-start justify-between gap-3 mb-5" },
      h("div", null,
        h("h1", { className: "text-2xl font-bold text-slate-900" }, "Repair Parts"),
        h("p", { className: "text-sm text-slate-500 mt-1" },
          "Van stock for on-site repairs. Shared with the desktop app \u2014 stock comes off when a job is saved.")),
      h("button", {
        type: "button", onClick: () => setShowAdd(v => !v),
        className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm"
      }, h(Plus, { size: 18 }), showAdd ? " Close" : " Add part")),

    // ---- messages
    note && h("div", {
      className: "text-sm rounded-lg px-4 py-2.5 mb-4 border " +
        (note.kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")
    }, note.text),
    offline && h("div", {
      className: "text-sm rounded-lg px-4 py-2.5 mb-4 border bg-amber-50 border-amber-200 text-amber-900 flex items-center justify-between gap-3"
    },
      h("span", null, "Couldn't reach the server \u2014 showing the last saved copy. Changes need a connection."),
      h("button", { type: "button", onClick: load, className: "text-xs font-semibold underline whitespace-nowrap" }, "Try again")),

    // ---- add form
    showAdd && h("div", { className: "bg-white border border-slate-200 rounded-xl p-4 md:p-5 mb-5" },
      h("div", { className: "font-semibold text-slate-900 mb-3" }, "New part"),
      h("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-3" },
        h("div", { className: "col-span-2" },
          h("label", { className: label }, "Name"),
          h("input", { className: input, value: fresh.name, placeholder: "e.g. DETA 10A Plug Top - Black",
            onChange: e => setFresh(Object.assign({}, fresh, { name: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Bunnings I/N"),
          h("input", { className: input, value: fresh.sku, placeholder: "4330985",
            onChange: e => setFresh(Object.assign({}, fresh, { sku: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Cost"),
          h("input", { className: input, type: "number", step: "0.01", value: fresh.cost, placeholder: "0.00",
            onChange: e => setFresh(Object.assign({}, fresh, { cost: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "Sell"),
          h("input", { className: input, type: "number", step: "0.01", value: fresh.sell,
            disabled: fresh.consumable,
            placeholder: fresh.consumable ? "not billed" : "auto " + money(suggestedSell(fresh.cost)),
            onChange: e => setFresh(Object.assign({}, fresh, { sell: e.target.value })) })),
        h("div", null,
          h("label", { className: label }, "In stock"),
          h("input", { className: input, type: "number", min: 0, value: fresh.onHand,
            onChange: e => setFresh(Object.assign({}, fresh, { onHand: e.target.value })) }))),
      h("div", { className: "flex flex-wrap items-center justify-between gap-3 mt-3" },
        h("label", { className: "flex items-center gap-2 text-sm text-slate-600" },
          h("input", { type: "checkbox", checked: fresh.consumable,
            onChange: e => setFresh(Object.assign({}, fresh, { consumable: e.target.checked })) }),
          "Consumable kit (heatshrink, crimp terminals) \u2014 tracked, never billed per fit"),
        h("button", {
          type: "button", onClick: addPart, disabled: busy === "add",
          className: "bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        }, busy === "add" ? "Adding\u2026" : "Add part"))),

    // ---- figures
    h("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" },
      tile(active.filter(p => !p.consumable).length, "Parts carried"),
      tile(low.length, "Need restocking", low.length ? "text-amber-600" : "text-slate-900"),
      tile(money(valueCost), "Stock value at cost"),
      tile(money(valueSell), "Stock value at sell")),

    // ---- restock
    low.length > 0 && h("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-2" },
        h("div", { className: "font-semibold text-amber-900" },
          "Restock list \u2014 " + low.length + " item" + (low.length === 1 ? "" : "s")),
        h("button", {
          type: "button",
          onClick: async () => {
            const ok = await copyText(restockText(low));
            flash(ok ? "ok" : "err", ok ? "Restock list copied - paste it into a message or note"
                                        : "Couldn't copy - select the list and copy it by hand");
          },
          className: "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
        }, h(ClipboardList, { size: 14 }), " Copy list")),
      h("div", { className: "divide-y divide-amber-200/70" },
        low.map(p => h("div", { key: p.id, className: "flex items-center justify-between gap-3 py-1.5 text-sm" },
          h("div", { className: "min-w-0" },
            h("div", { className: "text-amber-950 truncate" }, p.name),
            p.sku && h("div", { className: "text-[11px] text-amber-700 font-mono" }, "I/N " + p.sku)),
          h("span", {
            className: "text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap " + partStatus(p).cls
          }, (Number(p.onHand) || 0) + " left"))))),

    // ---- toolbar
    h("div", { className: "flex flex-col md:flex-row md:items-center gap-3 mb-3" },
      h("div", { className: "relative flex-1" },
        h(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
        h("input", {
          value: query, onChange: e => setQuery(e.target.value),
          placeholder: "Search parts or I/N...",
          className: "w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        })),
      h("div", { className: "flex flex-wrap gap-2" },
        chip("all", "All", active.length),
        chip("low", "Running low", low.length),
        chip("kits", "Kits", active.filter(p => p.consumable).length),
        chip("archived", "Archived", parts.filter(p => p.active === false).length))),

    loading && parts.length === 0 && h("div", { className: "text-sm text-slate-500 py-10 text-center" },
      h(Loader2, { size: 18, className: "animate-spin inline mr-2" }), "Loading parts\u2026"),

    !loading && shown.length === 0 && h("div", {
      className: "text-sm text-slate-500 py-10 text-center border-2 border-dashed border-slate-200 rounded-xl"
    }, filter === "low" ? "Nothing needs restocking." : q ? "No parts match that search." : "No parts here."),

    // ---- wide screens: table
    shown.length > 0 && h("div", { className: "hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden" },
      h("table", { className: "w-full text-sm" },
        h("thead", null,
          h("tr", { className: "text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200" },
            ["Part", "Cost", "Sell", "In stock", "Low at", "Kit", "Status", ""].map(t =>
              h("th", { key: t, className: "px-3 py-2.5" }, t)))),
        h("tbody", null, shown.map(p => {
          const d = current(p);
          const st = partStatus(d);
          return h("tr", {
            key: p.id,
            className: "border-b border-slate-100 last:border-0 " + (isDirty(p) ? "bg-blue-50/40" : "")
          },
            h("td", { className: "px-3 py-2 min-w-[260px]" },
              h("input", { className: input + " font-medium", value: d.name,
                onChange: e => edit(p, { name: e.target.value }) }),
              h("input", { className: "mt-1 w-32 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono text-slate-500",
                value: d.sku || "", placeholder: "I/N",
                onChange: e => edit(p, { sku: e.target.value }) })),
            h("td", { className: "px-3 py-2 w-28" },
              h("input", { className: input, type: "number", step: "0.01", value: d.cost,
                onChange: e => edit(p, { cost: e.target.value }) })),
            h("td", { className: "px-3 py-2 w-28" },
              h("input", { className: input, type: "number", step: "0.01",
                value: d.consumable ? "" : d.sell, disabled: d.consumable,
                placeholder: d.consumable ? "\u2014" : "",
                onChange: e => edit(p, { sell: e.target.value }) })),
            h("td", { className: "px-3 py-2" }, stepper(p, false)),
            h("td", { className: "px-3 py-2 w-20" },
              h("input", { className: input, type: "number", min: 0, value: d.lowAt,
                onChange: e => edit(p, { lowAt: e.target.value }) })),
            h("td", { className: "px-3 py-2 text-center" },
              h("input", { type: "checkbox", checked: !!d.consumable,
                title: "Consumable kit - tracked, never billed per fit",
                onChange: e => edit(p, { consumable: e.target.checked }) })),
            h("td", { className: "px-3 py-2" },
              h("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full " + st.cls }, st.label)),
            h("td", { className: "px-3 py-2 whitespace-nowrap" }, actions(p)));
        })))),

    // ---- phones: cards with big stock buttons for use on site
    shown.length > 0 && h("div", { className: "md:hidden space-y-3" },
      shown.map(p => {
        const d = current(p);
        const st = partStatus(d);
        return h("div", {
          key: p.id,
          className: "bg-white border rounded-xl p-4 " + (isDirty(p) ? "border-blue-300" : "border-slate-200")
        },
          h("div", { className: "flex items-start justify-between gap-2 mb-3" },
            // Wraps rather than truncating: the end of the name is often the
            // colour, which is what tells the plug tops apart.
            h("textarea", { className: input + " font-semibold resize-none leading-snug", rows: 2, value: d.name,
              onChange: e => edit(p, { name: e.target.value.replace(/\n/g, " ") }) }),
            h("span", { className: "text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap " + st.cls }, st.label)),
          h("div", { className: "flex items-center justify-between gap-3 mb-3" },
            h("div", { className: "text-xs text-slate-500" }, "In stock"),
            stepper(p, true)),
          h("div", { className: "grid grid-cols-3 gap-2 mb-3" },
            h("div", null, h("label", { className: label }, "Cost"),
              h("input", { className: input, type: "number", step: "0.01", value: d.cost,
                onChange: e => edit(p, { cost: e.target.value }) })),
            h("div", null, h("label", { className: label }, "Sell"),
              h("input", { className: input, type: "number", step: "0.01",
                value: d.consumable ? "" : d.sell, disabled: d.consumable,
                placeholder: d.consumable ? "kit" : "",
                onChange: e => edit(p, { sell: e.target.value }) })),
            h("div", null, h("label", { className: label }, "Low at"),
              h("input", { className: input, type: "number", min: 0, value: d.lowAt,
                onChange: e => edit(p, { lowAt: e.target.value }) }))),
          h("div", { className: "flex items-center justify-between gap-2" },
            h("div", { className: "text-[11px] text-slate-400 font-mono" }, d.sku ? "I/N " + d.sku : ""),
            actions(p)));
      })),

    // ---- unsaved changes bar
    dirty.length > 0 && h("div", {
      className: "fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 shadow-2xl",
      style: { paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }
    },
      h("div", { className: "max-w-6xl mx-auto flex items-center justify-between gap-3" },
        h("span", { className: "text-sm" },
          dirty.length + " unsaved change" + (dirty.length === 1 ? "" : "s")),
        h("div", { className: "flex gap-2" },
          h("button", {
            type: "button", onClick: () => setDrafts({}), disabled: busy === "all",
            className: "text-sm px-4 py-2 rounded-lg text-slate-300 hover:text-white"
          }, "Discard"),
          h("button", {
            type: "button", onClick: saveAll, disabled: busy === "all",
            className: "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          }, busy === "all" ? "Saving\u2026" : h(React.Fragment, null, h(Save, { size: 15 }), " Save all"))))));
}

// ======================================================================
// 20-fixed-rcd.js
// Fixed RCD (switchboard safety switch) test log
// ======================================================================
//
// Fixed RCDs are tested from a power point on the protected circuit, not in
// the appliance socket: plug the Wavecom TnT RCD's own mains lead into the
// GPO, Menu B > F3 > F1 (time test), 30 mA, PRCD off, trip at 0 deg then
// 180 deg. The TnT RCD has no x1/2 or x5 multiplier, so only the 1x
// operating time is logged (AS/NZS 3760:2022). Hard-wired circuits with no
// power point (lighting, cool rooms, HWU) get a push-button test at the board.
//
// Stored on the job as job.fixedRcd and sent to the server inside extra_json,
// so the desktop suite (which doesn't send it) can never wipe it.

const FIXED_RCD_PRICE = 10.00; // published "RCD / safety switch testing" rate (test-and-tag.html)
const FIXED_RCD_LIMIT_MS = { I: 40, II: 300 };

const FIXED_RCD_METHODS = [
  { value: "time", label: "Trip time (TnT RCD)" },
  { value: "push", label: "Push-button only" },
  { value: "nt", label: "Not tested (trading)" },
];

function blankFixedRcdRow(prev) {
  return {
    id: uuid(),
    board: prev ? prev.board || "" : "",
    circuit: "",
    location: "",
    method: prev ? prev.method || "time" : "time",
    rcdType: prev ? prev.rcdType || "II" : "II",
    t0: "",
    t180: "",
    noTrip: false,
    manual: "",
    notes: "",
  };
}

function blankFixedRcd() {
  const t = effectiveTester();
  return {
    instrument: t.testEquipment || "Wavecom TnT RCD",
    serial: t.testEquipmentSerial || "",
    calDate: t.testEquipmentCalibrationDate || "",
    rated: "30",
    rows: [],
  };
}

// Older jobs and jobs from the desktop suite have no fixedRcd at all.
function fixedRcdOf(job) {
  const f = job && job.fixedRcd;
  if (!f || typeof f !== "object") return Object.assign(blankFixedRcd(), { rows: [] });
  return Object.assign(blankFixedRcd(), f, { rows: Array.isArray(f.rows) ? f.rows : [] });
}

// "pass" | "fail" | "nt" | "" (not finished yet)
function gradeFixedRcd(r) {
  if (!r) return "";
  if (r.method === "nt") return "nt";
  if (r.method === "push") return r.manual === "pass" ? "pass" : r.manual === "fail" ? "fail" : "";
  if (r.noTrip) return "fail";
  const lim = FIXED_RCD_LIMIT_MS[r.rcdType === "I" ? "I" : "II"];
  const a = parseFloat(r.t0), b = parseFloat(r.t180);
  if ((!isNaN(a) && a > lim) || (!isNaN(b) && b > lim)) return "fail";
  if (!isNaN(a) && !isNaN(b)) return "pass";
  return "";
}

function fixedRcdSummary(job) {
  const rows = fixedRcdOf(job).rows;
  const g = rows.map(gradeFixedRcd);
  const pass = g.filter(x => x === "pass").length;
  const fail = g.filter(x => x === "fail").length;
  const nt = g.filter(x => x === "nt").length;
  const pending = g.filter(x => x === "").length;
  return { total: rows.length, pass, fail, nt, pending, tested: pass + fail };
}

function fixedRcdTotalPriceAll(job) { return fixedRcdTotalPrice(job) + lightsTotalPrice(job); }
function fixedRcdTotalPrice(job) {
  return fixedRcdSummary(job).tested * FIXED_RCD_PRICE;
}

// The blank row every new job starts with, never filled in. It must not be
// printed or counted as a pass: it has no description and no readings.
function isUnusedItem(it) {
  if (!it) return true;
  const blank = v => v === undefined || v === null || String(v).trim() === "";
  return blank(it.description) && blank(it.makeModel) && blank(it.serialNumber) && blank(it.location) &&
    blank(it.earthContinuity) && blank(it.insulationResistance) && blank(it.leakageCurrent) &&
    blank(it.notes) && blank(it.partId) && (it.rcdTest || "n/a") === "n/a" && !it.rcdTripTestEnabled &&
    (it.visual || "pass") === "pass" &&
    !Object.values(it.visualChecks || {}).some(Boolean) && blank(it.polarity) && blank(it.cordLength) &&
    blank(it.faultDescription) && blank(it.repairType);
}
function certItems(job) {
  return (job.items || []).filter(it => !isUnusedItem(it));
}

// Headline numbers for the certificate: items AND fixed RCDs, so a failed
// safety switch can never sit under "0 failed, 100% pass".
function certificateCounts(job) {
  const items = gradedItems(job);
  const r = fixedRcdSummary(job);
  const itemPass = items.filter(i => i.overallResult === "pass").length;
  const itemFail = items.filter(i => i.overallResult === "fail").length;
  const pass = itemPass + r.pass, fail = itemFail + r.fail, total = items.length + r.tested;
  return {
    items: items.length, rcds: r.tested, total, pass, fail,
    rate: total ? Math.round(pass / total * 100) : 0,
    breakdown: !r.tested ? "" : !items.length ? "fixed RCD" + (r.tested === 1 ? "" : "s")
      : items.length + " item" + (items.length === 1 ? "" : "s") + " + " + r.tested + " RCD" + (r.tested === 1 ? "" : "s"),
  };
}

// Test current follows the RCD type: Type I = 10 mA, Type II = 30 mA.
function fixedRcdMa(r) { return r && r.rcdType === "I" ? 10 : 30; }

const FIXED_RCD_LABEL = { pass: "PASS", fail: "FAIL", nt: "NOT TESTED", "": "PENDING" };

function fixedRcdReadings(r) {
  if (r.method === "push") return { t0: "Mt", t180: "Mt" };
  if (r.method === "nt") return { t0: "NT", t180: "NT" };
  if (r.noTrip) return { t0: "No trip", t180: "No trip" };
  return { t0: r.t0 || "", t180: r.t180 || "" };
}

// ---------------------------------------------------------------------------
// Certificate / record HTML
// ---------------------------------------------------------------------------
function fixedRcdBadgeHtml(g) {
  if (g === "pass" || g === "fail") return resultBadgeHtml(g);
  const bg = g === "nt" ? "#fef3c7" : "#f1f5f9", fg = g === "nt" ? "#92400e" : "#64748b";
  return `<span class="badge" style="background:${bg};color:${fg}">${FIXED_RCD_LABEL[g]}</span>`;
}

function fixedRcdSectionHtml(job) {
  const f = fixedRcdOf(job);
  if (!f.rows.length) return "";
  const s = fixedRcdSummary(job);
  const failed = f.rows.filter(r => gradeFixedRcd(r) === "fail");
  const instrument = [f.instrument, f.serial ? "s/n " + f.serial : "", f.calDate ? "calibrated " + formatDisplayDate(f.calDate) : ""]
    .filter(Boolean).map(escapeHtml).join(" &middot; ");
  const rows = f.rows.map(r => {
    const g = gradeFixedRcd(r);
    const v = fixedRcdReadings(r);
    const ms = x => (x && !isNaN(parseFloat(x)) ? escapeHtml(x) : escapeHtml(x) || "&mdash;");
    return `
      <tr>
        <td>${escapeHtml(r.board) || "&mdash;"}</td>
        <td>${escapeHtml(r.circuit) || "&mdash;"}</td>
        <td>${escapeHtml(r.location) || "&mdash;"}</td>
        <td>${r.method === "time" ? "Type " + escapeHtml(r.rcdType === "I" ? "I" : "II") + " &middot; " + fixedRcdMa(r) + " mA" : "&mdash;"}</td>
        <td style="font-family:monospace">${ms(v.t0)}</td>
        <td style="font-family:monospace">${ms(v.t180)}</td>
        <td>${fixedRcdBadgeHtml(g)}</td>
        <td>${escapeHtml(r.notes) || ""}</td>
      </tr>`;
  }).join("");
  const callout = failed.length ? `<div class="callout">
      <h3>&#9888; Safety switches requiring attention</h3>
      <ul>${failed.map(r => `<li>${escapeHtml(r.board || "Board")} circuit ${escapeHtml(r.circuit || "?")}${r.location ? " &mdash; " + escapeHtml(r.location) : ""}: refer to a licensed electrician for repair or replacement.</li>`).join("")}</ul>
    </div>` : "";
  return `
    <h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Fixed RCD (Safety Switch) Test Log</h2>
    <p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5">
      Operating-time test at 1&times; the RCD's rated residual current (Type II 30 mA, Type I 10 mA), at 0&deg; and 180&deg;, from a socket outlet on each protected circuit (AS/NZS 3760:2022).
      Pass: Type II &le; 300 ms, Type I &le; 40 ms. &frac12;&times; and 5&times; tests not available on the instrument.<br/>
      Instrument: ${instrument || "&mdash;"}.
      ${s.pass} passed, ${s.fail} failed${s.nt ? ", " + s.nt + " not tested" : ""} of ${s.total}.
    </p>
    ${callout}
    <table>
      <thead>
        <tr><th>Board</th><th>Circuit</th><th>Location</th><th>Type</th><th>1&times; 0&deg; (ms)</th><th>1&times; 180&deg; (ms)</th><th>Result</th><th>Notes</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#94a3b8;margin:-16px 0 24px">Mt = manual push-button test (hard-wired circuit, no socket outlet). NT = not tested, with reason in notes.</p>`;
}

// Tab-separated copy of the log, for pasting into an email or a spreadsheet.
function fixedRcdLogText(job) {
  const f = fixedRcdOf(job);
  const s = fixedRcdSummary(job);
  const head = [
    "RCD TEST LOG - trip test times at 1x rated current (Type II 30 mA, Type I 10 mA)",
    "Testing company: ZoltanStudios",
    "Tested by: " + (job.testerName || "") + " (" + (job.testerLicense || "") + ")",
    "Instrument: " + [f.instrument, f.serial ? "s/n " + f.serial : "", f.calDate ? "calibrated " + f.calDate : ""].filter(Boolean).join(", "),
    "Client & premises: " + [job.clientCompany || job.clientName, job.siteAddress].filter(Boolean).join(", "),
    "Test date: " + (job.testDate || ""),
    "",
    ["Board", "Circuit", "Location", "Type / mA", "1x 0deg ms", "1x 180deg ms", "x1/2", "x5", "Result", "Notes"].join("\t"),
  ];
  const lines = f.rows.map(r => {
    const v = fixedRcdReadings(r);
    return [r.board, r.circuit, r.location, r.method === "time" ? (r.rcdType === "I" ? "I" : "II") + " / " + fixedRcdMa(r) : "", v.t0, v.t180, "N/A", "N/A", FIXED_RCD_LABEL[gradeFixedRcd(r)], r.notes]
      .map(x => String(x || "").replace(/[\t\n]/g, " ")).join("\t");
  });
  return head.concat(lines, ["", "Pass " + s.pass + " / Fail " + s.fail + " / Not tested " + s.nt + " / Total " + s.total,
    "Mt = manual (push-button) test. NT = not tested. x1/2 and x5 not available on instrument."]).join("\n");
}

// ---------------------------------------------------------------------------
// Job form panel
// ---------------------------------------------------------------------------
function FixedRcdPanel({ job, onChange }) {
  const f = fixedRcdOf(job);
  const [open, setOpen] = useState(f.rows.length > 0);
  const [copied, setCopied] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const s = fixedRcdSummary(job);
  const inp = "w-full border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lbl = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  const setF = patch => onChange(Object.assign({}, f, patch));
  const setRow = (id, patch) => setF({ rows: f.rows.map(r => (r.id === id ? Object.assign({}, r, patch) : r)) });
  const addRow = () => setF({ rows: f.rows.concat([blankFixedRcdRow(f.rows[f.rows.length - 1])]) });
  const removeRow = id => setF({ rows: f.rows.filter(r => r.id !== id) });
  const setSerial = e => {
    const v = e.target.value;
    setF({ serial: v });
    // Remember it for the next job.
    try { saveTesterSettings(Object.assign({}, loadTesterSettings() || {}, { testEquipmentSerial: v })); } catch (err) {}
  };
  const copyLog = () => {
    const txt = fixedRcdLogText(job);
    const done = () => { setCopied("Log copied"); setTimeout(() => setCopied(""), 2000); };
    try {
      navigator.clipboard.writeText(txt).then(done, () => setCopied("Copy blocked - use the record download instead"));
    } catch (e) { setCopied("Copy blocked - use the record download instead"); }
  };

  const pillCls = g => "text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap " + (
    g === "pass" ? "bg-emerald-100 text-emerald-700" :
    g === "fail" ? "bg-red-100 text-red-700" :
    g === "nt" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500");
  const edge = g => g === "pass" ? "border-l-emerald-500" : g === "fail" ? "border-l-red-500" : g === "nt" ? "border-l-amber-500" : "border-l-slate-300";
  const e = React.createElement;

  return e("div", { className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden" },
    e("button", {
      type: "button",
      onClick: () => setOpen(o => !o),
      className: "w-full flex items-center justify-between gap-3 p-4 md:px-6 text-left hover:bg-slate-50",
      "aria-expanded": open,
    },
      e("span", { className: "min-w-0" },
        e("span", { className: "block font-semibold text-slate-900" }, "Fixed RCDs (switchboard safety switches)"),
        e("span", { className: "block text-xs text-slate-500 mt-0.5" },
          s.total ? `${s.total} logged · ${s.pass} pass · ${s.fail} fail${s.nt ? " · " + s.nt + " not tested" : ""}${s.pending ? " · " + s.pending + " to finish" : ""}`
                  : "Trip-time test each fixed RCD from a power point on its circuit")),
      e("span", { className: "text-xs text-slate-400 shrink-0" }, open ? "Hide" : "Show")),
    open && e("div", { className: "px-4 md:px-6 pb-5 space-y-4" },
      e("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3" },
        e("div", { className: "sm:col-span-2" }, e("label", { className: lbl, htmlFor: "frcd-inst" }, "Instrument"),
          e("input", { id: "frcd-inst", className: inp, value: f.instrument, onChange: ev => setF({ instrument: ev.target.value }) })),
        e("div", null, e("label", { className: lbl, htmlFor: "frcd-serial" }, "Serial No."),
          e("input", { id: "frcd-serial", className: inp, value: f.serial, onChange: setSerial, placeholder: "On the back of the tester" })),
        e("div", null, e("label", { className: lbl, htmlFor: "frcd-cal" }, "Calibrated"),
          e("input", { id: "frcd-cal", type: "date", className: inp, value: f.calDate, onChange: ev => setF({ calDate: ev.target.value }) }))),
      e("details", { className: "text-sm bg-slate-50 border border-slate-200 rounded-lg p-3" },
        e("summary", { className: "font-semibold text-slate-700 cursor-pointer" }, "How to test a fixed RCD with the TnT RCD"),
        e("ol", { className: "list-decimal pl-5 mt-2 space-y-1 text-slate-600" },
          e("li", null, "Battery isolation switch ON, so the tester stays on when the RCD trips."),
          e("li", null, "Plug the tester's own mains lead into a power point on the circuit. Nothing in the appliance socket."),
          e("li", null, "Enter → Menu B → F3 (RCD) → F1 (Time test). F3 for options: Type II at 30 mA (Type I at 10 mA), PRCD off."),
          e("li", null, "0° → F3 to trip, read the ms. Reset at the board, switch to 180°, test again."),
          e("li", null, "Pass: Type II ≤ 300 ms, Type I ≤ 40 ms. A fail stays a fail: don't retest for a pass, refer it to a licensed electrician."),
          e("li", null, "No power point on the circuit (lighting, cool rooms, HWU)? Push-button test it at the board."))),
      f.rows.length === 0 && e("p", { className: "text-sm text-slate-500" }, "No fixed RCDs on this job yet. Add one per RCD or RCBO on the board."),
      e("div", { className: "space-y-3" },
        f.rows.map((r, i) => {
          const g = gradeFixedRcd(r);
          const lim = FIXED_RCD_LIMIT_MS[r.rcdType === "I" ? "I" : "II"];
          return e("div", { key: r.id, className: "border border-slate-200 border-l-4 rounded-lg p-3 space-y-3 " + edge(g) },
            e("div", { className: "grid grid-cols-2 sm:grid-cols-[6rem_6rem_1fr_auto] gap-2 items-end" },
              e("div", null, e("label", { className: lbl, htmlFor: "frb-" + r.id }, "Board"),
                e("input", { id: "frb-" + r.id, className: inp, value: r.board, placeholder: "MSB", onChange: ev => setRow(r.id, { board: ev.target.value }) })),
              e("div", null, e("label", { className: lbl, htmlFor: "frc-" + r.id }, "Circuit"),
                e("input", { id: "frc-" + r.id, className: inp + " font-mono", value: r.circuit, placeholder: "21", onChange: ev => setRow(r.id, { circuit: ev.target.value }) })),
              e("div", { className: "col-span-2 sm:col-span-1 min-w-0" }, e("label", { className: lbl, htmlFor: "frl-" + r.id }, "Location"),
                e("input", { id: "frl-" + r.id, className: inp, value: r.location, placeholder: "Office power", onChange: ev => setRow(r.id, { location: ev.target.value }) })),
              e("span", { className: pillCls(g) + " justify-self-start sm:mb-2" }, FIXED_RCD_LABEL[g])),
            e("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 items-end" },
              e("div", { className: "col-span-2 sm:col-span-1" }, e("label", { className: lbl, htmlFor: "frm-" + r.id }, "Test"),
                e("select", { id: "frm-" + r.id, className: inp, value: r.method, onChange: ev => setRow(r.id, { method: ev.target.value }) },
                  FIXED_RCD_METHODS.map(m => e("option", { key: m.value, value: m.value }, m.label)))),
              r.method === "time" && e(React.Fragment, null,
                e("div", { className: "col-span-2 sm:col-span-1" }, e("label", { className: lbl, htmlFor: "frt-" + r.id }, "Type"),
                  e("select", { id: "frt-" + r.id, className: inp, value: r.rcdType, onChange: ev => setRow(r.id, { rcdType: ev.target.value }) },
                    e("option", { value: "II" }, "II · 30 mA · ≤ 300 ms"), e("option", { value: "I" }, "I · 10 mA · ≤ 40 ms"))),
                e("div", null, e("label", { className: lbl, htmlFor: "fr0-" + r.id }, "1× 0° (ms)"),
                  e("input", { id: "fr0-" + r.id, className: inp + " font-mono", inputMode: "decimal", value: r.t0, disabled: r.noTrip, placeholder: "< " + lim,
                    onChange: ev => setRow(r.id, { t0: ev.target.value.replace(/[^0-9.]/g, "") }) })),
                e("div", null, e("label", { className: lbl, htmlFor: "fr1-" + r.id }, "1× 180° (ms)"),
                  e("input", { id: "fr1-" + r.id, className: inp + " font-mono", inputMode: "decimal", value: r.t180, disabled: r.noTrip, placeholder: "< " + lim,
                    onChange: ev => setRow(r.id, { t180: ev.target.value.replace(/[^0-9.]/g, "") }) }))),
              r.method === "push" && e("div", { className: "col-span-2 sm:col-span-3" }, e("label", { className: lbl, htmlFor: "frp-" + r.id }, "Push-button at the board"),
                e("select", { id: "frp-" + r.id, className: inp, value: r.manual, onChange: ev => setRow(r.id, { manual: ev.target.value }) },
                  e("option", { value: "" }, "—"), e("option", { value: "pass" }, "Tripped (pass)"), e("option", { value: "fail" }, "Did not trip (fail)")))),
            e("div", { className: "flex flex-wrap items-end gap-3" },
              e("div", { className: "flex-1 min-w-[12rem]" }, e("label", { className: lbl, htmlFor: "frn-" + r.id }, r.method === "nt" ? "Reason not tested" : "Notes"),
                e("input", { id: "frn-" + r.id, className: inp, value: r.notes, placeholder: r.method === "nt" ? "e.g. Cool room - manager declined during trade" : "",
                  onChange: ev => setRow(r.id, { notes: ev.target.value }) })),
              r.method === "time" && e("label", { className: "inline-flex items-center gap-2 text-sm text-slate-600 py-2" },
                e("input", { type: "checkbox", className: "w-5 h-5", checked: !!r.noTrip, onChange: ev => setRow(r.id, { noTrip: ev.target.checked }) }), "Did not trip"),
              e("button", { type: "button", onClick: () => removeRow(r.id), className: "text-xs text-slate-400 hover:text-red-600 underline py-2" }, "Remove RCD " + (i + 1))),
            g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Failed. Tell the site contact now and refer to a licensed electrician. Don't reset and retest for a pass."));
        })),
      e("div", { className: "flex flex-wrap items-center gap-2" },
        e("button", { type: "button", onClick: addRow, className: "inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg" },
          e(Plus, { size: 16 }), " Add fixed RCD"),
        f.rows.length > 0 && e("button", { type: "button", onClick: copyLog, className: "border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-lg" }, "Copy RCD log"),
        f.rows.length > 0 && !confirmClear && e("button", { type: "button", onClick: () => setConfirmClear(true), className: "text-sm text-slate-400 hover:text-red-600 underline px-2" }, "Clear all"),
        confirmClear && e("span", { className: "inline-flex items-center gap-2 text-sm" }, "Remove every fixed RCD?",
          e("button", { type: "button", onClick: () => { setF({ rows: [] }); setConfirmClear(false); }, className: "text-red-700 font-semibold underline" }, "Yes, clear"),
          e("button", { type: "button", onClick: () => setConfirmClear(false), className: "text-slate-600 underline" }, "Keep")),
        copied && e("span", { className: "text-sm text-emerald-700 font-medium", role: "status" }, copied)),
      e("p", { className: "text-xs text-slate-400" },
        "Each tested RCD is charged at $" + FIXED_RCD_PRICE.toFixed(2) + " on the estimate. The log prints on the certificate and the job record. Only test from power points; switchboard repairs or replacing a failed RCD is licensed electrical work.")));
}

// ---------------------------------------------------------------------------
// In-app certificate view
// ---------------------------------------------------------------------------
function FixedRcdReportSection({ job }) {
  const f = fixedRcdOf(job);
  if (!f.rows.length) return null;
  const s = fixedRcdSummary(job);
  const e = React.createElement;
  const badge = g => g === "pass" || g === "fail" ? e(ResultBadge, { result: g }) :
    e("span", { className: "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold " + (g === "nt" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500") }, FIXED_RCD_LABEL[g]);
  return e("div", { className: "mb-6" },
    e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Fixed RCD (Safety Switch) Test Log"),
    e("p", { className: "text-xs text-slate-500 mb-3" },
      `1× rated current (Type II 30 mA, Type I 10 mA) at 0° and 180° from a socket outlet. Instrument: ${[f.instrument, f.serial && "s/n " + f.serial, f.calDate && "cal. " + formatDisplayDate(f.calDate)].filter(Boolean).join(", ")}. ${s.pass} passed, ${s.fail} failed${s.nt ? ", " + s.nt + " not tested" : ""} of ${s.total}.`),
    e("div", { className: "overflow-x-auto" },
      e("table", { className: "w-full text-xs border-collapse" },
        e("thead", null, e("tr", { className: "text-left border-b-2 border-slate-300" },
          ["Board", "Circuit", "Location", "Type", "1× 0° (ms)", "1× 180° (ms)", "Result"].map(h => e("th", { key: h, className: "py-2 pr-2 whitespace-nowrap" }, h)))),
        e("tbody", null, f.rows.map(r => {
          const v = fixedRcdReadings(r);
          return e("tr", { key: r.id, className: "border-b border-slate-100" },
            e("td", { className: "py-1.5 pr-2" }, r.board || "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, r.circuit || "—"),
            e("td", { className: "py-1.5 pr-2" }, r.location || "—"),
            e("td", { className: "py-1.5 pr-2 whitespace-nowrap" }, r.method === "time" ? "Type " + (r.rcdType === "I" ? "I" : "II") + " · " + fixedRcdMa(r) + " mA" : "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, v.t0 || "—"),
            e("td", { className: "py-1.5 pr-2 font-mono" }, v.t180 || "—"),
            e("td", { className: "py-1.5 pr-2" }, badge(gradeFixedRcd(r))));
        })))),
    e("p", { className: "text-[11px] text-slate-400 mt-1" }, "Mt = manual push-button test. NT = not tested."));
}

// ======================================================================
// 21-item-checks.js
// Guided testing: what each item still needs, class-aware hints, reading
// sanity checks, the visual checklist, fail handling, on-site repairs
// (plug tops 10 A / 15 A) and the "is this job ready to certify?" gate.
// ======================================================================
//
// Items created before this version (no checksVersion) keep the old rules,
// so saved jobs don't suddenly turn Pending.

const CHECKS_VERSION = 2;

const VISUAL_CHECKS = [
  { k: "cord", label: "Cord & sheath" },
  { k: "plug", label: "Plug & pins" },
  { k: "grip", label: "Cord grip" },
  { k: "casing", label: "Casing & guards" },
  { k: "label", label: "Markings & label" },
];

const FAULT_PRESETS = [
  "Damaged plug top",
  "Bent or loose plug pins",
  "Cord sheath cut or damaged",
  "Cord grip failed - inner cores exposed",
  "Damaged casing or guard",
  "Earth bond over limit",
  "Insulation resistance under limit",
  "Leakage current over limit",
  "Polarity incorrect",
  "RCD did not trip / tripped too slowly",
  "Compliance label missing or illegible",
];

const REPAIR_TYPES = [
  { value: "", label: "No repair" },
  { value: "plug", label: "Plug top replaced" },
  { value: "socket", label: "Extension socket replaced" },
  { value: "cord", label: "Flexible cord replaced" },
];

// Fields that live only in the apps (no tt_items column). They travel to the
// server as job.itemExtras, keyed by the item's permanent qrId.
const ITEM_EXTRA_FIELDS = ["checksVersion", "medical", "saleUntested", "visualChecks", "polarity", "cordLength", "faultDescription",
  "repairType", "plugRating", "repairDetails", "removedFromService", "followUp"];

function itemExtrasFor(items) {
  const out = {};
  (items || []).forEach(it => {
    if (!it.qrId) return;
    const x = {};
    ITEM_EXTRA_FIELDS.forEach(k => { if (it[k] !== undefined && it[k] !== "" && it[k] !== false) x[k] = it[k]; });
    if (Object.keys(x).length) out[it.qrId] = x;
  });
  return out;
}
function applyItemExtras(items, extras) {
  if (!extras || typeof extras !== "object") return items;
  return items.map(it => (it.qrId && extras[it.qrId] ? Object.assign({}, it, extras[it.qrId]) : it));
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------
function usesGuidedChecks(it) { return !!it && (it.checksVersion || 0) >= CHECKS_VERSION; }
function hasReading(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }
function readingNum(v) { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }

// "OL", "open", ">" and the like: the tester saw no earth path at all.
function earthOpen(v) {
  return hasReading(v) && /^(ol|o\/l|o\.l|open|inf|infinity|∞|>|no\b|nr\b|n\/r|none)/i.test(String(v).trim());
}

function isLeadItem(it) {
  return /\b(extension|ext\.? lead|lead|power ?board|powerboard|cord ?set|cable reel|cable drum|reel|drum|piggy ?back|adaptor|adapter|epod|outlet device|double adaptor)\b/i
    .test((it.description || "") + " " + (it.makeModel || ""));
}

// Equipment with surge protection or switch-mode supplies: a 500 V insulation
// test can falsely fail it, so 250 V or a leakage test is the right method.
function likelySurgeProtected(it) {
  return /\b(surge|power ?board|powerboard|ups\b|uninterruptible|computer|desktop|pc\b|server|laptop|monitor|screen|printer|photocopier|copier|scanner|router|modem|network switch|television|\btv\b|set top|charger|power supply|led driver|eftpos|pos terminal|cash register)\b/i
    .test((it.description || "") + " " + (it.makeModel || ""));
}

// ---------------------------------------------------------------------------
// What an item still needs
// ---------------------------------------------------------------------------
function visualFailed(it) {
  const vc = it.visualChecks || {};
  return it.visual === "fail" || VISUAL_CHECKS.some(c => vc[c.k] === "fail");
}

function missingReadings(it) {
  if (!usesGuidedChecks(it) || isUnusedItem(it)) return [];
  if (it.medical || it.saleUntested) return []; // referred / sold untested: not graded
  if (visualFailed(it)) return []; // stop at the visual: no electrical tests on a damaged item
  const need = [];
  const vc = it.visualChecks || {};
  if (VISUAL_CHECKS.some(c => vc[c.k] !== "ok")) need.push("visual checklist");
  const cls = it.equipmentClass;
  if (cls === "I" && !hasReading(it.earthContinuity)) need.push("earth bond");
  if ((cls === "I" || cls === "II") && !hasReading(it.insulationResistance) && !hasReading(it.leakageCurrent)) need.push("insulation or leakage");
  if (isLeadItem(it) && !it.polarity) need.push("polarity");
  if (it.itemType === "rcd" && (it.rcdTest || "n/a") === "n/a") need.push("RCD push-button test");
  if (it.itemType === "rcd" && !it.rcdTripTestEnabled) need.push("RCD trip test");
  if (it.rcdTripTestEnabled) {
    if (it.rcdTestMode === "ramp" ? !hasReading(it.rcdMeasuredTripCurrentMa) : !hasReading(it.rcdMeasuredTripTimeMs)) need.push("RCD trip reading");
  }
  if (it.repairType === "plug" && !it.plugRating) need.push("plug rating (10 A or 15 A)");
  if (it.repairType === "socket" && !it.plugRating) need.push("socket rating (10 A or 15 A)");
  return need;
}

// "pending" | "pass" | "fail"
function itemStatus(it) {
  if (!it) return "pending";
  if (it.medical) return "referred";
  if (it.saleUntested) return "untested";
  if (it.overrideResult) return it.overallResult === "fail" ? "fail" : "pass";
  if (it.overallResult === "fail") return "fail";
  return missingReadings(it).length ? "pending" : "pass";
}

// A fail is only finished once the reason is written down and the item is
// tagged out (or repaired and retested to a pass).
function failNeeds(it) {
  if (!usesGuidedChecks(it) || itemStatus(it) !== "fail") return [];
  const need = [];
  if (!hasReading(it.faultDescription)) need.push("fault description");
  if (!it.removedFromService) need.push("confirm Danger tag fitted and removed from service");
  return need;
}

function itemIssues(it) {
  return itemStatus(it) === "pending" ? missingReadings(it) : failNeeds(it);
}

// Non-blocking things worth a second look.
function itemWarnings(it) {
  const w = [];
  if (!usesGuidedChecks(it)) return w;
  const earth = readingNum(it.earthContinuity);
  if (it.equipmentClass === "I" && hasReading(it.earthContinuity) && !earthOpen(it.earthContinuity)) {
    if (earth === 0) w.push("Earth bond of exactly 0.00 Ω is unusual. Were the test leads nulled against the tester's earth pin?");
    if (earth !== null && earth >= 10 && !/[.,]/.test(String(it.earthContinuity))) w.push("Earth bond of " + it.earthContinuity + " Ω. Did you mean 0." + String(it.earthContinuity).replace(/\D/g, "") + "? Check the reading.");
    const len = readingNum(it.cordLength);
    if (isLeadItem(it) && len && earth !== null && earth > 0.5) {
      const expected = len * 0.0121; // 1.5 mm² copper, about 12.1 mΩ per metre
      if (earth > expected * 3 + 0.2) w.push("A " + len + " m lead should read about " + expected.toFixed(2) + " Ω on the earth (1.5 mm² cord). " + it.earthContinuity + " Ω points to a poor connection at the plug or socket, not cord length.");
    }
  }
  const ins = readingNum(it.insulationResistance);
  if (ins !== null && ins > 0 && ins < 1 && !/</.test(String(it.insulationResistance))) w.push("Insulation under 1 MΩ fails. Check it isn't a 1.0 typed as 0.1.");
  if (it.rcdTripTestEnabled && it.rcdTestMode !== "ramp") {
    const t = readingNum(it.rcdMeasuredTripTimeMs);
    if (t !== null && t > 0 && t < 5) w.push("RCD trip under 5 ms is faster than an RCD can open. Check the reading.");
  }
  if (likelySurgeProtected(it) && String(it.insulationTestVoltage || "500") === "500") {
    w.push("This looks like surge-protected or electronic gear. A 500 V insulation test can falsely fail it: use 250 V or the leakage test.");
  }
  return w;
}

// ---------------------------------------------------------------------------
// Job readiness: blocking problems stop a certificate being issued.
// ---------------------------------------------------------------------------
function calibrationState(dateStr, testDate) {
  if (!dateStr) return "missing";
  const due = addMonths(dateStr, 12);
  if (due && testDate && due < testDate) return "overdue";
  return "ok";
}

function jobReadiness(job) {
  const blocking = [], warnings = [];
  gradedItems(job).forEach(it => {
    const label = (it.assetId || "Untagged") + (it.description ? " " + it.description : "");
    const need = itemIssues(it);
    if (need.length) blocking.push(label + ": " + need.join(", "));
    itemWarnings(it).forEach(m => warnings.push(label + ": " + m));
  });

  const f = fixedRcdOf(job);
  const seen = {};
  f.rows.forEach(r => {
    const label = "RCD " + [r.board, r.circuit && "circuit " + r.circuit].filter(Boolean).join(" ") + (r.location ? " (" + r.location + ")" : "");
    const g = gradeFixedRcd(r);
    if (g === "") blocking.push(label + ": " + (r.method === "push" ? "push-button result" : "0° and 180° trip times"));
    if (g === "nt" && !hasReading(r.notes)) blocking.push(label + ": reason it wasn't tested");
    const key = (r.board || "").trim().toLowerCase() + "|" + (r.circuit || "").trim().toLowerCase();
    if (r.circuit && seen[key]) warnings.push(label + ": circuit logged twice on the same board.");
    seen[key] = true;
    if (r.method === "time" && !r.noTrip) {
      [r.t0, r.t180].forEach(v => { const n = readingNum(v); if (n !== null && n > 0 && n < 5) warnings.push(label + ": trip under 5 ms, check the reading."); });
    }
  });

  emergencyLightsOf(job).rows.forEach(r => {
    if (gradeLight(r) === "") blocking.push("Light " + (r.fittingId || "") + (r.location ? " (" + r.location + ")" : "") + ": result");
  });

  const t = effectiveTester();
  const patCal = (f.rows.length && f.calDate) || t.testEquipmentCalibrationDate;
  const patState = calibrationState(patCal, job.testDate);
  if (patState === "overdue") blocking.push((t.testEquipment || "Tester") + " calibration is more than 12 months old (" + formatDisplayDate(patCal) + "). Get it recalibrated before issuing certificates.");
  if (patState === "missing") warnings.push("No calibration date for " + (t.testEquipment || "the tester") + ". Add it in Tester Defaults so it can be checked.");
  if (job.meggerEquipment && calibrationState(job.meggerCalibrationDate, job.testDate) === "overdue") {
    blocking.push(job.meggerEquipment + " calibration is more than 12 months old.");
  }
  return { blocking, warnings, ready: blocking.length === 0 };
}

// ---------------------------------------------------------------------------
// UI: the guidance row under each item
// ---------------------------------------------------------------------------
function ItemChecksRow({ item, job, onChange, parts, inputCls }) {
  const e = React.createElement;
  if (!usesGuidedChecks(item)) return null;
  if (item.medical || item.saleUntested) {
    return e("tr", { className: "border-b border-slate-100 bg-slate-50" }, e("td", null),
      e("td", { colSpan: 9, className: "py-2 px-2 text-xs" }, e(ServicesItemFlags, { item, job, onChange })));
  }
  const vc = item.visualChecks || {};
  const status = itemStatus(item);
  const missing = missingReadings(item);
  const fNeeds = failNeeds(item);
  const warnings = itemWarnings(item);
  const lead = isLeadItem(item);
  const setCheck = (k, v) => onChange({ visualChecks: Object.assign({}, vc, { [k]: vc[k] === v ? "" : v }) });
  const chip = (on, tone) => "px-2 py-1 rounded-md border text-xs font-semibold min-w-[2.25rem] " + (on
    ? (tone === "bad" ? "bg-red-600 border-red-600 text-white" : "bg-emerald-600 border-emerald-600 text-white")
    : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50");
  const lbl = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const plugParts = (parts || []).filter(p => p.active !== false && !p.consumable &&
    (item.repairType === "socket" ? /socket/i : /plug/i).test(p.name || "") &&
    (!item.plugRating || new RegExp("\\b" + item.plugRating + "\\s?A\\b", "i").test(p.name || "")));

  const tips = [];
  if (item.equipmentClass === "I" && !hasReading(item.earthContinuity) && !visualFailed(item)) {
    tips.push(e("div", { key: "c1", className: "flex flex-wrap items-center gap-2" },
      e("span", null, "Class I: check the rating plate for the ", e("strong", null, "⧈ double-insulated symbol"), " first. If it's there the item is Class II and there's no earth to bond."),
      e("button", { type: "button", onClick: () => onChange({ equipmentClass: "II", earthContinuity: "" }), className: "text-xs font-semibold underline text-blue-700" }, "It's Class II")));
  }
  if (item.equipmentClass === "I" && earthOpen(item.earthContinuity)) {
    tips.push(e("div", { key: "ol" },
      e("strong", { className: "text-red-700" }, "No earth reading. Before you fail it:"),
      e("ol", { className: "list-decimal pl-5 mt-1 space-y-0.5" },
        e("li", null, "Is it actually Class II? Look for the ⧈ symbol. ", e("button", { type: "button", onClick: () => onChange({ equipmentClass: "II", earthContinuity: "" }), className: "underline font-semibold text-blue-700" }, "Mark Class II")),
        e("li", null, "Clip on bare metal. Paint, powder coat and anodising insulate: try a screw head or the frame."),
        e("li", null, "Not every metal part is earthed. Try the motor housing or gearcase, not a bed or guard."),
        e("li", null, "Flex the cord along its length while testing to catch a broken earth core."),
        e("li", null, "Null the test leads against the tester's earth pin to rule out the lead."),
        e("li", null, "Still open on an earthed part: it's a fail. Danger tag it."))));
  }
  if (item.equipmentClass === "II" && !hasReading(item.insulationResistance) && !hasReading(item.leakageCurrent) && !visualFailed(item)) {
    tips.push(e("div", { key: "c2" }, "Class II: no earth bond. Test insulation (or leakage with the item running)."));
  }
  if (item.equipmentClass === "III") {
    tips.push(e("div", { key: "c3" }, "Class III (extra-low voltage): visual check only. Test the plug-pack or transformer that supplies it as its own item."));
  }
  if (likelySurgeProtected(item) && String(item.insulationTestVoltage || "500") === "500") {
    tips.push(e("div", { key: "mov", className: "flex flex-wrap items-center gap-2" },
      e("span", null, "Surge-protected or electronic: test insulation at 250 V, or use leakage."),
      e("button", { type: "button", onClick: () => onChange({ insulationTestVoltage: "250" }), className: "text-xs font-semibold underline text-blue-700" }, "Use 250 V")));
  }

  return e("tr", { className: "border-b border-slate-100 " + (status === "fail" ? "bg-red-50/40" : status === "pending" ? "bg-amber-50/40" : "bg-white") },
    e("td", null),
    e("td", { colSpan: 9, className: "py-2 px-2" },
      e("div", { className: "flex flex-col gap-2 text-xs text-slate-700" },
        e(ServicesItemFlags, { item, job, onChange }),
        // Visual checklist
        e("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1.5" },
          e("span", { className: "font-semibold text-slate-500 uppercase tracking-wide text-[10px]" }, "Visual"),
          VISUAL_CHECKS.map(c => e("span", { key: c.k, className: "inline-flex items-center gap-1" },
            e("span", { className: vc[c.k] === "fail" ? "text-red-700 font-semibold" : "" }, c.label),
            e("button", { type: "button", "aria-label": c.label + " OK", onClick: () => setCheck(c.k, "ok"), className: chip(vc[c.k] === "ok", "good") }, "✓"),
            e("button", { type: "button", "aria-label": c.label + " fail", onClick: () => setCheck(c.k, "fail"), className: chip(vc[c.k] === "fail", "bad") }, "✗"))),
          e("button", { type: "button", onClick: () => onChange({ visualChecks: VISUAL_CHECKS.reduce((o, c) => Object.assign(o, { [c.k]: "ok" }), {}) }),
            className: "text-xs font-semibold underline text-emerald-700" }, "All OK")),
        // Leads: polarity and length
        lead && e("div", { className: "flex flex-wrap items-end gap-3" },
          e("div", null, e("span", { className: lbl }, "Polarity / continuity"),
            e("div", { className: "flex gap-1" },
              e("button", { type: "button", onClick: () => onChange({ polarity: item.polarity === "pass" ? "" : "pass" }), className: chip(item.polarity === "pass", "good") }, "Pass"),
              e("button", { type: "button", onClick: () => onChange({ polarity: item.polarity === "fail" ? "" : "fail" }), className: chip(item.polarity === "fail", "bad") }, "Fail"))),
          e("div", { className: "w-24" }, e("label", { className: lbl, htmlFor: "len-" + item.id }, "Length (m)"),
            e("input", { id: "len-" + item.id, className: inputCls + " py-1 text-xs", inputMode: "decimal", value: item.cordLength || "", onChange: ev => onChange({ cordLength: ev.target.value }) }))),
        // Tips
        tips.length > 0 && e("div", { className: "bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-3 py-2 space-y-1.5" }, tips),
        warnings.filter(w => !/surge-protected/.test(w)).map((w, i) => e("div", { key: "w" + i, className: "bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-1.5" }, "⚠ " + w)),
        // Fail handling + repairs
        (status === "fail" || item.repairType) && e("div", { className: "border border-red-200 bg-white rounded-lg p-2.5 flex flex-col gap-2" },
          e("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" },
            e("div", null, e("label", { className: lbl, htmlFor: "fd-" + item.id }, "Fault found"),
              e("input", { id: "fd-" + item.id, list: "fault-presets", className: inputCls + " py-1 text-xs", value: item.faultDescription || "", placeholder: "e.g. Damaged plug top",
                onChange: ev => onChange({ faultDescription: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "rp-" + item.id }, "Repaired on site"),
              e("select", { id: "rp-" + item.id, className: inputCls + " py-1 text-xs", value: item.repairType || "",
                onChange: ev => onChange({ repairType: ev.target.value, plugRating: "", partId: "" }) },
                REPAIR_TYPES.map(r => e("option", { key: r.value, value: r.value }, r.label))))),
          (item.repairType === "plug" || item.repairType === "socket") && e("div", { className: "flex flex-col gap-1.5" },
            e("div", { className: "flex flex-wrap items-center gap-2" },
              e("span", { className: "font-semibold" }, item.repairType === "plug" ? "Plug top rating:" : "Socket rating:"),
              ["10", "15"].map(a => e("button", { key: a, type: "button", onClick: () => {
                  const match = (parts || []).filter(p => p.active !== false && !p.consumable && (item.repairType === "socket" ? /socket/i : /plug/i).test(p.name || "") && new RegExp("\\b" + a + "\\s?A\\b", "i").test(p.name || ""));
                  onChange({ plugRating: a, partId: match.length === 1 ? match[0].id : "",
                    repairDetails: (item.repairType === "plug" ? "Plug top" : "Extension socket") + " replaced (" + a + " A), retested" });
                }, className: chip(item.plugRating === a, "good") + " px-3" }, a + " A")),
              !item.plugRating && e("span", { className: "text-amber-700 font-semibold" }, "Pick 10 A or 15 A")),
            e("p", { className: "text-slate-500" }, "Match the original: a 15 A appliance has the wider earth pin and must get a 15 A plug. Never fit a 10 A plug to a 15 A appliance."),
            item.plugRating && e("div", { className: "max-w-sm" },
              e("label", { className: lbl, htmlFor: "pp-" + item.id }, "Part used"),
              e("select", { id: "pp-" + item.id, className: inputCls + " py-1 text-xs", value: item.partId || "", onChange: ev => onChange({ partId: ev.target.value }) },
                e("option", { value: "" }, plugParts.length ? "Choose the part" : "None in stock at " + item.plugRating + " A"),
                plugParts.map(p => e("option", { key: p.id, value: p.id }, p.name + (p.onHand <= 0 ? " (none in stock)" : "")))),
              !plugParts.length && e("p", { className: "text-amber-700 mt-0.5" }, "No " + item.plugRating + " A " + (item.repairType === "plug" ? "plug tops" : "sockets") + " in your parts list. Add them on the Parts screen.")),
            item.repairType && e("p", { className: "text-slate-600" }, "After the repair, re-tick the visual checks and retest: the readings you enter are the after-repair readings.")),
          item.repairType === "cord" && e("p", { className: "text-slate-600" }, "After replacing the cord, retest earth, insulation and polarity and enter the new readings."),
          status === "fail" && e("label", { className: "inline-flex items-center gap-2 font-semibold text-red-800" },
            e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.removedFromService, onChange: ev => onChange({ removedFromService: ev.target.checked }) }),
            "Danger tag fitted and item removed from service")),
        // Status line
        status === "pending" && missing.length > 0 && e("div", { className: "font-semibold text-amber-800" }, "Pending. Still needs: " + missing.join(", ")),
        status === "fail" && fNeeds.length > 0 && e("div", { className: "font-semibold text-red-800" }, "To finish this fail: " + fNeeds.join(", "))
      )));
}

// One shared list for the fault field's suggestions.
function FaultPresetList() {
  return React.createElement("datalist", { id: "fault-presets" }, FAULT_PRESETS.map(f => React.createElement("option", { key: f, value: f })));
}

// ---------------------------------------------------------------------------
// UI: readiness panels
// ---------------------------------------------------------------------------
function JobReadinessPanel({ job, compact }) {
  const e = React.createElement;
  const r = jobReadiness(job);
  if (!r.blocking.length && !r.warnings.length) return null;
  return e("div", { className: "rounded-xl border p-4 mb-4 text-sm " + (r.blocking.length ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200") },
    r.blocking.length > 0 && e("div", null,
      e("div", { className: "font-semibold text-amber-900 mb-1" }, "Not ready for a certificate (" + r.blocking.length + ")"),
      e("ul", { className: "list-disc pl-5 space-y-0.5 text-amber-900" }, r.blocking.slice(0, compact ? 8 : 100).map((m, i) => e("li", { key: i }, m))),
      compact && r.blocking.length > 8 && e("div", { className: "text-amber-800 mt-1" }, "and " + (r.blocking.length - 8) + " more")),
    r.warnings.length > 0 && e("div", { className: r.blocking.length ? "mt-3" : "" },
      e("div", { className: "font-semibold text-slate-700 mb-1" }, "Worth a second look"),
      e("ul", { className: "list-disc pl-5 space-y-0.5 text-slate-600" }, r.warnings.slice(0, compact ? 6 : 100).map((m, i) => e("li", { key: i }, m)))));
}

// Certificate HTML gets a DRAFT banner if it's exported while not ready
// (ZIP export, folder save), so an unfinished one can't pass as issued.
function draftBannerHtml(job) {
  const r = jobReadiness(job);
  if (r.ready) return "";
  return `<div style="border:2px solid #b45309;background:#fffbeb;color:#92400e;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px">
    <strong style="font-size:15px">DRAFT &mdash; not a valid certificate.</strong> Testing isn't finished:
    <ul style="margin:6px 0 0;padding-left:18px">${r.blocking.slice(0, 12).map(m => "<li>" + escapeHtml(m) + "</li>").join("")}</ul>
  </div>`;
}

// ======================================================================
// 22-services.js
// Extra services a test and tag technician can do in Victoria without an
// electrical licence: hire equipment (before each hire), second-hand goods
// for sale (AS/NZS 5761), construction sites (AS/NZS 3012), medical items
// referred to biomedical (AS/NZS 3551), and emergency / exit light testing
// (AS/NZS 2293.2 - testing only; repairs to fixed fittings are electrical work).
// ======================================================================

const SITE_MODES = [
  { value: "standard", label: "Workplace", sub: "AS/NZS 3760:2022" },
  { value: "construction", label: "Construction site", sub: "AS/NZS 3760 + AS/NZS 3012, 3-monthly" },
  { value: "hire", label: "Hire equipment", sub: "Tested before each hire" },
  { value: "resale", label: "Second-hand for sale", sub: "AS/NZS 5761 before sale" },
];
const EMERGENCY_LIGHT_PRICE = 10.00; // per fitting, 6-monthly test

function siteModeOf(job) {
  const m = job && job.siteMode;
  return SITE_MODES.some(x => x.value === m) ? m : (job && job.environment === "construction" ? "construction" : "standard");
}

function certificateTitle(job) {
  const m = siteModeOf(job);
  if (m === "resale") return "Second-hand Equipment Safety Test (AS/NZS 5761)";
  if (m === "hire") return "Hire Equipment Test &amp; Tag Certificate";
  if (m === "construction") return "Construction Site Test &amp; Tag Certificate";
  return "Test &amp; Tag Compliance Certificate";
}

// What the certificate says under "Next Test Due".
function nextTestText(job) {
  const m = siteModeOf(job);
  if (m === "hire") return "Before each hire";
  if (m === "resale") return "Not applicable (tested prior to sale)";
  return formatDisplayDate(addMonths(job.testDate, job.retestMonths));
}

function standardsLine(job) {
  const m = siteModeOf(job);
  if (m === "resale") return "AS/NZS 5761 (in-service safety inspection and testing of second-hand equipment prior to sale)";
  if (m === "construction") return "AS/NZS 3760:2022 and AS/NZS 3012 (construction and demolition sites)";
  if (m === "hire") return "AS/NZS 3760:2022 (hire equipment, inspected and tested before each hire)";
  return "AS/NZS 3760:2022";
}

// ---------------------------------------------------------------------------
// Items that are not graded: medical (referred) and resale items sold untested
// ---------------------------------------------------------------------------
function isReferredItem(it) { return !!(it && it.medical); }
function isUntestedSaleItem(it, job) { return !!(it && it.saleUntested) && siteModeOf(job || {}) === "resale"; }
function referredItems(job) { return certItems(job).filter(isReferredItem); }
function untestedSaleItems(job) { return certItems(job).filter(it => !isReferredItem(it) && isUntestedSaleItem(it, job)); }
function gradedItems(job) { return certItems(job).filter(it => !isReferredItem(it) && !isUntestedSaleItem(it, job)); }

function ServicesItemFlags({ item, job, onChange }) {
  const e = React.createElement;
  const resale = siteModeOf(job) === "resale";
  return e("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1" },
    e("label", { className: "inline-flex items-center gap-1.5 text-slate-600" },
      e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.medical, onChange: ev => onChange({ medical: ev.target.checked }) }),
      "Medical device: refer to biomedical, don't test"),
    resale && e("label", { className: "inline-flex items-center gap-1.5 text-slate-600" },
      e("input", { type: "checkbox", className: "w-4 h-4", checked: !!item.saleUntested, onChange: ev => onChange({ saleUntested: ev.target.checked }) }),
      "Not tested: sell labelled \"used\""),
    item.medical && e("span", { className: "text-slate-500" }, "Listed on the certificate as referred under AS/NZS 3551. Visual-only defects can still be noted."));
}

// ---------------------------------------------------------------------------
// Emergency & exit lighting log (AS/NZS 2293.2, 6-monthly discharge test)
// ---------------------------------------------------------------------------
const EL_TYPES = [
  { value: "exit", label: "Exit sign" },
  { value: "emergency", label: "Emergency light" },
  { value: "combined", label: "Combined exit / emergency" },
];
function emergencyLightsOf(job) {
  const x = job && job.emergencyLights;
  return { rows: x && Array.isArray(x.rows) ? x.rows : [] };
}
function blankLightRow(prev) {
  return { id: uuid(), location: "", fittingId: "", type: prev ? prev.type || "exit" : "exit", minutes: "", result: "", notes: "" };
}
// "pass" | "fail" | "" ; a pass needs the light to have stayed on for 90 min.
function gradeLight(r) {
  if (!r) return "";
  if (r.result === "fail") return "fail";
  if (r.result === "pass") {
    const m = readingNum(r.minutes);
    return m !== null && m < 90 ? "fail" : "pass";
  }
  return "";
}
function lightsSummary(job) {
  const g = emergencyLightsOf(job).rows.map(gradeLight);
  return { total: g.length, pass: g.filter(x => x === "pass").length, fail: g.filter(x => x === "fail").length, pending: g.filter(x => x === "").length };
}
function lightsTotalPrice(job) { const s = lightsSummary(job); return (s.pass + s.fail) * EMERGENCY_LIGHT_PRICE; }

function EmergencyLightsPanel({ job, onChange }) {
  const e = React.createElement;
  const rows = emergencyLightsOf(job).rows;
  const [open, setOpen] = useState(rows.length > 0);
  const s = lightsSummary(job);
  const inp = "w-full border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lbl = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const set = list => onChange({ rows: list });
  const setRow = (id, p) => set(rows.map(r => (r.id === id ? Object.assign({}, r, p) : r)));
  const chip = (on, bad) => "px-3 py-2 rounded-lg border text-sm font-semibold " + (on ? (bad ? "bg-red-600 border-red-600 text-white" : "bg-emerald-600 border-emerald-600 text-white") : "bg-white border-slate-300 text-slate-600");
  return e("div", { className: "bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden" },
    e("button", { type: "button", onClick: () => setOpen(o => !o), "aria-expanded": open, className: "w-full flex items-center justify-between gap-3 p-4 md:px-6 text-left hover:bg-slate-50" },
      e("span", null,
        e("span", { className: "block font-semibold text-slate-900" }, "Emergency & exit lights"),
        e("span", { className: "block text-xs text-slate-500 mt-0.5" }, s.total ? `${s.total} logged · ${s.pass} pass · ${s.fail} fail${s.pending ? " · " + s.pending + " to finish" : ""}` : "6-monthly discharge test, AS/NZS 2293.2")),
      e("span", { className: "text-xs text-slate-400" }, open ? "Hide" : "Show")),
    open && e("div", { className: "px-4 md:px-6 pb-5 space-y-3" },
      e("details", { className: "text-sm bg-slate-50 border border-slate-200 rounded-lg p-3" },
        e("summary", { className: "font-semibold text-slate-700 cursor-pointer" }, "How to run the 6-monthly test"),
        e("ol", { className: "list-decimal pl-5 mt-2 space-y-1 text-slate-600" },
          e("li", null, "Check every fitting is lit and its charge indicator is on before you start."),
          e("li", null, "Switch to battery with the test switch (or the circuit's test key) and start a 90-minute timer."),
          e("li", null, "At 90 minutes walk the site: every fitting must still be lit. Note any that dimmed or went out and when."),
          e("li", null, "Restore mains and check the charge indicators come back on."),
          e("li", null, "Failed fittings go to a licensed electrician. Replacing batteries, lamps or fittings in fixed wiring is electrical work."))),
      rows.map((r, i) => {
        const g = gradeLight(r);
        return e("div", { key: r.id, className: "border border-slate-200 border-l-4 rounded-lg p-3 space-y-2 " + (g === "pass" ? "border-l-emerald-500" : g === "fail" ? "border-l-red-500" : "border-l-slate-300") },
          e("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" },
            e("div", { className: "col-span-2" }, e("label", { className: lbl, htmlFor: "ell-" + r.id }, "Location"),
              e("input", { id: "ell-" + r.id, className: inp, value: r.location, placeholder: "e.g. Rear exit, kitchen", onChange: ev => setRow(r.id, { location: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "eli-" + r.id }, "Fitting ID"),
              e("input", { id: "eli-" + r.id, className: inp, value: r.fittingId, placeholder: "EL-01", onChange: ev => setRow(r.id, { fittingId: ev.target.value }) })),
            e("div", null, e("label", { className: lbl, htmlFor: "elt-" + r.id }, "Type"),
              e("select", { id: "elt-" + r.id, className: inp, value: r.type, onChange: ev => setRow(r.id, { type: ev.target.value }) }, EL_TYPES.map(t => e("option", { key: t.value, value: t.value }, t.label))))),
          e("div", { className: "flex flex-wrap items-end gap-2" },
            e("div", { className: "w-28" }, e("label", { className: lbl, htmlFor: "elm-" + r.id }, "Lasted (min)"),
              e("input", { id: "elm-" + r.id, className: inp + " font-mono", inputMode: "numeric", value: r.minutes, placeholder: "90", onChange: ev => setRow(r.id, { minutes: ev.target.value.replace(/[^0-9]/g, "") }) })),
            e("button", { type: "button", onClick: () => setRow(r.id, { result: r.result === "pass" ? "" : "pass" }), className: chip(r.result === "pass") }, "Stayed lit"),
            e("button", { type: "button", onClick: () => setRow(r.id, { result: r.result === "fail" ? "" : "fail" }), className: chip(r.result === "fail", true) }, "Failed"),
            e("div", { className: "flex-1 min-w-[10rem]" }, e("label", { className: lbl, htmlFor: "eln-" + r.id }, "Notes"),
              e("input", { id: "eln-" + r.id, className: inp, value: r.notes, placeholder: g === "fail" ? "e.g. Went out at 40 min" : "", onChange: ev => setRow(r.id, { notes: ev.target.value }) })),
            e("button", { type: "button", onClick: () => set(rows.filter(x => x.id !== r.id)), className: "text-xs text-slate-400 hover:text-red-600 underline py-2" }, "Remove " + (i + 1))),
          r.result === "pass" && g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Under 90 minutes is a fail, even if it's still lit."),
          g === "fail" && e("p", { className: "text-xs font-semibold text-red-700" }, "Refer to a licensed electrician for repair."));
      }),
      e("div", { className: "flex flex-wrap gap-2 items-center" },
        e("button", { type: "button", onClick: () => set(rows.concat([blankLightRow(rows[rows.length - 1])])), className: "inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg" }, e(Plus, { size: 16 }), " Add fitting"),
        e("span", { className: "text-xs text-slate-400" }, "$" + EMERGENCY_LIGHT_PRICE.toFixed(2) + " per fitting on the estimate."))));
}

function lightsSectionHtml(job) {
  const rows = emergencyLightsOf(job).rows;
  if (!rows.length) return "";
  const s = lightsSummary(job);
  const failed = rows.filter(r => gradeLight(r) === "fail");
  const typeLabel = v => (EL_TYPES.find(t => t.value === v) || EL_TYPES[0]).label;
  return `
    <h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Emergency &amp; Exit Lighting Test Log</h2>
    <p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5">
      Six-monthly discharge test to AS/NZS 2293.2: each fitting run on battery and required to stay lit for at least 90 minutes.
      ${s.pass} passed, ${s.fail} failed of ${s.total}.
    </p>
    ${failed.length ? `<div class="callout"><h3>&#9888; Fittings requiring attention</h3><ul>${failed.map(r => `<li>${escapeHtml(r.fittingId || "Fitting")}${r.location ? " &mdash; " + escapeHtml(r.location) : ""}${r.notes ? ": " + escapeHtml(r.notes) : ""}. Refer to a licensed electrician.</li>`).join("")}</ul></div>` : ""}
    <table>
      <thead><tr><th>Fitting</th><th>Location</th><th>Type</th><th>Duration (min)</th><th>Result</th><th>Notes</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.fittingId) || "&mdash;"}</td><td>${escapeHtml(r.location) || "&mdash;"}</td><td>${typeLabel(r.type)}</td><td style="font-family:monospace">${escapeHtml(r.minutes) || "&mdash;"}</td><td>${fixedRcdBadgeHtml(gradeLight(r))}</td><td>${escapeHtml(r.notes) || ""}</td></tr>`).join("")}</tbody>
    </table>`;
}

// Medical referrals and resale "used, untested" lists for the certificate.
function servicesItemSectionsHtml(job) {
  let out = "";
  const med = referredItems(job);
  if (med.length) {
    out += `<h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Medical Equipment Referred</h2>
      <p style="font-size:12px;color:#475569;margin:0 0 10px">Not tested under this certificate. Medical electrical equipment is managed under AS/NZS 3551; refer these items to a biomedical engineering service.</p>
      <table><thead><tr><th>Tag Number</th><th>Description</th><th>Location</th><th>Notes</th></tr></thead><tbody>
      ${med.map(i => `<tr><td>${escapeHtml(i.assetId) || "&mdash;"}</td><td>${escapeHtml(i.description) || "&mdash;"}</td><td>${escapeHtml(i.location) || "&mdash;"}</td><td>${escapeHtml(i.faultDescription || i.notes) || ""}</td></tr>`).join("")}
      </tbody></table>`;
  }
  const un = untestedSaleItems(job);
  if (un.length) {
    out += `<h2 style="font-size:16px;margin:8px 0 6px;color:#0f172a">Not Safety Tested &mdash; to be sold as "used"</h2>
      <p style="font-size:12px;color:#475569;margin:0 0 10px">Under Victorian rules these items must be labelled as second-hand ("used") and sold with information stating they have not been safety tested.</p>
      <table><thead><tr><th>Tag Number</th><th>Description</th><th>Notes</th></tr></thead><tbody>
      ${un.map(i => `<tr><td>${escapeHtml(i.assetId) || "&mdash;"}</td><td>${escapeHtml(i.description) || "&mdash;"}</td><td>${escapeHtml(i.notes) || ""}</td></tr>`).join("")}
      </tbody></table>`;
  }
  return out;
}

// In-app certificate view: the same extra sections, as React.
function ServicesReportSections({ job }) {
  const e = React.createElement;
  const rows = emergencyLightsOf(job).rows;
  const med = referredItems(job), un = untestedSaleItems(job);
  if (!rows.length && !med.length && !un.length) return null;
  const tbl = (heads, body) => e("div", { className: "overflow-x-auto mb-2" }, e("table", { className: "w-full text-xs border-collapse" },
    e("thead", null, e("tr", { className: "text-left border-b-2 border-slate-300" }, heads.map(h => e("th", { key: h, className: "py-2 pr-2" }, h)))),
    e("tbody", null, body)));
  return e("div", { className: "mb-6 space-y-4" },
    rows.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Emergency & Exit Lighting Test Log"),
      e("p", { className: "text-xs text-slate-500 mb-2" }, "AS/NZS 2293.2 six-monthly discharge test, 90 minutes minimum."),
      tbl(["Fitting", "Location", "Duration", "Result"], rows.map(r => e("tr", { key: r.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, r.fittingId || "—"), e("td", { className: "py-1.5 pr-2" }, r.location || "—"),
        e("td", { className: "py-1.5 pr-2 font-mono" }, r.minutes ? r.minutes + " min" : "—"),
        e("td", { className: "py-1.5 pr-2" }, gradeLight(r) ? e(ResultBadge, { result: gradeLight(r) }) : e(ResultBadge, { result: "pending" })))))),
    med.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Medical equipment referred"),
      e("p", { className: "text-xs text-slate-500 mb-2" }, "Not tested here. Refer to biomedical engineering (AS/NZS 3551)."),
      tbl(["Tag", "Description", "Location"], med.map(i => e("tr", { key: i.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, i.assetId || "—"), e("td", { className: "py-1.5 pr-2" }, i.description || "—"), e("td", { className: "py-1.5 pr-2" }, i.location || "—"))))),
    un.length > 0 && e("div", null,
      e("h3", { className: "font-semibold text-slate-900 mb-1" }, "Not safety tested: sell labelled \"used\""),
      tbl(["Tag", "Description"], un.map(i => e("tr", { key: i.id, className: "border-b border-slate-100" },
        e("td", { className: "py-1.5 pr-2" }, i.assetId || "—"), e("td", { className: "py-1.5 pr-2" }, i.description || "—"))))));
}

// Site mode picker for the job form.
function SiteModePicker({ job, update }) {
  const e = React.createElement;
  const cur = siteModeOf(job);
  return e("div", { className: "mt-4" },
    e("div", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2" }, "Where is the equipment?"),
    e("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2" }, SITE_MODES.map(m => e("button", {
      key: m.value, type: "button",
      onClick: () => update(Object.assign({ siteMode: m.value }, m.value === "construction" ? { environment: "construction", retestMonths: 3 } : {})),
      className: "text-left px-3 py-2.5 rounded-lg border-2 " + (cur === m.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"),
    }, e("div", { className: "font-semibold text-sm " + (cur === m.value ? "text-blue-800" : "text-slate-700") }, m.label),
       e("div", { className: "text-[11px] text-slate-500" }, m.sub)))),
    cur === "construction" && e("p", { className: "text-xs text-slate-500 mt-2" }, "AS/NZS 3012: retest every 3 months with RGBY tags. All site equipment should be RCD protected; portable RCDs push-button tested by the user daily."),
    cur === "hire" && e("p", { className: "text-xs text-slate-500 mt-2" }, "Hire equipment is inspected and tested before each hire. The certificate shows \"Next test: before each hire\"."),
    cur === "resale" && e("p", { className: "text-xs text-slate-500 mt-2" }, "AS/NZS 5761: test before sale. Anything you don't test gets ticked \"Not tested\" and must be sold labelled \"used\" with a note that it hasn't been safety tested."));
}

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
    // Published rates on test-and-tag.html: $30 call-out, then per item.
    // 100+ items and contracts are negotiable, so no volume tier here.
    const PRICES = TT_PRICES;
    const callOut = PRICES.callOut;
    const chargeableStd = counts.standard;
    const volumeRate = PRICES.standard;
    const partsTotal = partsTotalFor(job.items, partsCat);
    const partsCount = job.items.filter(i => { const p = partById(partsCat, i.partId); return p && !p.consumable; }).length;
    const itemTotal = chargeableStd * volumeRate + counts.power_tool * PRICES.power_tool + counts.rcd * PRICES.rcd + counts.microwave * PRICES.microwave;
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
    }, /*#__PURE__*/React.createElement("span", null, "Call-out: ", /*#__PURE__*/React.createElement("strong", null, "$" + callOut.toFixed(2))), chargeableStd > 0 && /*#__PURE__*/React.createElement("span", null, "Standard ×", chargeableStd, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (chargeableStd * volumeRate).toFixed(2))), partsCount > 0 && /*#__PURE__*/React.createElement("span", null, "Parts ×", partsCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", partsTotal.toFixed(2))), counts.power_tool > 0 && /*#__PURE__*/React.createElement("span", null, "Power tools ×", counts.power_tool, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.power_tool * PRICES.power_tool).toFixed(2))), counts.rcd > 0 && /*#__PURE__*/React.createElement("span", null, "RCD ×", counts.rcd, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.rcd * PRICES.rcd).toFixed(2))), fixedRcdCount > 0 && /*#__PURE__*/React.createElement("span", null, "Fixed RCDs ×", fixedRcdCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", fixedRcdTotal.toFixed(2))), lightsCount > 0 && /*#__PURE__*/React.createElement("span", null, "Emergency lights ×", lightsCount, ": ", /*#__PURE__*/React.createElement("strong", null, "$", lightsTotal.toFixed(2))), counts.microwave > 0 && /*#__PURE__*/React.createElement("span", null, "Microwave ×", counts.microwave, ": ", /*#__PURE__*/React.createElement("strong", null, "$", (counts.microwave * PRICES.microwave).toFixed(2))), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-blue-700"
    }, "Total: $", estimatedTotal.toFixed(2)))), totalItems >= 100 && /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-amber-600 mt-1"
    }, "100+ items: bulk rates are negotiable. This estimate is at the standard per-item rates."));
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

// ======================================================================
// 18-pdf.js
// Rendering certificates and reports to PDF
// ======================================================================
//
// The certificate template uses flexbox, which the pure-PHP PDF libraries
// (Dompdf and friends) can't render — the layout collapses. So the PDF is
// produced here in the browser, where the layout already works, and the
// finished file is either downloaded or posted to the server for emailing.
//
// jsPDF and html2canvas are served from our own site rather than a CDN,
// because Edge's tracking prevention blocks CDN scripts.

const PDF_PAGE = { width: 210, height: 297 }; // A4 in mm

function pdfLibsReady() {
  return typeof window !== "undefined" &&
         window.jspdf && window.jspdf.jsPDF &&
         typeof window.html2canvas === "function";
}

/**
 * Renders a full HTML document to a multi-page A4 PDF.
 *
 * The HTML is written into an offscreen iframe so it lays out exactly as it
 * does on screen (including flexbox and the embedded logo), then captured
 * and sliced across A4 pages.
 *
 * Returns a jsPDF instance.
 */
async function renderHtmlToPdf(html, opts) {
  if (!pdfLibsReady()) {
    throw new Error("The PDF library didn't load. Reload the page and try again.");
  }
  const options = opts || {};
  const scale = options.scale || 2; // 2x for legible text

  // Offscreen iframe, A4 width at 96dpi so the layout matches the paper.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden;";
  document.body.appendChild(frame);

  try {
    const doc = frame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    // Let images (the logo, any site photos, the signature) finish loading,
    // or the capture catches blank boxes.
    await new Promise((resolve) => {
      const imgs = Array.from(doc.images || []);
      let pending = imgs.filter((i) => !i.complete).length;
      const done = () => { if (--pending <= 0) resolve(); };
      if (pending === 0) { setTimeout(resolve, 120); return; }
      imgs.forEach((i) => {
        if (i.complete) return;
        i.addEventListener("load", done, { once: true });
        i.addEventListener("error", done, { once: true });
      });
      // Never hang on a broken image.
      setTimeout(resolve, 4000);
    });

    const target = doc.body;
    const canvas = await window.html2canvas(target, {
      scale: scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 794,
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    const imgWidth = PDF_PAGE.width;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let remaining = imgHeight;
    let position = 0;
    const data = canvas.toDataURL("image/jpeg", 0.92);

    pdf.addImage(data, "JPEG", 0, position, imgWidth, imgHeight);
    remaining -= PDF_PAGE.height;

    // Slice onto further pages by shifting the same image upward.
    while (remaining > 0) {
      position -= PDF_PAGE.height;
      pdf.addPage();
      pdf.addImage(data, "JPEG", 0, position, imgWidth, imgHeight);
      remaining -= PDF_PAGE.height;
    }

    return pdf;
  } finally {
    document.body.removeChild(frame);
  }
}

/** Builds the right document for a job and returns { html, filename, label }. */
function documentForJob(job, kind) {
  const certNo = job.certNumber ? job.certNumber + "-" : "";
  const client = String(job.clientName || "client")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "client";

  if (kind === "record") {
    return { html: buildRecordHTML(job), filename: "record-" + certNo + client, label: "Job record" };
  }
  if (kind === "generator") {
    return {
      html: buildGeneratorReportHTML(job),
      filename: "generator-inspection-" + certNo + client,
      label: "Generator inspection report",
    };
  }
  return {
    html: buildCertificateHTML(job),
    filename: "certificate-" + certNo + client,
    label: "Compliance certificate",
  };
}

/** Downloads a job document as a PDF. */
async function downloadJobPdf(job, kind) {
  const doc = documentForJob(job, kind);
  const pdf = await renderHtmlToPdf(doc.html);
  pdf.save(doc.filename + ".pdf");
}

/** Returns the PDF as a bare base64 string, for posting to the server. */
async function jobPdfBase64(job, kind) {
  const doc = documentForJob(job, kind);
  const pdf = await renderHtmlToPdf(doc.html);
  const uri = pdf.output("datauristring");
  return { base64: uri.slice(uri.indexOf(",") + 1), filename: doc.filename + ".pdf" };
}

// ======================================================================
// 16-report-view.js
// Certificate / report view
// ======================================================================

function ReportView({
  job,
  onBack
}) {
  const certCounts = certificateCounts(job);
  const shownItems = gradedItems(job);
  const passCount = certCounts.pass;
  const failCount = certCounts.fail;
  const passRate = certCounts.rate;
  const nextTestDate = addMonths(job.testDate, job.retestMonths);
  const failedItems = shownItems.filter(i => i.overallResult === "fail");
  // A certificate can't be issued (PDF, email, download, print) until
  // every item and fixed RCD is finished and the tester is in calibration.
  const readiness = jobReadiness(job);
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto p-4 md:p-8"
  }, !readiness.ready && /*#__PURE__*/React.createElement("div", {
    className: "print:hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-100 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 mb-3 text-sm font-semibold"
  }, "Draft. Finish the items below to issue the certificate. The PDF, email and certificate download unlock once everything is done."), /*#__PURE__*/React.createElement(JobReadinessPanel, {
    job: job
  })), readiness.ready && /*#__PURE__*/React.createElement(JobReadinessPanel, {
    job: job,
    compact: true
  }), /*#__PURE__*/React.createElement("div", {
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
}), " Generator Report"), readiness.ready && (function () {
  return React.createElement(EmailCertButton, {
    job: job
  });
})(), readiness.ready && (function () {
  return React.createElement(PdfButtons, {
    job: job
  });
})(), /*#__PURE__*/React.createElement("button", {
    onClick: () => downloadSingleFile(buildRecordHTML(job), "record.html"),
    className: "inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2.5 rounded-lg transition-colors text-sm",
    title: "Download the full working record as a single HTML file"
  }, /*#__PURE__*/React.createElement(FileText, {
    size: 15
  }), " Record"), readiness.ready && /*#__PURE__*/React.createElement("button", {
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
  }), " Both (ZIP)"), readiness.ready && /*#__PURE__*/React.createElement("button", {
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
  }, certificateTitle(job).replace(/&amp;/g, "&")))), /*#__PURE__*/React.createElement("div", {
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
    }, nextTestText(job))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
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
  }), /*#__PURE__*/React.createElement(ServicesReportSections, {
    job: job
  }), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-slate-200 pt-4 mb-8 text-xs text-slate-600 leading-relaxed"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-800 mb-2"
  }, "Statutory Declaration"), /*#__PURE__*/React.createElement("p", null, "I declare that the electrical equipment listed in this report has been inspected and tested in accordance with " + standardsLine(job) + ", and that the results recorded above are a true and accurate account of the condition of each item at the time of testing. This testing has been carried out with regard to the duties and obligations set out under the Occupational Health and Safety Act 2004 (Vic) and the Occupational Health and Safety Regulations 2017. Equipment marked \"Fail\" should be removed from service, repaired, or replaced before further use.")), /*#__PURE__*/React.createElement("div", {
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
