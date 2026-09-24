using Microsoft.Data.Sqlite;
using ZoltanStudios.Suite.Models;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// All reads and writes against the local database.
///
/// Every save stamps UpdatedAt and queues the row for sync, so the caller
/// never has to remember to. Deletes are soft — see Database.cs for why a
/// hard delete would be silently undone by the next pull.
/// </summary>
public static class Repository
{
    private static string Now() => DateTime.UtcNow.ToString("s");

    private static void Queue(SqliteConnection c, string table, string id, string op)
    {
        // One pending entry per row and operation: a row saved five times
        // offline needs sending once, with its latest content.
        using (var dedupe = c.CreateCommand())
        {
            dedupe.CommandText = "DELETE FROM SyncQueue WHERE TableName = $t AND RowId = $r AND Operation = $o";
            dedupe.Parameters.AddWithValue("$t", table);
            dedupe.Parameters.AddWithValue("$r", id);
            dedupe.Parameters.AddWithValue("$o", op);
            dedupe.ExecuteNonQuery();
        }

        using var cmd = c.CreateCommand();
        cmd.CommandText =
            "INSERT INTO SyncQueue (TableName, RowId, Operation, QueuedAt) VALUES ($t, $r, $o, $q)";
        cmd.Parameters.AddWithValue("$t", table);
        cmd.Parameters.AddWithValue("$r", id);
        cmd.Parameters.AddWithValue("$o", op);
        cmd.Parameters.AddWithValue("$q", Now());
        cmd.ExecuteNonQuery();
    }

    private static string S(SqliteDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? "" : r.GetString(i);
    }

    private static int I(SqliteDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? 0 : r.GetInt32(i);
    }

    private static double D(SqliteDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? 0 : r.GetDouble(i);
    }

    // ================================================================ clients

    public static List<Client> GetClients(bool includeDeleted = false)
    {
        var list = new List<Client>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        // A soft-deleted row still needs reading so the delete can be pushed.
        cmd.CommandText = includeDeleted
            ? "SELECT * FROM Clients ORDER BY Name COLLATE NOCASE"
            : "SELECT * FROM Clients WHERE Deleted = 0 ORDER BY Name COLLATE NOCASE";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Client
            {
                Id = S(r, "Id"),
                Name = S(r, "Name"),
                Company = S(r, "Company"),
                Email = S(r, "Email"),
                Phone = S(r, "Phone"),
                Address = S(r, "Address"),
                Notes = S(r, "Notes"),
                CreatedAt = S(r, "CreatedAt"),
                UpdatedAt = S(r, "UpdatedAt"),
                ServerId = S(r, "ServerId"),
                Deleted = I(r, "Deleted") == 1,
            });
        }
        return list;
    }

    public static void SaveClient(Client x)
    {
        x.UpdatedAt = Now();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Clients (Id,Name,Company,Email,Phone,Address,Notes,CreatedAt,UpdatedAt,Deleted,ServerId)
            VALUES ($id,$n,$co,$e,$p,$a,$no,$c1,$u,0,$sid)
            ON CONFLICT(Id) DO UPDATE SET
                Name=$n, Company=$co, Email=$e, Phone=$p, Address=$a, Notes=$no, UpdatedAt=$u
            """;
        cmd.Parameters.AddWithValue("$id", x.Id);
        cmd.Parameters.AddWithValue("$n", x.Name);
        cmd.Parameters.AddWithValue("$co", x.Company);
        cmd.Parameters.AddWithValue("$e", x.Email);
        cmd.Parameters.AddWithValue("$p", x.Phone);
        cmd.Parameters.AddWithValue("$a", x.Address);
        cmd.Parameters.AddWithValue("$no", x.Notes);
        cmd.Parameters.AddWithValue("$c1", x.CreatedAt);
        cmd.Parameters.AddWithValue("$u", x.UpdatedAt);
        cmd.Parameters.AddWithValue("$sid", (object?)x.ServerId ?? DBNull.Value);
        cmd.ExecuteNonQuery();
        Queue(c, "Clients", x.Id, "upsert");
    }

    public static void DeleteClient(string id) => SoftDelete("Clients", id);

    // =================================================================== jobs

    public static List<Job> GetJobs(bool includeItems = false, bool includeDeleted = false)
    {
        var list = new List<Job>();
        using var c = Database.Open();
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = includeDeleted
                ? "SELECT * FROM Jobs ORDER BY TestDate DESC"
                : "SELECT * FROM Jobs WHERE Deleted = 0 ORDER BY TestDate DESC";
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new Job
                {
                    Id = S(r, "Id"),
                    ClientId = S(r, "ClientId"),
                    CertNumber = S(r, "CertNumber"),
                    JobType = S(r, "JobType"),
                    SiteAddress = S(r, "SiteAddress"),
                    Environment = S(r, "Environment"),
                    RetestMonths = I(r, "RetestMonths"),
                    TestDate = S(r, "TestDate"),
                    TesterName = S(r, "TesterName"),
                    TesterLicence = S(r, "TesterLicence"),
                    TestEquipment = S(r, "TestEquipment"),
                    CalibrationDate = S(r, "CalibrationDate"),
                    TagStart = S(r, "TagStart"),
                    Status = S(r, "Status"),
                    CreatedAt = S(r, "CreatedAt"),
                    UpdatedAt = S(r, "UpdatedAt"),
                    ServerId = S(r, "ServerId"),
                    Deleted = I(r, "Deleted") == 1,
                });
            }
        }

        if (includeItems)
            foreach (var j in list) j.Items = GetItems(j.Id);

        return list;
    }

    public static List<Item> GetItems(string jobId)
    {
        var list = new List<Item>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT * FROM Items WHERE JobId = $j AND Deleted = 0 ORDER BY Position";
        cmd.Parameters.AddWithValue("$j", jobId);
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Item
            {
                Id = S(r, "Id"),
                JobId = S(r, "JobId"),
                Position = I(r, "Position"),
                TagNumber = S(r, "TagNumber"),
                Description = S(r, "Description"),
                MakeModel = S(r, "MakeModel"),
                SerialNumber = S(r, "SerialNumber"),
                Location = S(r, "Location"),
                ItemType = S(r, "ItemType"),
                EquipmentClass = S(r, "EquipmentClass"),
                CordLength = S(r, "CordLength"),
                Visual = S(r, "Visual"),
                CordCondition = S(r, "CordCondition"),
                PlugCondition = S(r, "PlugCondition"),
                Polarity = S(r, "Polarity"),
                EarthContinuity = S(r, "EarthContinuity"),
                InsulationResistance = S(r, "InsulationResistance"),
                InsulationVoltage = S(r, "InsulationVoltage"),
                LeakageCurrent = S(r, "LeakageCurrent"),
                RcdTest = S(r, "RcdTest"),
                OperationTest = S(r, "OperationTest"),
                FuseCheck = S(r, "FuseCheck"),
                Result = S(r, "Result"),
                ResultOverridden = I(r, "ResultOverridden") == 1,
                FaultDescription = S(r, "FaultDescription"),
                RepairDetails = S(r, "RepairDetails"),
                PartId = S(r, "PartId"),
                RemovedFromService = I(r, "RemovedFromService") == 1,
                FollowUp = I(r, "FollowUp") == 1,
                Notes = S(r, "Notes"),
                UpdatedAt = S(r, "UpdatedAt"),
            });
        }
        return list;
    }

    /// <summary>
    /// Saves a job and its items. <paramref name="queue"/> false and a
    /// <paramref name="stamp"/> are used by the sync pull: a job that just
    /// arrived keeps the server's timestamp and isn't sent straight back.
    /// </summary>
    public static void SaveJob(Job x, bool queue = true, string? stamp = null)
    {
        x.UpdatedAt = stamp ?? Now();
        using var c = Database.Open();
        using var tx = c.BeginTransaction();

        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = """
                INSERT INTO Jobs (Id,ClientId,CertNumber,JobType,SiteAddress,Environment,RetestMonths,
                    TestDate,TesterName,TesterLicence,TestEquipment,CalibrationDate,TagStart,
                    GeneratorJson,Status,CreatedAt,UpdatedAt,Deleted,ServerId)
                VALUES ($id,$cl,$cn,$jt,$sa,$env,$rm,$td,$tn,$tl,$te,$cd,$ts,'',$st,$ca,$u,0,$sid)
                ON CONFLICT(Id) DO UPDATE SET
                    ClientId=$cl, CertNumber=$cn, JobType=$jt, SiteAddress=$sa, Environment=$env,
                    RetestMonths=$rm, TestDate=$td, TesterName=$tn, TesterLicence=$tl,
                    TestEquipment=$te, CalibrationDate=$cd, TagStart=$ts, Status=$st, UpdatedAt=$u,
                    ServerId=COALESCE(NULLIF($sid, ''), ServerId), Deleted=0
                """;
            cmd.Parameters.AddWithValue("$id", x.Id);
            cmd.Parameters.AddWithValue("$cl", string.IsNullOrEmpty(x.ClientId) ? DBNull.Value : x.ClientId);
            cmd.Parameters.AddWithValue("$cn", x.CertNumber);
            cmd.Parameters.AddWithValue("$jt", x.JobType);
            cmd.Parameters.AddWithValue("$sa", x.SiteAddress);
            cmd.Parameters.AddWithValue("$env", x.Environment);
            cmd.Parameters.AddWithValue("$rm", x.RetestMonths);
            cmd.Parameters.AddWithValue("$td", x.TestDate);
            cmd.Parameters.AddWithValue("$tn", x.TesterName);
            cmd.Parameters.AddWithValue("$tl", x.TesterLicence);
            cmd.Parameters.AddWithValue("$te", x.TestEquipment);
            cmd.Parameters.AddWithValue("$cd", x.CalibrationDate);
            cmd.Parameters.AddWithValue("$ts", x.TagStart);
            cmd.Parameters.AddWithValue("$st", x.Status);
            cmd.Parameters.AddWithValue("$ca", x.CreatedAt);
            cmd.Parameters.AddWithValue("$u", x.UpdatedAt);
            cmd.Parameters.AddWithValue("$sid", (object?)x.ServerId ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }

        // Items are replaced wholesale: simpler than diffing, and a job's item
        // list is small enough that it costs nothing.
        using (var del = c.CreateCommand())
        {
            del.CommandText = "DELETE FROM Items WHERE JobId = $j";
            del.Parameters.AddWithValue("$j", x.Id);
            del.ExecuteNonQuery();
        }

        for (var i = 0; i < x.Items.Count; i++)
        {
            var it = x.Items[i];
            it.JobId = x.Id;
            it.Position = i;
            it.UpdatedAt = x.UpdatedAt;
            using var cmd = c.CreateCommand();
            cmd.CommandText = """
                INSERT INTO Items (Id,JobId,Position,TagNumber,Description,MakeModel,SerialNumber,
                    Location,ItemType,EquipmentClass,CordLength,Visual,CordCondition,PlugCondition,
                    Polarity,EarthContinuity,InsulationResistance,InsulationVoltage,LeakageCurrent,
                    RcdTest,RcdJson,OperationTest,FuseCheck,Result,ResultOverridden,FaultDescription,
                    RepairDetails,PartId,RemovedFromService,FollowUp,Notes,UpdatedAt,Deleted)
                VALUES ($id,$j,$pos,$tag,$desc,$mm,$sn,$loc,$it,$ec,$cl,$vis,$cc,$pc,$pol,$earth,
                    $ins,$iv,$leak,$rcd,'',$op,$fuse,$res,$ro,$fd,$rd,$part,$rfs,$fu,$notes,$u,0)
                """;
            cmd.Parameters.AddWithValue("$id", it.Id);
            cmd.Parameters.AddWithValue("$j", it.JobId);
            cmd.Parameters.AddWithValue("$pos", it.Position);
            cmd.Parameters.AddWithValue("$tag", it.TagNumber);
            cmd.Parameters.AddWithValue("$desc", it.Description);
            cmd.Parameters.AddWithValue("$mm", it.MakeModel);
            cmd.Parameters.AddWithValue("$sn", it.SerialNumber);
            cmd.Parameters.AddWithValue("$loc", it.Location);
            cmd.Parameters.AddWithValue("$it", it.ItemType);
            cmd.Parameters.AddWithValue("$ec", it.EquipmentClass);
            cmd.Parameters.AddWithValue("$cl", it.CordLength);
            cmd.Parameters.AddWithValue("$vis", it.Visual);
            cmd.Parameters.AddWithValue("$cc", it.CordCondition);
            cmd.Parameters.AddWithValue("$pc", it.PlugCondition);
            cmd.Parameters.AddWithValue("$pol", it.Polarity);
            cmd.Parameters.AddWithValue("$earth", it.EarthContinuity);
            cmd.Parameters.AddWithValue("$ins", it.InsulationResistance);
            cmd.Parameters.AddWithValue("$iv", it.InsulationVoltage);
            cmd.Parameters.AddWithValue("$leak", it.LeakageCurrent);
            cmd.Parameters.AddWithValue("$rcd", it.RcdTest);
            cmd.Parameters.AddWithValue("$op", it.OperationTest);
            cmd.Parameters.AddWithValue("$fuse", it.FuseCheck);
            cmd.Parameters.AddWithValue("$res", it.Result);
            cmd.Parameters.AddWithValue("$ro", it.ResultOverridden ? 1 : 0);
            cmd.Parameters.AddWithValue("$fd", it.FaultDescription);
            cmd.Parameters.AddWithValue("$rd", it.RepairDetails);
            cmd.Parameters.AddWithValue("$part", it.PartId ?? "");
            cmd.Parameters.AddWithValue("$rfs", it.RemovedFromService ? 1 : 0);
            cmd.Parameters.AddWithValue("$fu", it.FollowUp ? 1 : 0);
            cmd.Parameters.AddWithValue("$notes", it.Notes);
            cmd.Parameters.AddWithValue("$u", it.UpdatedAt);
            cmd.ExecuteNonQuery();
        }

        if (queue) Queue(c, "Jobs", x.Id, "upsert");
        tx.Commit();
    }

    public static void DeleteJob(string id) => SoftDelete("Jobs", id);

    // =============================================================== invoices

    public static List<Invoice> GetInvoices(bool includeDeleted = false)
    {
        var list = new List<Invoice>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = includeDeleted
            ? "SELECT * FROM Invoices ORDER BY IssuedDate DESC"
            : "SELECT * FROM Invoices WHERE Deleted = 0 ORDER BY IssuedDate DESC";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Invoice
            {
                Id = S(r, "Id"),
                ClientId = S(r, "ClientId"),
                JobId = S(r, "JobId"),
                Number = S(r, "Number"),
                IssuedDate = S(r, "IssuedDate"),
                DueDate = S(r, "DueDate"),
                Subtotal = D(r, "Subtotal"),
                Total = D(r, "Total"),
                Status = S(r, "Status"),
                Notes = S(r, "Notes"),
                LinesJson = S(r, "LinesJson"),
                CreatedAt = S(r, "CreatedAt"),
                UpdatedAt = S(r, "UpdatedAt"),
                ServerId = S(r, "ServerId"),
                Deleted = I(r, "Deleted") == 1,
            });
        }
        return list;
    }

    // =========================================================== appointments

    public static List<Appointment> GetAppointments(bool includeDeleted = false)
    {
        var list = new List<Appointment>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = includeDeleted
            ? "SELECT * FROM Appointments ORDER BY StartsAt"
            : "SELECT * FROM Appointments WHERE Deleted = 0 ORDER BY StartsAt";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Appointment
            {
                Id = S(r, "Id"),
                ClientId = S(r, "ClientId"),
                Title = S(r, "Title"),
                StartsAt = S(r, "StartsAt"),
                EndsAt = S(r, "EndsAt"),
                Location = S(r, "Location"),
                Notes = S(r, "Notes"),
                Status = S(r, "Status"),
                CreatedAt = S(r, "CreatedAt"),
                UpdatedAt = S(r, "UpdatedAt"),
                ServerId = S(r, "ServerId"),
                Deleted = I(r, "Deleted") == 1,
            });
        }
        return list;
    }

    // =================================================================== util

    private static void SoftDelete(string table, string id)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = $"UPDATE {table} SET Deleted = 1, UpdatedAt = $u WHERE Id = $id";
        cmd.Parameters.AddWithValue("$u", Now());
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
        Queue(c, table, id, "delete");
    }

    /// <summary>Settings live in Meta so they sit alongside the data they configure.</summary>
    public static string GetSetting(string key, string fallback = "")
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT Value FROM Meta WHERE Key = $k";
        cmd.Parameters.AddWithValue("$k", key);
        return cmd.ExecuteScalar() as string ?? fallback;
    }

    public static void SetSetting(string key, string value)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText =
            "INSERT INTO Meta (Key,Value) VALUES ($k,$v) ON CONFLICT(Key) DO UPDATE SET Value=$v";
        cmd.Parameters.AddWithValue("$k", key);
        cmd.Parameters.AddWithValue("$v", value);
        cmd.ExecuteNonQuery();
    }


    // ---------------------------------------------------------- quiet writes
    // Used by the sync pull. These deliberately do NOT queue the row for push:
    // data that just arrived from the server must not be sent straight back.

    public static void SaveClientQuiet(Client x)
    {
        x.UpdatedAt = Now();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Clients (Id,Name,Company,Email,Phone,Address,Notes,CreatedAt,UpdatedAt,Deleted,ServerId)
            VALUES ($id,$n,$co,$e,$p,$a,$no,$c1,$u,0,$sid)
            ON CONFLICT(Id) DO UPDATE SET
                Name=$n, Company=$co, Email=$e, Phone=$p, Address=$a, Notes=$no, UpdatedAt=$u, ServerId=$sid
            """;
        cmd.Parameters.AddWithValue("$id", x.Id);
        cmd.Parameters.AddWithValue("$n", x.Name);
        cmd.Parameters.AddWithValue("$co", x.Company);
        cmd.Parameters.AddWithValue("$e", x.Email);
        cmd.Parameters.AddWithValue("$p", x.Phone);
        cmd.Parameters.AddWithValue("$a", x.Address);
        cmd.Parameters.AddWithValue("$no", x.Notes);
        cmd.Parameters.AddWithValue("$c1", x.CreatedAt);
        cmd.Parameters.AddWithValue("$u", x.UpdatedAt);
        cmd.Parameters.AddWithValue("$sid", (object?)x.ServerId ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    public static void SaveInvoiceQuiet(Invoice x)
    {
        x.UpdatedAt = Now();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Invoices (Id,ClientId,JobId,Number,IssuedDate,DueDate,Subtotal,Total,Status,LinesJson,Notes,CreatedAt,UpdatedAt,Deleted,ServerId)
            VALUES ($id,$cl,$j,$num,$iss,$due,$sub,$tot,$st,$lines,$no,$ca,$u,0,$sid)
            ON CONFLICT(Id) DO UPDATE SET
                ClientId=$cl, JobId=$j, Number=$num, IssuedDate=$iss, DueDate=$due, Subtotal=$sub, Total=$tot,
                Status=$st, LinesJson=$lines, Notes=$no, UpdatedAt=$u, ServerId=$sid
            """;
        cmd.Parameters.AddWithValue("$lines", x.LinesJson ?? "");
        cmd.Parameters.AddWithValue("$id", x.Id);
        cmd.Parameters.AddWithValue("$cl", string.IsNullOrEmpty(x.ClientId) ? DBNull.Value : x.ClientId);
        cmd.Parameters.AddWithValue("$j", string.IsNullOrEmpty(x.JobId) ? DBNull.Value : x.JobId);
        cmd.Parameters.AddWithValue("$num", x.Number);
        cmd.Parameters.AddWithValue("$iss", x.IssuedDate);
        cmd.Parameters.AddWithValue("$due", x.DueDate);
        cmd.Parameters.AddWithValue("$sub", x.Subtotal);
        cmd.Parameters.AddWithValue("$tot", x.Total);
        cmd.Parameters.AddWithValue("$st", x.Status);
        cmd.Parameters.AddWithValue("$no", x.Notes);
        cmd.Parameters.AddWithValue("$ca", x.CreatedAt);
        cmd.Parameters.AddWithValue("$u", x.UpdatedAt);
        cmd.Parameters.AddWithValue("$sid", (object?)x.ServerId ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    public static void SaveAppointmentQuiet(Appointment x)
    {
        x.UpdatedAt = Now();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Appointments (Id,ClientId,Title,StartsAt,EndsAt,Location,Notes,Status,CreatedAt,UpdatedAt,Deleted,ServerId)
            VALUES ($id,$cl,$t,$s,$e,$l,$n,$st,$ca,$u,0,$sid)
            ON CONFLICT(Id) DO UPDATE SET
                ClientId=$cl, Title=$t, StartsAt=$s, EndsAt=$e, Location=$l, Notes=$n, Status=$st,
                UpdatedAt=$u, ServerId=$sid
            """;
        cmd.Parameters.AddWithValue("$st", string.IsNullOrEmpty(x.Status) ? "confirmed" : x.Status);
        cmd.Parameters.AddWithValue("$id", x.Id);
        cmd.Parameters.AddWithValue("$cl", string.IsNullOrEmpty(x.ClientId) ? DBNull.Value : x.ClientId);
        cmd.Parameters.AddWithValue("$t", x.Title);
        cmd.Parameters.AddWithValue("$s", x.StartsAt);
        cmd.Parameters.AddWithValue("$e", x.EndsAt);
        cmd.Parameters.AddWithValue("$l", x.Location);
        cmd.Parameters.AddWithValue("$n", x.Notes);
        cmd.Parameters.AddWithValue("$ca", x.CreatedAt);
        cmd.Parameters.AddWithValue("$u", x.UpdatedAt);
        cmd.Parameters.AddWithValue("$sid", (object?)x.ServerId ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    public static Job? GetJob(string id)
    {
        var job = GetJobs().FirstOrDefault(j => j.Id == id);
        if (job is not null) job.Items = GetItems(job.Id);
        return job;
    }

    public static void SaveInvoice(Invoice x)
    {
        SaveInvoiceQuiet(x);
        using var c = Database.Open();
        Queue(c, "Invoices", x.Id, "upsert");
    }

    public static void SaveAppointment(Appointment x)
    {
        SaveAppointmentQuiet(x);
        using var c = Database.Open();
        Queue(c, "Appointments", x.Id, "upsert");
    }

    public static void DeleteInvoice(string id) => SoftDelete("Invoices", id);
    public static void DeleteAppointment(string id) => SoftDelete("Appointments", id);

    /// <summary>True when a local change to this row is still waiting to be sent.</summary>
    public static bool HasPending(string table, string id)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM SyncQueue WHERE TableName = $t AND RowId = $r";
        cmd.Parameters.AddWithValue("$t", table);
        cmd.Parameters.AddWithValue("$r", id);
        return Convert.ToInt32(cmd.ExecuteScalar() ?? 0) > 0;
    }

    /// <summary>Marks a row deleted because it's gone from the server. Not queued.</summary>
    public static void MarkDeletedQuiet(string table, string id)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = $"UPDATE {table} SET Deleted = 1, UpdatedAt = $u WHERE Id = $id";
        cmd.Parameters.AddWithValue("$u", Now());
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    /// <summary>Records what the server assigned after a job push, without re-queueing it.</summary>
    public static void SetJobServerInfo(string id, string serverId, string certNumber, string updatedAt)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            UPDATE Jobs SET ServerId = $sid,
                CertNumber = CASE WHEN $cn <> '' THEN $cn ELSE CertNumber END,
                UpdatedAt = CASE WHEN $u <> '' THEN $u ELSE UpdatedAt END
            WHERE Id = $id
            """;
        cmd.Parameters.AddWithValue("$sid", serverId);
        cmd.Parameters.AddWithValue("$cn", certNumber);
        cmd.Parameters.AddWithValue("$u", updatedAt);
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public sealed record SyncProblem(string Table, string RowId, string Operation, int Attempts, string Error, string QueuedAt);

    /// <summary>Queued changes that have failed at least once, with the server's reason.</summary>
    public static List<SyncProblem> SyncProblems()
    {
        var list = new List<SyncProblem>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT TableName, RowId, Operation, Attempts, LastError, QueuedAt FROM SyncQueue WHERE Attempts > 0 ORDER BY Id";
        using var r = cmd.ExecuteReader();
        while (r.Read())
            list.Add(new SyncProblem(r.GetString(0), r.GetString(1), r.GetString(2), r.GetInt32(3), r.GetString(4), r.GetString(5)));
        return list;
    }

    /// <summary>Drops a queued change the user has chosen to give up on.</summary>
    public static void DiscardQueued(string table, string rowId)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "DELETE FROM SyncQueue WHERE TableName = $t AND RowId = $r";
        cmd.Parameters.AddWithValue("$t", table);
        cmd.Parameters.AddWithValue("$r", rowId);
        cmd.ExecuteNonQuery();
    }

    public static int PendingSyncCount()
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM SyncQueue";
        return Convert.ToInt32(cmd.ExecuteScalar() ?? 0);
    }
}
