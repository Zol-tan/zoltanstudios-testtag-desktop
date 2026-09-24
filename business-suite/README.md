# ZoltanStudios Business Suite

Lives in `business-suite/` of the desktop repo, next to the Tauri test-and-tag
wrapper. Its build workflow is `.github/workflows/build-suite.yml` at the repo
root (GitHub only reads workflows from there). Paths below are relative to
`business-suite/`.

A native Windows desktop application — WPF on .NET 8. Real window chrome,
menu bar, navigation tree, and a local SQLite database so it works with no
connection.

**Purpose:** everything behind the admin login at zoltanstudios.au, as a
native app — the whole admin panel (`admin.html`, `admin-tools.html`) plus the
tools and calculators. Public customer-facing pages (home, services, blog,
client portal, certificate lookup) stay on the website.

## Status — version 0.2.0

| Admin panel feature | Endpoint(s) | Suite |
|---|---|---|
| Test and tag jobs | `services.php?resource=testtag` pull, job_save, delete | Done — local + sync |
| Dashboard | (derived) | Done |
| Clients | `data.php?resource=users` list, create, update, deactivate | Done — local + sync |
| Invoices | `data.php?resource=invoices` list, create, update_status, delete | Done — local + sync |
| Calendar / bookings | `data.php?resource=events` list, create, update, update_status, delete | Done — add, edit, confirm/decline requests, delete |
| Projects | `data.php?resource=projects` list, create, update, delete | Done — live |
| Project access (was `admin-tools.html`) | `data.php?resource=projects` members, add_member, remove_member | Done — live |
| Messages | `messages.php` list, get, reply, create, mark_read, close | Done — live |
| Quotes (3D print) | `services.php?resource=quotes` list, create, update, update_status, delete | Done — live, plus "Save as Quote" from the 3D Printing Quote tool |
| API tokens | `services.php?resource=tokens` list, create, revoke | Done — live |
| Quote Calculator, 3D Print Quote, Parts, Settings | — | Done |

"Local + sync" sections work offline and sync on F5. "Live" sections read and
write the server directly, like the admin panel does, and need a connection.

**Server requirement:** `data.php` from the matching website update adds
`users/update`, `events/update`, `projects/members` and
`projects/remove_member`. Against an older `data.php` the suite still works,
but client edits and booking edits (other than status) wait in the queue with
a message saying so, and project access can add but not list members.

## Building

GitHub builds it for you: **Actions → Build Business Suite → Run workflow**,
then download the artifact. Tag `suite-v0.2.0` to publish a release instead.

The result is a **single self-contained .exe** — no .NET install needed on the
target machine. Around 150MB because the runtime is bundled.

Locally, with the .NET 8 SDK:

```
dotnet build src/ZoltanStudios.Suite/ZoltanStudios.Suite.csproj -c Release
```

It compile-checks on Linux and macOS too (`EnableWindowsTargeting`), though
you can only run it on Windows.

## Testing against the real API

`tests/sync-harness/run.sh /path/to/public_html/api` copies the live API
files, swaps only `config.php` and the MySQL connection for SQLite, serves
them with `php -S`, and drives them with the suite's own `Services` code:
sign-in, every sync path (clients, jobs, invoices, bookings, deletes both
ways) and every live admin call. Needs PHP with pdo_sqlite and the .NET 8 SDK.
Add `--old-server` (with `OLD_DATA_PHP=` pointing at a previous data.php) to
check the fallbacks for a server that hasn't been updated.

The WPF windows themselves are compile-checked only; click through them on
Windows after each build.

## Layout

```
src/ZoltanStudios.Suite/
  App.xaml(.cs)              Entry point, database init
  Models/Entities.cs         Client, Job, Item, Invoice, Appointment
  Services/
    ApiClient.cs             The one shared HTTP client (session cookie, CSRF, errors)
    SyncService.cs           Push queue + pull merge
    AdminRows.cs             Parsers for projects, messages, quotes, tokens, users
    Repository.cs            Local database reads/writes
    Database.cs              SQLite schema and migrations
  Views/
    MainWindow.xaml(.cs)     Shell: menus, navigation, content host
    Forms.cs                 Shared dialog building blocks
    Modules/                 One class per section (AdminModules.cs = live sections)
tests/sync-harness/          End-to-end test against the real PHP
```

## Where the data lives

`%AppData%\ZoltanStudios\suite.db` — per-user, survives app updates.

- **every table carries `UpdatedAt`**; **deletes are soft** (`Deleted = 1`)
- `SyncQueue` holds local changes until the server accepts them. A change the
  server refuses stays queued with the server's reason, listed under
  **Settings ▸ Sync problems** — never silently dropped.
- The session cookie is kept in the `Meta` table (`SessionCookie`) so the app
  doesn't ask for a password every launch. **Sync ▸ Sign Out** clears it.

## How sync matches records

- Every synced row keeps the server's id in `ServerId`.
- Jobs also send the suite's own id as `externalId`, so an edited job updates
  the same server job instead of creating a copy.
- A pulled row never overwrites a local change that is still queued.
- Rows deleted on the website (invoices, bookings) are removed here on the next pull.
- An invoice in **draft** stays in the suite. Once issued, only its status is
  sent — the server has no invoice edit. GST is sent as its own line so the
  server's total matches.
- A new client is created on the server with a random password (the API
  requires one); they can use "Forgot password" if they ever want the portal.
  A client whose email already has an account is linked to it.

## Known limits

- The server stores fewer item fields than the suite: cord and plug
  condition, polarity, operation and fuse checks, fault and repair text,
  removed-from-service and follow-up stay in the suite only (kept through
  syncs where the item still matches by position and tag).
- The server has no job type, so a generator inspection arrives on the
  website as an ordinary job record.
- Booking location is suite-only (events have no location column).
