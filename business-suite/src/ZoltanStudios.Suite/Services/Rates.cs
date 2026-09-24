namespace ZoltanStudios.Suite.Services;

/// <summary>
/// Every price the quoting tools use, stored in the database so they can be
/// changed without a rebuild.
///
/// The test and tag and 3D printing figures are the real published rates and
/// must match the website. Everything else ships as a placeholder — edit them
/// under Settings before quoting a customer from them.
/// </summary>
public sealed class Rates
{
    // ---- Test & Tag (published on test-and-tag.html) --------------------
    public double CallOut { get; set; } = 120;
    public int CallOutIncludes { get; set; } = 20;
    public double PerItemStandard { get; set; } = 3.50;
    public double PerItemPowerTool { get; set; } = 5.00;
    public double PerItemRcd { get; set; } = 8.00;
    public double PerItemMicrowave { get; set; } = 12.00;
    public double PerItem100 { get; set; } = 2.90;
    public double PerItem200 { get; set; } = 2.50;
    public double IntroOfferPrice { get; set; } = 99;          // flat, first job
    public int IntroOfferItems { get; set; } = 30;
    public double ContractQuarterlyPercent { get; set; } = 10; // off, on a quarterly contract
    public double ContractAnnualPercent { get; set; } = 15;

    // ---- 3D printing (must match 3d-printing-services.html) -------------
    public double PrintSetup { get; set; } = 15;
    public double PrintPlaPerGram { get; set; } = 0.03;
    public double PrintPetgPerGram { get; set; } = 0.04;
    public double PrintAbsPerGram { get; set; } = 0.04;
    public double PrintTpuPerGram { get; set; } = 0.06;
    public double PrintCompositePerGram { get; set; } = 0.08;

    // ---- Placeholders: set these before quoting from them ---------------
    public double PcBuildLabour { get; set; } = 120;          // per build
    public double PcBuildOsSetup { get; set; } = 60;
    public double PcPartsMarkupPercent { get; set; } = 10;

    public double RepairDiagnostic { get; set; } = 45;        // waived if repaired
    public double RepairHourly { get; set; } = 90;
    public double RepairMinimum { get; set; } = 60;

    public double RecoveryLogical { get; set; } = 150;        // deleted files, corrupt partition
    public double RecoveryPhysical { get; set; } = 450;       // failed drive, clicking
    public double RecoveryPerGb { get; set; } = 0;

    public double WebPerPage { get; set; } = 250;
    public double WebSetup { get; set; } = 400;
    public double WebHostingMonthly { get; set; } = 25;

    public double ConsultingHourly { get; set; } = 110;
    public double SeoMonthly { get; set; } = 450;
    public double SocialMonthly { get; set; } = 350;

    public double CallOutTravelPerKm { get; set; } = 0;
    public double GstPercent { get; set; } = 0;               // 0 if not registered

    /// <summary>
    /// Markup on repair parts fitted on site. High by trade standards because
    /// the customer is paying for you being there with the right part and the
    /// licence to fit it, not for the plug top.
    /// </summary>
    public double PartsMarkupPercent { get; set; } = 250;

    // -------------------------------------------------------------- storage

    private const string Prefix = "rate.";

    public static Rates Load()
    {
        var r = new Rates();
        foreach (var p in typeof(Rates).GetProperties())
        {
            if (!p.CanWrite) continue;
            var raw = Repository.GetSetting(Prefix + p.Name, "");
            if (raw.Length == 0) continue;

            if (p.PropertyType == typeof(double) && double.TryParse(raw, out var d))
                p.SetValue(r, d);
            else if (p.PropertyType == typeof(int) && int.TryParse(raw, out var i))
                p.SetValue(r, i);
        }
        return r;
    }

    public void Save()
    {
        foreach (var p in typeof(Rates).GetProperties())
        {
            if (!p.CanWrite) continue;
            Repository.SetSetting(Prefix + p.Name,
                Convert.ToString(p.GetValue(this)) ?? "");
        }
    }

    /// <summary>
    /// Test and tag total for a given mix of items. The call-out covers the
    /// first 20 items, and volume tiers replace the standard rate outright
    /// rather than stacking on top of it.
    /// </summary>
    public double TestTagTotal(int standard, int powerTools, int rcd, int microwave)
    {
        var totalItems = standard + powerTools + rcd + microwave;
        var chargeable = Math.Max(0, standard - CallOutIncludes);

        var standardRate = totalItems >= 200 ? PerItem200
                         : totalItems >= 100 ? PerItem100
                         : PerItemStandard;

        return CallOut
             + chargeable * standardRate
             + powerTools * PerItemPowerTool
             + rcd * PerItemRcd
             + microwave * PerItemMicrowave;
    }
}
