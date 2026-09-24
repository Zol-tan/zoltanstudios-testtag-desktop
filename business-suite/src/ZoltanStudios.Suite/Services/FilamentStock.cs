using ZoltanStudios.Suite.Models;

namespace ZoltanStudios.Suite.Services;

/// <summary>One spool (or a stock line of identical spools counted in grams).</summary>
public sealed class Spool
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Material { get; set; } = "PLA";
    public string Colour { get; set; } = "";
    public string Brand { get; set; } = "";
    public double SpoolGrams { get; set; } = 1000;
    public double RemainingGrams { get; set; } = 1000;
    public double CostPerKg { get; set; }
    public double LowAtGrams { get; set; } = 200;
    public string Notes { get; set; } = "";

    public bool IsLow => RemainingGrams <= LowAtGrams;
    public string Display => $"{Material} {Colour}".Trim() + (Brand.Length > 0 ? $" ({Brand})" : "");
    public int PercentLeft => SpoolGrams <= 0 ? 0 : (int)Math.Round(Math.Clamp(RemainingGrams / SpoolGrams, 0, 1) * 100);
    public double ValueLeft => Math.Round(RemainingGrams / 1000.0 * CostPerKg, 2);
    public string State => RemainingGrams <= 0 ? "out" : IsLow ? "low" : "in stock";
}

/// <summary>
/// Filament stock, kept in the suite only - the website has nowhere to store
/// it. Every use is logged, so "where did that kilo of PETG go" has an answer.
/// </summary>
public static class FilamentStock
{
    public static readonly string[] Materials = { "PLA", "PETG", "ABS", "ASA", "TPU", "Nylon", "Composite", "Other" };

    public static List<Spool> All()
    {
        var list = new List<Spool>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT * FROM Filament WHERE Deleted = 0 ORDER BY Material, Colour";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new Spool
            {
                Id = r.GetString(r.GetOrdinal("Id")),
                Material = r.GetString(r.GetOrdinal("Material")),
                Colour = r.GetString(r.GetOrdinal("Colour")),
                Brand = r.GetString(r.GetOrdinal("Brand")),
                SpoolGrams = r.GetDouble(r.GetOrdinal("SpoolGrams")),
                RemainingGrams = r.GetDouble(r.GetOrdinal("RemainingGrams")),
                CostPerKg = r.GetDouble(r.GetOrdinal("CostPerKg")),
                LowAtGrams = r.GetDouble(r.GetOrdinal("LowAtGrams")),
                Notes = r.GetString(r.GetOrdinal("Notes")),
            });
        }
        return list;
    }

    public static void Save(Spool s)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
            INSERT INTO Filament (Id,Material,Colour,Brand,SpoolGrams,RemainingGrams,CostPerKg,LowAtGrams,Notes,UpdatedAt,Deleted)
            VALUES ($id,$m,$c,$b,$sg,$rg,$ck,$lo,$n,$u,0)
            ON CONFLICT(Id) DO UPDATE SET Material=$m, Colour=$c, Brand=$b, SpoolGrams=$sg, RemainingGrams=$rg,
                CostPerKg=$ck, LowAtGrams=$lo, Notes=$n, UpdatedAt=$u
            """;
        cmd.Parameters.AddWithValue("$id", s.Id);
        cmd.Parameters.AddWithValue("$m", s.Material);
        cmd.Parameters.AddWithValue("$c", s.Colour);
        cmd.Parameters.AddWithValue("$b", s.Brand);
        cmd.Parameters.AddWithValue("$sg", Math.Max(0, s.SpoolGrams));
        cmd.Parameters.AddWithValue("$rg", Math.Max(0, s.RemainingGrams));
        cmd.Parameters.AddWithValue("$ck", Math.Max(0, s.CostPerKg));
        cmd.Parameters.AddWithValue("$lo", Math.Max(0, s.LowAtGrams));
        cmd.Parameters.AddWithValue("$n", s.Notes);
        cmd.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("s"));
        cmd.ExecuteNonQuery();
    }

    public static void Delete(string id)
    {
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "UPDATE Filament SET Deleted = 1, UpdatedAt = $u WHERE Id = $id";
        cmd.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("s"));
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    /// <summary>
    /// Takes grams off a spool (never below zero) and logs it. A negative
    /// amount adds stock back, e.g. a failed print you reclaimed or a correction.
    /// Returns the grams actually taken.
    /// </summary>
    public static double Use(string spoolId, double grams, string note)
    {
        var s = All().FirstOrDefault(x => x.Id == spoolId)
            ?? throw new InvalidOperationException("That spool no longer exists.");
        var before = s.RemainingGrams;
        s.RemainingGrams = Math.Max(0, before - grams);
        Save(s);
        var taken = before - s.RemainingGrams;

        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "INSERT INTO FilamentLog (SpoolId, Grams, Note, At) VALUES ($s, $g, $n, $a)";
        cmd.Parameters.AddWithValue("$s", spoolId);
        cmd.Parameters.AddWithValue("$g", taken);
        cmd.Parameters.AddWithValue("$n", note);
        cmd.Parameters.AddWithValue("$a", DateTime.Now.ToString("yyyy-MM-dd HH:mm"));
        cmd.ExecuteNonQuery();
        return taken;
    }

    public sealed record LogEntry(string At, string Spool, double Grams, string Note);

    public static List<LogEntry> Log(int max = 100)
    {
        var spools = All().ToDictionary(s => s.Id, s => s.Display);
        var list = new List<LogEntry>();
        using var c = Database.Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "SELECT SpoolId, Grams, Note, At FROM FilamentLog ORDER BY Id DESC LIMIT $m";
        cmd.Parameters.AddWithValue("$m", max);
        using var r = cmd.ExecuteReader();
        while (r.Read())
            list.Add(new LogEntry(r.GetString(3), spools.TryGetValue(r.GetString(0), out var n) ? n : "(deleted spool)",
                r.GetDouble(1), r.GetString(2)));
        return list;
    }

    public static List<Spool> Low() => All().Where(s => s.IsLow).ToList();
}
