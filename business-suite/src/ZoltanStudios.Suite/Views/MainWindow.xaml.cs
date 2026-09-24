using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using ZoltanStudios.Suite.Services;
using ZoltanStudios.Suite.Views.Modules;

namespace ZoltanStudios.Suite.Views;

public partial class MainWindow : Window
{
    private readonly ApiClient _api;
    private readonly SyncService _sync;

    public MainWindow()
    {
        InitializeComponent();

        // One API client for the whole app: the session lives in its cookie
        // jar, and every module (sync, projects, messages...) must share it.
        _api = new ApiClient(Repository.GetSetting("ServerUrl", "https://zoltanstudios.au"));
        ApiClient.Shared = _api;

        // Keep the session cookie between launches so the app doesn't ask for
        // a password every time. The server expires sessions after ~24h idle.
        _api.ImportSessionCookie(Repository.GetSetting("SessionCookie", ""));
        _api.SessionCookieChanged += c => Repository.SetSetting("SessionCookie", c);

        _sync = new SyncService(_api);

        // Keyboard shortcuts that match the menu.
        InputBindings.Add(new KeyBinding(
            new RelayCommand(_ => NewJob_Click(this, new RoutedEventArgs())),
            Key.N, ModifierKeys.Control));
        InputBindings.Add(new KeyBinding(
            new RelayCommand(_ => SyncNow_Click(this, new RoutedEventArgs())),
            Key.F5, ModifierKeys.None));

        InputBindings.Add(new KeyBinding(
            new RelayCommand(_ => Navigate("find")), Key.F, ModifierKeys.Control));

        BuildNav();
        Navigate("dashboard");
        _ = RestoreSessionAsync();
    }

    /// <summary>
    /// Quietly checks whether an existing session is still valid. The app is
    /// fully usable either way - this only decides what the status bar says.
    /// </summary>
    private async Task RestoreSessionAsync()
    {
        var ok = await _api.RestoreSessionAsync();
        SetConnectionState(ok);
    }

    private void SetConnectionState(bool connected)
    {
        var dot = (System.Windows.Media.Brush)Application.Current.Resources[connected ? "OkBrush" : "FaintText"];
        SyncDot.Fill = dot;
        SideDot.Fill = dot;
        SyncText.Text = connected
            ? "Connected" + (_api.SignedInAs is { Length: > 0 } who ? " · " + who : "")
            : "Offline";
        SideStatus.Text = connected ? (_api.SignedInAs ?? "Connected") : "Not signed in";
        SideStatus.ToolTip = SyncText.Text;
    }

    // ------------------------------------------------------------- navigation

    /// <summary>The sidebar, in order. Section headings have an empty key.</summary>
    private static readonly (string Key, string Label, string Glyph, bool Child)[] NavItems =
    {
        ("dashboard", "Dashboard", Ui.GHome, false),
        ("", "TEST & TAG", "", false),
        ("webapp", "Test & Tag App", Ui.GGlobe, false),
        ("testtag", "Jobs", Ui.GBolt, false),
        ("testtag.due", "Retest Due", Ui.GClock, true),
        ("testtag.generator", "Generator Reports", Ui.GFlag, true),
        ("testtag.assets", "Asset Register", Ui.GList, true),
        ("", "BUSINESS", "", false),
        ("clients", "Clients", Ui.GPeople, false),
        ("projects", "Projects", Ui.GWork, false),
        ("messages", "Messages", Ui.GChat, false),
        ("quotes", "Quotes", Ui.GDoc, false),
        ("invoices", "Invoices", Ui.GMoney, false),
        ("invoices.unpaid", "Unpaid", Ui.GWarn, true),
        ("calendar", "Calendar", Ui.GCalendar, false),
        ("calendar.pending", "Booking Requests", Ui.GClock, true),
        ("", "TOOLS", "", false),
        ("quote", "Quote Calculator", Ui.GCalc, false),
        ("printquote", "3D Printing Quote", Ui.GBox, false),
        ("pricing", "Pricing", Ui.GTag, false),
        ("appliances", "Appliance Library", Ui.GBook, false),
        ("find", "Find", Ui.GSearch, false),
        ("", "STOCK", "", false),
        ("parts", "Parts", Ui.GRepair, false),
        ("parts.restock", "Restock List", Ui.GWarn, true),
        ("filament", "Filament", Ui.GBox, false),
        ("", "HELP & ADMIN", "", false),
        ("guide.3760", "AS/NZS 3760 Reference", Ui.GSchool, false),
        ("guide.wavecom", "Wavecom TnT Guide", Ui.GHelp, false),
        ("tokens", "API Tokens", Ui.GKey, false),
        ("settings", "Settings", Ui.GSettings, false),
    };

    private readonly Dictionary<string, RadioButton> _navButtons = new();

    private void BuildNav()
    {
        var style = (Style)Application.Current.Resources["NavItem"];
        foreach (var (key, label, glyph, child) in NavItems)
        {
            if (key.Length == 0)
            {
                NavHost.Children.Add(new TextBlock
                {
                    Text = label,
                    FontSize = 10.5,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (System.Windows.Media.Brush)Application.Current.Resources["SidebarMuted"],
                    Margin = new Thickness(20, 16, 0, 6),
                });
                continue;
            }

            var row = new StackPanel { Orientation = Orientation.Horizontal };
            row.Children.Add(new TextBlock
            {
                Text = glyph,
                FontFamily = Ui.IconFont,
                FontSize = child ? 12 : 15,
                Width = 22,
                Margin = new Thickness(0, 0, 10, 0),
                VerticalAlignment = VerticalAlignment.Center,
                Opacity = child ? 0.8 : 1,
            });
            row.Children.Add(new TextBlock
            {
                Text = label,
                FontSize = child ? 12.5 : 13,
                VerticalAlignment = VerticalAlignment.Center,
            });

            var rb = new RadioButton
            {
                Style = style,
                GroupName = "nav",
                Content = row,
                Tag = key,
                Margin = new Thickness(child ? 26 : 8, 1, 8, 1),
            };
            rb.Checked += (_, _) => { if (!_syncingNav) Navigate(key); };
            _navButtons[key] = rb;
            NavHost.Children.Add(rb);
        }
    }

    private bool _syncingNav;

    /// <summary>
    /// Swaps the content pane. Sections are addressed as "module.view" so a
    /// sub-item can open a filtered view of its parent module.
    /// </summary>
    private string _currentKey = "dashboard";

    /// <summary>The built-in test and tag web app is kept alive between visits, so nothing typed is lost.</summary>
    private WebAppModule? _webApp;

    public void Navigate(string key)
    {
        _currentKey = key;
        var module = key.Split('.')[0];
        var view = key.Contains('.') ? key.Split('.')[1] : "";

        // Highlight the matching sidebar entry without re-triggering navigation.
        _syncingNav = true;
        if (_navButtons.TryGetValue(key, out var rb) || _navButtons.TryGetValue(module, out rb)) rb.IsChecked = true;
        else foreach (var b in _navButtons.Values) b.IsChecked = false;
        _syncingNav = false;

        if (module == "webapp")
        {
            _webApp ??= new WebAppModule();
            WebHost.Content = _webApp;
            WebHost.Visibility = Visibility.Visible;
            ContentHost.Visibility = Visibility.Collapsed;
            ContentHost.Content = null;
            StatusText.Text = "Test & Tag App";
            return;
        }

        WebHost.Visibility = Visibility.Collapsed;
        ContentHost.Visibility = Visibility.Visible;

        ContentControl page = module switch
        {
            "testtag"  => new TestTagModule(view),
            "clients"  => new ClientsModule(),
            "invoices" => new InvoicesModule(view),
            "calendar" => new CalendarModule(view),
            "printquote" => new PrintQuoteModule(),
            "quote" => new QuoteModule(),
            "parts" => new PartsModule(view),
            "projects" => new ProjectsModule(),
            "messages" => new MessagesModule(),
            "quotes" => new QuotesModule(),
            "tokens" => new TokensModule(),
            "settings" => new SettingsModule(),
            "find" => new FindModule(),
            "pricing" => new PricingModule(),
            "appliances" => new ApplianceLibraryModule(),
            "filament" => new FilamentModule(),
            "guide" => view == "wavecom" ? new WavecomGuideModule() : new ReferenceModule(),
            _          => new DashboardModule(),
        };

        ContentHost.Content = page;
        StatusText.Text = NavItems.FirstOrDefault(n => n.Key == key).Label
                       ?? NavItems.FirstOrDefault(n => n.Key == module).Label
                       ?? "Dashboard";
    }

    private void Navigate_Click(object sender, RoutedEventArgs e)
    {
        if (sender is MenuItem { Tag: string key })
            Navigate(key);
    }

    // ------------------------------------------------------------- view menu

    private void ToggleSidebar_Click(object sender, RoutedEventArgs e)
        => Sidebar.Visibility = MenuSidebar.IsChecked ? Visibility.Visible : Visibility.Collapsed;

    // ------------------------------------------------------------- file menu

    private void NewJob_Click(object sender, RoutedEventArgs e)
    {
        var editor = new JobEditorWindow { Owner = this };
        if (editor.ShowDialog() == true)
        {
            Navigate("testtag");
            StatusText.Text = "Job saved";
        }
    }

    /// <summary>Re-renders the current view. Used after an editor saves.</summary>
    public void ReloadCurrent() => Navigate(_currentKey);

    private void NewClient_Click(object sender, RoutedEventArgs e)
    {
        if (new ClientEditorWindow { Owner = this }.ShowDialog() == true)
        {
            Navigate("clients");
            StatusText.Text = "Client saved";
        }
    }

    private void NewInvoice_Click(object sender, RoutedEventArgs e)
    {
        if (new InvoiceEditorWindow { Owner = this }.ShowDialog() == true)
        {
            Navigate("invoices");
            StatusText.Text = "Invoice saved";
        }
    }

    /// <summary>
    /// A complete copy of the local database - jobs, clients, invoices,
    /// bookings, parts, filament, rates and settings - in one file.
    /// </summary>
    private void Export_Click(object sender, RoutedEventArgs e)
    {
        var dlg = new Microsoft.Win32.SaveFileDialog
        {
            Title = "Export backup",
            FileName = $"ZoltanStudios-backup-{DateTime.Now:yyyy-MM-dd}.zsbackup",
            Filter = "Business Suite backup (*.zsbackup)|*.zsbackup|All files (*.*)|*.*",
        };
        if (dlg.ShowDialog(this) != true) return;
        try
        {
            var info = BackupService.Export(dlg.FileName);
            StatusText.Text = "Backup saved";
            MessageBox.Show(this, $"Backup saved to\n{dlg.FileName}\n\n{info}", "Export backup",
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "The backup couldn't be written: " + ex.Message, "Export backup",
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void Import_Click(object sender, RoutedEventArgs e)
    {
        var dlg = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Import backup",
            Filter = "Business Suite backup (*.zsbackup;*.db)|*.zsbackup;*.db|All files (*.*)|*.*",
        };
        if (dlg.ShowDialog(this) != true) return;

        var check = BackupService.Inspect(dlg.FileName);
        if (!check.Ok)
        {
            MessageBox.Show(this, check.Message, "Import backup", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }
        if (MessageBox.Show(this,
                $"Replace everything in the suite with this backup?\n\n{check.Message}\n\n" +
                "Your current data is copied aside first, so this can be undone by importing that copy.",
                "Import backup", MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes) return;

        try
        {
            var saved = BackupService.Import(dlg.FileName);
            MessageBox.Show(this,
                $"Backup restored. Your previous data was saved as\n{saved}\n\nThe suite will now restart.",
                "Import backup", MessageBoxButton.OK, MessageBoxImage.Information);
            if (Environment.ProcessPath is { } exe) System.Diagnostics.Process.Start(exe);
            Application.Current.Shutdown();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "The backup couldn't be restored: " + ex.Message + "\n\nNothing was changed.",
                "Import backup", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void Find_Click(object sender, RoutedEventArgs e) => Navigate("find");

    public void NewBooking()
    {
        if (new AppointmentEditorWindow(null) { Owner = this }.ShowDialog() == true)
        {
            Navigate("calendar");
            StatusText.Text = "Booking saved";
        }
    }

    public void NewJob() => NewJob_Click(this, new RoutedEventArgs());
    public void NewInvoice() => NewInvoice_Click(this, new RoutedEventArgs());
    public void SyncNow() => SyncNow_Click(this, new RoutedEventArgs());

    private void Exit_Click(object sender, RoutedEventArgs e) => Close();

    // ------------------------------------------------------------- sync menu

    private async void SyncNow_Click(object sender, RoutedEventArgs e)
    {
        if (MenuOffline.IsChecked)
        {
            StatusText.Text = "Working offline - sync skipped";
            return;
        }

        if (!_api.IsSignedIn && !await _api.RestoreSessionAsync())
        {
            if (!PromptSignIn()) return;
        }

        StatusText.Text = "Syncing…";
        var result = await _sync.SyncAsync();
        StatusText.Text = result.Message;
        SetConnectionState(_api.IsSignedIn);

        // Reload whatever is on screen so pulled data appears immediately.
        if (result.Pulled > 0) Navigate(_currentKey);
    }

    private bool PromptSignIn()
    {
        var dlg = new SignInWindow(_api) { Owner = this };
        var ok = dlg.ShowDialog() == true;
        SetConnectionState(ok);
        return ok;
    }

    private void ToggleOffline_Click(object sender, RoutedEventArgs e)
    {
        var offline = MenuOffline.IsChecked;
        SyncText.Text = offline ? "Working offline" : "Not connected";
        StatusText.Text = offline
            ? "Working offline - changes are saved locally"
            : "Ready";
    }

    private async void SignOut_Click(object sender, RoutedEventArgs e)
    {
        await _api.SignOutAsync();
        SetConnectionState(false);
        StatusText.Text = "Signed out";
    }

    private void SyncSettings_Click(object sender, RoutedEventArgs e)
    {
        PromptSignIn();
        Navigate("settings");
    }

    // ------------------------------------------------------------ tools menu

    private void TesterDefaults_Click(object sender, RoutedEventArgs e)
    {
        if (new TesterDefaultsWindow { Owner = this }.ShowDialog() == true)
            StatusText.Text = "Tester defaults saved";
    }

    private void Pricing_Click(object sender, RoutedEventArgs e) => Navigate("pricing");
    private void Appliances_Click(object sender, RoutedEventArgs e) => Navigate("appliances");

    // ------------------------------------------------------------ parts menu

    private void AddPart_Click(object sender, RoutedEventArgs e)
    {
        // A new part is marked as edited on both counts so the next sync
        // creates it on the server with its stock.
        PartsCatalogue.Save(new Services.Part { Name = "New part", CatalogueDirty = true, StockDirty = true });
        Navigate("parts");
        StatusText.Text = "New part added - fill in its details";
    }

    private void CopyRestock_Click(object sender, RoutedEventArgs e)
    {
        var low = PartsCatalogue.LowStock();
        if (low.Count == 0)
        {
            StatusText.Text = "Nothing needs restocking";
            return;
        }
        Clipboard.SetText(PartsCatalogue.RestockText(low));
        StatusText.Text = $"Restock list copied - {low.Count} item(s)";
    }

    // ------------------------------------------------------------- help menu

    private void Reference_Click(object sender, RoutedEventArgs e) => Navigate("guide.3760");
    private void WavecomGuide_Click(object sender, RoutedEventArgs e) => Navigate("guide.wavecom");

    private void About_Click(object sender, RoutedEventArgs e)
        => MessageBox.Show(
            "ZoltanStudios Business Suite\nVersion 0.3.0\n\n" +
            "Test and tag, clients, projects, messages, quotes, invoicing, bookings and stock.\n" +
            "Works offline; syncs to zoltanstudios.au when connected.",
            "About", MessageBoxButton.OK, MessageBoxImage.Information);

}

/// <summary>Minimal ICommand so keyboard shortcuts can call methods directly.</summary>
public sealed class RelayCommand : ICommand
{
    private readonly Action<object?> _run;
    public RelayCommand(Action<object?> run) => _run = run;
    public bool CanExecute(object? parameter) => true;
    public void Execute(object? parameter) => _run(parameter);
    public event EventHandler? CanExecuteChanged { add { } remove { } }
}
