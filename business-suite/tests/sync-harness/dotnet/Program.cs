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

    // A site without files.php or the parts "receive" action yet.
    var www = Path.Combine(Path.GetDirectoryName(Path.GetFullPath(serverDb))!, "www", "api");
    File.Delete(Path.Combine(www, "files.php"));
    var pp = Path.Combine(www, "parts.php");
    File.WriteAllText(pp, File.ReadAllText(pp).Replace("case 'receive':", "case 'receive_not_yet':"));
    AttachmentStore.TesterSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    var oldInv = new Invoice { Number = "INV-OLD1", IssuedDate = "2026-09-28", DueDate = "2026-10-12", Status = "draft" };
    Repository.SaveInvoice(oldInv);
    AttachmentStore.SaveForOwner("invoice", oldInv.Id, new[] { new Attachment { Kind = "photo", DataUrl = AttachmentStore.TesterSignature } });
    await sync.SyncAsync();
    var op = PartsCatalogue.All().First(x => !x.Consumable);
    var opBefore = op.OnHand;
    PartsCatalogue.RecordPurchase(op, 2, op.Cost);
    var ors = await sync.SyncAsync();
    Check(!ors.Message.Contains("photos") && !ors.Message.Contains("signature") && AttachmentStore.TesterSignatureDirty,
        "without files.php: sync carries on quietly, photos and signature wait here", ors.Message);
    Check(N("SELECT on_hand FROM testtag_parts WHERE id=$1", op.Id) == opBefore + 2 && PartsCatalogue.UnsentPurchases().Count == 0,
        "without 'receive': stock bought is sent as a count instead", N("SELECT on_hand FROM testtag_parts WHERE id=$1", op.Id).ToString());
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

Console.WriteLine("== phone capture relay (photos and signatures from a phone)");
{
    const string Png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    // A site where capture-schema.sql was run by hand before label/mode existed.
    Srv("CREATE TABLE testtag_capture_tokens (id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, job_id VARCHAR(64) NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL)");

    var phone = new HttpClient(new HttpClientHandler { CookieContainer = new System.Net.CookieContainer() });
    async Task<(int Status, JsonElement Json)> Phone(string path, Dictionary<string, string>? form = null)
    {
        var res = form is null ? await phone.GetAsync(baseUrl + "/" + path)
                               : await phone.PostAsync(baseUrl + "/" + path, new FormUrlEncodedContent(form));
        return ((int)res.StatusCode, JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone());
    }

    var capJob = new Job { SiteAddress = "Capture Site", TestDate = "2026-09-25", Items = { new Item { TagNumber = "T-700", Description = "Kettle" } } };
    Repository.SaveJob(capJob);

    var (sess, serr) = await PhoneCapture.StartAsync(api, capJob.Id, "Job ZS123 - Capture Site", PhoneCapture.Modes.Signature);
    Check(sess is not null && sess.Url.Contains("/capture.html?t=") && sess.StartedAt.Length == 19,
        "the suite gets a phone link (and the old capture table gains label/mode)", serr);
    var tok = sess!.Url[(sess.Url.IndexOf("t=") + 2)..];

    var capInfo = await Phone("api/capture.php?action=session&token=" + tok);
    Check(capInfo.Status == 200 && Json.Str(capInfo.Json.GetProperty("data"), "label") == "Job ZS123 - Capture Site"
          && Json.Str(capInfo.Json.GetProperty("data"), "mode") == "signature", "the phone page learns what it's for, with no login");

    var photoOnSigLink = await Phone("api/capture.php?action=upload", new() { ["token"] = tok, ["kind"] = "photo", ["data"] = Png });
    Check(photoOnSigLink.Status == 400, "a signature-only link won't take photos");
    var notImage = await Phone("api/capture.php?action=upload", new() { ["token"] = tok, ["kind"] = "signature", ["data"] = "data:image/png;base64," + Convert.ToBase64String("<?php echo 1;"u8.ToArray()) });
    Check(notImage.Status == 400, "something that isn't really an image is refused");
    var up = await Phone("api/capture.php?action=upload", new() { ["token"] = tok, ["kind"] = "signature", ["data"] = Png, ["note"] = "Sam Sample" });
    Check(up.Status == 200, "the client's signature uploads");

    var (got, perr) = await PhoneCapture.PollAsync(api, capJob.Id, sess.StartedAt);
    Check(got.Count == 1 && got[0].IsSignature && got[0].Note == "Sam Sample" && got[0].DataUrl == Png, "the suite collects it, with the signer's name", perr);

    var (anon, _) = await PhoneCapture.PollAsync(new ApiClient(baseUrl), capJob.Id, "");
    Check(anon.Count == 0, "nobody else can collect it (poll needs the admin)");

    // (Timestamps are to the second; in use the next link is never made in the same second as an earlier upload.)
    Srv("UPDATE testtag_captures SET created_at = '2026-01-01 00:00:00'");
    // Two photos in the same second: the old "created_at > since" lost the second one.
    var (s2, _) = await PhoneCapture.StartAsync(api, capJob.Id, "Job ZS123", PhoneCapture.Modes.Both);
    var tok2 = s2!.Url[(s2.Url.IndexOf("t=") + 2)..];
    Check((await Phone("api/capture.php?action=session&token=" + tok)).Status == 403, "a new link replaces the last one for that job");
    await Phone("api/capture.php?action=upload", new() { ["token"] = tok2, ["kind"] = "photo", ["data"] = Png, ["note"] = "one" });
    var first = (await PhoneCapture.PollAsync(api, capJob.Id, s2.StartedAt)).Items;
    var since = first.Max(a => a.CreatedAt)!;
    await Phone("api/capture.php?action=upload", new() { ["token"] = tok2, ["kind"] = "photo", ["data"] = Png, ["note"] = "two" });
    Srv("UPDATE testtag_captures SET created_at = $1 WHERE note = 'two'", since); // force "same second"
    var second = (await PhoneCapture.PollAsync(api, capJob.Id, since)).Items;
    Check(second.Any(a => a.Note == "two"), "a second photo in the same second isn't lost");

    Check(sess.StartedAt.CompareTo(first[0].CreatedAt) <= 0 && (await PhoneCapture.PollAsync(api, capJob.Id, s2.StartedAt)).Items.All(a => !a.IsSignature),
        "a new link only brings what's sent after it (removed photos don't come back)");

    Srv("UPDATE testtag_capture_tokens SET expires_at = '2000-01-01 00:00:00'");
    var late = await Phone("api/capture.php?action=upload", new() { ["token"] = tok2, ["kind"] = "photo", ["data"] = Png });
    Check(late.Status == 403, "an expired link is refused");
    var (s3, _) = await PhoneCapture.StartAsync(api, "invoice-inv1", "Invoice INV-0001", PhoneCapture.Modes.Photos);
    Check(s3 is not null && N("SELECT COUNT(*) FROM testtag_capture_tokens WHERE expires_at < '2001-01-01'") == 0, "expired links are cleared out");
    var tok3 = s3!.Url[(s3.Url.IndexOf("t=") + 2)..];
    Check((await Phone("api/capture.php?action=upload", new() { ["token"] = tok3, ["kind"] = "signature", ["data"] = Png })).Status == 400,
        "a photos-only link won't take a signature");
    Srv("UPDATE testtag_captures SET created_at = '2001-01-01 00:00:00' WHERE note = 'one'");
    await PhoneCapture.StartAsync(api, "tester-signature", "", PhoneCapture.Modes.Tester);
    Check(N("SELECT COUNT(*) FROM testtag_captures WHERE note = 'one'") == 0, "relay copies older than 30 days are cleared");
}

Console.WriteLine("== photos and signatures sync with jobs (merged, not overwritten)");
{
    const string P = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    object Att(string id, string kind, string note = "") => new { id, kind, note, createdAt = "2026-09-25 01:00:00", dataUrl = P };
    async Task<List<string>> ServerIds(string ext)
    {
        var pull = await TokenCall("api/services.php?resource=testtag&action=pull");
        var j = pull.Json.GetProperty("data").EnumerateArray().First(x => Json.Str(x, "externalId") == ext);
        return j.GetProperty("attachments").EnumerateArray().Select(a => Json.Str(a, "id")).OrderBy(x => x).ToList();
    }
    List<string> LocalIds(string id) => AttachmentStore.Get(AttachmentStore.JobOwner, id).Select(a => a.Id).OrderBy(x => x).ToList();

    var mj = new { id = "att-job-0001", externalId = "att-job-0001", siteAddress = "Photo Site", testDate = "2026-09-25",
        attachments = new[] { Att("p1", "photo", "Switchboard") }, items = new[] { new { description = "Heater", overallResult = "pass" } } };
    await TokenCall("api/services.php?resource=testtag&action=push", new { job = mj });
    await Sync();
    Check(string.Join(",", LocalIds("att-job-0001")) == "p1" && AttachmentStore.Get("job", "att-job-0001")[0].Note == "Switchboard",
        "a phone's photo reaches the suite");

    // Suite: client signs on the laptop. Meanwhile the phone adds another photo.
    var attLocal = Repository.GetJob("att-job-0001")!;
    var list = AttachmentStore.Get("job", attLocal.Id);
    list.Add(new Attachment { Id = "s1", Kind = "signature", Note = "Sam Sample", DataUrl = P });
    Repository.SaveJob(attLocal);
    AttachmentStore.SaveForJob(attLocal.Id, list);
    await TokenCall("api/services.php?resource=testtag&action=push", new { job = new { mj.id, mj.externalId, mj.siteAddress, mj.testDate, mj.items,
        attachments = new[] { Att("p1", "photo", "Switchboard"), Att("p2", "photo", "Faulty lead") } } });
    await Sync();
    Check(string.Join(",", await ServerIds("att-job-0001")) == "p1,p2,s1", "the suite's signature and the phone's new photo are both kept",
        string.Join(",", await ServerIds("att-job-0001")));
    Check(string.Join(",", LocalIds("att-job-0001")) == "p1,p2,s1", "and the suite picks up the phone's photo", string.Join(",", LocalIds("att-job-0001")));

    // Removed in the suite -> removed on the server, nothing else touched.
    list = AttachmentStore.Get("job", attLocal.Id).Where(a => a.Id != "p1").ToList();
    Repository.SaveJob(Repository.GetJob(attLocal.Id)!);
    AttachmentStore.SaveForJob(attLocal.Id, list);
    await Sync();
    Check(string.Join(",", await ServerIds("att-job-0001")) == "p2,s1", "a photo removed in the suite is removed on the website");

    // An ordinary edit in the suite doesn't resend (or overwrite) the photos.
    await TokenCall("api/services.php?resource=testtag&action=push", new { job = new { mj.id, mj.externalId, mj.siteAddress, mj.testDate, mj.items,
        attachments = new[] { Att("p2", "photo"), Att("s1", "signature", "Sam Sample"), Att("p3", "photo") } } });
    var ed = Repository.GetJob(attLocal.Id)!; ed.SiteAddress = "Photo Site (edited)"; Repository.SaveJob(ed);
    AttachmentStore.SaveForJob(ed.Id, AttachmentStore.Get("job", ed.Id)); // unchanged list: not marked
    await Sync();
    Check(string.Join(",", await ServerIds("att-job-0001")) == "p2,p3,s1", "editing a job's details leaves the website's photos alone");
    Check(LocalIds("att-job-0001").Contains("p3"), "and the new phone photo still comes down");

    var badAtt = await TokenCall("api/services.php?resource=testtag&action=push", new { job = new { mj.id, mj.externalId, mj.siteAddress, mj.testDate, mj.items,
        attachments = new object[] { Att("p2", "photo"), new { id = "x1", kind = "photo", dataUrl = "javascript:alert(1)" } } } });
    Check(badAtt.Status == 200 && string.Join(",", await ServerIds("att-job-0001")) == "p2", "entries that aren't images are dropped");
}

Console.WriteLine("== photos on invoices, tester signature");
{
    const string P = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    AttachmentStore.Set(AttachmentStore.InvoiceOwner, "invAtts-a", new[]
    {
        new Attachment { Id = "a", Kind = "photo", DataUrl = P, Note = "Before" },
        new Attachment { Id = "b", Kind = "photo", DataUrl = "not an image" },
        new Attachment { Id = "c", Kind = "signature", DataUrl = P, Note = "Old", CreatedAt = "2026-09-01 10:00:00" },
        new Attachment { Id = "d", Kind = "signature", DataUrl = P, Note = "New", CreatedAt = "2026-09-20 10:00:00" },
    });
    var invAtts = AttachmentStore.Get(AttachmentStore.InvoiceOwner, "invAtts-a");
    Check(invAtts.Count == 3 && invAtts[0].Note == "Before", "invoice photos are kept, in order, and junk is skipped");
    Check(AttachmentStore.LatestSignature(invAtts)?.Note == "New", "the latest signature is the one that prints");
    AttachmentStore.TesterSignature = "http://example.test/x.png";
    Check(AttachmentStore.TesterSignature == "", "the tester signature must be an image");
    AttachmentStore.TesterSignature = P;
    Check(AttachmentStore.TesterSignature == P, "tester signature saved");
    Check(new Attachment { DataUrl = P }.Bytes()?.Length > 60 && new Attachment { DataUrl = "data:image/png;base64,@@" }.Bytes() is null, "image bytes decode (badAtt data gives none)");
}

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

Console.WriteLine("== invoice photos stored on the server (compressed, on disk)");
{
    // A real phone-sized photo: 3000x2000 JPEG made by PHP's GD.
    var gen = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("php", new[] { "-r",
        "$i=imagecreatetruecolor(3000,2000);for($x=0;$x<3000;$x+=6)for($y=0;$y<2000;$y+=6){imagefilledrectangle($i,$x,$y,$x+5,$y+5,imagecolorallocate($i,($x*7+$y)%256,($y*3)%256,($x+$y*5)%256));}ob_start();imagejpeg($i,null,97);echo base64_encode(ob_get_clean());" })
        { RedirectStandardOutput = true })!;
    var bigJpeg = "data:image/jpeg;base64," + (await gen.StandardOutput.ReadToEndAsync()).Trim();
    await gen.WaitForExitAsync();
    const string P = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    var filesDir = Path.Combine(Path.GetDirectoryName(Path.GetFullPath(serverDb))!, "www", "testtag_uploads", "files");

    var pInv = new Invoice { ClientId = alice.Id, Number = "INV-0100", IssuedDate = "2026-09-28", DueDate = "2026-10-12", Status = "draft",
        LinesJson = InvoiceLines.Write(new[] { new InvoiceLines.Line("Repair", 1, 60) }), Subtotal = 60, Total = 60 };
    Repository.SaveInvoice(pInv);
    AttachmentStore.SaveForOwner("invoice", pInv.Id, new[]
    {
        new Attachment { Id = "ph-1", Kind = "photo", Note = "Before", DataUrl = bigJpeg },
        new Attachment { Id = "ph-2", Kind = "photo", Note = "After", DataUrl = P },
    });
    var sr = await Sync();
    Check(N("SELECT COUNT(*) FROM zs_files WHERE owner_type='invoice' AND owner_id=$1", pInv.Id) == 2,
        "a draft invoice's photos go to the server (it doesn't wait for the invoice)", sr.Message);
    var stored = Path.Combine(filesDir, S("SELECT filename FROM zs_files WHERE id='ph-1'"));
    var bigBytes = Convert.FromBase64String(bigJpeg[(bigJpeg.IndexOf(',') + 1)..]).Length;
    Check(File.Exists(stored) && new FileInfo(stored).Length < bigBytes / 3,
        $"stored on disk and compressed ({bigBytes / 1024} KB -> {(File.Exists(stored) ? new FileInfo(stored).Length / 1024 : 0)} KB)");
    var dims = S("SELECT bytes FROM zs_files WHERE id='ph-1'");
    using (var probe = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("php", new[] { "-r", "$s=getimagesize($argv[1]);echo $s[0].'x'.$s[1];", stored }) { RedirectStandardOutput = true })!)
    {
        var wh = (await probe.StandardOutput.ReadToEndAsync()).Trim();
        Check(wh == "1600x1067", "shrunk to 1600 px on the long side", wh);
    }
    Check(S("SELECT COUNT(*) FROM zs_files WHERE id='ph-1'") == "1" && !Directory.GetFiles(filesDir).Any(f => f.EndsWith(".png") && f.Contains("ph-1")), "one file per photo");

    // Issue it: the server id is recorded against the photos.
    pInv = Repository.GetInvoices().First(i => i.Id == pInv.Id); pInv.Status = "due"; Repository.SaveInvoice(pInv);
    await Sync();
    pInv = Repository.GetInvoices().First(i => i.Id == pInv.Id);
    Check(!string.IsNullOrEmpty(pInv.ServerId) && N("SELECT COUNT(*) FROM zs_files WHERE owner_ref=$1", pInv.ServerId!) == 2,
        "once issued, the photos are tied to the website's invoice too");

    // Another device adds a photo; this PC removes one of its own. Both happen.
    Check((await TokenCall("api/files.php?action=save", new { id = "ph-3", ownerType = "invoice", ownerId = pInv.Id, kind = "photo", note = "From the phone", dataUrl = P })).Status == 200,
        "another device can add a photo with its token");
    AttachmentStore.SaveForOwner("invoice", pInv.Id, AttachmentStore.Get("invoice", pInv.Id).Where(a => a.Id != "ph-2"));
    await Sync();
    var ids = string.Join(",", AttachmentStore.Get("invoice", pInv.Id).Select(a => a.Id).OrderBy(x => x));
    Check(ids == "ph-1,ph-3" && N("SELECT COUNT(*) FROM zs_files WHERE owner_type='invoice'") == 2,
        "removed here -> removed on the server; added elsewhere -> arrives here", ids);
    Check(!Directory.GetFiles(filesDir).Any(f => Path.GetFileName(f).StartsWith("ph-2")), "the removed photo's file is deleted from disk");

    // A new PC: the invoice comes down from the website with a new local id - its photos follow.
    using (var lc = new SqliteConnection("Data Source=" + localDb))
    {
        lc.Open();
        using var cmd = lc.CreateCommand();
        cmd.CommandText = "DELETE FROM Invoices WHERE Id=$i; DELETE FROM Attachments WHERE OwnerId=$i; DELETE FROM AttachmentSync WHERE OwnerId=$i;";
        cmd.Parameters.AddWithValue("$i", pInv.Id);
        cmd.ExecuteNonQuery();
    }
    await Sync();
    var invAgain = Repository.GetInvoices().FirstOrDefault(i => i.ServerId == pInv.ServerId);
    var againAtts = invAgain is null ? new List<Attachment>() : AttachmentStore.Get("invoice", invAgain.Id);
    Check(invAgain is not null && invAgain.Id != pInv.Id && againAtts.Count == 2 && againAtts.Any(a => a.Note == "Before" && a.DataUrl.StartsWith("data:image/jpeg")),
        "on a new PC the invoice's photos come back with it", $"{againAtts.Count}");

    var noAuth = await new HttpClient().GetAsync(baseUrl + "/api/files.php?action=list&ownerType=invoice");
    Check((int)noAuth.StatusCode == 401, "the file store needs the admin or a token");
    var notImg = await TokenCall("api/files.php?action=save", new { id = "x-1", ownerType = "invoice", ownerId = "abc", kind = "photo",
        dataUrl = "data:image/png;base64," + Convert.ToBase64String("<?php phpinfo();"u8.ToArray()) });
    Check(notImg.Status == 400, "something that isn't an image is refused");
    var badId = await TokenCall("api/files.php?action=save", new { id = "../../x", ownerType = "invoice", ownerId = "abc", kind = "photo", dataUrl = P });
    Check(badId.Status == 400, "a file id can't be a path");
}

Console.WriteLine("== one tester signature for every app");
{
    const string A = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    string Sig(int shade)
    {
        var p = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("php", new[] { "-r",
            $"$i=imagecreatetruecolor(300,100);imagefill($i,0,0,imagecolorallocate($i,255,255,255));imageline($i,10,50,290,{shade},imagecolorallocate($i,0,0,0));ob_start();imagepng($i);echo base64_encode(ob_get_clean());" })
            { RedirectStandardOutput = true })!;
        var b = p.StandardOutput.ReadToEnd().Trim(); p.WaitForExit();
        return "data:image/png;base64," + b;
    }
    // (An earlier test set a signature here that hasn't been synced.)
    await Sync();
    var g1 = await TokenCall("api/files.php?action=tester_get");
    var v1 = Json.Str(g1.Json.GetProperty("data"), "version");
    Check(v1.Length > 0 && Json.Str(g1.Json.GetProperty("data"), "dataUrl").StartsWith("data:image/png"), "the suite's signature is stored on the server");

    // Drawn on the phone (the web app sends it with its token).
    var phoneSig = Sig(20);
    var set = await TokenCall("api/files.php?action=tester_set", new { dataUrl = phoneSig });
    Check(set.Status == 200 && Json.Str(set.Json.GetProperty("data"), "version") != v1, "the phone saves a new signature");
    await Sync();
    var suiteSig = AttachmentStore.TesterSignature;
    Check(suiteSig.StartsWith("data:image/png") && suiteSig != A && !AttachmentStore.TesterSignatureDirty, "the suite picks up the phone's signature");

    // Signed through a tester QR link: saved for everyone straight away.
    var (ts, _) = await PhoneCapture.StartAsync(api, PhoneCapture.TesterRecord, "", PhoneCapture.Modes.Tester);
    var ttok = ts!.Url[(ts.Url.IndexOf("t=") + 2)..];
    var linkSig = Sig(90);
    using (var ph = new HttpClient())
        await ph.PostAsync(baseUrl + "/api/capture.php?action=upload", new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = ttok, ["kind"] = "signature", ["data"] = linkSig }));
    await Sync();
    Check(AttachmentStore.TesterSignature != suiteSig && AttachmentStore.TesterSignature.StartsWith("data:image/png"),
        "a signature from a phone QR link becomes the signature everywhere");

    // Changed in the suite -> sent; cleared -> cleared everywhere.
    AttachmentStore.TesterSignature = Sig(60);
    Check(AttachmentStore.TesterSignatureDirty, "a change here waits to be sent");
    await Sync();
    var g2 = await TokenCall("api/files.php?action=tester_get");
    Check(!AttachmentStore.TesterSignatureDirty && Json.Str(g2.Json.GetProperty("data"), "version") == AttachmentStore.TesterSignatureVersion,
        "sent, and the versions agree");
    AttachmentStore.TesterSignature = "";
    await Sync();
    var g3 = await TokenCall("api/files.php?action=tester_get");
    Check(Json.Str(g3.Json.GetProperty("data"), "dataUrl") == "" && Json.Str(g3.Json.GetProperty("data"), "version").Length > 0,
        "clearing it clears it for every app");
    Check((await TokenCall("api/files.php?action=delete", new { id = "tester-signature" })).Status == 400, "the signature can't be deleted as a plain file");
}

Console.WriteLine("== buying stock");
{
    await Sync();
    var bp = PartsCatalogue.All().First(p => !p.Consumable);
    var before = bp.OnHand;
    var serverBefore = N("SELECT on_hand FROM testtag_parts WHERE id=$1", bp.Id);
    Check(serverBefore == before, "start: suite and website agree on the count", $"{before} vs {serverBefore}");
    PartsCatalogue.RecordPurchase(bp, 3, bp.Cost + 1.25);
    var after = PartsCatalogue.All().First(p => p.Id == bp.Id);
    Check(after.OnHand == before + 3 && Math.Abs(after.Cost - (bp.Cost + 1.25)) < 0.001 && after.CatalogueDirty,
        "bought 3: in stock straight away, and the new price becomes the cost");

    // Meanwhile the phone fits one (the website's count drops by one).
    Srv("UPDATE testtag_parts SET on_hand = on_hand - 1 WHERE id = $1", bp.Id);
    await Sync();
    Check(N("SELECT on_hand FROM testtag_parts WHERE id=$1", bp.Id) == before - 1 + 3, "the website adds the 3 to its count (the phone's fit isn't undone)",
        N("SELECT on_hand FROM testtag_parts WHERE id=$1", bp.Id).ToString());
    Check(PartsCatalogue.All().First(p => p.Id == bp.Id).OnHand == before + 2, "and the suite shows the same");
    Check(Math.Abs(Convert.ToDouble(Srv("SELECT cost FROM testtag_parts WHERE id=$1", bp.Id)) - (bp.Cost + 1.25)) < 0.001, "the new cost reaches the website");

    var purchaseId = PartsCatalogue.Purchases().First().Id;
    var dup = await TokenCall("api/parts.php?action=receive", new { id = purchaseId, partId = bp.Id, quantity = 3 });
    Check(dup.Status == 200 && N("SELECT on_hand FROM testtag_parts WHERE id=$1", bp.Id) == before + 2, "a repeated send doesn't add it twice");

    // Bought for a brand-new part (not on the website yet).
    var np = new Part { Name = "Harness test fuse 5A", Cost = 2, Sell = 8, OnHand = 0, LowAt = 1, CatalogueDirty = true };
    PartsCatalogue.Save(np);
    PartsCatalogue.RecordPurchase(np, 10, 1.8, "Jaycar");
    await Sync();
    Check(N("SELECT on_hand FROM testtag_parts WHERE id=$1", np.Id) == 10 && PartsCatalogue.UnsentPurchases().Count == 0,
        "a new part's first stock arrives with it");

    // A pull while a purchase is still unsent keeps it counted.
    var hp = PartsCatalogue.All().First(p => p.Id == bp.Id);
    PartsCatalogue.RecordPurchase(hp, 2, hp.Cost);
    var serverList = (await api.CallGetAsync("api/parts.php?action=list")).Rows().Select(r => new Part
    {
        Id = Json.Str(r, "id"), Sku = Json.Str(r, "sku"), Name = Json.Str(r, "name"), Cost = Json.Num(r, "cost"), Sell = Json.Num(r, "sell"),
        OnHand = (int)Json.Num(r, "onHand"), LowAt = (int)Json.Num(r, "lowAt"), Active = Json.Bool(r, "active"),
    }).ToList();
    PartsCatalogue.ReplaceFromServer(serverList);
    Check(PartsCatalogue.All().First(p => p.Id == bp.Id).OnHand == before + 4, "a refresh from the website before sending keeps the unsent purchase counted");
    await Sync();
    var hist = (await api.CallGetAsync("api/parts.php?action=purchases")).Rows().ToList();
    Check(hist.Count == 3 && hist.Any(h => Json.Str(h, "supplier") == "Jaycar" && Json.Num(h, "quantity") == 10), "the website keeps the purchase history");
    Check(PartsCatalogue.Purchases().Count == 3 && PartsCatalogue.Purchases().All(p => p.Sent), "and the suite's history shows them all counted");
    var badQty = await TokenCall("api/parts.php?action=receive", new { id = "zz1", partId = bp.Id, quantity = 0 });
    Check(badQty.Status == 400, "buying zero is refused");
    Check(PartsCatalogue.SuggestedBuy(new Part { OnHand = 0, LowAt = 2 }) == 3 && PartsCatalogue.SuggestedBuy(new Part { OnHand = 5, LowAt = 2 }) == 1,
        "suggested quantity gets back above the warning level");
    Check(PartsCatalogue.BuyLink(new Part { Sku = "4430411", Name = "Plug" }).StartsWith("https://www.bunnings.com.au/search/products?q=4430411")
        && PartsCatalogue.BuyLink(new Part { Url = "https://www.jaycar.com.au/p/PP4000" }) == "https://www.jaycar.com.au/p/PP4000",
        "buy links go to the product page, or a search at its shop");
}

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
Check(bl[0].Rate == 30 && bl.Any(l => l.Description.StartsWith("Items tested") && l.Quantity == 2 && l.Rate == 5) && bl.Any(l => l.Description.StartsWith("Power tools") && l.Rate == 8) && bl.Any(l => l.Description.StartsWith("RCD") && l.Rate == 10),
    "call-out, power tool and RCD rates applied");

Console.WriteLine("== Amazon");
Check(Suppliers.SearchUrl("Amazon", "iec lead 2m") == "https://www.amazon.com.au/s?k=iec%20lead%202m", "Amazon search link");
Check(Suppliers.ShopFor("https://www.amazon.com.au/dp/B0ABCDEF12") == "Amazon" && Suppliers.Names.Contains("Amazon"), "Amazon pages are recognised, and it's in the shop lists");
Check(Suppliers.AmazonAsin("b0abcdef12", "") == "B0ABCDEF12" && Suppliers.AmazonAsin("", "https://www.amazon.com.au/Some-Lead/dp/B0ABCDEF12/ref=sr_1_3?x=1") == "B0ABCDEF12"
      && Suppliers.AmazonAsin("4430411", "https://www.bunnings.com.au/x_p4430411") == "", "ASIN from the item no. or the link (not a Bunnings number)");
Check(Suppliers.AmazonCartUrl(new[] { ("B0ABCDEF12", 2), ("B0ZZZZZZZ9", 1), ("B0ABCDEF12", 1), ("bad", 5) })
      == "https://www.amazon.com.au/gp/aws/cart/add.html?ASIN.1=B0ABCDEF12&Quantity.1=3&ASIN.2=B0ZZZZZZZ9&Quantity.2=1",
      "one cart link for all Amazon items, quantities combined", Suppliers.AmazonCartUrl(new[] { ("B0ABCDEF12", 2) }) ?? "");
Check(Suppliers.AmazonCartUrl(new[] { ("", 1) }) is null, "no cart link when nothing has an ASIN");
Check(new Part { Sku = "B0ABCDEF12" }.SupplierOrGuess == "Amazon" && PartsCatalogue.BuyLink(new Part { Sku = "B0ABCDEF12", Supplier = "Amazon" }) == "https://www.amazon.com.au/dp/B0ABCDEF12",
      "a part with an ASIN counts as Amazon and links to its page");
var az = Suppliers.Parse(System.Text.Json.JsonSerializer.Serialize(System.Text.Json.JsonSerializer.Serialize(new { name = "IEC Power Lead 2m", sku = "B0ABCDEF12", price = "$12.95", url = "https://www.amazon.com.au/dp/B0ABCDEF12", isProduct = true, priceGuessed = false })));
Check(az is { Name: "IEC Power Lead 2m", Sku: "B0ABCDEF12", Price: 12.95, Supplier: "Amazon" }, "reads an Amazon page result (\"$12.95\")");

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
