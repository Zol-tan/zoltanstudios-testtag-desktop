# iOS Setup

Getting the Test and Tag app onto your iPhone as a real native app.

---

## What you need

- **Apple Developer account** ($149/yr AUD) — you have this
- **A Mac** (or macOS VM) with Xcode installed — only needed for *signing*,
  not for building
- **This repo set to public** — macOS runners are free for public repos. On a
  private repo they bill at 10× the Linux rate, which gets expensive fast.

---

## Before making the repo public

Check nothing sensitive is in the repo or its history:

- No `.env` files
- No database credentials
- No `capture.php` or anything from `/api/`

The desktop repo is clean, but git history is public too — if a credential
was ever committed and later deleted, it's still in history.

`APP_URL` pointing at `zoltanstudios.au` is fine. That's a public URL.

---

## The approach

Building iOS apps requires Xcode, which is macOS-only. Signing requires your
developer certificates. So the work splits:

| Step | Where | Why |
|---|---|---|
| Build the app | GitHub Actions (macOS runner) | Free, reliable, no local setup |
| Sign it | Your Mac | Certificates live in your keychain |
| Install it | Your iPhone | Via Xcode or TestFlight |

You never have to get a full Rust + Xcode toolchain working in the VM — the
VM only signs, which is far less likely to break.

---

## Running the build

**Actions** tab → **Build iOS App** → **Run workflow**.

First run takes 20–30 minutes (Rust compiles for ARM from scratch). Later runs
are faster thanks to caching.

Two artifacts come out:

- `ZoltanStudios-TestTag-iOS-unsigned` — the unsigned `.ipa`
- `xcode-project` — the generated Xcode project

---

## Signing and installing

### Option A — Open the Xcode project (easiest)

1. Download the `xcode-project` artifact, unzip it on your Mac
2. Open the `.xcodeproj` in Xcode
3. Select the project → **Signing & Capabilities**
4. Tick **Automatically manage signing**, pick your Team
5. Plug in your iPhone, select it as the destination, press **Run**

Xcode handles the certificate and provisioning profile for you. This is the
path of least resistance and what I'd try first.

### Option B — TestFlight (best if others need it too)

Useful if you'll have staff using the app.

1. **App Store Connect** → create a new app, bundle ID `au.zoltanstudios.testtag`
2. In Xcode: **Product → Archive**
3. **Distribute App** → **TestFlight & App Store** → upload
4. Add testers by email; they install through the TestFlight app

TestFlight builds still get a review, but it's lighter than full App Store
review and usually turns around in a day. Builds last 90 days.

Worth knowing: for an internal tool you do **not** need App Store release.
TestFlight or direct install via Xcode is enough, and avoids review entirely
in the Xcode case.

---

## Bundle identifier

Currently `au.zoltanstudios.testtag` (set in `src-tauri/tauri.conf.json`).

This must match what you register in your Apple Developer account. If you
already have an App ID you'd rather use, change `identifier` in that file
before building.

---

## Changing the app

**The web app itself** (features, fixes) — upload to cPanel as usual. The iOS
app loads the live site, so it picks up changes on next launch. No rebuild,
no re-signing, no TestFlight upload. This is the big advantage of the wrapper
approach.

**The shell** (icon, name, URL) — edit the config, rebuild, re-sign.

---

## Known limitations of the wrapper approach

The app is a native shell around your hosted web app. That means:

- **Push notifications don't work.** These need native code and APNs
  integration. If you want "retest due" notifications on your phone, that's a
  separate piece of work.
- **First launch needs a connection.** After that the service worker caches
  everything and it works offline.
- **Camera** goes through the web file picker rather than a native camera
  sheet. Functional, slightly less slick.

If any of those become a real problem, the fix is moving specific features to
native code — a bigger job, but the wrapper doesn't prevent it.

---

## If the build fails

Open the failed run under **Actions** and expand the red step.

The most likely failure is `tauri ios init` needing an Apple Team ID even for
an unsigned build. If that happens, set `developmentTeam` in the `iOS` section
of `src-tauri/tauri.conf.json` to your Team ID (found in your Apple Developer
account under Membership), commit, and re-run.
