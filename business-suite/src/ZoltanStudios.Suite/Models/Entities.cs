namespace ZoltanStudios.Suite.Models;

/// <summary>Everything syncable carries these. See Database.cs for why.</summary>
public abstract class SyncEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("s");
    public bool Deleted { get; set; }
    public string? ServerId { get; set; }
}

public sealed class Client : SyncEntity
{
    public string Name { get; set; } = "";
    public string Company { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string Notes { get; set; } = "";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("s");

    public string Display => string.IsNullOrWhiteSpace(Company) ? Name : $"{Name} — {Company}";
}

public sealed class Job : SyncEntity
{
    public string? ClientId { get; set; }
    public string CertNumber { get; set; } = "";
    public string JobType { get; set; } = "test_tag";
    public string SiteAddress { get; set; } = "";
    public string Environment { get; set; } = "office";
    public int RetestMonths { get; set; } = 12;
    public string TestDate { get; set; } = DateTime.Today.ToString("yyyy-MM-dd");
    public string TesterName { get; set; } = "";
    public string TesterLicence { get; set; } = "";
    public string TestEquipment { get; set; } = "";
    public string CalibrationDate { get; set; } = "";
    public string TagStart { get; set; } = "";
    public string Status { get; set; } = "draft";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("s");

    public List<Item> Items { get; set; } = new();

    public int ItemCount => Items.Count;
    public int FailCount => Items.Count(i => i.Result == "fail");
    public bool IsGenerator => JobType == "generator_inspection";

    /// <summary>Next test date, derived rather than stored so it can't go stale.</summary>
    public string NextDue =>
        DateTime.TryParse(TestDate, out var d)
            ? d.AddMonths(RetestMonths).ToString("yyyy-MM-dd")
            : "";

    public int DaysUntilRetest =>
        DateTime.TryParse(NextDue, out var due)
            ? (int)(due.Date - DateTime.Today).TotalDays
            : int.MaxValue;
}

public sealed class Item : SyncEntity
{
    public string JobId { get; set; } = "";
    public int Position { get; set; }
    public string TagNumber { get; set; } = "";
    public string Description { get; set; } = "";
    public string MakeModel { get; set; } = "";
    public string SerialNumber { get; set; } = "";
    public string Location { get; set; } = "";
    public string ItemType { get; set; } = "standard";
    public string EquipmentClass { get; set; } = "I";
    public string CordLength { get; set; } = "";
    public string Visual { get; set; } = "pass";
    public string CordCondition { get; set; } = "good";
    public string PlugCondition { get; set; } = "good";
    public string Polarity { get; set; } = "n/a";
    public string EarthContinuity { get; set; } = "";
    public string InsulationResistance { get; set; } = "";
    public string InsulationVoltage { get; set; } = "500";
    public string LeakageCurrent { get; set; } = "";
    public string RcdTest { get; set; } = "n/a";
    public string OperationTest { get; set; } = "n/a";
    public string FuseCheck { get; set; } = "n/a";
    public string Result { get; set; } = "pass";
    public bool ResultOverridden { get; set; }
    public string FaultDescription { get; set; } = "";
    public string RepairDetails { get; set; } = "";
    /// <summary>Part fitted during an on-site repair, if any.</summary>
    public string PartId { get; set; } = "";
    public bool RemovedFromService { get; set; }
    public bool FollowUp { get; set; }
    public string Notes { get; set; } = "";
}

public sealed class Invoice : SyncEntity
{
    public string? ClientId { get; set; }
    public string? JobId { get; set; }
    public string Number { get; set; } = "";
    public string IssuedDate { get; set; } = "";
    public string DueDate { get; set; } = "";
    public double Subtotal { get; set; }
    public double Total { get; set; }
    public string Status { get; set; } = "draft";
    public string Notes { get; set; } = "";
    /// <summary>Line items as JSON: [{description, quantity, rate}] - the same shape data.php stores.</summary>
    public string LinesJson { get; set; } = "";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("s");

    /// <summary>
    /// Statuses data.php accepts, plus "draft", which stays in the suite until
    /// it's changed (a draft is never sent to the client portal).
    /// </summary>
    public static readonly string[] Statuses = { "draft", "due", "partial", "paid", "overdue", "refunded", "cancelled" };

    /// <summary>Older versions of the suite used "sent"; the server calls that "due".</summary>
    public static string Normalise(string s) => s == "sent" ? "due" : s;

    public bool IsUnpaid => Normalise(Status) is "draft" or "due" or "partial" or "overdue";
}

public sealed class Appointment : SyncEntity
{
    public string? ClientId { get; set; }
    public string Title { get; set; } = "";
    public string StartsAt { get; set; } = "";
    public string EndsAt { get; set; } = "";
    public string Location { get; set; } = "";
    public string Notes { get; set; } = "";
    /// <summary>pending (a client's booking request) | confirmed | deadline | cancelled - as data.php uses them.</summary>
    public string Status { get; set; } = "confirmed";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("s");

    public static readonly string[] Statuses = { "pending", "confirmed", "deadline", "cancelled" };

    public string Date => StartsAt.Length >= 10 ? StartsAt[..10] : StartsAt;
    public string Time => StartsAt.Length >= 16 ? StartsAt.Substring(11, 5) : "";
}
