using System.Globalization;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using ZoltanStudios.Suite.Models;

namespace ZoltanStudios.Suite.Services;

public sealed record SyncResult(bool Ok, int Pushed, int Pulled, string Message, int Failed = 0);

/// <summary>
/// Reconciles the local database with zoltanstudios.au.
///
/// Single user, so this is deliberately simple: push anything queued, then
/// pull everything and take the server's copy unless a local change to that
/// row is still waiting to go up.
///
/// Every field name below was read from the PHP (data.php, _testtag.php), not
/// guessed. The ids: the server's id for a row is kept in ServerId; a job also
/// sends the suite's own id as externalId so the server can recognise it.
/// </summary>
public sealed class SyncService
{
    private readonly ApiClient _api;

    public SyncService(ApiClient api) => _api = api;

    public bool IsBusy { get; private set; }

    public async Task<SyncResult> SyncAsync(CancellationToken ct = default)
    {
        if (IsBusy) return new SyncResult(false, 0, 0, "A sync is already running.");
        IsBusy = true;
        try
        {
            if (!_api.IsSignedIn && !await _api.RestoreSessionAsync(ct))
                return new SyncResult(false, 0, 0, "Not signed in. Use Sync ▸ Sync Settings to connect.");

            // Pull clients before pushing so a new local client whose email is
            // already on the server links to that account instead of failing.
            var pulled = await PullClientsAsync(ct);
            var (pushed, failed) = await PushAsync(ct);
            pulled += await PullAsync(ct);
            // After the pull, so the first sync can match local parts to the
            // server's (by I/N) before any edits are sent against them.
            pushed += await PushPartsAsync(ct);

            Repository.SetSetting("LastSync", DateTime.Now.ToString("s"));
            var msg = $"Synced. {pushed} sent, {pulled} received.";
            if (failed > 0) msg += $" {failed} change(s) couldn't be sent - see Settings ▸ Sync problems.";
            return new SyncResult(failed == 0, pushed, pulled, msg, failed);
        }
        catch (Exception ex)
        {
            return new SyncResult(false, 0, 0, "Sync failed: " + ex.Message);
        }
        finally
        {
            IsBusy = false;
        }
    }

    // ------------------------------------------------------------------ push

    private sealed record Outcome(bool Ok, string Error)
    {
        public static readonly Outcome Done = new(true, "");
        public static Outcome Fail(string e) => new(false, e);
        public static Outcome From(ApiResult r) => r.Ok ? Done : new(false, r.Error);
    }

    /// <summary>
    /// Sends queued local changes. A row that fails stays in the queue with
    /// the server's reason recorded rather than being dropped, so nothing is
    /// silently lost - that failure mode caused real trouble in the web app.
    /// </summary>
    private async Task<(int sent, int failed)> PushAsync(CancellationToken ct)
    {
        int sent = 0, failed = 0;

        var pending = new List<(long id, string table, string rowId, string op, int attempts)>();
        using (var c = Database.Open())
        using (var cmd = c.CreateCommand())
        {
            // Clients first: invoices and jobs refer to them by server id.
            cmd.CommandText = """
                SELECT Id, TableName, RowId, Operation, Attempts FROM SyncQueue
                ORDER BY CASE TableName WHEN 'Clients' THEN 0 ELSE 1 END, Id LIMIT 500
                """;
            using var r = cmd.ExecuteReader();
            while (r.Read())
                pending.Add((r.GetInt64(0), r.GetString(1), r.GetString(2), r.GetString(3), r.GetInt32(4)));
        }

        foreach (var (queueId, table, rowId, op, attempts) in pending)
        {
            ct.ThrowIfCancellationRequested();

            Outcome result;
            try
            {
                result = table switch
                {
                    "Jobs" => await PushJobAsync(rowId, op, ct),
                    "Clients" => await PushClientAsync(rowId, op, ct),
                    "Invoices" => await PushInvoiceAsync(rowId, op, ct),
                    "Appointments" => await PushAppointmentAsync(rowId, op, ct),
                    _ => Outcome.Fail("Unknown table " + table),
                };
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                result = Outcome.Fail(ex.Message);
            }

            using var c = Database.Open();
            using var upd = c.CreateCommand();
            if (result.Ok)
            {
                upd.CommandText = "DELETE FROM SyncQueue WHERE Id = $id";
                upd.Parameters.AddWithValue("$id", queueId);
                sent++;
            }
            else
            {
                upd.CommandText = "UPDATE SyncQueue SET Attempts = $a, LastError = $e WHERE Id = $id";
                upd.Parameters.AddWithValue("$id", queueId);
                upd.Parameters.AddWithValue("$a", attempts + 1);
                upd.Parameters.AddWithValue("$e", result.Error);
                failed++;
            }
            upd.ExecuteNonQuery();
        }

        return (sent, failed);
    }

    // ------------------------------------------------------------------ jobs

    private async Task<Outcome> PushJobAsync(string jobId, string op, CancellationToken ct)
    {
        var job = Repository.GetJobs(includeItems: false, includeDeleted: true).FirstOrDefault(j => j.Id == jobId);
        if (job is null) return Outcome.Done; // gone locally; nothing to send

        if (op == "delete" || job.Deleted)
        {
            if (op != "delete") return Outcome.Done;               // deleted before it was ever sent
            if (string.IsNullOrEmpty(job.ServerId)) return Outcome.Done;
            var del = await _api.CallPostAsync("api/services.php?resource=testtag&action=delete",
                new { id = job.ServerId }, ct);
            return Outcome.From(del);
        }

        job.Items = Repository.GetItems(job.Id);
        var client = string.IsNullOrEmpty(job.ClientId) ? null
            : Repository.GetClients(includeDeleted: true).FirstOrDefault(c => c.Id == job.ClientId);

        var payload = new
        {
            job = new
            {
                // services.php finds the job by its server id, else by externalId.
                id = job.ServerId ?? "",
                externalId = job.Id,
                certNumber = job.CertNumber,
                clientId = string.IsNullOrEmpty(client?.ServerId) ? null : client!.ServerId,
                clientName = client?.Name ?? "",
                clientCompany = client?.Company ?? "",
                clientEmail = client?.Email ?? "",
                clientPhone = client?.Phone ?? "",
                siteAddress = job.SiteAddress,
                environment = job.Environment,
                retestMonths = job.RetestMonths,
                testDate = job.TestDate,
                testerName = job.TesterName,
                testerLicense = job.TesterLicence,
                status = job.Status,
                source = "desktop",
                items = job.Items.Select(i => new
                {
                    assetId = i.TagNumber,
                    itemType = i.ItemType,
                    description = i.Description,
                    makeModel = i.MakeModel,
                    serialNumber = i.SerialNumber,
                    location = i.Location,
                    equipmentClass = i.EquipmentClass,
                    visual = i.Visual,
                    earthContinuity = i.EarthContinuity,
                    insulationResistance = i.InsulationResistance,
                    insulationTestVoltage = i.InsulationVoltage,
                    leakageCurrent = i.LeakageCurrent,
                    rcdTest = i.RcdTest,
                    overallResult = i.Result,
                    overrideResult = i.ResultOverridden,
                    partId = i.PartId,
                    notes = i.Notes,
                }).ToArray(),
            },
        };

        var res = await _api.CallPostAsync("api/services.php?resource=testtag&action=job_save", payload, ct);
        if (!res.Ok) return Outcome.From(res);

        // Remember the server's id and certificate number, and take its
        // timestamp so the pull that follows doesn't treat this as newer.
        Repository.SetJobServerInfo(job.Id, res.Str("id"), res.Str("certNumber"), ToLocalStamp(res.Str("lastUpdated")));
        return Outcome.Done;
    }

    // ---------------------------------------------------------------- clients

    private async Task<Outcome> PushClientAsync(string id, string op, CancellationToken ct)
    {
        var c = Repository.GetClients(includeDeleted: true).FirstOrDefault(x => x.Id == id);
        if (c is null) return Outcome.Done;

        if (op == "delete")
        {
            if (string.IsNullOrEmpty(c.ServerId)) return Outcome.Done;
            return Outcome.From(await _api.CallPostAsync("api/data.php?resource=users&action=deactivate",
                new { id = c.ServerId }, ct));
        }
        if (c.Deleted) return Outcome.Done;

        if (c.Email.Trim().Length == 0)
            return Outcome.Fail($"Client \"{c.Name}\" has no email address. The website needs one to create their account.");

        var form = new Dictionary<string, object>
        {
            ["email"] = c.Email.Trim(),
            ["firstName"] = FirstName(c.Name),
            ["lastName"] = LastName(c.Name),
            ["company"] = c.Company,
            ["phone"] = c.Phone,
        };

        if (!string.IsNullOrEmpty(c.ServerId))
        {
            form["id"] = c.ServerId;
            var up = await _api.CallPostAsync("api/data.php?resource=users&action=update", form, ct);
            if (!up.Ok && up.Error.StartsWith("Unknown action", StringComparison.OrdinalIgnoreCase))
                return Outcome.Fail("The website's data.php is older than this app and can't update clients. Upload the new api/data.php.");
            return Outcome.From(up);
        }

        // users/create insists on a password (10+ characters). The client
        // never needs it: they set their own with "Forgot password" if they
        // ever want to log in to the portal.
        form["password"] = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(18));

        var res = await _api.CallPostAsync("api/data.php?resource=users&action=create", form, ct);
        if (res.Ok)
        {
            c.ServerId = res.Str("id");
            Repository.SaveClientQuiet(c);
            return Outcome.Done;
        }

        // Already has an account (e.g. signed up on the website): link to it.
        if (res.Status == 409)
        {
            var users = await _api.CallGetAsync("api/data.php?resource=users&action=list", ct);
            var match = users.Rows().FirstOrDefault(u =>
                string.Equals(Json.Str(u, "email"), c.Email.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match.ValueKind == JsonValueKind.Object)
            {
                c.ServerId = Json.Str(match, "id");
                Repository.SaveClientQuiet(c);
                return Outcome.Done;
            }
        }
        return Outcome.From(res);
    }

    // --------------------------------------------------------------- invoices

    private async Task<Outcome> PushInvoiceAsync(string id, string op, CancellationToken ct)
    {
        var inv = Repository.GetInvoices(includeDeleted: true).FirstOrDefault(x => x.Id == id);
        if (inv is null) return Outcome.Done;

        if (op == "delete")
        {
            if (string.IsNullOrEmpty(inv.ServerId)) return Outcome.Done;
            return Outcome.From(await _api.CallPostAsync("api/data.php?resource=invoices&action=delete",
                new { id = inv.ServerId }, ct));
        }
        if (inv.Deleted) return Outcome.Done;

        var status = Invoice.Normalise(inv.Status);

        // A draft stays in the suite. It's queued again when its status changes.
        if (status == "draft") return Outcome.Done;

        // After issuing, only the status can change on the server - data.php
        // has no invoice edit. The lines and amounts are fixed once sent.
        if (!string.IsNullOrEmpty(inv.ServerId))
        {
            return Outcome.From(await _api.CallPostAsync("api/data.php?resource=invoices&action=update_status",
                new { id = inv.ServerId, status }, ct));
        }

        var client = string.IsNullOrEmpty(inv.ClientId) ? null
            : Repository.GetClients(includeDeleted: true).FirstOrDefault(c => c.Id == inv.ClientId);
        if (client is null)
            return Outcome.Fail($"Invoice {inv.Number} has no client. The website files every invoice under a client account - pick one and save.");
        if (string.IsNullOrEmpty(client.ServerId))
            return Outcome.Fail($"Invoice {inv.Number}: client \"{client.Name}\" isn't on the website yet (does it have an email address?).");

        var items = InvoiceLines.Read(inv.LinesJson);
        // GST isn't a separate field on the server; it's sent as its own line
        // so the server's total (sum of qty x rate) matches the suite's.
        var gst = Math.Round(inv.Total - inv.Subtotal, 2);
        if (gst > 0.004) items.Add(new InvoiceLines.Line("GST", 1, gst));

        object payload = items.Count > 0
            ? new
            {
                userId = client.ServerId, invoiceNumber = inv.Number, issueDate = inv.IssuedDate,
                dueDate = inv.DueDate, notes = inv.Notes,
                items = items.Select(l => new { description = l.Description, quantity = l.Quantity, rate = l.Rate }).ToArray(),
            }
            : new
            {
                userId = client.ServerId, invoiceNumber = inv.Number, issueDate = inv.IssuedDate,
                dueDate = inv.DueDate, notes = inv.Notes,
                description = inv.Notes.Length > 0 ? inv.Notes : "Services", amount = inv.Total,
            };

        var res = await _api.CallPostAsync("api/data.php?resource=invoices&action=create", payload, ct);
        if (!res.Ok) return Outcome.From(res);

        inv.ServerId = res.Str("id");
        Repository.SaveInvoiceQuiet(inv);

        // invoices/create always starts at "due".
        if (status != "due")
        {
            var st = await _api.CallPostAsync("api/data.php?resource=invoices&action=update_status",
                new { id = inv.ServerId, status }, ct);
            if (!st.Ok) return Outcome.Fail($"Invoice {inv.Number} was created, but setting it to {status} failed: {st.Error}");
        }
        return Outcome.Done;
    }

    // ----------------------------------------------------------- appointments

    private async Task<Outcome> PushAppointmentAsync(string id, string op, CancellationToken ct)
    {
        var a = Repository.GetAppointments(includeDeleted: true).FirstOrDefault(x => x.Id == id);
        if (a is null) return Outcome.Done;

        if (op == "delete")
        {
            if (string.IsNullOrEmpty(a.ServerId)) return Outcome.Done;
            return Outcome.From(await _api.CallPostAsync("api/data.php?resource=events&action=delete",
                new { id = a.ServerId }, ct));
        }
        if (a.Deleted) return Outcome.Done;

        // events needs a title and a yyyy-mm-dd date.
        var date = a.Date;
        if (a.Title.Trim().Length == 0 || !DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            return Outcome.Fail($"Booking \"{a.Title}\" needs a title and a date before it can be sent.");

        var client = string.IsNullOrEmpty(a.ClientId) ? null
            : Repository.GetClients(includeDeleted: true).FirstOrDefault(c => c.Id == a.ClientId);

        var body = new Dictionary<string, object>
        {
            ["title"] = a.Title.Trim(),
            ["date"] = date,
            ["time"] = a.Time.Length == 5 ? a.Time : "09:00",
            ["status"] = string.IsNullOrEmpty(a.Status) ? "confirmed" : a.Status,
            ["notes"] = a.Notes,
        };
        // Without a userId the server files it under the admin's own account.
        if (!string.IsNullOrEmpty(client?.ServerId)) body["userId"] = client!.ServerId!;

        if (!string.IsNullOrEmpty(a.ServerId))
        {
            body["id"] = a.ServerId!;
            var up = await _api.CallPostAsync("api/data.php?resource=events&action=update", body, ct);
            if (!up.Ok && up.Error.StartsWith("Unknown action", StringComparison.OrdinalIgnoreCase))
            {
                // Older data.php: only the status can be changed.
                var st = await _api.CallPostAsync("api/data.php?resource=events&action=update_status",
                    new { id = a.ServerId, status = body["status"] }, ct);
                return st.Ok
                    ? Outcome.Done
                    : Outcome.From(st);
            }
            return Outcome.From(up);
        }

        var res = await _api.CallPostAsync("api/data.php?resource=events&action=create", body, ct);
        if (!res.Ok) return Outcome.From(res);
        a.ServerId = res.Str("id");
        Repository.SaveAppointmentQuiet(a);
        return Outcome.Done;
    }

    // ------------------------------------------------------------------ parts

    /// <summary>Sends catalogue edits made in this app (price, count, new parts).</summary>
    private async Task<int> PushPartsAsync(CancellationToken ct)
    {
        var sent = 0;
        foreach (var p in PartsCatalogue.Dirty())
        {
            var body = new Dictionary<string, object>
            {
                ["id"] = p.Id, ["sku"] = p.Sku, ["name"] = p.Name, ["cost"] = p.Cost,
                ["sell"] = p.Sell, ["lowAt"] = p.LowAt, ["active"] = p.Active,
                ["consumable"] = p.Consumable,
            };
            // Only a restock sends the count - see Part.StockDirty.
            if (p.StockDirty) body["onHand"] = p.OnHand;

            var res = await _api.CallPostAsync("api/parts.php?action=save", body, ct);
            if (res.Ok) { PartsCatalogue.MarkClean(p.Id); sent++; }
        }
        return sent;
    }

    private static Part ParsePart(JsonElement e) => new()
    {
        Id = Json.Str(e, "id"),
        Sku = Json.Str(e, "sku"),
        Name = Json.Str(e, "name"),
        Cost = Json.Num(e, "cost"),
        Sell = Json.Num(e, "sell"),
        OnHand = (int)Json.Num(e, "onHand"),
        LowAt = (int)Json.Num(e, "lowAt"),
        Active = Json.Bool(e, "active"),
        Consumable = Json.Bool(e, "consumable"),
    };

    // ------------------------------------------------------------------ pull

    private async Task<int> PullClientsAsync(CancellationToken ct)
    {
        var users = await _api.CallGetAsync("api/data.php?resource=users&action=list", ct);
        var pulled = 0;
        foreach (var u in users.Rows())
            if (MergeClient(u)) pulled++;
        return pulled;
    }

    private async Task<int> PullAsync(CancellationToken ct)
    {
        var pulled = await PullClientsAsync(ct);

        // Test and tag jobs
        var jobs = await _api.CallGetAsync("api/services.php?resource=testtag&action=pull", ct);
        foreach (var j in jobs.Rows())
            if (MergeJob(j)) pulled++;

        var invoices = await _api.CallGetAsync("api/data.php?resource=invoices&action=list", ct);
        foreach (var i in invoices.Rows())
            if (MergeInvoice(i)) pulled++;
        if (invoices.Ok) RemoveGone("Invoices", Repository.GetInvoices().Select(x => (x.Id, x.ServerId)), invoices);

        var events = await _api.CallGetAsync("api/data.php?resource=events&action=list", ct);
        foreach (var e in events.Rows())
            if (MergeAppointment(e)) pulled++;
        if (events.Ok) RemoveGone("Appointments", Repository.GetAppointments().Select(x => (x.Id, x.ServerId)), events);

        // Repair parts. The server owns the stock count - it's recalculated
        // from saved jobs - so the local copy is replaced, not merged.
        var parts = (await _api.CallGetAsync("api/parts.php?action=list", ct)).Rows().ToList();
        if (parts.Count > 0)
            PartsCatalogue.ReplaceFromServer(parts.Select(ParsePart).ToList());

        return pulled;
    }

    /// <summary>
    /// A row deleted on the website disappears from its list. Without this it
    /// would live on here forever (e.g. an unpaid invoice that was cancelled).
    /// </summary>
    private static void RemoveGone(string table, IEnumerable<(string Id, string? ServerId)> local, ApiResult server)
    {
        var onServer = server.Rows().Select(r => Json.Str(r, "id")).ToHashSet();
        foreach (var (id, serverId) in local)
            if (!string.IsNullOrEmpty(serverId) && !onServer.Contains(serverId) && !Repository.HasPending(table, id))
                Repository.MarkDeletedQuiet(table, id);
    }

    private static bool MergeClient(JsonElement u)
    {
        var serverId = Json.Str(u, "id");
        if (serverId.Length == 0 || Json.Bool(u, "isAdmin")) return false; // admins aren't clients

        var all = Repository.GetClients(includeDeleted: true);
        var existing = all.FirstOrDefault(c => c.ServerId == serverId)
            // A client added here and not yet linked, with the same email.
            ?? all.FirstOrDefault(c => string.IsNullOrEmpty(c.ServerId) && !c.Deleted
                && c.Email.Length > 0 && string.Equals(c.Email, Json.Str(u, "email"), StringComparison.OrdinalIgnoreCase));

        if (existing is not null && (existing.Deleted || Repository.HasPending("Clients", existing.Id)))
        {
            // Deleted here, or edited here and not yet sent: the local copy wins.
            if (string.IsNullOrEmpty(existing.ServerId)) { existing.ServerId = serverId; Repository.SaveClientQuiet(existing); }
            return false;
        }

        var name = (Json.Str(u, "firstName") + " " + Json.Str(u, "lastName")).Trim();
        if (name.Length == 0) name = Json.Str(u, "email");

        var client = existing ?? new Client { ServerId = serverId };
        client.ServerId = serverId;
        client.Name = name;
        client.Company = Json.Str(u, "company");
        client.Email = Json.Str(u, "email");
        client.Phone = Json.Str(u, "phone");

        Repository.SaveClientQuiet(client);
        return existing is null;
    }

    private static string? LocalClientId(string serverClientId)
        => string.IsNullOrEmpty(serverClientId) ? null
         : Repository.GetClients(includeDeleted: true).FirstOrDefault(c => c.ServerId == serverClientId)?.Id;

    private static bool MergeInvoice(JsonElement v)
    {
        var serverId = Json.Str(v, "id");
        if (serverId.Length == 0) return false;

        var existing = Repository.GetInvoices(includeDeleted: true).FirstOrDefault(i => i.ServerId == serverId);
        if (existing is not null && (existing.Deleted || Repository.HasPending("Invoices", existing.Id))) return false;

        var inv = existing ?? new Invoice { ServerId = serverId };
        inv.Number = Json.Str(v, "invoiceNumber");
        inv.ClientId = LocalClientId(Json.Str(v, "userId")) ?? inv.ClientId;
        inv.IssuedDate = Json.Str(v, "issueDate");
        inv.DueDate = Json.Str(v, "dueDate");
        inv.Status = Json.Str(v, "status", "due");
        inv.Notes = Json.Str(v, "notes");
        inv.Total = Json.Num(v, "total");

        if (v.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
        {
            var lines = items.EnumerateArray()
                .Select(i => new InvoiceLines.Line(Json.Str(i, "description"), Json.Num(i, "quantity"), Json.Num(i, "rate")))
                .ToList();
            inv.LinesJson = InvoiceLines.Write(lines);
            inv.Subtotal = Math.Round(lines.Where(l => l.Description != "GST").Sum(l => l.Quantity * l.Rate), 2);
        }
        else inv.Subtotal = inv.Total;

        Repository.SaveInvoiceQuiet(inv);
        return existing is null;
    }

    private static bool MergeAppointment(JsonElement e)
    {
        var serverId = Json.Str(e, "id");
        if (serverId.Length == 0) return false;

        var existing = Repository.GetAppointments(includeDeleted: true).FirstOrDefault(a => a.ServerId == serverId);
        if (existing is not null && (existing.Deleted || Repository.HasPending("Appointments", existing.Id))) return false;

        var appt = existing ?? new Appointment { ServerId = serverId };
        appt.Title = Json.Str(e, "title");
        var date = Json.Str(e, "date");
        var time = Json.Str(e, "time", "09:00");
        appt.StartsAt = date + (time.Length >= 5 ? "T" + time[..5] : "");
        appt.Status = Json.Str(e, "status", "confirmed");
        appt.Notes = Json.Str(e, "notes");
        appt.ClientId = LocalClientId(Json.Str(e, "userId")) ?? appt.ClientId;

        Repository.SaveAppointmentQuiet(appt);
        return existing is null;
    }

    /// <summary>
    /// Takes the server copy unless a local edit is waiting to go up, or the
    /// local copy is at least as new.
    /// </summary>
    private static bool MergeJob(JsonElement j)
    {
        var serverId = Json.Str(j, "id");
        if (serverId.Length == 0) return false;
        var externalId = Json.Str(j, "externalId");

        var all = Repository.GetJobs(includeDeleted: true);
        var existing = all.FirstOrDefault(x => x.ServerId == serverId)
            ?? (externalId.Length > 0 ? all.FirstOrDefault(x => x.Id == externalId) : null)
            ?? all.FirstOrDefault(x => x.Id == serverId);

        if (existing is not null)
        {
            if (existing.Deleted || Repository.HasPending("Jobs", existing.Id)) return false;
            var serverStamp = ToLocalStamp(Json.Str(j, "lastUpdated"));
            if (string.CompareOrdinal(existing.UpdatedAt, serverStamp) >= 0)
            {
                if (string.IsNullOrEmpty(existing.ServerId))
                    Repository.SetJobServerInfo(existing.Id, serverId, "", "");
                return false; // local is newer or equal - keep it
            }
        }

        // A job created on the website has no externalId; use its server id.
        var job = existing is null
            ? new Job { Id = externalId.Length > 0 ? externalId : serverId }
            : Repository.GetJob(existing.Id)!;

        job.ServerId = serverId;
        job.CertNumber = Json.Str(j, "certNumber");
        job.ClientId = LocalClientId(Json.Str(j, "clientId")) ?? job.ClientId;
        job.SiteAddress = Json.Str(j, "siteAddress");
        job.Environment = Json.Str(j, "environment", "office");
        job.TestDate = Json.Str(j, "testDate");
        job.TesterName = Json.Str(j, "testerName");
        job.TesterLicence = Json.Str(j, "testerLicense");
        job.Status = Json.Str(j, "status", "draft");
        job.RetestMonths = (int)Json.Num(j, "retestMonths", 12);

        if (j.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
        {
            // The server keeps fewer item fields than the suite (no cord or
            // plug condition, polarity, fault/repair text...). Keep the local
            // values of those for items that still match by position and tag.
            var old = job.Items;
            job.Items = items.EnumerateArray().Select((i, n) =>
            {
                var prev = n < old.Count && old[n].TagNumber == Json.Str(i, "assetId") ? old[n] : null;
                var it = prev ?? new Item();
                it.Id = prev?.Id ?? Guid.NewGuid().ToString("N");
                it.TagNumber = Json.Str(i, "assetId");
                it.ItemType = Json.Str(i, "itemType", "standard");
                it.Description = Json.Str(i, "description");
                it.MakeModel = Json.Str(i, "makeModel");
                it.SerialNumber = Json.Str(i, "serialNumber");
                it.Location = Json.Str(i, "location");
                it.EquipmentClass = Json.Str(i, "equipmentClass", "I");
                it.Visual = Json.Str(i, "visual", "pass");
                it.EarthContinuity = Json.Str(i, "earthContinuity");
                it.InsulationResistance = Json.Str(i, "insulationResistance");
                it.InsulationVoltage = Json.Str(i, "insulationTestVoltage", it.InsulationVoltage);
                it.LeakageCurrent = Json.Str(i, "leakageCurrent");
                it.RcdTest = Json.Str(i, "rcdTest", "n/a");
                it.Result = Json.Str(i, "overallResult", "pass");
                it.ResultOverridden = Json.Bool(i, "overrideResult");
                it.PartId = Json.Str(i, "partId");
                it.Notes = Json.Str(i, "notes");
                return it;
            }).ToList();
        }

        // Written with the server's timestamp and without queueing, so it
        // isn't bounced straight back to the server.
        Repository.SaveJob(job, queue: false, stamp: ToLocalStamp(Json.Str(j, "lastUpdated")));
        return existing is null;
    }

    // ------------------------------------------------------------------ util

    /// <summary>
    /// The server's ISO timestamp ("2026-09-25T01:02:03+00:00") in the local
    /// database's format ("2026-09-25T01:02:03", UTC), so the two compare.
    /// </summary>
    public static string ToLocalStamp(string iso)
        => DateTimeOffset.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var d)
            ? d.UtcDateTime.ToString("s", CultureInfo.InvariantCulture)
            : "";

    private static string FirstName(string full)
    {
        var parts = full.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 0 ? parts[0] : full;
    }

    private static string LastName(string full)
    {
        var parts = full.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 1 ? string.Join(' ', parts[1..]) : "";
    }
}

/// <summary>Invoice lines stored as JSON, in the same shape data.php uses.</summary>
public static class InvoiceLines
{
    public sealed record Line(string Description, double Quantity, double Rate);

    private sealed class Dto
    {
        public string description { get; set; } = "";
        public double quantity { get; set; }
        public double rate { get; set; }
    }

    public static List<Line> Read(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return (JsonSerializer.Deserialize<List<Dto>>(json) ?? new())
                .Select(d => new Line(d.description, d.quantity, d.rate)).ToList();
        }
        catch (JsonException) { return new(); }
    }

    public static string Write(IEnumerable<Line> lines)
        => JsonSerializer.Serialize(lines.Select(l => new Dto { description = l.Description, quantity = l.Quantity, rate = l.Rate }));
}
