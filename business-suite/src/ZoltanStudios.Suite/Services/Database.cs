using System.IO;
using Microsoft.Data.Sqlite;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// The local SQLite database. This is the source of truth: every read and
/// write happens here so the app is fully usable with no connection, and a
/// sync layer reconciles with the cPanel API separately.
///
/// Two conventions make that sync possible and are worth keeping to:
///   - every table carries UpdatedAt, so last-write-wins can be resolved
///   - deletes are soft (Deleted = 1), or a deletion made offline would be
///     silently undone by the next pull
/// </summary>
public static class Database
{
    private static string? _path;

    /// <summary>Points the app at a different database file (used by the test harness).</summary>
    public static void UsePath(string path) => _path = path;

    /// <summary>
    /// %AppData%\ZoltanStudios\suite.db — per-user, survives app updates, and
    /// isn't inside Program Files where writes would need elevation.
    /// </summary>
    public static string Path
    {
        get
        {
            if (_path is not null) return _path;
            var dir = System.IO.Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "ZoltanStudios");
            Directory.CreateDirectory(dir);
            _path = System.IO.Path.Combine(dir, "suite.db");
            return _path;
        }
    }

    public static SqliteConnection Open()
    {
        var c = new SqliteConnection($"Data Source={Path}");
        c.Open();
        return c;
    }

    public static void Initialise()
    {
        using var c = Open();
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = Schema;
            cmd.ExecuteNonQuery();
        }
        Migrate(c);
    }

    /// <summary>
    /// CREATE TABLE IF NOT EXISTS won't add columns to a table that already
    /// exists, so a database made by an earlier version would be missing
    /// anything added since - and every write naming that column would fail.
    /// Each column added after the first release is listed here.
    /// </summary>
    private static void Migrate(SqliteConnection c)
    {
        AddColumnIfMissing(c, "Items", "PartId", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfMissing(c, "Parts", "Consumable", "INTEGER NOT NULL DEFAULT 0");
        AddColumnIfMissing(c, "Appointments", "Status", "TEXT NOT NULL DEFAULT 'confirmed'");

        // 0.5: photos and signatures, for jobs, invoices and the tester.
        AttachmentStore.EnsureSchema(c);

        // 0.1 wrote the "sent" invoice status, which the server rejects.
        using var fix = c.CreateCommand();
        fix.CommandText = "UPDATE Invoices SET Status = 'due' WHERE Status = 'sent'";
        fix.ExecuteNonQuery();
    }

    public static void AddColumnIfMissing(SqliteConnection c, string table, string column, string definition)
    {
        // Table may not exist yet (Parts is created later, by PartsCatalogue).
        using (var exists = c.CreateCommand())
        {
            exists.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=$t";
            exists.Parameters.AddWithValue("$t", table);
            if (Convert.ToInt32(exists.ExecuteScalar() ?? 0) == 0) return;
        }

        using (var info = c.CreateCommand())
        {
            info.CommandText = $"PRAGMA table_info({table})";
            using var r = info.ExecuteReader();
            while (r.Read())
                if (string.Equals(r.GetString(1), column, StringComparison.OrdinalIgnoreCase))
                    return;
        }

        using var alter = c.CreateCommand();
        alter.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {definition}";
        alter.ExecuteNonQuery();
    }

    /// <summary>
    /// Schema version 1. Additive changes only — a released app will have
    /// real data in it, so columns get added, never removed or retyped.
    /// </summary>
    private const string Schema = """
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS Meta (
            Key         TEXT PRIMARY KEY,
            Value       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Clients (
            Id          TEXT PRIMARY KEY,
            Name        TEXT NOT NULL DEFAULT '',
            Company     TEXT NOT NULL DEFAULT '',
            Email       TEXT NOT NULL DEFAULT '',
            Phone       TEXT NOT NULL DEFAULT '',
            Address     TEXT NOT NULL DEFAULT '',
            Notes       TEXT NOT NULL DEFAULT '',
            CreatedAt   TEXT NOT NULL,
            UpdatedAt   TEXT NOT NULL,
            Deleted     INTEGER NOT NULL DEFAULT 0,
            ServerId    TEXT
        );

        CREATE TABLE IF NOT EXISTS Jobs (
            Id              TEXT PRIMARY KEY,
            ClientId        TEXT,
            CertNumber      TEXT NOT NULL DEFAULT '',
            JobType         TEXT NOT NULL DEFAULT 'test_tag',
            SiteAddress     TEXT NOT NULL DEFAULT '',
            Environment     TEXT NOT NULL DEFAULT 'office',
            RetestMonths    INTEGER NOT NULL DEFAULT 12,
            TestDate        TEXT NOT NULL DEFAULT '',
            TesterName      TEXT NOT NULL DEFAULT '',
            TesterLicence   TEXT NOT NULL DEFAULT '',
            TestEquipment   TEXT NOT NULL DEFAULT '',
            CalibrationDate TEXT NOT NULL DEFAULT '',
            TagStart        TEXT NOT NULL DEFAULT '',
            GeneratorJson   TEXT NOT NULL DEFAULT '',
            Status          TEXT NOT NULL DEFAULT 'draft',
            CreatedAt       TEXT NOT NULL,
            UpdatedAt       TEXT NOT NULL,
            Deleted         INTEGER NOT NULL DEFAULT 0,
            ServerId        TEXT,
            FOREIGN KEY (ClientId) REFERENCES Clients(Id)
        );
        CREATE INDEX IF NOT EXISTS IX_Jobs_Client ON Jobs(ClientId);
        CREATE INDEX IF NOT EXISTS IX_Jobs_TestDate ON Jobs(TestDate);

        CREATE TABLE IF NOT EXISTS Items (
            Id                  TEXT PRIMARY KEY,
            JobId               TEXT NOT NULL,
            Position            INTEGER NOT NULL DEFAULT 0,
            TagNumber           TEXT NOT NULL DEFAULT '',
            Description         TEXT NOT NULL DEFAULT '',
            MakeModel           TEXT NOT NULL DEFAULT '',
            SerialNumber        TEXT NOT NULL DEFAULT '',
            Location            TEXT NOT NULL DEFAULT '',
            ItemType            TEXT NOT NULL DEFAULT 'standard',
            EquipmentClass      TEXT NOT NULL DEFAULT 'I',
            CordLength          TEXT NOT NULL DEFAULT '',
            Visual              TEXT NOT NULL DEFAULT 'pass',
            CordCondition       TEXT NOT NULL DEFAULT 'good',
            PlugCondition       TEXT NOT NULL DEFAULT 'good',
            Polarity            TEXT NOT NULL DEFAULT 'n/a',
            EarthContinuity     TEXT NOT NULL DEFAULT '',
            InsulationResistance TEXT NOT NULL DEFAULT '',
            InsulationVoltage   TEXT NOT NULL DEFAULT '500',
            LeakageCurrent      TEXT NOT NULL DEFAULT '',
            RcdTest             TEXT NOT NULL DEFAULT 'n/a',
            RcdJson             TEXT NOT NULL DEFAULT '',
            OperationTest       TEXT NOT NULL DEFAULT 'n/a',
            FuseCheck           TEXT NOT NULL DEFAULT 'n/a',
            Result              TEXT NOT NULL DEFAULT 'pass',
            ResultOverridden    INTEGER NOT NULL DEFAULT 0,
            FaultDescription    TEXT NOT NULL DEFAULT '',
            RepairDetails       TEXT NOT NULL DEFAULT '',
            PartId              TEXT NOT NULL DEFAULT '',
            RemovedFromService  INTEGER NOT NULL DEFAULT 0,
            FollowUp            INTEGER NOT NULL DEFAULT 0,
            Notes               TEXT NOT NULL DEFAULT '',
            UpdatedAt           TEXT NOT NULL,
            Deleted             INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (JobId) REFERENCES Jobs(Id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS IX_Items_Job ON Items(JobId, Position);

        CREATE TABLE IF NOT EXISTS Invoices (
            Id          TEXT PRIMARY KEY,
            ClientId    TEXT,
            JobId       TEXT,
            Number      TEXT NOT NULL DEFAULT '',
            IssuedDate  TEXT NOT NULL DEFAULT '',
            DueDate     TEXT NOT NULL DEFAULT '',
            Subtotal    REAL NOT NULL DEFAULT 0,
            Total       REAL NOT NULL DEFAULT 0,
            Status      TEXT NOT NULL DEFAULT 'draft',
            LinesJson   TEXT NOT NULL DEFAULT '',
            Notes       TEXT NOT NULL DEFAULT '',
            CreatedAt   TEXT NOT NULL,
            UpdatedAt   TEXT NOT NULL,
            Deleted     INTEGER NOT NULL DEFAULT 0,
            ServerId    TEXT
        );
        CREATE INDEX IF NOT EXISTS IX_Invoices_Status ON Invoices(Status);

        CREATE TABLE IF NOT EXISTS Appointments (
            Id          TEXT PRIMARY KEY,
            ClientId    TEXT,
            Title       TEXT NOT NULL DEFAULT '',
            StartsAt    TEXT NOT NULL DEFAULT '',
            EndsAt      TEXT NOT NULL DEFAULT '',
            Location    TEXT NOT NULL DEFAULT '',
            Notes       TEXT NOT NULL DEFAULT '',
            CreatedAt   TEXT NOT NULL,
            UpdatedAt   TEXT NOT NULL,
            Deleted     INTEGER NOT NULL DEFAULT 0,
            ServerId    TEXT
        );
        CREATE INDEX IF NOT EXISTS IX_Appointments_Start ON Appointments(StartsAt);

        -- Queue of local changes waiting to be pushed. Survives restarts so a
        -- change made with no signal isn't lost if the app closes.
        CREATE TABLE IF NOT EXISTS SyncQueue (
            Id          INTEGER PRIMARY KEY AUTOINCREMENT,
            TableName   TEXT NOT NULL,
            RowId       TEXT NOT NULL,
            Operation   TEXT NOT NULL,
            QueuedAt    TEXT NOT NULL,
            Attempts    INTEGER NOT NULL DEFAULT 0,
            LastError   TEXT NOT NULL DEFAULT ''
        );

        -- 3D printer filament (local to the suite; the website has no filament stock).
        CREATE TABLE IF NOT EXISTS Filament (
            Id              TEXT PRIMARY KEY,
            Material        TEXT NOT NULL DEFAULT 'PLA',
            Colour          TEXT NOT NULL DEFAULT '',
            Brand           TEXT NOT NULL DEFAULT '',
            SpoolGrams      REAL NOT NULL DEFAULT 1000,
            RemainingGrams  REAL NOT NULL DEFAULT 1000,
            CostPerKg       REAL NOT NULL DEFAULT 0,
            LowAtGrams      REAL NOT NULL DEFAULT 200,
            Notes           TEXT NOT NULL DEFAULT '',
            UpdatedAt       TEXT NOT NULL,
            Deleted         INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS FilamentLog (
            Id          INTEGER PRIMARY KEY AUTOINCREMENT,
            SpoolId     TEXT NOT NULL,
            Grams       REAL NOT NULL,
            Note        TEXT NOT NULL DEFAULT '',
            At          TEXT NOT NULL
        );

        INSERT OR IGNORE INTO Meta (Key, Value) VALUES ('SchemaVersion', '1');
        """;
}
