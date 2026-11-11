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

## Status — version 0.6.1

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
| **Test & Tag App** (the web app, built in) | `testtag-app.html` in WebView2, API token created automatically | Done — 0.3 |
| Find (Ctrl+F) | local: clients, jobs, tags/serials, invoices, bookings | Done — 0.3 |
| Import / Export backup | whole local database, `.zsbackup` | Done — 0.3 |
| Pricing page, Tester Defaults | local | Done — 0.3 |
| Appliance Library + "Add from Library" in the job editor | local, seeded with the web app's 212 appliances | Done — 0.3 |
| Filament stock | local (spools, use log, low stock) | Done — 0.3 |
| Retest reminder emails | opens your mail program from Retest Due | Done — 0.3 |
| AS/NZS 3760 reference, Wavecom TnT guide | Help pages | Done — 0.3 |
| **Find Parts Online** (Bunnings, Jaycar, Altronics in a built-in browser) | reads the product page's own schema.org data | Done — 0.4 |
| Parts: shop, item no. and product link per part; Check My Prices; restock list by shop | `parts.php` save/list (`supplier`, `url`) | Done — 0.4 |
| **Photos & signatures** on jobs and invoices: Use My Phone (QR), sign on the laptop, add photos from the PC | `capture.php` start/poll (the web app's phone relay) + job `attachments` | Done — 0.5 |
| Tester signature on certificates — one signature shared with the web app / phones | `files.php` tester_get / tester_set | Done — 0.6 |
| Invoice photos stored on the server (compressed, on disk) | `files.php` list / get / save / link / delete | Done — 0.6 |
| **Buy Stock**: shopping list by shop, open pages in your browser, "Bought" adds to stock; purchase history | `parts.php` receive / purchases | Done — 0.6 |

"Local + sync" sections work offline and sync on F5. "Live" sections read and
write the server directly, like the admin panel does, and need a connection.

**Server requirement:** `data.php` from the matching website update adds
`users/update`, `events/update`, `projects/members` and
`projects/remove_member`. Against an older `data.php` the suite still works,
but client edits and booking edits (other than status) wait in the queue with
a message saying so, and project access can add but not list members.

## Find Parts Online (0.4)

There's no public API for Bunnings, Jaycar, Altronics or Amazon, so the suite opens
their normal website in a built-in browser (profile
`%LocalAppData%\ZoltanStudios\WebView2-Shops`) and reads the product details
the page publishes for search engines (schema.org Product JSON-LD: name, item
number, price). Checked against live Bunnings and Jaycar product pages;
Amazon publishes none, so its product page's title, ASIN and price are
read (tested against a page laid out like Amazon's, not the live site);
Altronics falls back to the page's meta tags, and a price read off the page
text is flagged as a guess for you to confirm.

- **Search** any shop, open a product, then **Add as a New Part**, **Update My
  Part From This Page**, or **Link to an Existing Part**.
- **Check My Prices** visits every part that has a link (or searches by item
  number) and lists old cost vs. new cost with Apply ticked; optionally
  reprices the sell price from your markup.
- Parts have a shop, item number and product link; the Restock List is
  grouped by shop with "buy N" quantities and opens the product page.

## Photos and signatures (0.5)

**Photos & Signature…** in the job editor (and **Photos…** in the invoice
editor) opens a panel with:

- **Use My Phone…** — a QR code for the website's capture page
  (`capture.html`, the same relay the web app uses). Scan it, take photos or
  hand the phone over to sign; they appear in the suite within a few seconds.
  No login on the phone: the link is good for one record for an hour.
- **Client Signs on Phone…** — the same, but the phone shows only a name box
  and a signature pad, and the window closes once it's signed.
- **Client Signs Here…** — sign on the laptop (mouse, touchscreen or pen).
- **Add Photos from PC…** — shrunk to 1600 px and turned the right way up.
- **Copy from Job…** (invoices) — the linked job's photos.

The latest signature prints on the certificate's client line (or as "Work
accepted" on an invoice); photos print under the results. The tester's own
signature is set in **Tools ▸ Tester Defaults** (here or on the phone).

Invoice photos are stored on your server (`api/files.php`): compressed there
to a 1600 px JPEG (signatures to a small PNG) and kept on disk in
`testtag_uploads/files`, which the web can't open directly — only the API
serves them. They go up on the next sync, even for a draft invoice, and
come back with the invoice on another PC.

The tester signature is one signature for everything: set it in Tester
Defaults here, draw it in the web app's Tester Defaults on your phone, or
use **Sign on My Phone** — the server keeps it and every app picks it up.

Job photos and signatures sync with the website in the job's `attachments`.
The suite sends them only when changed here, with `attachmentsBase` (the ids
it last saw) so the server **merges** — a photo the phone added meanwhile is
kept; only ones removed here are dropped. Invoice photos merge the same way.

## Buying stock (0.6)

**Parts ▸ Buy Stock…** (also on the Parts page and Restock List) lists what's
low — or everything — grouped by shop, with how many to buy to get back
above the warning level and the last price paid. Tick what you're getting,
**Open in My Browser** opens each product page in your normal browser (where
you're signed in to Bunnings / Jaycar), **Copy List** makes a list for the
trade desk, and **Bought — Add to Stock** puts them in stock at the price
paid. **Amazon** items (with an ASIN as the item no. or an amazon.com.au
link) all go into your Amazon cart through one link, with their quantities —
Amazon shows a page to confirm them. On a product page in Find Parts Online, **Bought This — Add to Stock…**
does the same for one part. **Bought…** on the Parts page records stock
bought any other way.

Stock bought is *added* to the website's count (`parts.php?action=receive`,
once per purchase id), never set, so parts fitted from a phone in the
meantime still come off. A new price paid becomes the part's cost.
**Parts ▸ Stock Bought…** shows the history with monthly totals.

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
ways) and every live admin call, plus the local rules (retests, tag roll,
invoicing, stock, supplier pages, backup, the phone relay, photo sync, invoice photos on the server, the
shared tester signature and buying stock, Amazon) — 220 checks. Needs PHP with pdo_sqlite and the .NET 8 SDK.
Add `--old-server` (with `OLD_DATA_PHP=` pointing at a previous data.php) to
check the fallbacks for a server that hasn't been updated.

The WPF windows themselves are compile-checked only (the build compiles the
XAML); click through them on Windows after each build.

## The built-in Test & Tag App

The sidebar's **Test & Tag App** runs `testtag-app.html` from the website
inside the suite using Microsoft Edge WebView2 (installed on Windows 10/11).
Its profile lives in `%LocalAppData%\ZoltanStudios\WebView2`, so the app's own
saved jobs and settings survive restarts. The page has no login, so the suite
creates an API token for it (label "Business Suite built-in app (PC name)") and
writes it into the page's server settings; **Reconnect** makes a new one if it
was revoked. The page is kept alive while you use other sections.

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
- Booking location is suite-only (events have no location column).
- The admin panel website pages don't show invoice photos (they're for the
  suite's printed invoice).
