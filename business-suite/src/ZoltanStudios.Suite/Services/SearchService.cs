namespace ZoltanStudios.Suite.Services;

/// <summary>One thing Find turned up.</summary>
public sealed record SearchHit(string Kind, string Title, string Detail, string Id, string JobId = "");

/// <summary>
/// Searches everything stored locally: clients, jobs, tested items (by tag,
/// description, serial), invoices and bookings. The data is small enough
/// that a plain scan is instant and needs no index to keep in step.
/// </summary>
public static class SearchService
{
    public static List<SearchHit> Search(string query, int max = 200)
    {
        var q = query.Trim();
        var hits = new List<SearchHit>();
        if (q.Length < 2) return hits;

        bool M(params string?[] fields) => fields.Any(f => !string.IsNullOrEmpty(f) && f.Contains(q, StringComparison.OrdinalIgnoreCase));

        var clients = Repository.GetClients();
        var names = clients.ToDictionary(c => c.Id, c => c.Display);
        string ClientName(string? id) => id is not null && names.TryGetValue(id, out var n) ? n : "";

        foreach (var c in clients.Where(c => M(c.Name, c.Company, c.Email, c.Phone, c.Address, c.Notes)))
            hits.Add(new SearchHit("Client", c.Display, JoinNonEmpty(c.Email, c.Phone), c.Id));

        var jobs = Repository.GetJobs(includeItems: true);
        foreach (var j in jobs)
        {
            if (M(j.CertNumber, j.SiteAddress, j.TesterName, ClientName(j.ClientId)))
                hits.Add(new SearchHit("Job", $"{j.CertNumber} · {(j.SiteAddress.Length > 0 ? j.SiteAddress : "no site address")}",
                    JoinNonEmpty(ClientName(j.ClientId), "tested " + j.TestDate, $"{j.ItemCount} item(s)"), j.Id, j.Id));

            foreach (var i in j.Items.Where(i => M(i.TagNumber, i.Description, i.SerialNumber, i.MakeModel, i.Location)))
                hits.Add(new SearchHit("Item", $"{i.TagNumber} · {i.Description}",
                    JoinNonEmpty(i.Location, i.MakeModel, i.Result, "on " + j.CertNumber), i.Id, j.Id));
        }

        foreach (var inv in Repository.GetInvoices().Where(i => M(i.Number, i.Notes, ClientName(i.ClientId))))
            hits.Add(new SearchHit("Invoice", inv.Number, JoinNonEmpty(ClientName(inv.ClientId), $"${inv.Total:0.00}", inv.Status), inv.Id));

        foreach (var a in Repository.GetAppointments().Where(a => M(a.Title, a.Notes, a.Location, ClientName(a.ClientId))))
            hits.Add(new SearchHit("Booking", a.Title, JoinNonEmpty(a.Date + " " + a.Time, ClientName(a.ClientId), a.Status), a.Id));

        return hits.Take(max).ToList();
    }

    private static string JoinNonEmpty(params string?[] parts)
        => string.Join(" · ", parts.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p!.Trim()));
}
