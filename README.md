# ZoltanStudios — Test & Tag app, desktop wrapper and Business Suite

| Folder | What |
|---|---|
| `modules/`, `build/`, `vendor/`, `dist/` | The Test & Tag web app (`testtag-app.html`). Source is `modules/`; `node build/build.js --css` builds `dist/`. |
| `website/` | Public site pages kept in step with the app (`test-and-tag.html`: services, prices, FAQ, schema). Prices must match `TT_PRICES` in `modules/12-settings.js` and the Suite's `Rates.cs`. |
| `server/` | Server code: `server/api/` is the live `public_html/api/` (without `config.php`), plus `email.php` and the verify files. |
| `src-tauri/` | Tauri desktop wrapper that loads the live web app. Workflows: `build.yml`, `build-ios.yml`. |
| `business-suite/` | Native Windows Business Suite (WPF, .NET 8). Workflow: `build-suite.yml`. See `business-suite/README.md`. |

Never commit `config.php` — it holds the live database password.

---

# ZoltanStudios Test and Tag — source

The app used to exist only as a compiled bundle, which meant every change was
a string-replacement patch into generated code. That's why fixes sometimes
took two or three attempts to land. This is the same app, split into readable
modules with a build step that verifies its own output.

## Layout

```
modules/     the source, one file per area of the app
build/
  build.js     assembles modules -> dist/testtag-app.js
  order.json   the order modules are concatenated in
  tailwind.css tailwind entry point
dist/        build output - this is what you upload
test/        a runnable copy for checking changes locally
```

## Building

```
node build/build.js          assemble and verify
node build/build.js --css    also rebuild the stylesheet
```

The build **refuses to write a bundle that doesn't parse**, and checks that a
list of expected functions is still present. A syntax error or an accidentally
dropped module can't reach the server.

## Making a change

1. Edit the relevant file in `modules/`
2. `node build/build.js --css`
3. Test: `cd test && python3 -m http.server 8000`, open
   `http://localhost:8000/testtag-app.html`
4. Copy `dist/testtag-app.js` and `dist/testtag-app.css` into your upload
5. Bump `CACHE_VERSION` in `sw.js` or installed PWA copies keep the old files

## Where things live

| Module | Contains |
|---|---|
| `01-icons.js` | Inline SVG icons |
| `02-zip-download.js` | ZIP builder, downloads, desktop-shell detection |
| `03-templates.js` | Logo, certificate, record and signature HTML |
| `04-csv.js` | CSV cell escaping |
| `05-zip-export.js` | Per-job ZIP export |
| `06-folder.js` | Folder saving (File System Access API) |
| `07-qr-labels.js` | A4 QR label sheet |
| `08-appliance-db.js` | 280+ appliances, picker modal |
| `09-storage.js` | localStorage keys, job persistence |
| `10-server-sync.js` | Server config, push/pull, phone capture relay |
| `11-backup.js` | Backup and restore |
| `12-settings.js` | Tester defaults, retest scheduling, asset register |
| `13-job-model.js` | Job/item model, tag numbering, carry-forward |
| `14-job-list.js` | Job list, filters, backup buttons |
| `15-job-form.js` | Job form, item table, generator panel |
| `16-report-view.js` | In-app certificate view |
| `17-app.js` | Root component, view routing, save/delete/copy |

## Notes

- The modules are plain JS using `React.createElement` — no JSX, no transpile
  step. What you edit is what ships.
- No CDN dependencies. React and Tailwind are served from your own site
  because Edge's tracking prevention blocks CDN scripts.
- `/api/` requests are never cached by the service worker, so login and sync
  always hit the live server.
