using System.Text.Json;

namespace ZoltanStudios.Suite.Services;

// Rows for the live admin sections, parsed from the API's JSON. Kept out of
// the WPF views so the test harness can check them against the real PHP.

/// <summary>A portal account as the server lists it (clients and admins alike).</summary>
public sealed record ServerUser(string Id, string Name, string Email, string Company, bool IsAdmin)
{
    public string Display =>
        (Name.Length > 0 ? Name : Email)
        + (Company.Length > 0 ? " — " + Company : "")
        + (IsAdmin ? " (admin)" : "");

    public static ServerUser From(JsonElement u) => new(
        Json.Str(u, "id"),
        (Json.Str(u, "firstName") + " " + Json.Str(u, "lastName")).Trim(),
        Json.Str(u, "email"),
        Json.Str(u, "company"),
        Json.Bool(u, "isAdmin"));

    /// <summary>Everyone on the server, or an empty list with the error.</summary>
    public static async Task<(List<ServerUser> Users, string Error)> LoadAsync()
    {
        var r = await ApiClient.Shared.CallGetAsync("api/data.php?resource=users&action=list");
        if (!r.Ok) return (new List<ServerUser>(), r.Error);
        return (r.Rows().Select(From).OrderBy(u => u.Display, StringComparer.OrdinalIgnoreCase).ToList(), "");
    }
}

public sealed class ProjectRow
{
    public string Id { get; init; } = "";
    public string UserId { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Status { get; init; } = "";
    public int Progress { get; init; }
    public string ClientName { get; set; } = "";
    public string Updated { get; init; } = "";
    public string ProgressText => Progress + "%";

    public static ProjectRow From(JsonElement p) => new()
    {
        Id = Json.Str(p, "id"),
        UserId = Json.Str(p, "userId"),
        Name = Json.Str(p, "projectName"),
        Description = Json.Str(p, "description"),
        Status = Json.Str(p, "status"),
        Progress = (int)Json.Num(p, "progress"),
        Updated = Json.LocalTime(Json.Str(p, "lastUpdated")),
    };
}

public sealed class ConversationRow
{
    public string Id { get; init; } = "";
    public string ClientId { get; init; } = "";
    public string ClientName { get; init; } = "";
    public string ClientEmail { get; init; } = "";
    public string ProjectId { get; init; } = "";
    public string Subject { get; init; } = "";
    public string LastMessage { get; init; } = "";
    public bool IsClosed { get; init; }
    public string LastUpdatedIso { get; init; } = "";
    public string LastReadIso { get; init; } = "";

    public string Client => ClientName.Length > 0 ? ClientName : ClientEmail;
    public string Preview => LastMessage.Replace('\n', ' ').Length > 90
        ? LastMessage.Replace('\n', ' ')[..90] + "…" : LastMessage.Replace('\n', ' ');
    public string Updated => Json.LocalTime(LastUpdatedIso);
    public bool Unread =>
        !DateTimeOffset.TryParse(LastReadIso, out var read)
        || (DateTimeOffset.TryParse(LastUpdatedIso, out var upd) && upd > read);
    public string State => IsClosed ? "Closed" : Unread ? "● New" : "Open";

    public static ConversationRow From(JsonElement m) => new()
    {
        Id = Json.Str(m, "id"),
        ClientId = Json.Str(m, "clientId"),
        ClientName = Json.Str(m, "clientName"),
        ClientEmail = Json.Str(m, "clientEmail"),
        ProjectId = Json.Str(m, "projectId"),
        Subject = Json.Str(m, "subject"),
        LastMessage = Json.Str(m, "lastMessage"),
        IsClosed = Json.Bool(m, "isClosed"),
        LastUpdatedIso = Json.Str(m, "lastUpdated"),
        LastReadIso = Json.Str(m, "lastRead"),
    };
}

public sealed class QuoteRow
{
    public string Id { get; init; } = "";
    public string Number { get; init; } = "";
    public string ClientId { get; init; } = "";
    public string CustomerName { get; init; } = "";
    public string CustomerEmail { get; init; } = "";
    public string ItemName { get; init; } = "";
    public string Material { get; init; } = "PLA";
    public double WeightGrams { get; init; }
    public double PrintHours { get; init; }
    public int Infill { get; init; } = 20;
    public int Quantity { get; init; } = 1;
    public double MaterialCost { get; init; }
    public double TimeCost { get; init; }
    public double SetupFee { get; init; }
    public double Total { get; init; }
    public string Status { get; init; } = "draft";
    public string Notes { get; init; } = "";
    public string Created { get; init; } = "";
    public string TotalText => $"${Total:0.00}";

    public static QuoteRow From(JsonElement q) => new()
    {
        Id = Json.Str(q, "id"),
        Number = Json.Str(q, "quoteNumber"),
        ClientId = Json.Str(q, "clientId"),
        CustomerName = Json.Str(q, "customerName"),
        CustomerEmail = Json.Str(q, "customerEmail"),
        ItemName = Json.Str(q, "itemName"),
        Material = Json.Str(q, "material", "PLA"),
        WeightGrams = Json.Num(q, "weightGrams"),
        PrintHours = Json.Num(q, "printHours"),
        Infill = (int)Json.Num(q, "infillPercent", 20),
        Quantity = (int)Json.Num(q, "quantity", 1),
        MaterialCost = Json.Num(q, "materialCost"),
        TimeCost = Json.Num(q, "timeCost"),
        SetupFee = Json.Num(q, "setupFee"),
        Total = Json.Num(q, "total"),
        Status = Json.Str(q, "status", "draft"),
        Notes = Json.Str(q, "notes"),
        Created = Json.LocalTime(Json.Str(q, "createdAt")),
    };
}

public sealed class TokenRow
{
    public string Id { get; init; } = "";
    public string Label { get; init; } = "";
    public string Scope { get; init; } = "";
    public string LastUsed { get; init; } = "";
    public string Created { get; init; } = "";

    public static TokenRow From(JsonElement t) => new()
    {
        Id = Json.Str(t, "id"),
        Label = Json.Str(t, "label"),
        Scope = Json.Str(t, "scope"),
        LastUsed = Json.Str(t, "lastUsed") is { Length: > 0 } lu ? Json.LocalTime(lu) : "never",
        Created = Json.LocalTime(Json.Str(t, "createdAt")),
    };
}
