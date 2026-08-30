# ZoltanStudios Test & Tag — Windows Desktop App

A native Windows wrapper around the hosted Test & Tag app. Internal use only.

You never build anything on your own machine — GitHub builds the installer for
you and gives you a download link.

---

## How it works

The desktop app is a native window that loads `zoltanstudios.au/testtag-app.html`.

That matters for two reasons:

- **Login and sync work exactly as they do now.** The PHP session cookie
  behaves identically, so there's no CORS setup and no second auth path.
- **Uploading new app files to cPanel updates the desktop app too.** No
  rebuild, no reinstall. Same single-upload workflow you have today.

The service worker still caches everything after the first successful load, so
the app keeps working on site with no signal.

---

## One-time setup

### 1. Create the repository

On GitHub: **New repository** → name it `zoltanstudios-testtag-desktop` →
**Private** → Create.

### 2. Push this folder to it

With GitHub Desktop (easiest): **Add** → **Add existing repository** → pick this
folder → **Publish repository**.

Or from a terminal in this folder:

```bash
git init
git add .
git commit -m "Initial desktop wrapper"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/zoltanstudios-testtag-desktop.git
git push -u origin main
```

### 3. Build it

Two ways to trigger a build:

**By hand** — repo → **Actions** tab → **Build Windows App** → **Run workflow**.

**By tag** — this also publishes a permanent Release:

```bash
git tag v2.6.0
git push origin v2.6.0
```

First build takes about 5–10 minutes (Rust compiles from scratch). Later builds
are 2–3 minutes thanks to the cache.

### 4. Download the installer

- **Tagged build** → repo → **Releases** → download the `.msi`
- **Manual build** → **Actions** → click the run → **Artifacts** at the bottom

Two installers are produced: `.msi` (standard Windows installer) and a `.exe`
(NSIS, slightly smaller). Either is fine — the `.msi` is the usual choice.

---

## Installing on a work PC

Run the `.msi`. Windows SmartScreen will warn that the publisher is unrecognised
because the installer isn't code-signed — click **More info** → **Run anyway**.
That's expected for an internal tool and only happens on install.

Signing certificates run $200–400/year and are only worth it if you ever hand
the installer to someone outside the business.

---

## Making changes

**Changing the app itself** (features, fixes) — upload to cPanel as usual. The
desktop app picks it up on next launch. No rebuild needed.

**Changing the wrapper** (window size, app name, icon) — edit
`src-tauri/tauri.conf.json`, bump the `version`, push a new tag.

**Pointing at a different URL** — edit `APP_URL` at the top of
`src-tauri/src/main.rs`.

---

## Layout

```
.github/workflows/build.yml   The GitHub Actions build
src-tauri/
  tauri.conf.json             Window size, app name, installer settings
  Cargo.toml                  Rust dependencies
  build.rs                    Build script
  src/main.rs                 Entry point — APP_URL is set here
  icons/                      App and installer icons
dist/index.html               Placeholder Tauri requires; not used at runtime
```

---

## Notes

Tauri uses the WebView2 runtime already present in Windows 10 and 11, so the
installer is roughly 8–15MB rather than the ~150MB an Electron build would be.

If a build fails, open the failed run under **Actions** and expand the red step
— the error is usually in "Build the installer".
