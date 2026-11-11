using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// A photo or signature on a job, an invoice, or the tester's own signature.
/// Same shape as the web app's job.attachments entries, so jobs carry them
/// to and from the website unchanged.
/// </summary>
public sealed class Attachment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    /// <summary>"photo" or "signature".</summary>
    public string Kind { get; set; } = "photo";
    /// <summary>A photo's caption, or the name of whoever signed.</summary>
    public string Note { get; set; } = "";
    /// <summary>UTC, "yyyy-MM-dd HH:mm:ss" like the server's.</summary>
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
    /// <summary>data:image/png;base64,... or data:image/jpeg;base64,...</summary>
    public string DataUrl { get; set; } = "";

    public bool IsSignature => Kind == "signature";

    /// <summary>The image bytes, or null if the data URL isn't an image.</summary>
    public byte[]? Bytes()
    {
        var comma = DataUrl.IndexOf(',');
        if (!DataUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) || comma < 0) return null;
        try { return Convert.FromBase64String(DataUrl[(comma + 1)..]); }
        catch (FormatException) { return null; }
    }

    /// <summary>The local date it was taken or signed (CreatedAt is UTC).</summary>
    public string LocalDate =>
        DateTime.TryParse(CreatedAt, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal, out var d)
            ? d.ToLocalTime().ToString("yyyy-MM-dd") : "";

    public static bool IsImageDataUrl(string s)
        => System.Text.RegularExpressions.Regex.IsMatch(s ?? "", @"^data:image/(png|jpeg|jpg|webp);base64,", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    /// <summary>Reads one entry from the server or the capture relay; null if it isn't an image.</summary>
    public static Attachment? FromJson(JsonElement e)
    {
        var url = Json.Str(e, "dataUrl");
        var id = Json.Str(e, "id");
        if (id.Length == 0 || !IsImageDataUrl(url)) return null;
        return new Attachment
        {
            Id = id,
            Kind = Json.Str(e, "kind") == "signature" ? "signature" : "photo",
            Note = Json.Str(e, "note"),
            CreatedAt = Json.Str(e, "createdAt"),
            DataUrl = url,
        };
    }

    public object ToPayload() => new { id = Id, kind = Kind, note = Note, createdAt = CreatedAt, dataUrl = DataUrl };
}

/// <summary>
/// Where photos and signatures are kept on this PC.
///
/// Jobs' attachments also sync with the website. The suite only sends them
/// when they were changed here, with the ids it last saw from the server
/// ("attachmentsBase"), so the server merges rather than replaces: a photo
/// the phone added meanwhile is kept, and only ones removed here are dropped.
/// Invoice photos go to the server's file store instead (see ServerFiles).
/// </summary>
public static class AttachmentStore
{
    public const string JobOwner = "job";
    public const string InvoiceOwner = "invoice";
    public const string TesterSignatureKey = "TesterSignature";

    public static void EnsureSchema(SqliteConnection c)
    {
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = """
                CREATE TABLE IF NOT EXISTS Attachments (
                    OwnerType TEXT NOT NULL,
                    OwnerId   TEXT NOT NULL,
                    Id        TEXT NOT NULL,
                    Position  INTEGER NOT NULL DEFAULT 0,
                    Kind      TEXT NOT NULL DEFAULT 'photo',
                    Note      TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL DEFAULT '',
                    DataUrl   TEXT NOT NULL,
                    PRIMARY KEY (OwnerType, OwnerId, Id)
                );
                """;
            cmd.ExecuteNonQuery();
        }
        // Invoices (and anything else in the server's file store): changed
        // here and not yet sent / the ids last seen on the server.
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = """
                CREATE TABLE IF NOT EXISTS AttachmentSync (
                    OwnerType TEXT NOT NULL,
                    OwnerId   TEXT NOT NULL,
                    Dirty     INTEGER NOT NULL DEFAULT 0,
                    Base      TEXT NOT NULL DEFAULT '[]',
                    PRIMARY KEY (OwnerType, OwnerId)
                );
                """;
            cmd.ExecuteNonQuery();
        }
        // Same for jobs, kept on the job row.
        Database.AddColumnIfMissing(c, "Jobs", "AttachmentsDirty", "INTEGER NOT NULL DEFAULT 0");
        Database.AddColumnIfMissing(c, "Jobs", "AttachmentsBase", "TEXT NOT NULL DEFAULT '[]'");
    }

    // ------------------------------------------------------------ read/write

    public static List<Attachment> Get(string owner, string ownerId)
    {
        var list = new List<Attachment>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT * FROM Attachments WHERE OwnerType = $o AND OwnerId = $id ORDER BY Position, CreatedAt";
        cmd.Parameters.AddWithValue("$o", owner);
        cmd.Parameters.AddWithValue("$id", ownerId);
        using var r = cmd.ExecuteReader();
        while (r.Read())
            list.Add(new Attachment
            {
                Id = r.GetString(r.GetOrdinal("Id")),
                Kind = r.GetString(r.GetOrdinal("Kind")),
                Note = r.GetString(r.GetOrdinal("Note")),
                CreatedAt = r.GetString(r.GetOrdinal("CreatedAt")),
                DataUrl = r.GetString(r.GetOrdinal("DataUrl")),
            });
        return list;
    }

    public static int Count(string owner, string ownerId)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM Attachments WHERE OwnerType = $o AND OwnerId = $id";
        cmd.Parameters.AddWithValue("$o", owner);
        cmd.Parameters.AddWithValue("$id", ownerId);
        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    /// <summary>Replaces the whole list, in this order. Anything that isn't an image is skipped.</summary>
    public static void Set(string owner, string ownerId, IEnumerable<Attachment> items)
    {
        using var c = Database.Open();
        using var tx = c.BeginTransaction();
        Replace(c, owner, ownerId, items);
        tx.Commit();
    }

    private static void Replace(SqliteConnection c, string owner, string ownerId, IEnumerable<Attachment> items)
    {
        using (var del = c.CreateCommand())
        {
            del.CommandText = "DELETE FROM Attachments WHERE OwnerType = $o AND OwnerId = $id";
            del.Parameters.AddWithValue("$o", owner);
            del.Parameters.AddWithValue("$id", ownerId);
            del.ExecuteNonQuery();
        }
        var pos = 0;
        var seen = new HashSet<string>();
        foreach (var a in items)
        {
            if (!Attachment.IsImageDataUrl(a.DataUrl) || !seen.Add(a.Id)) continue;
            using var ins = c.CreateCommand();
            ins.CommandText = """
                INSERT INTO Attachments (OwnerType,OwnerId,Id,Position,Kind,Note,CreatedAt,DataUrl)
                VALUES ($o,$oid,$id,$p,$k,$n,$c,$d)
                """;
            ins.Parameters.AddWithValue("$o", owner);
            ins.Parameters.AddWithValue("$oid", ownerId);
            ins.Parameters.AddWithValue("$id", a.Id);
            ins.Parameters.AddWithValue("$p", pos++);
            ins.Parameters.AddWithValue("$k", a.Kind == "signature" ? "signature" : "photo");
            ins.Parameters.AddWithValue("$n", a.Note ?? "");
            ins.Parameters.AddWithValue("$c", a.CreatedAt ?? "");
            ins.Parameters.AddWithValue("$d", a.DataUrl);
            ins.ExecuteNonQuery();
        }
    }

    /// <summary>The signature that goes on the document: the most recent one.</summary>
    public static Attachment? LatestSignature(IEnumerable<Attachment> items)
        => items.Where(a => a.IsSignature).OrderBy(a => a.CreatedAt, StringComparer.Ordinal).LastOrDefault();

    public static bool SameIds(IEnumerable<Attachment> a, IEnumerable<Attachment> b)
        => a.Select(x => x.Id).OrderBy(x => x, StringComparer.Ordinal)
            .SequenceEqual(b.Select(x => x.Id).OrderBy(x => x, StringComparer.Ordinal));

    // ------------------------------------------------------------------ jobs

    /// <summary>
    /// Saves a job's photos and signatures after an edit here, marking them
    /// to be sent with the job. Call after Repository.SaveJob (which queues the push).
    /// </summary>
    public static void SaveForJob(string jobId, IEnumerable<Attachment> items)
    {
        var list = items.ToList();
        if (SameIds(list, Get(JobOwner, jobId)) && list.Select(a => a.Note).SequenceEqual(Get(JobOwner, jobId).Select(a => a.Note)))
            return; // unchanged - don't send them again
        using var c = Database.Open();
        using var tx = c.BeginTransaction();
        Replace(c, JobOwner, jobId, list);
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = "UPDATE Jobs SET AttachmentsDirty = 1 WHERE Id = $id";
            cmd.Parameters.AddWithValue("$id", jobId);
            cmd.ExecuteNonQuery();
        }
        tx.Commit();
    }

    /// <summary>Whether this job's attachments need sending, and the ids last seen on the server.</summary>
    public static (bool Dirty, List<string> Base) JobSyncState(string jobId)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT AttachmentsDirty, AttachmentsBase FROM Jobs WHERE Id = $id";
        cmd.Parameters.AddWithValue("$id", jobId);
        using var r = cmd.ExecuteReader();
        if (!r.Read()) return (false, new List<string>());
        List<string> ids;
        try { ids = JsonSerializer.Deserialize<List<string>>(r.GetString(1)) ?? new(); }
        catch (JsonException) { ids = new(); }
        return (r.GetInt32(0) == 1, ids);
    }

    /// <summary>After a successful push: nothing left to send.</summary>
    public static void MarkJobSent(string jobId)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "UPDATE Jobs SET AttachmentsDirty = 0 WHERE Id = $id";
        cmd.Parameters.AddWithValue("$id", jobId);
        cmd.ExecuteNonQuery();
    }

    /// <summary>
    /// Takes the server's photos and signatures for a job, unless there are
    /// changes here still to send. Separate from the job's other fields:
    /// after a merge the server can hold photos this PC hasn't seen even
    /// though the job's timestamp says the local copy is current.
    /// Returns true if anything changed.
    /// </summary>
    public static bool FromServer(string jobId, JsonElement serverJob)
    {
        if (!serverJob.TryGetProperty("attachments", out var arr) || arr.ValueKind != JsonValueKind.Array) return false;
        if (Repository.HasPending("Jobs", jobId) || JobSyncState(jobId).Dirty) return false;

        var server = arr.EnumerateArray().Select(Attachment.FromJson).Where(a => a is not null).Select(a => a!).ToList();
        var ids = JsonSerializer.Serialize(server.Select(a => a.Id).ToList());
        var changed = !SameIds(server, Get(JobOwner, jobId));

        using var c = Database.Open();
        using var tx = c.BeginTransaction();
        if (changed) Replace(c, JobOwner, jobId, server);
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = "UPDATE Jobs SET AttachmentsBase = $b, AttachmentsDirty = 0 WHERE Id = $id";
            cmd.Parameters.AddWithValue("$b", ids);
            cmd.Parameters.AddWithValue("$id", jobId);
            cmd.ExecuteNonQuery();
        }
        tx.Commit();
        return changed;
    }

    // ------------------------------------------------ invoices (server files)

    /// <summary>
    /// Saves an invoice's photos after an edit here and marks them to be sent
    /// to the server's file store. Deleting an invoice saves an empty list,
    /// which removes its photos from the server too.
    /// </summary>
    public static void SaveForOwner(string owner, string ownerId, IEnumerable<Attachment> items)
    {
        var list = items.ToList();
        var old = Get(owner, ownerId);
        if (SameIds(list, old) && list.Select(a => a.Note).SequenceEqual(old.Select(a => a.Note))) return;
        using var c = Database.Open();
        using var tx = c.BeginTransaction();
        Replace(c, owner, ownerId, list);
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = """
                INSERT INTO AttachmentSync (OwnerType, OwnerId, Dirty) VALUES ($o, $id, 1)
                ON CONFLICT(OwnerType, OwnerId) DO UPDATE SET Dirty = 1
                """;
            cmd.Parameters.AddWithValue("$o", owner);
            cmd.Parameters.AddWithValue("$id", ownerId);
            cmd.ExecuteNonQuery();
        }
        tx.Commit();
    }

    public sealed record OwnerState(string OwnerId, bool Dirty, List<string> Base);

    public static List<OwnerState> OwnerStates(string owner)
    {
        var list = new List<OwnerState>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT OwnerId, Dirty, Base FROM AttachmentSync WHERE OwnerType = $o";
        cmd.Parameters.AddWithValue("$o", owner);
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            List<string> ids;
            try { ids = JsonSerializer.Deserialize<List<string>>(r.GetString(2)) ?? new(); }
            catch (JsonException) { ids = new(); }
            list.Add(new OwnerState(r.GetString(0), r.GetInt32(1) == 1, ids));
        }
        return list;
    }

    /// <summary>Records what the server now holds for an owner (and that nothing is waiting to go).</summary>
    public static void SetOwnerSynced(string owner, string ownerId, IEnumerable<string> serverIds)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO AttachmentSync (OwnerType, OwnerId, Dirty, Base) VALUES ($o, $id, 0, $b)
            ON CONFLICT(OwnerType, OwnerId) DO UPDATE SET Dirty = 0, Base = $b
            """;
        cmd.Parameters.AddWithValue("$o", owner);
        cmd.Parameters.AddWithValue("$id", ownerId);
        cmd.Parameters.AddWithValue("$b", JsonSerializer.Serialize(serverIds.OrderBy(x => x, StringComparer.Ordinal).ToList()));
        cmd.ExecuteNonQuery();
    }

    // ---------------------------------------------------------------- tester

    /// <summary>
    /// The tester's signature. Shared with the web app through the server:
    /// setting it here marks it to be sent; the server's copy is taken on
    /// sync when nothing is waiting to go.
    /// </summary>
    public static string TesterSignature
    {
        get => Repository.GetSetting(TesterSignatureKey, "");
        set
        {
            var v = Attachment.IsImageDataUrl(value) ? value : "";
            if (v == TesterSignature) return;
            Repository.SetSetting(TesterSignatureKey, v);
            Repository.SetSetting(TesterSignatureKey + "Dirty", "1");
        }
    }

    public static bool TesterSignatureDirty => Repository.GetSetting(TesterSignatureKey + "Dirty", "") == "1";
    public static string TesterSignatureVersion => Repository.GetSetting(TesterSignatureKey + "Version", "");

    /// <summary>After a sync: the server's copy and version, nothing waiting.</summary>
    public static void TesterSignatureSynced(string dataUrl, string version)
    {
        Repository.SetSetting(TesterSignatureKey, Attachment.IsImageDataUrl(dataUrl) ? dataUrl : "");
        Repository.SetSetting(TesterSignatureKey + "Version", version);
        Repository.SetSetting(TesterSignatureKey + "Dirty", "");
    }
}
