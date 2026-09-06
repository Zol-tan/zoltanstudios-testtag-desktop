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
