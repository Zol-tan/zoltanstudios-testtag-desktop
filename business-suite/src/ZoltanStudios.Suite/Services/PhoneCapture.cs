namespace ZoltanStudios.Suite.Services;

/// <param name="StartedAt">The server's clock when the link was made ("yyyy-MM-dd HH:mm:ss" UTC):
/// polling from here means a photo removed earlier doesn't come back the next time a phone is used.</param>
public sealed record CaptureSession(string Token, string Url, int ExpiresInMinutes, string StartedAt);

/// <summary>
/// The website's phone capture relay (api/capture.php + capture.html), the
/// same one the web app's "Capture from phone" uses: the suite asks for a
/// short-lived link for one record, shows it as a QR code, and the phone
/// (no login needed) uploads photos or a signature that the suite collects.
/// </summary>
public static class PhoneCapture
{
    /// <summary>What the phone page shows.</summary>
    public static class Modes
    {
        public const string Both = "both";
        public const string Photos = "photos";
        /// <summary>A client signs, typing their name.</summary>
        public const string Signature = "signature";
        /// <summary>The tester signs (no name box).</summary>
        public const string Tester = "tester";
    }

    /// <summary>The relay's record id for an invoice (jobs use their own id).</summary>
    public static string InvoiceRecord(string invoiceId) => "invoice-" + invoiceId;
    public const string TesterRecord = "tester-signature";

    public static async Task<(CaptureSession? Session, string Error)> StartAsync(
        ApiClient api, string recordId, string label, string mode, CancellationToken ct = default)
    {
        var r = await api.CallPostAsync("api/capture.php?action=start",
            new { jobId = recordId, label, mode }, ct);
        if (!r.Ok)
            return (null, r.Status == 401
                ? "Sign in first (Sync ▸ Sign In) - the phone link comes from the website."
                : r.Error);
        var minutes = (int)Json.Num(r.Data, "expiresIn", 60);
        var started = DateTime.TryParseExact(r.Str("expiresAt"), "yyyy-MM-dd HH:mm:ss",
                System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var exp)
            ? exp.AddMinutes(-minutes).ToString("yyyy-MM-dd HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture)
            : "";
        return (new CaptureSession(r.Str("token"), r.Str("url"), minutes, started), "");
    }

    /// <summary>
    /// What the phone has sent for this record since <paramref name="since"/>
    /// (the server's createdAt of the newest one already seen). The server
    /// includes items stamped in that same second, so skip ids already held.
    /// </summary>
    public static async Task<(List<Attachment> Items, string Error)> PollAsync(
        ApiClient api, string recordId, string since, CancellationToken ct = default)
    {
        var path = "api/capture.php?action=poll&jobId=" + Uri.EscapeDataString(recordId)
                 + (since.Length > 0 ? "&since=" + Uri.EscapeDataString(since) : "");
        var r = await api.CallGetAsync(path, ct);
        if (!r.Ok) return (new List<Attachment>(), r.Error);
        return (r.Rows().Select(Attachment.FromJson).Where(a => a is not null).Select(a => a!).ToList(), "");
    }
}
