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
