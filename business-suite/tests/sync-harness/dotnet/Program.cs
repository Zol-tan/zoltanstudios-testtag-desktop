// End-to-end check of the Business Suite's sync engine and the live admin
// endpoints, against the REAL PHP API files running on `php -S` with an
// SQLite stand-in for MySQL. Nothing here is mocked except the database engine.
using System.Text.Json;
using Microsoft.Data.Sqlite;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

var baseUrl = args.Length > 0 ? args[0] : "http://127.0.0.1:8765";
var serverDb = args.Length > 1 ? args[1] : "test.db";
var sessionsDir = Path.Combine(Path.GetDirectoryName(Path.GetFullPath(serverDb))!, "sessions");
var localDb = Path.Combine(Path.GetTempPath(), "suite-harness.db");
File.Delete(localDb);
Database.UsePath(localDb);
Database.Initialise();
PartsCatalogue.EnsureSchema();

int pass = 0, fail = 0;
void Check(bool ok, string what, string detail = "")
{
    if (ok) { pass++; Console.WriteLine("  PASS " + what); }
    else { fail++; Console.WriteLine("  FAIL " + what + (detail.Length > 0 ? "  -> " + detail : "")); }
}
object? Srv(string sql, params object[] a)
{
    using var c = new SqliteConnection("Data Source=" + serverDb);
    c.Open();
    using var cmd = c.CreateCommand();
    cmd.CommandText = sql;
    for (var i = 0; i < a.Length; i++) cmd.Parameters.AddWithValue("$" + (i + 1), a[i]);
    return cmd.ExecuteScalar();
}
long N(string sql, params object[] a) => Convert.ToInt64(Srv(sql, a) ?? 0);
string S(string sql, params object[] a) => Convert.ToString(Srv(sql, a)) ?? "";

var api = new ApiClient(baseUrl);
ApiClient.Shared = api;
var cookieSaved = "";
api.SessionCookieChanged += c => cookieSaved = c;
var sync = new SyncService(api);

Console.WriteLine("== sign in");
var (ok, err) = await api.SignInAsync("admin@example.test", "wrong-password");
Check(!ok && !string.IsNullOrEmpty(err), "wrong password is refused with a message", err ?? "");
(ok, err) = await api.SignInAsync("admin@example.test", "TestPassword123");
Check(ok, "admin signs in", err ?? "");
Check(cookieSaved.Length > 0, "session cookie is reported for saving");

// A second client given only the saved cookie is signed in (app relaunch).
var relaunch = new ApiClient(baseUrl);
relaunch.ImportSessionCookie(cookieSaved);
Check(await relaunch.RestoreSessionAsync(), "saved session cookie restores the session on relaunch");

if (args.Contains("--old-server"))
{
    // The live site before this update: no users/update, events/update or members.
    Console.WriteLine("== against the old data.php");
    var oc = new Client { Name = "Old Server", Email = "old@example.test" };
    Repository.SaveClient(oc);
    var ob = new Appointment { Title = "Visit", StartsAt = "2026-10-01T09:00", Status = "pending" };
    Repository.SaveAppointment(ob);
    await Sync();
    oc = Repository.GetClients().First(c => c.Id == oc.Id);
    oc.Phone = "123";
    Repository.SaveClient(oc);
    ob = Repository.GetAppointments().First(a => a.Id == ob.Id);
    ob.Status = "confirmed";
    ob.Title = "Visit renamed";
    Repository.SaveAppointment(ob);
    await Sync();
    Check(S("SELECT status FROM events") == "confirmed", "booking status still syncs via update_status fallback");
    Check(Repository.SyncProblems().Any(p => p.Table == "Clients" && p.Error.Contains("Upload the new api/data.php")),
        "client edit explains the server needs the new data.php", string.Join("|", Repository.SyncProblems().Select(p => p.Error)));
    var m = await api.CallGetAsync("api/data.php?resource=projects&action=members&projectId=x");
    Check(!m.Ok && m.Error.StartsWith("Unknown action"), "members call fails with 'Unknown action' (the access window explains it)", m.Error);
    Console.WriteLine($"{pass} passed, {fail} failed");
    return fail == 0 ? 0 : 1;
}

// ------------------------------------------------------------------ clients
Console.WriteLine("== clients");
var alice = new Client { Name = "Alice Example", Company = "Example Cafe", Email = "alice@example.test", Phone = "0400 111 222" };
var linked = new Client { Name = "Sample Client", Email = "CLIENT.ONE@example.test" }; // already on the server
var noEmail = new Client { Name = "No Email Person" };
Repository.SaveClient(alice);
Repository.SaveClient(linked);
Repository.SaveClient(noEmail);

var r = await Sync();
Console.WriteLine("   " + r.Message);
alice = Repository.GetClients().First(c => c.Id == alice.Id);
linked = Repository.GetClients().First(c => c.Id == linked.Id);
Check(!string.IsNullOrEmpty(alice.ServerId), "new client created on the server");
Check(S("SELECT company FROM users WHERE id=$1", alice.ServerId!) == "Example Cafe", "client company stored on server");
Check(linked.ServerId == "cli00000000000000001", "local client with an existing email links to that account", linked.ServerId ?? "");
Check(N("SELECT COUNT(*) FROM users WHERE email='client.one@example.test'") == 1, "no duplicate account for the linked client");
var problems = Repository.SyncProblems();
Check(problems.Any(p => p.Error.Contains("no email")), "client with no email is reported, not dropped",
    string.Join(" | ", problems.Select(p => p.Error)));
Check(Repository.GetClients().Count(c => c.ServerId == "cli00000000000000001") == 1, "pull doesn't duplicate the linked client");
Check(!Repository.GetClients().Any(c => c.Email == "admin@example.test"), "admin account isn't pulled in as a client");
Repository.DiscardQueued("Clients", noEmail.Id);

alice.Phone = "0400 999 888";
Repository.SaveClient(alice);
await Sync();
Check(S("SELECT phone FROM users WHERE id=$1", alice.ServerId!) == "0400 999 888", "client edit reaches the server (users/update)");

// --------------------------------------------------------------------- jobs
Console.WriteLine("== test and tag jobs");
var job = new Job
{
    ClientId = alice.Id, SiteAddress = "1 Test St, Bundoora", TestDate = "2026-09-20", TesterName = "Tester",
    TesterLicence = "TEST-LICENCE", Environment = "office", RetestMonths = 12,
    Items =
    {
        new Item { TagNumber = "T-001", Description = "Kettle", EquipmentClass = "I", EarthContinuity = "0.1", InsulationResistance = ">200", InsulationVoltage = "500", CordCondition = "worn", Result = "pass" },
        new Item { TagNumber = "T-002", Description = "Heater", EquipmentClass = "I", Result = "fail", ResultOverridden = true, Notes = "Cracked plug" },
    },
};
Repository.SaveJob(job);
Repository.SaveJob(Repository.GetJob(job.Id)!);   // saved twice offline: one queue entry
Check(N0("SELECT COUNT(*) FROM SyncQueue WHERE TableName='Jobs'") == 1, "saving twice queues the job once");

r = await Sync();
Console.WriteLine("   " + r.Message);
var local = Repository.GetJob(job.Id)!;
Check(N("SELECT COUNT(*) FROM tt_jobs") == 1, "job pushed once");
Check(!string.IsNullOrEmpty(local.ServerId) && local.ServerId == S("SELECT id FROM tt_jobs"), "server id stored locally");
Check(local.CertNumber.Length > 0 && local.CertNumber == S("SELECT cert_number FROM tt_jobs"), "server-generated certificate number comes back", local.CertNumber);
Check(S("SELECT external_id FROM tt_jobs") == job.Id, "suite id stored as externalId");
Check(S("SELECT client_id FROM tt_jobs") == alice.ServerId, "job linked to the client's portal account");
Check(S("SELECT client_name FROM tt_jobs") == "Alice Example" && S("SELECT client_email FROM tt_jobs") == "alice@example.test", "client name and email on the job");
Check(S("SELECT override_result FROM tt_items WHERE asset_id='T-002'") == "1", "override flag sent");
Check(S("SELECT insulation_test_voltage FROM tt_items WHERE asset_id='T-001'") == "500", "insulation test voltage sent");
Check(Repository.GetJobs().Count == 1, "pull after push doesn't duplicate the job locally");
Check(Repository.GetItems(job.Id).First(i => i.TagNumber == "T-001").CordCondition == "worn", "local-only item field survives the round trip");

// Edit and re-save: must update the same server job, not 409 or duplicate.
local.Items.Add(new Item { TagNumber = "T-003", Description = "Toaster", Result = "pass" });
Repository.SaveJob(local);
r = await Sync();
Check(r.Failed == 0, "edited job syncs without error", r.Message);
Check(N("SELECT COUNT(*) FROM tt_jobs") == 1 && N("SELECT COUNT(*) FROM tt_items") == 3, "edit updates the same server job (3 items)");

// Jobs created on the website (no externalId) - two of them, must stay two.
foreach (var site in new[] { "Web Job A", "Web Job B" })
{
    var w = await api.CallPostAsync("api/services.php?resource=testtag&action=job_save",
        new { job = new { siteAddress = site, testDate = "2026-09-21", items = new[] { new { description = "Lamp", overallResult = "pass" } } } });
    Check(w.Ok, "website job created: " + site, w.Error);
}
await Sync();
Check(Repository.GetJobs().Count == 3, "both website jobs pulled as separate jobs", Repository.GetJobs().Count.ToString());
Check(Repository.GetJobs().All(j => j.Id != "id"), "no job collapsed onto the id \"id\"");

// Server-side edit is pulled.
var webId = S("SELECT id FROM tt_jobs WHERE site_address='Web Job A'");
await Task.Delay(1100);
var we = await api.CallPostAsync("api/services.php?resource=testtag&action=job_save",
    new { job = new { id = webId, siteAddress = "Web Job A (edited)", testDate = "2026-09-21", items = new[] { new { description = "Lamp", overallResult = "fail" } } } });
Check(we.Ok, "website edit saved", we.Error);
await Sync();
Check(Repository.GetJobs().Any(j => j.SiteAddress == "Web Job A (edited)"), "website edit pulled into the suite");

// Delete from the suite.
var webLocal = Repository.GetJobs().First(j => j.SiteAddress.StartsWith("Web Job B"));
Repository.DeleteJob(webLocal.Id);
r = await Sync();
Check(N("SELECT COUNT(*) FROM tt_jobs WHERE site_address='Web Job B'") == 0, "job deleted in the suite is deleted on the server", r.Message);
Check(Repository.GetJobs().Count == 2, "deleted job doesn't come back on pull");

// ----------------------------------------------------------------- invoices
Console.WriteLine("== invoices");
var inv = new Invoice
{
    ClientId = alice.Id, Number = "INV-0001", IssuedDate = "2026-09-25", DueDate = "2026-10-09", Status = "draft",
    LinesJson = InvoiceLines.Write(new[] { new InvoiceLines.Line("Call-out (includes first 20 items)", 1, 120), new InvoiceLines.Line("Standard items 21-30", 10, 3.5) }),
    Subtotal = 155, Total = 155, Notes = "Test invoice",
};
Repository.SaveInvoice(inv);
await Sync();
Check(N("SELECT COUNT(*) FROM invoices") == 0, "draft invoice is not sent");

inv = Repository.GetInvoices().First(i => i.Id == inv.Id);
Check(InvoiceLines.Read(inv.LinesJson).Count == 2, "invoice lines are stored locally");
inv.Status = "due";
Repository.SaveInvoice(inv);
r = await Sync();
Check(N("SELECT COUNT(*) FROM invoices") == 1, "issued invoice sent", r.Message);
Check(S("SELECT user_id FROM invoices") == alice.ServerId, "invoice filed under the client's account");
Check(Math.Abs(Convert.ToDouble(Srv("SELECT total FROM invoices")) - 155) < 0.001, "server total matches (155.00)", S("SELECT total FROM invoices"));
Check(S("SELECT invoice_number FROM invoices") == "INV-0001", "invoice number kept");
Check(S("SELECT items FROM invoices").Contains("Standard items 21-30"), "line items sent");
inv = Repository.GetInvoices().First(i => i.Id == inv.Id);
Check(InvoiceLines.Read(inv.LinesJson).Count == 2 && Math.Abs(inv.Total - 155) < 0.001, "lines and total intact after pull");

inv.Status = "paid";
Repository.SaveInvoice(inv);
await Sync();
Check(S("SELECT status FROM invoices") == "paid", "status change sent");

var orphan = new Invoice { Number = "INV-0002", IssuedDate = "2026-09-25", DueDate = "2026-10-09", Status = "due", Total = 50, Subtotal = 50 };
Repository.SaveInvoice(orphan);
await Sync();
Check(Repository.SyncProblems().Any(p => p.Table == "Invoices" && p.Error.Contains("no client")), "invoice with no client is reported with a reason");
Repository.DiscardQueued("Invoices", orphan.Id);

var paidPaid = new Invoice { ClientId = linked.Id, Number = "INV-0003", IssuedDate = "2026-09-25", DueDate = "2026-10-09", Status = "paid",
    LinesJson = InvoiceLines.Write(new[] { new InvoiceLines.Line("Repair", 1, 80) }), Subtotal = 80, Total = 80 };
Repository.SaveInvoice(paidPaid);
await Sync();
Check(S("SELECT status FROM invoices WHERE invoice_number='INV-0003'") == "paid", "invoice created as paid ends up paid");

// Deleted on the website -> removed here.
var web = await api.CallPostAsync("api/data.php?resource=invoices&action=delete", new { id = S("SELECT id FROM invoices WHERE invoice_number='INV-0003'") });
Check(web.Ok, "website deletes an invoice", web.Error);
await Sync();
Check(!Repository.GetInvoices().Any(i => i.Number == "INV-0003"), "invoice deleted on the website disappears from the suite");

// ----------------------------------------------------------------- bookings
Console.WriteLine("== bookings");
var appt = new Appointment { ClientId = linked.Id, Title = "Site visit", StartsAt = "2026-10-01T10:30", Status = "confirmed", Notes = "Bring tags" };
Repository.SaveAppointment(appt);
await Sync();
Check(N("SELECT COUNT(*) FROM events") == 1, "booking created on the server");
Check(S("SELECT user_id FROM events") == "cli00000000000000001", "booking shows in the client's portal (user_id)");
Check(S("SELECT event_date FROM events") == "2026-10-01" && S("SELECT event_time FROM events") == "10:30", "date and time sent separately");

appt = Repository.GetAppointments().First(a => a.Id == appt.Id);
Check(appt.StartsAt == "2026-10-01T10:30", "pulled booking keeps its date and time", appt.StartsAt);
appt.Title = "Site visit (moved)";
appt.StartsAt = "2026-10-02T14:00";
Repository.SaveAppointment(appt);
await Sync();
Check(S("SELECT title FROM events") == "Site visit (moved)" && S("SELECT event_date FROM events") == "2026-10-02"
      && S("SELECT event_time FROM events") == "14:00", "booking edit reaches the server (events/update)");

// A client's request made in the portal arrives as pending.
Srv("INSERT INTO events (id,user_id,title,event_date,event_time,status,notes,created_at) VALUES ('evreq00000000000001','cli00000000000000001','Can you test our office?','2026-10-10','09:00','pending','',datetime('now'))");
await Sync();
var req = Repository.GetAppointments().FirstOrDefault(a => a.ServerId == "evreq00000000000001");
Check(req is not null && req.Status == "pending" && req.ClientId == linked.Id, "portal booking request pulled as pending for the right client");
req!.Status = "confirmed";
Repository.SaveAppointment(req);
await Sync();
Check(S("SELECT status FROM events WHERE id='evreq00000000000001'") == "confirmed", "confirming the request updates the server");

Srv("DELETE FROM events WHERE id='evreq00000000000001'");
await Sync();
Check(!Repository.GetAppointments().Any(a => a.ServerId == "evreq00000000000001"), "booking deleted on the website disappears");

Repository.DeleteAppointment(appt.Id);
await Sync();
Check(N("SELECT COUNT(*) FROM events") == 0, "booking deleted in the suite is deleted on the server");

// Unsent local edit wins over the pull.
var appt2 = new Appointment { Title = "Own calendar", StartsAt = "2026-11-01T09:00" };
Repository.SaveAppointment(appt2);
await Sync();
var sid2 = Repository.GetAppointments().First(a => a.Id == appt2.Id).ServerId!;
Check(S("SELECT user_id FROM events WHERE id=$1", sid2) == "adm00000000000000001", "booking with no client files under the admin");

// ------------------------------------------------------------ client delete
Repository.DeleteClient(alice.Id);
await Sync();
Check(S("SELECT is_active FROM users WHERE id=$1", alice.ServerId!) == "0", "deleting a client deactivates the account");
Check(!Repository.GetClients().Any(c => c.ServerId == alice.ServerId), "deactivated client isn't resurrected by the pull");

// ============================================================ live sections
Console.WriteLine("== projects + access");
var users = (await ServerUser.LoadAsync()).Users;
Check(users.Any(u => u.Id == "cli00000000000000001" && !u.IsAdmin) && users.Any(u => u.IsAdmin), "users list parsed (ServerUser)");
var pc = await api.CallPostAsync("api/data.php?resource=projects&action=create",
    new Dictionary<string, object> { ["projectName"] = "Website rebuild", ["userId"] = "cli00000000000000001", ["status"] = "Queued", ["progress"] = 10, ["description"] = "Desc" });
Check(pc.Ok, "project created", pc.Error);
var pid = pc.Str("id");
var pu = await api.CallPostAsync("api/data.php?resource=projects&action=update",
    new Dictionary<string, object> { ["id"] = pid, ["projectName"] = "Website rebuild", ["userId"] = "cli00000000000000001", ["status"] = "In Progress", ["progress"] = 55, ["description"] = "Desc 2" });
Check(pu.Ok, "project updated", pu.Error);
var plist = (await api.CallGetAsync("api/data.php?resource=projects&action=list")).Rows().Select(ProjectRow.From).ToList();
var pr = plist.FirstOrDefault(p => p.Id == pid);
Check(pr is { Name: "Website rebuild", Status: "In Progress", Progress: 55, Description: "Desc 2", UserId: "cli00000000000000001" }, "project row parsed with edited values");
var other = users.First(u => !u.IsAdmin && u.Id != "cli00000000000000001");
Check((await api.CallPostAsync("api/data.php?resource=projects&action=add_member", new { projectId = pid, userId = other.Id, role = "viewer" })).Ok, "access granted");
var mem = await api.CallGetAsync("api/data.php?resource=projects&action=members&projectId=" + pid);
Check(mem.Ok && mem.Rows().Count() == 1 && Json.Str(mem.Rows().First(), "role") == "viewer" && Json.Str(mem.Rows().First(), "email").Length > 0, "members listed with role and email", mem.Error);
Check((await api.CallPostAsync("api/data.php?resource=projects&action=remove_member", new { projectId = pid, userId = other.Id })).Ok, "access removed");
Check(!(await api.CallGetAsync("api/data.php?resource=projects&action=members&projectId=" + pid)).Rows().Any(), "member gone");
var badProj = await api.CallPostAsync("api/data.php?resource=projects&action=create", new { projectName = "x" });
Check(!badProj.Ok && badProj.Error.Contains("userId"), "server error text is surfaced", badProj.Error);

Console.WriteLine("== messages");
var mc = await api.CallPostAsync("api/messages.php?action=create",
    new Dictionary<string, object> { ["clientId"] = "cli00000000000000001", ["subject"] = "Your test report", ["message"] = "Hi, report attached.", ["projectId"] = pid });
Check(mc.Ok, "conversation started", mc.Error);
var mid = mc.Str("id");
// the client replies (as the website would record it)
Srv("INSERT INTO message_thread (id,message_id,sender_id,sender_name,sender_role,body,created_at) VALUES ('thr0000000000000001',$1,'cli00000000000000001','Sample Client','client','Thanks!',datetime('now','+5 seconds'))", mid);
Srv("UPDATE messages SET last_message='Thanks!', last_updated=datetime('now','+5 seconds') WHERE id=$1", mid);
var ml = (await api.CallGetAsync("api/messages.php?action=list")).Rows().Select(ConversationRow.From).ToList();
var conv = ml.FirstOrDefault(c => c.Id == mid);
Check(conv is { Subject: "Your test report", ClientName: "Sample Client", LastMessage: "Thanks!", IsClosed: false }, "conversation row parsed");
Check(conv?.Unread == true, "client reply shows as new");
var mg = await api.CallGetAsync("api/messages.php?action=get&id=" + mid);
Check(mg.Ok && mg.Data.GetProperty("thread").GetArrayLength() == 2, "thread loaded (2 posts)", mg.Error);
Check((await api.CallPostAsync("api/messages.php?action=mark_read", new { id = mid })).Ok, "marked read");
Srv("UPDATE messages SET admin_last_read=datetime('now','+10 seconds') WHERE id=$1", mid); // clock skew guard for the test
conv = (await api.CallGetAsync("api/messages.php?action=list")).Rows().Select(ConversationRow.From).First(c => c.Id == mid);
Check(!conv.Unread, "no longer new after reading");
var rep = await api.CallPostAsync("api/messages.php?action=reply", new { id = mid, message = "You're welcome." });
Check(rep.Ok && rep.Data.GetProperty("thread").GetArrayLength() == 3, "reply sent and thread returned", rep.Error);
Check(N("SELECT COUNT(*) FROM notifications WHERE recipient_id='cli00000000000000001'") >= 2, "client notified");
Check((await api.CallPostAsync("api/messages.php?action=close", new { id = mid })).Ok, "conversation closed");
var afterClose = await api.CallPostAsync("api/messages.php?action=reply", new { id = mid, message = "late" });
Check(!afterClose.Ok && afterClose.Error.Contains("closed"), "reply to a closed conversation is refused with a reason", afterClose.Error);

Console.WriteLine("== quotes");
var qc = await api.CallPostAsync("api/services.php?resource=quotes&action=create", new Dictionary<string, object?>
{
    ["clientId"] = "", ["customerName"] = "Walk-in", ["customerEmail"] = "walkin@example.test", ["itemName"] = "Bracket",
    ["material"] = "PETG", ["weightGrams"] = 42.5, ["printHours"] = 1.5, ["infillPercent"] = 20, ["quantity"] = 3,
    ["materialCost"] = 1.7, ["timeCost"] = 5.0, ["setupFee"] = 15.0, ["notes"] = "",
});
Check(qc.Ok && Math.Abs(Json.Num(qc.Data, "total") - 65.1) < 0.001, "quote created; server total (1.70+5+15)x3 = 65.10", qc.Error + " " + Json.Num(qc.Data, "total"));
Check(S("SELECT client_id FROM print_quotes") == "", "blank client stored as no client");
var qid = qc.Str("id");
var qu = await api.CallPostAsync("api/services.php?resource=quotes&action=update", new Dictionary<string, object?>
{
    ["id"] = qid, ["clientId"] = "cli00000000000000001", ["customerName"] = "Sample Client", ["customerEmail"] = "client.one@example.test",
    ["itemName"] = "Bracket v2", ["material"] = "PETG", ["weightGrams"] = 42.5, ["printHours"] = 1.5, ["infillPercent"] = 25,
    ["quantity"] = 2, ["materialCost"] = 1.7, ["timeCost"] = 5.0, ["setupFee"] = 15.0, ["notes"] = "n",
});
Check(qu.Ok && Math.Abs(Json.Num(qu.Data, "total") - 43.4) < 0.001, "quote updated; total recalculated", qu.Error);
Check((await api.CallPostAsync("api/services.php?resource=quotes&action=update_status", new { id = qid, status = "sent" })).Ok, "quote marked sent");
var bad = await api.CallPostAsync("api/services.php?resource=quotes&action=update_status", new { id = qid, status = "paid" });
Check(!bad.Ok && bad.Error.Contains("Invalid quote status"), "invalid status refused with the server's message", bad.Error);
var q = (await api.CallGetAsync("api/services.php?resource=quotes&action=list")).Rows().Select(QuoteRow.From).First();
Check(q is { Number: "Q-0001", ItemName: "Bracket v2", Status: "sent", Quantity: 2, Infill: 25, ClientId: "cli00000000000000001", Material: "PETG" }
      && Math.Abs(q.Total - 43.4) < 0.001 && Math.Abs(q.WeightGrams - 42.5) < 0.001, "quote row parsed", JsonSerializer.Serialize(q));
Check((await api.CallPostAsync("api/services.php?resource=quotes&action=delete", new { id = qid })).Ok && N("SELECT COUNT(*) FROM print_quotes") == 0, "quote deleted");

Console.WriteLine("== api tokens");
var tc = await api.CallPostAsync("api/services.php?resource=tokens&action=create", new { label = "Harness laptop" });
var token = tc.Str("token");
Check(tc.Ok && token.StartsWith("zst_"), "token created and shown once", tc.Error);
var tl = (await api.CallGetAsync("api/services.php?resource=tokens&action=list")).Rows().Select(TokenRow.From).ToList();
Check(tl.Count == 1 && tl[0].Label == "Harness laptop" && tl[0].Scope == "testtag_push" && tl[0].LastUsed == "never", "token row parsed");
using (var h = new HttpClient())
{
    h.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
    var pull = await h.GetStringAsync(baseUrl + "/api/services.php?resource=testtag&action=pull");
    Check(pull.Contains("\"ok\":true"), "new token works for the test and tag app's pull");
}
Check((await api.CallGetAsync("api/services.php?resource=tokens&action=list")).Rows().Select(TokenRow.From).First().LastUsed != "never", "last used updated");
Check((await api.CallPostAsync("api/services.php?resource=tokens&action=revoke", new { id = tl[0].Id })).Ok, "token revoked");
using (var h = new HttpClient())
{
    h.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
    var res = await h.GetAsync(baseUrl + "/api/services.php?resource=testtag&action=pull");
    Check((int)res.StatusCode == 401, "revoked token no longer works");
}

Console.WriteLine("== deleting jobs from any device");
// A tester-app job pushed with a token (no session), like the phone does.
var devToken = (await api.CallPostAsync("api/services.php?resource=tokens&action=create", new { label = "Phone" })).Str("token");
async Task<(int Status, JsonElement Json)> TokenCall(string path, object? body = null)
{
    using var h = new HttpClient();
    h.DefaultRequestHeaders.Add("Authorization", "Bearer " + devToken);
    var res = body is null
        ? await h.GetAsync(baseUrl + "/" + path)
        : await h.PostAsync(baseUrl + "/" + path, new StringContent(JsonSerializer.Serialize(body), System.Text.Encoding.UTF8, "application/json"));
    var text = await res.Content.ReadAsStringAsync();
    return ((int)res.StatusCode, JsonDocument.Parse(text).RootElement.Clone());
}
var phoneJob = new { id = "phone-job-0001", externalId = "phone-job-0001", siteAddress = "Phone Site", testDate = "2026-09-24",
    items = new[] { new { description = "Drill", overallResult = "pass" } } };
var pushed = await TokenCall("api/services.php?resource=testtag&action=push", new { job = phoneJob });
Check(pushed.Status == 200, "phone pushes a job with its token");
await Sync();
var phoneLocal = Repository.GetJobs().FirstOrDefault(j => j.Id == "phone-job-0001");
Check(phoneLocal is not null, "the suite pulls the phone's job");

// The phone deletes it (token, by its own id - it may not know the server id).
var tdel = await TokenCall("api/services.php?resource=testtag&action=delete", new { externalId = "phone-job-0001" });
Check(tdel.Status == 200 && tdel.Json.GetProperty("data").GetProperty("deleted").GetBoolean(), "the phone can delete with its token (by externalId)");
Check(N("SELECT COUNT(*) FROM tt_jobs WHERE external_id='phone-job-0001'") == 0, "job gone from the server");
var pullAfter = await TokenCall("api/services.php?resource=testtag&action=pull");
Check(pullAfter.Json.GetProperty("deleted").EnumerateArray().Any(d => Json.Str(d, "externalId") == "phone-job-0001"),
    "pull tells every device it was deleted");
await Sync();
Check(!Repository.GetJobs().Any(j => j.Id == "phone-job-0001"), "the suite drops a job deleted on another device");

// Deleting it again (e.g. a second device) is fine.
var again = await TokenCall("api/services.php?resource=testtag&action=delete", new { externalId = "phone-job-0001" });
Check(again.Status == 200 && again.Json.GetProperty("data").GetProperty("alreadyGone").GetBoolean(), "deleting something already gone succeeds");

// A bad token can't delete.
var savedTok = devToken; devToken = "zst_not_a_real_token";
var badTok = await TokenCall("api/services.php?resource=testtag&action=delete", new { externalId = "x" });
Check(badTok.Status == 401, "an invalid token can't delete");
devToken = savedTok;

// Deleted in the admin panel (session) -> gone from the suite.
var adminVictim = Repository.GetJobs().First(j => !string.IsNullOrEmpty(j.ServerId));
var ad = await api.CallPostAsync("api/services.php?resource=testtag&action=delete", new { id = adminVictim.ServerId });
Check(ad.Ok, "admin panel delete still works (session)", ad.Error);
await Sync();
Check(!Repository.GetJobs().Any(j => j.Id == adminVictim.Id), "the suite drops a job deleted in the admin panel");

// Re-pushed after a delete: alive again, tombstone cleared.
await TokenCall("api/services.php?resource=testtag&action=push", new { job = phoneJob });
var pullRevived = await TokenCall("api/services.php?resource=testtag&action=pull");
Check(!pullRevived.Json.GetProperty("deleted").EnumerateArray().Any(d => Json.Str(d, "externalId") == "phone-job-0001")
      && pullRevived.Json.GetProperty("data").EnumerateArray().Any(j => Json.Str(j, "externalId") == "phone-job-0001"),
    "a job pushed again after deletion is live again (tombstone cleared)");
await Sync();
Check(Repository.GetJobs().Any(j => j.Id == "phone-job-0001"), "and the suite picks it back up");

// Deleted in the suite -> gone on the server, even before it was linked.
var suiteOnly = new Job { SiteAddress = "Suite delete test", TestDate = "2026-09-25", Items = { new Item { TagNumber = "T-900", Description = "Fan" } } };
Repository.SaveJob(suiteOnly);
await Sync();
Repository.DeleteJob(suiteOnly.Id);
await Sync();
Check(N("SELECT COUNT(*) FROM tt_jobs WHERE external_id=$1", suiteOnly.Id) == 0, "deleting in the suite deletes the server copy");

Console.WriteLine("== generator jobs, photos and signatures survive");
var genJob = new
{
    id = "gen-job-0001", externalId = "gen-job-0001", jobType = "generator_inspection", siteAddress = "Gen Site", testDate = "2026-09-24",
    generator = new { make = "Honda", model = "EU22i", kva = "2.2" },
    attachments = new object[] { new { kind = "signature", dataUrl = "data:image/png;base64,AAAA", name = "Client" }, new { kind = "photo", dataUrl = "data:image/jpeg;base64,BBBB", note = "Nameplate" } },
    meggerEquipment = "Megger MIT400", meggerCalibrationDate = "2026-01-10",
    items = new[] { new { description = "Generator", overallResult = "pass" } },
};
Check((await TokenCall("api/services.php?resource=testtag&action=push", new { job = genJob })).Status == 200, "phone pushes a generator report with photos and a signature");
await Sync();
var genLocal = Repository.GetJobs().FirstOrDefault(j => j.Id == "gen-job-0001");
Check(genLocal is { JobType: "generator_inspection" }, "the suite knows it's a generator inspection", genLocal?.JobType ?? "missing");
var gj = Repository.GetJob(genLocal!.Id)!; gj.SiteAddress = "Gen Site (edited in suite)"; Repository.SaveJob(gj);
await Sync();
var genPull = await TokenCall("api/services.php?resource=testtag&action=pull");
var gp = genPull.Json.GetProperty("data").EnumerateArray().First(j => Json.Str(j, "externalId") == "gen-job-0001");
Check(Json.Str(gp, "siteAddress") == "Gen Site (edited in suite)", "the suite's edit reached the server");
Check(Json.Str(gp, "jobType") == "generator_inspection" && gp.GetProperty("generator").GetProperty("make").GetString() == "Honda",
    "job type and generator details kept after the suite's edit");
Check(gp.GetProperty("attachments").GetArrayLength() == 2 && Json.Str(gp, "meggerEquipment") == "Megger MIT400",
    "photos, signature and insulation tester kept after the suite's edit");

Console.WriteLine("== parts: shop and link");
var partsRes = await api.CallGetAsync("api/parts.php?action=list");
var firstPart = PartsCatalogue.All().First();
firstPart.Supplier = "Jaycar"; firstPart.Url = "https://www.jaycar.com.au/240v-line-mains-power-plug/p/PP4000"; firstPart.Sku = "PP4000"; firstPart.CatalogueDirty = true;
PartsCatalogue.Save(firstPart);
await Sync();
var pl = (await api.CallGetAsync("api/parts.php?action=list")).Rows().First(p => Json.Str(p, "id") == firstPart.Id);
Check(Json.Str(pl, "supplier") == "Jaycar" && Json.Str(pl, "url").Contains("PP4000"), "part's shop and link reach the server");
// The web app saves parts without these fields; they must survive.
await TokenCall("api/parts.php?action=save", new { id = firstPart.Id, sku = "PP4000", name = firstPart.Name + " (web edit)", cost = 5.10 });
await Sync();
var afterWeb = PartsCatalogue.All().First(p => p.Id == firstPart.Id);
Check(afterWeb.Supplier == "Jaycar" && afterWeb.Url.Contains("PP4000") && afterWeb.Name.EndsWith("(web edit)"), "a web-app edit doesn't wipe the shop or link");
var badUrl = await TokenCall("api/parts.php?action=save", new { name = "x", url = "javascript:alert(1)" });
Check(badUrl.Status == 400, "only web links are accepted as a product link");
Check(PartsCatalogue.All().Where(p => p.Sku.Length == 7 && p.Supplier.Length == 0).All(p => p.SupplierOrGuess == "Bunnings"), "old parts with a Bunnings I/N count as Bunnings");
var restock = PartsCatalogue.RestockText(PartsCatalogue.All());
Check(restock.Contains("\nBunnings\n") && restock.Contains("\nJaycar\n"), "restock list is grouped by shop");

Console.WriteLine("== session expiry");
// Lose the CSRF token server-side: the client should refresh and retry (419 path).
foreach (var f in Directory.GetFiles(sessionsDir))
{
    var t = File.ReadAllText(f);
    var i = t.IndexOf("csrf|", StringComparison.Ordinal);
    if (i >= 0) File.WriteAllText(f, t.Replace(t.Substring(i, t.IndexOf(';', i) - i + 1), "csrf|s:64:\"" + new string('0', 64) + "\";"));
}
var retry = await api.CallPostAsync("api/data.php?resource=projects&action=delete", new { id = pid });
Check(retry.Ok, "stale CSRF token is refreshed and the call retried", retry.Error);

await api.SignOutAsync();
var afterOut = await api.CallGetAsync("api/services.php?resource=quotes&action=list");
Check(!afterOut.Ok && afterOut.Status == 401 && !api.IsSignedIn, "signed out: calls refused, state updated", afterOut.Error);
var syncOut = await sync.SyncAsync();
Check(!syncOut.Ok && syncOut.Message.Contains("Not signed in"), "sync while signed out says so", syncOut.Message);

// ============================================================ local features
Console.WriteLine("== job rules");
Job J(string id, string client, string site, string date) => new() { Id = id, ClientId = client, SiteAddress = site, TestDate = date };
var rj = JobRules.CurrentForRetest(new[]
{
    J("a", "c1", "1 Test St", "2025-01-10"), J("b", "c1", "1 TEST ST.", "2026-01-12"),   // same site, retested
    J("c", "c2", "5 Other Rd", "2025-03-01"),                                        // only visit
    J("d", "", "", "2024-01-01"),                                                    // no client or site: kept
});
Check(rj.Select(x => x.Id).OrderBy(x => x).SequenceEqual(new[] { "b", "c", "d" }), "a site retested since is no longer due (only its latest job counts)",
    string.Join(",", rj.Select(x => x.Id)));
Check(JobRules.NextTagAfter("T-001", new[] { "T-001", "T-002", "T-007" }) == "T-008", "next tag follows the highest used");
Check(JobRules.NextTagAfter("A0098", new[] { "A0099" }) == "A0100", "tag numbers keep their width");
Check(JobRules.LaterTag("T-050", "T-008") == "T-050", "saving an old job doesn't wind the roll back");
Check(JobRules.LaterTag("T-050", "T-051") == "T-051" && JobRules.LaterTag("T-050", "R-001") == "R-001", "roll moves on (or to a new roll)");
var testRates = new Rates();
var billJob = new Job { SiteAddress = "Bill St", Items =
{
    new Item { ItemType = "standard", PartId = firstPart.Id }, new Item { ItemType = "standard", PartId = firstPart.Id },
    new Item { ItemType = "power_tool" }, new Item { ItemType = "rcd" },
} };
var bl = JobRules.InvoiceLinesFor(billJob, testRates, PartsCatalogue.All(includeInactive: true), new());
Check(bl.Any(l => l.Description.StartsWith("Repair part fitted") && l.Quantity == 2), "parts fitted in the web app are billed from the job's items",
    string.Join(" | ", bl.Select(l => $"{l.Description} x{l.Quantity}")));
Check(bl[0].Rate == 120 && bl.Any(l => l.Description.StartsWith("Power tools") && l.Rate == 5) && bl.Any(l => l.Description.StartsWith("RCD") && l.Rate == 8),
    "call-out, power tool and RCD rates applied");

Console.WriteLine("== stock when a part is fitted");
{
    var stockPart = PartsCatalogue.All().First(p => !p.Consumable);
    stockPart.OnHand = 1; PartsCatalogue.Save(stockPart);
    PartsCatalogue.RecordUse("stock-job-1", "item-a", stockPart.Id, 3);
    Check(PartsCatalogue.All().First(p => p.Id == stockPart.Id).OnHand == 0, "fitting 3 with 1 on hand leaves 0", "");
    Check(PartsCatalogue.UsedOn("stock-job-1").Sum(u => u.Quantity) == 3, "all 3 are still billed", "");
    PartsCatalogue.ClearUsageFor("stock-job-1");
    var after = PartsCatalogue.All().First(p => p.Id == stockPart.Id).OnHand;
    Check(after == 1, "re-saving the job gives back only the 1 actually taken (no phantom stock)", after.ToString());
    stockPart = PartsCatalogue.All().First(p => p.Id == stockPart.Id); stockPart.OnHand = 5; PartsCatalogue.Save(stockPart);
    PartsCatalogue.RecordUse("stock-job-2", "item-b", stockPart.Id, 2);
    PartsCatalogue.ClearUsageFor("stock-job-2");
    after = PartsCatalogue.All().First(p => p.Id == stockPart.Id).OnHand;
    Check(after == 5, "normal fit and undo returns the count to where it was", after.ToString());
}

Console.WriteLine("== supplier pages");
var pi = Suppliers.Parse("\"{\\\"name\\\":\\\"DETA 10A White Plug Top\\\",\\\"sku\\\":\\\"4430411\\\",\\\"price\\\":\\\"3.78\\\",\\\"url\\\":\\\"https://www.bunnings.com.au/deta-10a-white-plug-top_p4430411\\\",\\\"isProduct\\\":true,\\\"priceGuessed\\\":false}\"");
Check(pi is { Name: "DETA 10A White Plug Top", Sku: "4430411", Price: 3.78, IsProduct: true, Supplier: "Bunnings" }, "reads what the page script returns (the real Bunnings result)",
    System.Text.Json.JsonSerializer.Serialize(pi));
Check(Suppliers.Parse("null") is null && Suppliers.Parse("garbage") is null, "bad results are ignored");
Check(Suppliers.SearchUrl("Jaycar", "mains plug") == "https://www.jaycar.com.au/search?q=mains%20plug"
      && Suppliers.SearchUrl("Bunnings", "4430411") == "https://www.bunnings.com.au/search/products?q=4430411", "search links for each shop");
Check(Suppliers.ShopFor("https://www.jaycar.com.au/x/p/PP4000") == "Jaycar" && Suppliers.ShopFor("https://evil.example/bunnings.com.au") == "", "works out the shop from a link");

Console.WriteLine("== find");
var hits = SearchService.Search("kettle");
Check(hits.Any(h => h.Kind == "Item" && h.Title.Contains("Kettle") && h.JobId == job.Id), "finds a tested item by description, pointing at its job");
Check(SearchService.Search(Repository.GetJob(job.Id)!.CertNumber).Any(h => h.Kind == "Job"), "finds a job by certificate number");
Check(SearchService.Search("T-002").Any(h => h.Kind == "Item"), "finds an item by tag number");
Check(SearchService.Search("Sample Client").Any(h => h.Kind == "Client"), "finds a client by name");
Check(SearchService.Search("x").Count == 0, "single letters don't search");

Console.WriteLine("== appliance library");
var lib = ApplianceLibrary.Load();
Check(lib.Count == 212, "default library has the web app's 212 appliances", lib.Count.ToString());
Check(lib.Any(a => a.Name == "Laptop Charger / Power Brick" && a.EquipmentClass == "II" && a.ItemType == "standard"), "class and type carried over");
Check(lib.Count(a => a.ItemType == "power_tool") == 52 && lib.Count(a => a.ItemType == "microwave") == 3 && lib.Count(a => a.ItemType == "rcd") == 3, "pricing types per category (52 power tools, 3 microwave, 3 RCD)");
lib.Add(new Appliance { Category = " Custom ", Name = "  Tattoo machine ", ItemType = "weird", EquipmentClass = "IV" });
lib.Add(new Appliance { Name = "   " });
ApplianceLibrary.Save(lib);
var lib2 = ApplianceLibrary.Load();
var tat = lib2.FirstOrDefault(a => a.Name == "Tattoo machine");
Check(lib2.Count == 213 && tat is { Category: "Custom", ItemType: "standard", EquipmentClass: "I" }, "save trims, drops blanks and fixes invalid type/class");
ApplianceLibrary.ResetToDefaults();
Check(ApplianceLibrary.Load().Count == 212, "reset to defaults");

Console.WriteLine("== filament");
var spool = new Spool { Material = "PETG", Colour = "Black", SpoolGrams = 1000, RemainingGrams = 350, CostPerKg = 32, LowAtGrams = 200 };
FilamentStock.Save(spool);
Check(FilamentStock.Use(spool.Id, 120, "Bracket for Q-0001") == 120, "use takes the grams");
var sp = FilamentStock.All().First(s => s.Id == spool.Id);
Check(sp.RemainingGrams == 230 && !sp.IsLow && sp.State == "in stock", "230 g left, not yet low");
FilamentStock.Use(spool.Id, 100, "Test print");
Check(FilamentStock.Low().Any(s => s.Id == spool.Id), "below the warning level shows as low");
Check(FilamentStock.Use(spool.Id, 999, "Too much") == 130 && FilamentStock.All().First(s => s.Id == spool.Id).State == "out", "can't go below zero; shows out");
FilamentStock.Use(spool.Id, -50, "Correction");
Check(FilamentStock.All().First(s => s.Id == spool.Id).RemainingGrams == 50, "negative use puts filament back");
Check(FilamentStock.Log().Count == 4 && FilamentStock.Log()[0].Note == "Correction", "every use is logged, newest first");

Console.WriteLine("== backup");
var bak = Path.Combine(Path.GetTempPath(), "suite-harness-backup.zsbackup");
File.Delete(bak);
var jobsBefore = Repository.GetJobs().Count;
var clientsBefore = Repository.GetClients().Count;
var info = BackupService.Export(bak);
Check(File.Exists(bak) && !File.Exists(bak + "-wal") && info.StartsWith($"{jobsBefore} job(s)"), "backup written as one file and described", info);
// change things, then restore
Repository.DeleteJob(Repository.GetJobs().First().Id);
FilamentStock.Delete(spool.Id);
Repository.SetSetting("TesterName", "Changed After Backup");
var safety = BackupService.Import(bak);
Check(Repository.GetJobs().Count == jobsBefore && Repository.GetClients().Count == clientsBefore, "restore brings back the jobs and clients");
Check(FilamentStock.All().Any(s => s.Id == spool.Id), "restore brings back filament");
Check(Repository.GetSetting("TesterName", "") != "Changed After Backup", "restore brings back settings");
Check(File.Exists(safety) && BackupService.Inspect(safety).Ok && BackupService.Inspect(safety).Message.StartsWith($"{jobsBefore - 1} job(s)"),
    "the data it replaced was saved first", BackupService.Inspect(safety).Message);
var notBackup = Path.Combine(Path.GetTempPath(), "not-a-backup.zsbackup");
File.WriteAllText(notBackup, "hello");
Check(!BackupService.Inspect(notBackup).Ok, "a random file is refused");
var threw = false;
try { BackupService.Import(notBackup); } catch (InvalidOperationException) { threw = true; }
Check(threw && Repository.GetJobs().Count == jobsBefore, "importing a bad file changes nothing");

Console.WriteLine();
Console.WriteLine($"{pass} passed, {fail} failed");
return fail == 0 ? 0 : 1;

async Task<SyncResult> Sync()
{
    var res = await sync.SyncAsync();
    if (!res.Ok) Console.WriteLine("   (sync) " + res.Message);
    return res;
}

long N0(string sql)
{
    using var c = Database.Open();
    using var cmd = c.CreateCommand();
    cmd.CommandText = sql;
    return Convert.ToInt64(cmd.ExecuteScalar() ?? 0);
}
