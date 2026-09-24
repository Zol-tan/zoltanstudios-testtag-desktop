using System.IO;
using Microsoft.Data.Sqlite;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// Whole-database backup and restore. The backup is the SQLite database
/// itself (copied with SQLite's online backup, so it's consistent even while
/// the app is running) - jobs, items, clients, invoices, bookings, parts,
/// filament, rates, settings and anything still waiting to sync.
/// </summary>
public static class BackupService
{
    private static SqliteConnection OpenFile(string path, bool readOnly)
    {
        var cs = new SqliteConnectionStringBuilder
        {
            DataSource = path,
            Mode = readOnly ? SqliteOpenMode.ReadOnly : SqliteOpenMode.ReadWriteCreate,
            Pooling = false,
        }.ToString();
        var c = new SqliteConnection(cs);
        c.Open();
        return c;
    }

    /// <summary>Writes a backup to <paramref name="path"/> and describes what's in it.</summary>
    public static string Export(string path)
    {
        var tmp = path + ".partial";
        if (File.Exists(tmp)) File.Delete(tmp);

        using (var src = Database.Open())
        using (var dst = OpenFile(tmp, readOnly: false))
        {
            src.BackupDatabase(dst);
            // One self-contained file, not a database plus a -wal file.
            using var cmd = dst.CreateCommand();
            cmd.CommandText = "PRAGMA journal_mode = DELETE;";
            cmd.ExecuteNonQuery();
        }

        // Only replace an existing file once the new copy is complete.
        File.Move(tmp, path, overwrite: true);
        return Inspect(path).Message;
    }

    /// <summary>Checks a file really is a suite backup and says what it holds.</summary>
    public static (bool Ok, string Message) Inspect(string path)
    {
        if (!File.Exists(path)) return (false, "That file doesn't exist.");
        try
        {
            using var c = OpenFile(path, readOnly: true);
            long Count(string table)
            {
                using var exists = c.CreateCommand();
                exists.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=$t";
                exists.Parameters.AddWithValue("$t", table);
                if (Convert.ToInt64(exists.ExecuteScalar() ?? 0) == 0) return -1;
                using var cmd = c.CreateCommand();
                cmd.CommandText = $"SELECT COUNT(*) FROM {table} WHERE {(table is "Meta" or "Parts" ? "1=1" : "Deleted = 0")}";
                return Convert.ToInt64(cmd.ExecuteScalar() ?? 0);
            }

            if (Count("Meta") < 0 || Count("Jobs") < 0 || Count("Clients") < 0)
                return (false, "That file isn't a Business Suite backup.");

            var parts = Count("Parts");
            return (true,
                $"{Count("Jobs")} job(s), {Count("Clients")} client(s), {Count("Invoices")} invoice(s), " +
                $"{Count("Appointments")} booking(s)" + (parts >= 0 ? $", {parts} part(s)" : "") + ".");
        }
        catch (SqliteException)
        {
            return (false, "That file isn't a Business Suite backup (it couldn't be opened as one).");
        }
    }

    /// <summary>
    /// Replaces the live database with a backup. The current data is saved
    /// first, and that copy's path is returned so the user can go back.
    /// </summary>
    public static string Import(string path)
    {
        var check = Inspect(path);
        if (!check.Ok) throw new InvalidOperationException(check.Message);

        var dir = Path.GetDirectoryName(Database.Path)!;
        var safety = Path.Combine(dir, $"before-restore-{DateTime.Now:yyyyMMdd-HHmmss}.zsbackup");
        Export(safety);

        using (var src = OpenFile(path, readOnly: true))
        using (var dst = Database.Open())
        {
            src.BackupDatabase(dst);
        }

        // A backup from an older version gets the columns added since.
        Database.Initialise();
        PartsCatalogue.EnsureSchema();
        return safety;
    }
}
