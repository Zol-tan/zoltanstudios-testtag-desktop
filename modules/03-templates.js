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
