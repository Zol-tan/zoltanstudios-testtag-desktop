using System.Text.Json;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// Keeps invoice photos and the tester's signature in step with the
/// server's file store (api/files.php), where they're kept compressed on disk.
///
/// Invoice photos are matched to an invoice by the suite's own invoice id,
/// or - on a PC that pulled the invoice from the website - by the invoice's
/// server id, recorded against the files as "ref". Like job photos, changes
/// made here are merged: files added elsewhere are kept, and only ones
/// removed here are deleted.
/// </summary>
public static class ServerFiles
{
    public sealed record Result(int Sent, int Received, string Error);

    public static async Task<Result> SyncAsync(ApiClient api, CancellationToken ct = default)
    {
        var inv = await SyncInvoicePhotosAsync(api, ct);
        var sig = await SyncTesterSignatureAsync(api, ct);
        var err = string.Join(" ", new[] { inv.Error, sig.Error }.Where(e => e.Length > 0));
        return new Result(inv.Sent + sig.Sent, inv.Received + sig.Received, err);
    }

    /// <summary>An older server without files.php: nothing to do, and not an error worth repeating.</summary>
    private static bool NotInstalled(ApiResult r) => r.Status == 404;

    // ------------------------------------------------------------ invoices

    private sealed record ServerFile(string Id, string OwnerId, string Ref, string Kind, string Note, string CreatedAt);

    public static async Task<Result> SyncInvoicePhotosAsync(ApiClient api, CancellationToken ct = default)
    {
        const string owner = AttachmentStore.InvoiceOwner;
        var listRes = await api.CallGetAsync("api/files.php?action=list&ownerType=invoice", ct);
        if (!listRes.Ok) return new Result(0, 0, NotInstalled(listRes) ? "" : "Invoice photos: " + listRes.Error);

        var invoices = Repository.GetInvoices(includeDeleted: true);
        var server = listRes.Rows().Select(r => new ServerFile(Json.Str(r, "id"), Json.Str(r, "ownerId"), Json.Str(r, "ref"),
            Json.Str(r, "kind"), Json.Str(r, "note"), Json.Str(r, "createdAt"))).ToList();

        // Which local invoice each server file belongs to.
        string? LocalFor(ServerFile f)
            => invoices.FirstOrDefault(i => i.Id == f.OwnerId)?.Id
            ?? (f.Ref.Length > 0 ? invoices.FirstOrDefault(i => i.ServerId == f.Ref)?.Id : null);

        int sent = 0, received = 0;
        var errors = new List<string>();

        // ---- push what changed here
        foreach (var st in AttachmentStore.OwnerStates(owner).Where(s => s.Dirty))
        {
            var invoice = invoices.FirstOrDefault(i => i.Id == st.OwnerId);
            var local = invoice is null || invoice.Deleted ? new List<Attachment>() : AttachmentStore.Get(owner, st.OwnerId);
            var mine = server.Where(f => LocalFor(f) == st.OwnerId).ToList();
            var onServer = mine.Select(f => f.Id).ToHashSet();
            var ok = true;

            foreach (var a in local.Where(a => !onServer.Contains(a.Id)))
            {
                var r = await api.CallPostAsync("api/files.php?action=save", new
                {
                    id = a.Id, ownerType = owner, ownerId = st.OwnerId, @ref = invoice?.ServerId ?? "",
                    kind = a.Kind, note = a.Note, createdAt = a.CreatedAt, dataUrl = a.DataUrl,
                }, ct);
                if (r.Ok) sent++; else { ok = false; errors.Add(r.Error); }
            }
            // Captions changed here.
            foreach (var a in local.Where(a => onServer.Contains(a.Id) && mine.First(f => f.Id == a.Id).Note != a.Note))
            {
                var r = await api.CallPostAsync("api/files.php?action=save", new
                {
                    id = a.Id, ownerType = owner, ownerId = st.OwnerId, @ref = invoice?.ServerId ?? "",
                    kind = a.Kind, note = a.Note, createdAt = a.CreatedAt, dataUrl = a.DataUrl,
                }, ct);
                if (r.Ok) sent++; else { ok = false; errors.Add(r.Error); }
            }
            // Only what this PC had seen and has since removed.
            var localIds = local.Select(a => a.Id).ToHashSet();
            foreach (var id in st.Base.Where(id => onServer.Contains(id) && !localIds.Contains(id)))
            {
                var r = await api.CallPostAsync("api/files.php?action=delete", new { id }, ct);
                if (r.Ok) sent++; else { ok = false; errors.Add(r.Error); }
            }
            if (ok)
            {
                // Base = what the server holds now: ours plus anything added elsewhere (pulled below).
                var removed = st.Base.Where(id => !localIds.Contains(id)).ToHashSet();
                AttachmentStore.SetOwnerSynced(owner, st.OwnerId, localIds.Concat(onServer.Where(id => !removed.Contains(id))).Distinct());
            }
        }

        // ---- re-read, record server ids learned since, and pull
        listRes = await api.CallGetAsync("api/files.php?action=list&ownerType=invoice", ct);
        if (!listRes.Ok) return new Result(sent, received, "Invoice photos: " + listRes.Error);
        server = listRes.Rows().Select(r => new ServerFile(Json.Str(r, "id"), Json.Str(r, "ownerId"), Json.Str(r, "ref"),
            Json.Str(r, "kind"), Json.Str(r, "note"), Json.Str(r, "createdAt"))).ToList();

        foreach (var g in server.GroupBy(f => f.OwnerId))
        {
            var invoice = invoices.FirstOrDefault(i => i.Id == g.Key);
            if (invoice is { ServerId: { Length: > 0 } sid } && g.Any(f => f.Ref != sid))
                await api.CallPostAsync("api/files.php?action=link", new { ownerType = owner, ownerId = g.Key, @ref = sid }, ct);
        }

        var states = AttachmentStore.OwnerStates(owner).ToDictionary(s => s.OwnerId);
        foreach (var g in server.GroupBy(LocalFor).Where(g => g.Key is not null))
        {
            var invId = g.Key!;
            if (states.TryGetValue(invId, out var st) && st.Dirty) continue; // still waiting to go up
            if (invoices.First(i => i.Id == invId).Deleted)
            {
                // The invoice was deleted (here or on the website): its photos go too.
                foreach (var f in g)
                    if ((await api.CallPostAsync("api/files.php?action=delete", new { id = f.Id }, ct)).Ok) sent++;
                AttachmentStore.Set(owner, invId, Array.Empty<Attachment>());
                AttachmentStore.SetOwnerSynced(owner, invId, Array.Empty<string>());
                continue;
            }
            var local = AttachmentStore.Get(owner, invId);
            var have = local.ToDictionary(a => a.Id);
            var result = new List<Attachment>();
            var complete = true;
            foreach (var f in g)
            {
                if (have.TryGetValue(f.Id, out var a)) { a.Note = f.Note; result.Add(a); continue; }
                var r = await api.CallGetAsync("api/files.php?action=get&id=" + Uri.EscapeDataString(f.Id), ct);
                var got = r.Ok ? Attachment.FromJson(r.Data) : null;
                if (got is null) { complete = false; errors.Add(r.Error); continue; }
                result.Add(got);
                received++;
            }
            if (!complete) continue;
            if (!AttachmentStore.SameIds(result, local) || result.Zip(local).Any(p => p.First.Note != p.Second.Note))
                AttachmentStore.Set(owner, invId, result);
            AttachmentStore.SetOwnerSynced(owner, invId, result.Select(a => a.Id));
        }

        // Invoices whose photos were all removed elsewhere.
        var withFiles = server.Select(LocalFor).Where(x => x is not null).ToHashSet();
        foreach (var st in AttachmentStore.OwnerStates(owner).Where(s => !s.Dirty && s.Base.Count > 0 && !withFiles.Contains(s.OwnerId)))
        {
            AttachmentStore.Set(owner, st.OwnerId, Array.Empty<Attachment>());
            AttachmentStore.SetOwnerSynced(owner, st.OwnerId, Array.Empty<string>());
        }

        return new Result(sent, received, errors.Count > 0 ? "Invoice photos: " + string.Join("; ", errors.Distinct()) : "");
    }

    // ------------------------------------------------------------ tester signature

    /// <summary>
    /// One signature for every app: sent when changed here, otherwise the
    /// server's taken whenever its version differs from the last one seen.
    /// </summary>
    public static async Task<Result> SyncTesterSignatureAsync(ApiClient api, CancellationToken ct = default)
    {
        if (AttachmentStore.TesterSignatureDirty)
        {
            var r = await api.CallPostAsync("api/files.php?action=tester_set", new { dataUrl = AttachmentStore.TesterSignature }, ct);
            if (!r.Ok) return new Result(0, 0, NotInstalled(r) ? "" : "Tester signature: " + r.Error);
            AttachmentStore.TesterSignatureSynced(Json.Str(r.Data, "dataUrl"), Json.Str(r.Data, "version"));
            return new Result(1, 0, "");
        }
        var g = await api.CallGetAsync("api/files.php?action=tester_get", ct);
        if (!g.Ok) return new Result(0, 0, NotInstalled(g) ? "" : "Tester signature: " + g.Error);
        var version = Json.Str(g.Data, "version");
        if (version.Length == 0)
        {
            // Nothing on the server yet (e.g. first sync after updating): give it ours.
            if (AttachmentStore.TesterSignature.Length == 0) return new Result(0, 0, "");
            var r = await api.CallPostAsync("api/files.php?action=tester_set", new { dataUrl = AttachmentStore.TesterSignature }, ct);
            if (!r.Ok) return new Result(0, 0, "Tester signature: " + r.Error);
            AttachmentStore.TesterSignatureSynced(Json.Str(r.Data, "dataUrl"), Json.Str(r.Data, "version"));
            return new Result(1, 0, "");
        }
        if (version == AttachmentStore.TesterSignatureVersion) return new Result(0, 0, "");
        AttachmentStore.TesterSignatureSynced(Json.Str(g.Data, "dataUrl"), version);
        return new Result(0, 1, "");
    }
}
