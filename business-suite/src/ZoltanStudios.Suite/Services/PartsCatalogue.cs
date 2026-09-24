using Microsoft.Data.Sqlite;

namespace ZoltanStudios.Suite.Services;

/// <summary>A repair part carried in the van.</summary>
public sealed class Part
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Sku { get; set; } = "";          // Bunnings I/N
    public string Name { get; set; } = "";
    public double Cost { get; set; }               // what it cost to buy
    public double Sell { get; set; }               // what the customer pays, fitted
    public int OnHand { get; set; }
    public int LowAt { get; set; } = 2;            // warn at or below this
    public bool Active { get; set; } = true;

    /// <summary>
    /// Bulk kits (heatshrink, crimp terminals) used a piece at a time. Tracked
    /// for restocking but never billed per fit - charging a whole 127-piece
    /// kit for one sleeve would be wrong.
    /// </summary>
    public bool Consumable { get; set; }

    /// <summary>Name, price or settings edited here and not yet sent to the server.</summary>
    public bool CatalogueDirty { get; set; }

    /// <summary>
    /// Stock counted here (a restock) and not yet sent. Kept separate so a
    /// price edit never sends a stale count that would undo parts fitted
    /// from the website in the meantime.
    /// </summary>
    public bool StockDirty { get; set; }

    public bool IsLow => Active && OnHand <= LowAt;

    /// <summary>What the Parts grid shows in its Status column.</summary>
    public string StatusText => !Active ? "Archived"
        : OnHand <= 0 ? "Out"
        : OnHand <= LowAt ? "Low"
        : "OK";
    public double Margin => Sell - Cost;
    public string Display => $"{Name} — ${Sell:0.00}";
}

/// <summary>
/// Parts carried for on-site repairs, so a failed item can often be fixed
/// rather than tagged out.
///
/// Seeded from the stock actually carried. Sell prices start at cost plus the
/// markup in Settings, because the value is being there with the right part
/// and the licence to fit it, not the part itself. Every price is editable.
/// Changing the markup in Settings doesn't touch existing prices; the
/// "Reprice from markup" button applies it, and asks first.
/// </summary>
public static class PartsCatalogue
{
    public const string MarkupKey = "rate.PartsMarkupPercent";
    public const double DefaultMarkup = 250; // i.e. a $4 plug top sells at $14

    public static double Markup()
        => double.TryParse(Repository.GetSetting(MarkupKey, ""), out var v) ? v : DefaultMarkup;

    public static void SetMarkup(double percent)
        => Repository.SetSetting(MarkupKey, percent.ToString("0.##"));

    /// <summary>
    /// Cost plus markup, rounded up to the dollar. Rounding up to $5 above a
    /// threshold made near-identical parts differ by several dollars.
    /// </summary>
    public static double SuggestedSell(double cost)
        => Math.Ceiling(cost * (1 + Markup() / 100.0));

    // The van stock. I/N numbers are Bunnings item numbers so a restock list
    // can be taken straight to the trade desk.
    private static readonly (string Sku, string Name, double Cost, int Qty, bool Consumable)[] Seed =
    {
        ("4330985", "DETA 10A Side Entry Plug Top — Black",         4.16, 1, false),
        ("4430411", "DETA 10A Plug Top — White",                    3.59, 1, false),
        ("4430413", "DETA 10A Plug Top — Grey",                     3.59, 1, false),
        ("4430439", "DETA 10A Extension Socket — Clear",            5.27, 1, false),
        ("4430436", "DETA 10A Extension Socket — White",            5.27, 1, false),
        ("4430437", "DETA 10A Extension Socket — Grey",             5.90, 1, false),
        ("0189135", "Click Cable Management Kit — 150 pieces",     10.45, 1, true),
        ("0381120", "Click Multicolour Heatshrink Kit — 80 pieces", 10.58, 1, true),
        ("0381146", "Click Heatshrink Kit — 127 pieces",           10.58, 1, true),
        ("0255490", "Click 0.9m 4-Outlet Powerboard — White",       7.18, 2, false),
        ("0255495", "Click 0.9m 6-Outlet Powerboard — White",      10.46, 2, false),
    };

    public static void EnsureSchema()
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS Parts (
                Id        TEXT PRIMARY KEY,
                Sku       TEXT NOT NULL DEFAULT '',
                Name      TEXT NOT NULL DEFAULT '',
                Cost      REAL NOT NULL DEFAULT 0,
                Sell      REAL NOT NULL DEFAULT 0,
                OnHand    INTEGER NOT NULL DEFAULT 0,
                LowAt     INTEGER NOT NULL DEFAULT 2,
                Active    INTEGER NOT NULL DEFAULT 1,
                Consumable INTEGER NOT NULL DEFAULT 0,
                CatalogueDirty INTEGER NOT NULL DEFAULT 0,
                StockDirty INTEGER NOT NULL DEFAULT 0,
                UpdatedAt TEXT NOT NULL DEFAULT ''
            );

            -- What was fitted on which job, so parts land on the invoice and
            -- stock can be counted down.
            CREATE TABLE IF NOT EXISTS PartsUsed (
                Id        TEXT PRIMARY KEY,
                JobId     TEXT NOT NULL,
                ItemId    TEXT NOT NULL DEFAULT '',
                PartId    TEXT NOT NULL,
                Quantity  INTEGER NOT NULL DEFAULT 1,
                Sell      REAL NOT NULL DEFAULT 0,
                UsedAt    TEXT NOT NULL DEFAULT ''
            );
            CREATE INDEX IF NOT EXISTS IX_PartsUsed_Job ON PartsUsed(JobId);
            """;
        cmd.ExecuteNonQuery();
        Database.AddColumnIfMissing(c, "Parts", "Consumable", "INTEGER NOT NULL DEFAULT 0");
        Database.AddColumnIfMissing(c, "Parts", "CatalogueDirty", "INTEGER NOT NULL DEFAULT 0");
        Database.AddColumnIfMissing(c, "Parts", "StockDirty", "INTEGER NOT NULL DEFAULT 0");
        SeedIfEmpty();
    }

    private static void SeedIfEmpty()
    {
        using var c = Database.Open();
        using (var count = c.CreateCommand())
        {
            count.CommandText = "SELECT COUNT(*) FROM Parts";
            if (Convert.ToInt32(count.ExecuteScalar() ?? 0) > 0) return;
        }

        foreach (var (sku, name, cost, qty, consumable) in Seed)
        {
            using var cmd = c.CreateCommand();
            cmd.CommandText = """
                INSERT INTO Parts (Id,Sku,Name,Cost,Sell,OnHand,LowAt,Active,Consumable,UpdatedAt)
                VALUES ($id,$sku,$n,$c,$s,$q,$low,1,$con,$u)
                """;
            cmd.Parameters.AddWithValue("$id", Guid.NewGuid().ToString("N"));
            cmd.Parameters.AddWithValue("$sku", sku);
            cmd.Parameters.AddWithValue("$n", name);
            cmd.Parameters.AddWithValue("$c", cost);
            cmd.Parameters.AddWithValue("$s", consumable ? 0 : SuggestedSell(cost));
            cmd.Parameters.AddWithValue("$low", consumable ? 0 : 2);
            cmd.Parameters.AddWithValue("$con", consumable ? 1 : 0);
            cmd.Parameters.AddWithValue("$q", qty);
            cmd.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("s"));
            cmd.ExecuteNonQuery();
        }
    }

    // ------------------------------------------------------------------ reads

    public static List<Part> All(bool includeInactive = false)
    {
        var list = new List<Part>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = includeInactive
            ? "SELECT * FROM Parts ORDER BY Name"
            : "SELECT * FROM Parts WHERE Active = 1 ORDER BY Name";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Part
            {
                Id = r.GetString(r.GetOrdinal("Id")),
                Sku = r.GetString(r.GetOrdinal("Sku")),
                Name = r.GetString(r.GetOrdinal("Name")),
                Cost = r.GetDouble(r.GetOrdinal("Cost")),
                Sell = r.GetDouble(r.GetOrdinal("Sell")),
                OnHand = r.GetInt32(r.GetOrdinal("OnHand")),
                LowAt = r.GetInt32(r.GetOrdinal("LowAt")),
                Active = r.GetInt32(r.GetOrdinal("Active")) == 1,
                Consumable = r.GetInt32(r.GetOrdinal("Consumable")) == 1,
                CatalogueDirty = r.GetInt32(r.GetOrdinal("CatalogueDirty")) == 1,
                StockDirty = r.GetInt32(r.GetOrdinal("StockDirty")) == 1,
            });
        }
        return list;
    }

    /// <summary>Most urgent first: out of stock, then fewest left.</summary>
    public static List<Part> LowStock() => All().Where(p => p.IsLow).OrderBy(p => p.OnHand).ThenBy(p => p.Name).ToList();

    /// <summary>Plain-text list to paste into a message or take to the trade desk.</summary>
    public static string RestockText(List<Part> low)
        => "Restock list - ZoltanStudios - " + DateTime.Today.ToString("d MMM yyyy") + "\n\n"
         + string.Join("\n", low.Select(p => (p.Sku ?? "").PadRight(9) + p.Name + "  -  " + p.OnHand + " left"));

    /// <summary>Parts that can be billed as fitted to an item.</summary>
    public static List<Part> Fittable() => All().Where(p => !p.Consumable).ToList();

    public static void Save(Part p)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Parts (Id,Sku,Name,Cost,Sell,OnHand,LowAt,Active,Consumable,CatalogueDirty,StockDirty,UpdatedAt)
            VALUES ($id,$sku,$n,$c,$s,$q,$l,$a,$con,$cd,$sd,$u)
            ON CONFLICT(Id) DO UPDATE SET
                Sku=$sku, Name=$n, Cost=$c, Sell=$s, OnHand=$q, LowAt=$l, Active=$a,
                Consumable=$con, CatalogueDirty=$cd, StockDirty=$sd, UpdatedAt=$u
            """;
        cmd.Parameters.AddWithValue("$id", p.Id);
        cmd.Parameters.AddWithValue("$sku", p.Sku);
        cmd.Parameters.AddWithValue("$n", p.Name);
        cmd.Parameters.AddWithValue("$c", p.Cost);
        cmd.Parameters.AddWithValue("$s", p.Sell);
        cmd.Parameters.AddWithValue("$q", p.OnHand);
        cmd.Parameters.AddWithValue("$l", p.LowAt);
        cmd.Parameters.AddWithValue("$a", p.Active ? 1 : 0);
        cmd.Parameters.AddWithValue("$con", p.Consumable ? 1 : 0);
        cmd.Parameters.AddWithValue("$cd", p.CatalogueDirty ? 1 : 0);
        cmd.Parameters.AddWithValue("$sd", p.StockDirty ? 1 : 0);
        cmd.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("s"));
        cmd.ExecuteNonQuery();
    }

    public static List<Part> Dirty()
        => All(includeInactive: true).Where(p => p.CatalogueDirty || p.StockDirty).ToList();

    public static void MarkClean(string id)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "UPDATE Parts SET CatalogueDirty = 0, StockDirty = 0 WHERE Id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    /// <summary>
    /// Brings the local catalogue into line with the server, which owns the
    /// stock count.
    ///
    /// The first sync matches the locally seeded parts to the server's by
    /// Bunnings I/N and moves any job items across to the server's ids, so a
    /// part fitted before the first sync still resolves. Local edits not yet
    /// sent are kept (and sent straight after); everything else takes the
    /// server's values. Unsent new parts survive; stale local copies don't.
    /// </summary>
    public static void ReplaceFromServer(List<Part> server)
    {
        var local = All(includeInactive: true);
        var serverIds = new HashSet<string>(server.Select(p => p.Id));
        var kept = new HashSet<string>();

        using var c = Database.Open();
        using var tx = c.BeginTransaction();

        void Exec(string sql, params (string, object)[] args)
        {
            using var cmd = c.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = sql;
            foreach (var (k, v) in args) cmd.Parameters.AddWithValue(k, v);
            cmd.ExecuteNonQuery();
        }

        foreach (var sp in server.Where(p => p.Id.Length > 0))
        {
            var mine = local.FirstOrDefault(l => l.Id == sp.Id)
                    ?? local.FirstOrDefault(l => l.Sku.Length > 0 && l.Sku == sp.Sku && !serverIds.Contains(l.Id));

            if (mine is not null && mine.Id != sp.Id)
            {
                // Same part, different id: adopt the server's id everywhere.
                Exec("UPDATE Items SET PartId = $new WHERE PartId = $old", ("$new", sp.Id), ("$old", mine.Id));
                Exec("UPDATE PartsUsed SET PartId = $new WHERE PartId = $old", ("$new", sp.Id), ("$old", mine.Id));
                Exec("DELETE FROM Parts WHERE Id = $old", ("$old", mine.Id));
            }

            var merged = new Part
            {
                Id = sp.Id,
                Sku = mine is { CatalogueDirty: true } ? mine.Sku : sp.Sku,
                Name = mine is { CatalogueDirty: true } ? mine.Name : sp.Name,
                Cost = mine is { CatalogueDirty: true } ? mine.Cost : sp.Cost,
                Sell = mine is { CatalogueDirty: true } ? mine.Sell : sp.Sell,
                LowAt = mine is { CatalogueDirty: true } ? mine.LowAt : sp.LowAt,
                Active = mine is { CatalogueDirty: true } ? mine.Active : sp.Active,
                Consumable = mine is { CatalogueDirty: true } ? mine.Consumable : sp.Consumable,
                OnHand = mine is { StockDirty: true } ? mine.OnHand : sp.OnHand,
                CatalogueDirty = mine?.CatalogueDirty ?? false,
                StockDirty = mine?.StockDirty ?? false,
            };

            Exec("""
                INSERT INTO Parts (Id,Sku,Name,Cost,Sell,OnHand,LowAt,Active,Consumable,CatalogueDirty,StockDirty,UpdatedAt)
                VALUES ($id,$sku,$n,$c,$s,$q,$l,$a,$con,$cd,$sd,$u)
                ON CONFLICT(Id) DO UPDATE SET
                    Sku=$sku, Name=$n, Cost=$c, Sell=$s, OnHand=$q, LowAt=$l, Active=$a,
                    Consumable=$con, CatalogueDirty=$cd, StockDirty=$sd, UpdatedAt=$u
                """,
                ("$id", merged.Id), ("$sku", merged.Sku), ("$n", merged.Name), ("$c", merged.Cost),
                ("$s", merged.Sell), ("$q", merged.OnHand), ("$l", merged.LowAt),
                ("$a", merged.Active ? 1 : 0), ("$con", merged.Consumable ? 1 : 0),
                ("$cd", merged.CatalogueDirty ? 1 : 0), ("$sd", merged.StockDirty ? 1 : 0),
                ("$u", DateTime.UtcNow.ToString("s")));

            kept.Add(sp.Id);
            if (mine is not null) kept.Add(mine.Id);
        }

        // Local parts the server doesn't have: keep unsent new ones, drop the rest.
        foreach (var l in local.Where(l => !kept.Contains(l.Id) && !l.CatalogueDirty && !l.StockDirty))
            Exec("DELETE FROM Parts WHERE Id = $id", ("$id", l.Id));

        tx.Commit();
    }

    // ------------------------------------------------------------ usage

    /// <summary>
    /// Records a part fitted on a job and decrements stock. Called when a job
    /// is saved, so the count reflects what actually left the van.
    /// </summary>
    public static void RecordUse(string jobId, string itemId, string partId, int qty = 1)
    {
        var part = All(includeInactive: true).FirstOrDefault(p => p.Id == partId);
        if (part is null) return;

        using var c = Database.Open();
        using (var cmd = c.CreateCommand())
        {
            cmd.CommandText = """
                INSERT INTO PartsUsed (Id,JobId,ItemId,PartId,Quantity,Sell,UsedAt)
                VALUES ($id,$j,$i,$p,$q,$s,$u)
                """;
            cmd.Parameters.AddWithValue("$id", Guid.NewGuid().ToString("N"));
            cmd.Parameters.AddWithValue("$j", jobId);
            cmd.Parameters.AddWithValue("$i", itemId);
            cmd.Parameters.AddWithValue("$p", partId);
            cmd.Parameters.AddWithValue("$q", qty);
            cmd.Parameters.AddWithValue("$s", part.Sell);
            cmd.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("s"));
            cmd.ExecuteNonQuery();
        }

        // Never let stock go negative - that hides a miscount rather than
        // surfacing it.
        using var dec = c.CreateCommand();
        dec.CommandText = "UPDATE Parts SET OnHand = MAX(0, OnHand - $q) WHERE Id = $p";
        dec.Parameters.AddWithValue("$q", qty);
        dec.Parameters.AddWithValue("$p", partId);
        dec.ExecuteNonQuery();
    }

    /// <summary>
    /// Undoes a job's recorded usage, returning the parts to stock first.
    /// Deleting the rows without restoring stock meant every re-save of a job
    /// counted the same part out again.
    /// </summary>
    public static void ClearUsageFor(string jobId)
    {
        using var c = Database.Open();
        using var tx = c.BeginTransaction();

        using (var restore = c.CreateCommand())
        {
            restore.CommandText = """
                UPDATE Parts SET OnHand = OnHand + (
                    SELECT COALESCE(SUM(u.Quantity), 0) FROM PartsUsed u
                    WHERE u.PartId = Parts.Id AND u.JobId = $j)
                WHERE Id IN (SELECT PartId FROM PartsUsed WHERE JobId = $j)
                """;
            restore.Parameters.AddWithValue("$j", jobId);
            restore.ExecuteNonQuery();
        }

        using (var del = c.CreateCommand())
        {
            del.CommandText = "DELETE FROM PartsUsed WHERE JobId = $j";
            del.Parameters.AddWithValue("$j", jobId);
            del.ExecuteNonQuery();
        }

        tx.Commit();
    }

    /// <summary>Parts fitted on a job, for the invoice.</summary>
    public static List<(string Name, int Quantity, double Sell)> UsedOn(string jobId)
    {
        var list = new List<(string, int, double)>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            SELECT p.Name, u.Quantity, u.Sell
            FROM PartsUsed u JOIN Parts p ON p.Id = u.PartId
            WHERE u.JobId = $j
            """;
        cmd.Parameters.AddWithValue("$j", jobId);
        using var r = cmd.ExecuteReader();
        while (r.Read()) list.Add((r.GetString(0), r.GetInt32(1), r.GetDouble(2)));
        return list;
    }
}
