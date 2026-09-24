using System.Text.Json;

namespace ZoltanStudios.Suite.Services;

/// <summary>A common appliance, with the type (drives pricing) and class it's usually tested as.</summary>
public sealed class Appliance
{
    public string Category { get; set; } = "Other";
    public string Name { get; set; } = "";
    public string ItemType { get; set; } = "standard";
    public string EquipmentClass { get; set; } = "I";
}

/// <summary>
/// The appliance quick-pick used by the job editor. Starts as the same 212
/// appliances the web app offers, and can be edited under Tools ▸ Appliance
/// Library. Stored in Meta as JSON.
/// </summary>
public static class ApplianceLibrary
{
    private const string Key = "ApplianceLibrary";

    public static readonly string[] ItemTypes = { "standard", "power_tool", "rcd", "microwave" };
    public static readonly string[] Classes = { "I", "II", "III" };

    private static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    public static List<Appliance> Defaults()
    {
        using var s = typeof(ApplianceLibrary).Assembly.GetManifestResourceStream("ZoltanStudios.Suite.appliances.json");
        if (s is null) return new();
        return JsonSerializer.Deserialize<List<Appliance>>(s, Opts) ?? new();
    }

    public static List<Appliance> Load()
    {
        var raw = Repository.GetSetting(Key, "");
        if (raw.Length == 0) return Defaults();
        try { return JsonSerializer.Deserialize<List<Appliance>>(raw, Opts) ?? Defaults(); }
        catch (JsonException) { return Defaults(); }
    }

    /// <summary>Saves the list, dropping blank rows and tidying values the job editor can't use.</summary>
    public static void Save(IEnumerable<Appliance> list)
    {
        var clean = list
            .Where(a => !string.IsNullOrWhiteSpace(a.Name))
            .Select(a => new Appliance
            {
                Category = string.IsNullOrWhiteSpace(a.Category) ? "Other" : a.Category.Trim(),
                Name = a.Name.Trim(),
                ItemType = ItemTypes.Contains(a.ItemType) ? a.ItemType : "standard",
                EquipmentClass = Classes.Contains(a.EquipmentClass) ? a.EquipmentClass : "I",
            })
            .ToList();
        Repository.SetSetting(Key, JsonSerializer.Serialize(clean));
    }

    public static void ResetToDefaults() => Repository.SetSetting(Key, "");
}
