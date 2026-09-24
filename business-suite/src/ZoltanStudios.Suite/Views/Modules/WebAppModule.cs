using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// The test and tag web app (testtag-app.html) running inside the suite -
/// the same app as on the phone, with photo capture, signatures, emailing,
/// QR IDs and the parts panel.
///
/// It runs in Edge's engine (WebView2) with its own saved profile, so its
/// local copy of jobs and settings survives restarts. It connects to the
/// server with an API token the suite creates for it, the same way the old
/// desktop wrapper did (the page has no login of its own).
/// </summary>
public sealed class WebAppModule : UserControl
{
    private const string TokenSetting = "WebAppToken";

    private readonly WebView2 _web = new();
    private readonly Grid _host = new();
    private readonly TextBlock _status = new() { FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(12, 0, 0, 0) };
    private bool _started;

    private static string AppUrl => ApiClient.Shared.BaseUrl + "/testtag-app.html";

    public WebAppModule()
    {
        var root = new DockPanel();

        var bar = new DockPanel
        {
            Background = Ui.Res("ChromeBrush"),
            Margin = new Thickness(0),
        };
        var barBorder = new Border
        {
            Background = Ui.Res("ChromeBrush"),
            BorderBrush = Ui.Res("BorderBrush"),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(16, 10, 16, 10),
            Child = bar,
        };
        DockPanel.SetDock(barBorder, Dock.Top);
        root.Children.Add(barBorder);

        var title = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        var badge = Ui.Badge(Ui.GGlobe, "AccentBrush", 30);
        badge.Margin = new Thickness(0, 0, 10, 0);
        title.Children.Add(badge);
        title.Children.Add(new TextBlock
        {
            Text = "Test & Tag App", FontSize = 15, FontWeight = FontWeights.SemiBold,
            Foreground = Ui.Res("HeadingText"), VerticalAlignment = VerticalAlignment.Center,
        });
        title.Children.Add(_status);
        bar.Children.Add(title);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
        buttons.Children.Add(Forms.Btn("Back", (_, _) => { if (_web.CoreWebView2?.CanGoBack == true) _web.CoreWebView2.GoBack(); }, glyph: Ui.GBack));
        buttons.Children.Add(Forms.Btn("Reload", (_, _) => _web.CoreWebView2?.Reload(), glyph: Ui.GRefresh));
        buttons.Children.Add(Forms.Btn("Reconnect", async (_, _) => await Reconnect(), glyph: Ui.GKey));
        buttons.Children.Add(Forms.Btn("Open in Browser", (_, _) => OpenInBrowser(), glyph: Ui.GOpen));
        DockPanel.SetDock(buttons, Dock.Right);
        bar.Children.Insert(0, buttons);

        _host.Children.Add(_web);
        root.Children.Add(_host);
        Content = root;

        Loaded += async (_, _) =>
        {
            if (_started) return;
            _started = true;
            await StartAsync();
        };
    }

    private void SetStatus(string text, string brush = "MutedText")
    {
        _status.Text = text;
        _status.Foreground = Ui.Res(brush);
    }

    private async Task StartAsync()
    {
        SetStatus("Starting…");
        try
        {
            var dataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ZoltanStudios", "WebView2");
            Directory.CreateDirectory(dataDir);
            var env = await CoreWebView2Environment.CreateAsync(null, dataDir);
            await _web.EnsureCoreWebView2Async(env);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            ShowProblem("This PC is missing Microsoft Edge WebView2, which the built-in app runs on. " +
                        "Install the free \"Evergreen\" runtime from Microsoft, then reopen this page.",
                        "https://developer.microsoft.com/microsoft-edge/webview2/");
            return;
        }
        catch (Exception ex)
        {
            ShowProblem("The built-in app couldn't start: " + ex.Message, null);
            return;
        }

        var core = _web.CoreWebView2;
        core.Settings.IsStatusBarEnabled = false;
        core.NavigationStarting += (_, _) => SetStatus("Loading…");
        core.NavigationCompleted += (_, e) =>
        {
            if (e.IsSuccess) SetStatus(_tokenNote, _tokenNote.StartsWith("Connected") ? "OkBrush" : "WarnBrush");
            else SetStatus("Couldn't load the app (" + e.WebErrorStatus + "). Check the connection and press Reload.", "BadBrush");
        };

        var token = await EnsureTokenAsync();
        if (token.Length > 0)
        {
            // The page keeps its server settings in localStorage under this
            // key (see loadServerConfig in 10-server-sync.js). Writing the
            // token there before the page's own script runs connects it.
            var host = new Uri(ApiClient.Shared.BaseUrl).Host;
            var script = $$"""
                (function () {
                  try {
                    if (location.hostname !== {{JsonSerializer.Serialize(host)}}) return;
                    var k = 'zoltanstudios-server-config-v1';
                    var c = {};
                    try { c = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {}
                    c.url = location.origin;
                    c.token = {{JsonSerializer.Serialize(token)}};
                    localStorage.setItem(k, JSON.stringify(c));
                  } catch (e) {}
                })();
                """;
            await core.AddScriptToExecuteOnDocumentCreatedAsync(script);
        }

        _web.Source = new Uri(AppUrl);
    }

    private string _tokenNote = "";

    /// <summary>The token this app uses, creating one if the suite is signed in and has none.</summary>
    private async Task<string> EnsureTokenAsync()
    {
        var token = Repository.GetSetting(TokenSetting, "");
        if (token.Length > 0) { _tokenNote = "Connected to the server"; return token; }

        var api = ApiClient.Shared;
        if (!api.IsSignedIn && !await api.RestoreSessionAsync())
        {
            _tokenNote = "Not connected: sign in to the suite (Sync ▸ Sync Settings), then press Reconnect";
            return "";
        }

        var r = await api.CallPostAsync("api/services.php?resource=tokens&action=create",
            new { label = "Business Suite built-in app (" + Environment.MachineName + ")" });
        if (!r.Ok)
        {
            _tokenNote = "Not connected: " + r.Error;
            return "";
        }
        token = r.Str("token");
        Repository.SetSetting(TokenSetting, token);
        _tokenNote = "Connected to the server";
        return token;
    }

    /// <summary>Makes a fresh token (e.g. after the old one was revoked) and restarts the page.</summary>
    private async Task Reconnect()
    {
        if (_web.CoreWebView2 is null) return;
        Repository.SetSetting(TokenSetting, "");
        var token = await EnsureTokenAsync();
        if (token.Length == 0)
        {
            SetStatus(_tokenNote, "WarnBrush");
            return;
        }
        // Scripts added earlier still hold the old token, so write the new one now and reload.
        await _web.CoreWebView2.ExecuteScriptAsync(
            "try{var k='zoltanstudios-server-config-v1';var c=JSON.parse(localStorage.getItem(k)||'{}')||{};" +
            "c.url=location.origin;c.token=" + JsonSerializer.Serialize(token) + ";localStorage.setItem(k,JSON.stringify(c));}catch(e){}");
        await _web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
            "try{var k='zoltanstudios-server-config-v1';var c=JSON.parse(localStorage.getItem(k)||'{}')||{};" +
            "c.url=location.origin;c.token=" + JsonSerializer.Serialize(token) + ";localStorage.setItem(k,JSON.stringify(c));}catch(e){}");
        _web.CoreWebView2.Reload();
    }

    private static void OpenInBrowser()
    {
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(AppUrl) { UseShellExecute = true }); }
        catch { /* no default browser - nothing useful to do */ }
    }

    private void ShowProblem(string message, string? link)
    {
        SetStatus("Not available", "BadBrush");
        _host.Children.Clear();
        var panel = new StackPanel { Margin = new Thickness(30), MaxWidth = 720, HorizontalAlignment = HorizontalAlignment.Left };
        panel.Children.Add(Ui.Empty(message));
        var row = new StackPanel { Orientation = Orientation.Horizontal };
        if (link is not null)
            row.Children.Add(Forms.Btn("Get WebView2", (_, _) =>
            {
                try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(link) { UseShellExecute = true }); }
                catch { }
            }, primary: true, glyph: Ui.GOpen));
        row.Children.Add(Forms.Btn("Open the app in my browser instead", (_, _) => OpenInBrowser(), glyph: Ui.GGlobe));
        panel.Children.Add(row);
        _host.Children.Add(panel);
    }
}
