using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// The outcome of one API call. <see cref="Error"/> carries the server's own
/// message ("Missing required field: userId", "Invalid quote status.") so a
/// failure can be shown as-is instead of being swallowed.
/// </summary>
public sealed record ApiResult(bool Ok, JsonElement Data, string Error, int Status, JsonElement Root = default)
{
    public static ApiResult Offline(string why) => new(false, default, why, 0);

    /// <summary>The data array, or nothing if the call failed or data isn't a list.</summary>
    public IEnumerable<JsonElement> Rows()
    {
        if (!Ok || Data.ValueKind != JsonValueKind.Array) yield break;
        foreach (var r in Data.EnumerateArray()) yield return r;
    }

    public string Str(string name, string fallback = "") => Json.Str(Data, name, fallback);
}

/// <summary>Small helpers for reading the API's camelCase JSON.</summary>
public static class Json
{
    public static string Str(JsonElement e, string name, string fallback = "")
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var v)) return fallback;
        return v.ValueKind switch
        {
            JsonValueKind.String => v.GetString() ?? fallback,
            JsonValueKind.Number => v.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => fallback,
        };
    }

    public static double Num(JsonElement e, string name, double fallback = 0)
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var v)) return fallback;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d)) return d;
        if (v.ValueKind == JsonValueKind.String &&
            double.TryParse(v.GetString(), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out var s)) return s;
        return fallback;
    }

    public static bool Bool(JsonElement e, string name)
        => e.ValueKind == JsonValueKind.Object && e.TryGetProperty(name, out var v)
        && (v.ValueKind == JsonValueKind.True
            || (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i) && i != 0));

    /// <summary>ISO timestamp from the server, shown in local time.</summary>
    public static string LocalTime(string iso)
        => DateTimeOffset.TryParse(iso, out var d) ? d.ToLocalTime().ToString("yyyy-MM-dd HH:mm") : iso;
}

/// <summary>
/// Talks to the PHP API at zoltanstudios.au.
///
///   /api/auth.php       login, session, CSRF token
///   /api/data.php       users, projects, invoices, events, notifications
///   /api/messages.php   client conversations
///   /api/services.php   test and tag jobs, 3D print quotes, API tokens
///   /api/parts.php      repair parts
///
/// Every admin endpoint authenticates by PHP session, so this client logs in
/// once and keeps the cookie. There is ONE shared instance (<see cref="Shared"/>)
/// because the session lives in its cookie jar - a second ApiClient would be
/// signed out. That was why Projects, Messages and Quotes never loaded.
/// </summary>
public sealed class ApiClient : IDisposable
{
    public const string SessionCookieName = "zsportal";

    private static ApiClient? _shared;

    /// <summary>The app-wide client. Every module must use this one.</summary>
    public static ApiClient Shared
    {
        get => _shared ??= new ApiClient();
        set => _shared = value;
    }

    private readonly HttpClient _http;
    private readonly CookieContainer _cookies = new();
    private readonly Uri _base;
    private string _csrf = "";
    private string _lastCookie = "";

    public string BaseUrl { get; }
    public bool IsSignedIn { get; private set; }
    public string? SignedInAs { get; private set; }

    /// <summary>
    /// Raised when the server issues or rotates the session cookie (it rotates
    /// every 30 minutes), so the app can keep it and skip signing in next launch.
    /// </summary>
    public event Action<string>? SessionCookieChanged;

    public ApiClient(string baseUrl = "https://zoltanstudios.au")
    {
        BaseUrl = baseUrl.TrimEnd('/');
        _base = new Uri(BaseUrl + "/");
        _http = new HttpClient(new HttpClientHandler
        {
            CookieContainer = _cookies,
            UseCookies = true,
            AutomaticDecompression = DecompressionMethods.All,
        })
        {
            BaseAddress = _base,
            Timeout = TimeSpan.FromSeconds(30),
        };
        _http.DefaultRequestHeaders.Add("User-Agent", "ZoltanStudios-Suite/0.2");
    }

    // ------------------------------------------------------------- session cookie

    /// <summary>Restores a session cookie saved from an earlier run.</summary>
    public void ImportSessionCookie(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        _cookies.Add(_base, new Cookie(SessionCookieName, value, "/", _base.Host));
        _lastCookie = value;
    }

    private void CheckCookie()
    {
        var c = _cookies.GetCookies(_base)[SessionCookieName]?.Value ?? "";
        if (c.Length > 0 && c != _lastCookie)
        {
            _lastCookie = c;
            SessionCookieChanged?.Invoke(c);
        }
    }

    // ------------------------------------------------------------------ auth

    /// <summary>
    /// Restores an existing session if the cookie is still valid, and always
    /// picks up a CSRF token (auth.php's 'me' hands one out either way).
    /// </summary>
    public async Task<bool> RestoreSessionAsync(CancellationToken ct = default)
    {
        var res = await GetJsonAsync("api/auth.php?action=me", ct);
        if (res is null || !res.Value.TryGetProperty("ok", out var ok) || ok.ValueKind != JsonValueKind.True)
            return false;

        _csrf = ReadCsrf(res.Value);

        // auth.php returns the user under 'data'; null means not signed in.
        if (res.Value.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
        {
            IsSignedIn = true;
            SignedInAs = data.TryGetProperty("email", out var em) ? em.GetString() : null;
            return true;
        }

        IsSignedIn = false;
        return false;
    }

    public async Task<(bool ok, string? error)> SignInAsync(string email, string password, CancellationToken ct = default)
    {
        // A CSRF token is required even to log in, so fetch one first.
        if (_csrf.Length == 0) await RestoreSessionAsync(ct);

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["email"] = email,
            ["password"] = password,
            ["csrf"] = _csrf,
        });

        using var req = new HttpRequestMessage(HttpMethod.Post, "api/auth.php?action=login") { Content = body };
        req.Headers.Add("X-CSRF-Token", _csrf);

        JsonElement? json;
        try
        {
            using var res = await _http.SendAsync(req, ct);
            json = await ReadJsonAsync(res, ct);
            CheckCookie();
        }
        catch (HttpRequestException ex) { return (false, "Couldn't reach the server: " + ex.Message); }
        catch (TaskCanceledException) { return (false, "The server took too long to answer."); }

        if (json is null) return (false, "The server sent an unreadable response.");

        if (json.Value.TryGetProperty("ok", out var ok) && ok.ValueKind == JsonValueKind.True)
        {
            _csrf = ReadCsrf(json.Value);
            if (_csrf.Length == 0) await RestoreSessionAsync(ct);
            IsSignedIn = true;
            if (json.Value.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Object
                && d.TryGetProperty("email", out var em))
                SignedInAs = em.GetString();
            return (true, null);
        }

        return (false, json.Value.TryGetProperty("error", out var err)
            ? err.GetString() : "Sign-in failed.");
    }

    public async Task SignOutAsync(CancellationToken ct = default)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "api/auth.php?action=logout");
            req.Headers.Add("X-CSRF-Token", _csrf);
            req.Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["csrf"] = _csrf });
            await _http.SendAsync(req, ct);
        }
        catch (HttpRequestException) { /* signing out is best-effort */ }
        catch (TaskCanceledException) { }
        IsSignedIn = false;
        SignedInAs = null;
        _lastCookie = "";
        SessionCookieChanged?.Invoke("");
    }

    // ------------------------------------------------------------- calls

    /// <summary>GET any API path and report exactly what happened.</summary>
    public async Task<ApiResult> CallGetAsync(string path, CancellationToken ct = default)
    {
        try
        {
            using var res = await _http.GetAsync(path, ct);
            var r = await ToResultAsync(res, ct);
            CheckCookie();
            if (r.Status == 401) IsSignedIn = false;
            return r;
        }
        catch (HttpRequestException ex) { return ApiResult.Offline("Couldn't reach the server: " + ex.Message); }
        catch (TaskCanceledException) { return ApiResult.Offline("The server took too long to answer."); }
    }

    /// <summary>
    /// POST a JSON body with the CSRF header. Every endpoint reads JSON through
    /// input()/field(), so this works for data.php, messages.php and services.php.
    /// An expired CSRF token (419) is refreshed and the call retried once.
    /// </summary>
    public async Task<ApiResult> CallPostAsync(string path, object payload, CancellationToken ct = default)
    {
        var r = await PostOnceAsync(path, payload, ct);
        if (r.Status == 419 && await RestoreSessionAsync(ct))
            r = await PostOnceAsync(path, payload, ct);
        if (r.Status == 401) IsSignedIn = false;
        return r;
    }

    private async Task<ApiResult> PostOnceAsync(string path, object payload, CancellationToken ct)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, path)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            };
            req.Headers.Add("X-CSRF-Token", _csrf);
            using var res = await _http.SendAsync(req, ct);
            var r = await ToResultAsync(res, ct);
            CheckCookie();
            return r;
        }
        catch (HttpRequestException ex) { return ApiResult.Offline("Couldn't reach the server: " + ex.Message); }
        catch (TaskCanceledException) { return ApiResult.Offline("The server took too long to answer."); }
    }

    private static async Task<ApiResult> ToResultAsync(HttpResponseMessage res, CancellationToken ct)
    {
        var status = (int)res.StatusCode;
        var json = await ReadJsonAsync(res, ct);
        if (json is null)
            return new ApiResult(false, default, $"The server sent an unreadable response (HTTP {status}).", status);

        var root = json.Value;
        var ok = root.TryGetProperty("ok", out var o) && o.ValueKind == JsonValueKind.True;
        var data = root.TryGetProperty("data", out var d) ? d : default;
        var err = ok ? "" : Json.Str(root, "error", $"Request failed (HTTP {status}).");
        return new ApiResult(ok, data, err, status, root);
    }

    // --------------------------------------------- older helpers (sync engine)

    /// <summary>Lists a data.php resource, e.g. "invoices", "projects", "events".</summary>
    public async Task<JsonElement?> ListAsync(string resource, CancellationToken ct = default)
        => await GetJsonAsync($"api/data.php?resource={Uri.EscapeDataString(resource)}&action=list", ct);

    /// <summary>GET any API path, e.g. "api/parts.php?action=list".</summary>
    public async Task<JsonElement?> GetAsync(string path, CancellationToken ct = default)
        => await GetJsonAsync(path, ct);

    /// <summary>Pulls all test and tag jobs.</summary>
    public async Task<JsonElement?> PullJobsAsync(CancellationToken ct = default)
        => await GetJsonAsync("api/services.php?resource=testtag&action=pull", ct);

    /// <summary>Posts a JSON body with the CSRF header. Null if the server couldn't be reached.</summary>
    public async Task<JsonElement?> PostAsync(string path, object payload, CancellationToken ct = default)
    {
        var r = await CallPostAsync(path, payload, ct);
        if (r.Status == 0) return null;
        return JsonSerializer.SerializeToElement(new { ok = r.Ok, data = r.Data.ValueKind == JsonValueKind.Undefined ? (object?)null : r.Data, error = r.Error });
    }

    /// <summary>Form-encoded POST. Kept for callers that already build a dictionary.</summary>
    public async Task<JsonElement?> PostFormAsync(
        string path, Dictionary<string, string> fields, CancellationToken ct = default)
        => await PostAsync(path, fields, ct);

    // ----------------------------------------------------------------- plumbing

    private async Task<JsonElement?> GetJsonAsync(string path, CancellationToken ct)
    {
        try
        {
            using var res = await _http.GetAsync(path, ct);
            var j = await ReadJsonAsync(res, ct);
            CheckCookie();
            return j;
        }
        catch (HttpRequestException) { return null; }   // offline
        catch (TaskCanceledException) { return null; }  // timed out
    }

    private static async Task<JsonElement?> ReadJsonAsync(HttpResponseMessage res, CancellationToken ct)
    {
        try
        {
            var text = await res.Content.ReadAsStringAsync(ct);
            if (string.IsNullOrWhiteSpace(text)) return null;
            using var doc = JsonDocument.Parse(text);
            return doc.RootElement.Clone();
        }
        catch (JsonException) { return null; }
    }

    /// <summary>auth.php returns csrf at the top level or under meta.</summary>
    private static string ReadCsrf(JsonElement root)
    {
        if (root.TryGetProperty("csrf", out var c) && c.ValueKind == JsonValueKind.String)
            return c.GetString() ?? "";
        if (root.TryGetProperty("meta", out var m) && m.ValueKind == JsonValueKind.Object &&
            m.TryGetProperty("csrf", out var mc) && mc.ValueKind == JsonValueKind.String)
            return mc.GetString() ?? "";
        return "";
    }

    public void Dispose() => _http.Dispose();
}
