#!/usr/bin/env node
/**
 * Build the Test and Tag app from source modules.
 *
 *   node build/build.js            assemble + verify
 *   node build/build.js --css      also rebuild Tailwind
 *
 * Modules in build/order.json are concatenated in order into
 * dist/testtag-app.js. Nothing is transpiled — the modules are already
 * plain JS with React.createElement calls, so what you edit is what ships.
 *
 * The build refuses to write a bundle that doesn't parse, so a syntax error
 * can never reach the server.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const MODULES = path.join(ROOT, "modules");
const DIST = path.join(ROOT, "dist");
const ORDER = JSON.parse(fs.readFileSync(path.join(__dirname, "order.json"), "utf8"));

function log(msg) { process.stdout.write(msg + "\n"); }
function fail(msg) { process.stderr.write("BUILD FAILED: " + msg + "\n"); process.exit(1); }

// ---- assemble -------------------------------------------------------------
const missing = ORDER.filter((f) => !fs.existsSync(path.join(MODULES, f)));
if (missing.length) fail("missing modules: " + missing.join(", "));

const parts = ORDER.map((f) => fs.readFileSync(path.join(MODULES, f), "utf8"));
const bundle = parts.join("\n");

fs.mkdirSync(DIST, { recursive: true });
const outFile = path.join(DIST, "testtag-app.js");

// ---- verify before writing ------------------------------------------------
// A bundle that doesn't parse must never be written, or a bad build gets
// uploaded and the app is dead on arrival.
const tmp = path.join(DIST, "_verify.js");
fs.writeFileSync(tmp, bundle);
try {
  execSync(`node --check "${tmp}"`, { stdio: "pipe" });
} catch (e) {
  fs.unlinkSync(tmp);
  fail("bundle has a syntax error:\n" + (e.stderr || e.stdout || e.message).toString());
}
fs.renameSync(tmp, outFile);

// ---- sanity checks --------------------------------------------------------
// Cheap guards against a module being dropped or a rename going wrong.
const required = [
  "TestTagRecordsApp", "JobFormView", "JobListView", "ReportView",
  "buildCertificateHTML", "buildRecordHTML", "buildGeneratorReportHTML",
  "APPLIANCE_DB", "blankJob", "blankItem", "nextTagFor",
  "buildBackup", "restoreBackup", "pushJobToServer", "pullJobsFromServer",
  "startCaptureSession", "isDesktopShell",
  "emailDocumentToClient", "EmailCertButton",
];
const absent = required.filter((sym) => !bundle.includes(sym));
if (absent.length) fail("expected symbols missing from bundle: " + absent.join(", "));

log(`Built dist/testtag-app.js`);
log(`  ${ORDER.length} modules, ${bundle.split("\n").length} lines, ${(bundle.length / 1024).toFixed(0)} KB`);

// ---- optional CSS ---------------------------------------------------------
if (process.argv.includes("--css")) {
  try {
    execSync(
      `npx tailwindcss -c "${path.join(ROOT, "tailwind.config.js")}" ` +
      `-i "${path.join(ROOT, "build", "tailwind.css")}" ` +
      `-o "${path.join(DIST, "testtag-app.css")}" --minify`,
      { stdio: "inherit", cwd: ROOT }
    );
    log("Built dist/testtag-app.css");
  } catch (e) {
    fail("tailwind build failed");
  }
}
