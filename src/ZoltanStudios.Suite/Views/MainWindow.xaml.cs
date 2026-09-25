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
        SyncDot.Fill = (System.Windows.Media.Brush)Application.Current.Resources[
            connected ? "OkBrush" : "FaintText"];
        SyncText.Text = connected
            ? "Connected" + (_api.SignedInAs is { Length: > 0 } who ? " · " + who : "")
            : "Offline";
    }

    // ------------------------------------------------------------- navigation

    /// <summary>
    /// Swaps the content pane. Sections are addressed as "module.view" so a
    /// sub-item in the tree can open a filtered view of its parent module.
    /// </summary>
    private string _currentKey = "dashboard";

    private void Navigate(string key)
    {
        _currentKey = key;
        var module = key.Split('.')[0];
        var view = key.Contains('.') ? key.Split('.')[1] : "";

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
            _          => new DashboardModule(),
        };

        ContentHost.Content = page;
        StatusText.Text = module switch
        {
            "testtag"  => "Test & Tag",
            "clients"  => "Clients",
            "invoices" => "Invoices",
            "calendar" => "Calendar",
            "printquote" => "3D Printing Quote",
            "quote" => "Quote Calculator",
            "parts" => view == "restock" ? "Restock List" : "Parts",
            "projects" => "Projects",
            "messages" => "Messages",
            "quotes" => "Quotes",
            "tokens" => "API Tokens",
            "settings" => "Settings",
            _          => "Dashboard",
        };
    }

    private void NavTree_SelectedItemChanged(object sender, RoutedPropertyChangedEventArgs<object> e)
    {
        if (e.NewValue is TreeViewItem { Tag: string key })
            Navigate(key);
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

    private void Import_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Import backup");
    private void Export_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Export backup");
    private void Find_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Find");

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

    private void TesterDefaults_Click(object sender, RoutedEventArgs e) => Navigate("settings");
    private void Pricing_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Pricing");
    private void Appliances_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Appliance library");

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

    private void Reference_Click(object sender, RoutedEventArgs e) => NotBuiltYet("AS/NZS 3760 reference");
    private void WavecomGuide_Click(object sender, RoutedEventArgs e) => NotBuiltYet("Wavecom TnT guide");

    private void About_Click(object sender, RoutedEventArgs e)
        => MessageBox.Show(
            "ZoltanStudios Business Suite\nVersion 0.2.0\n\n" +
            "Test and tag compliance, clients, invoicing and scheduling.\n" +
            "Works offline; syncs to zoltanstudios.au when connected.",
            "About", MessageBoxButton.OK, MessageBoxImage.Information);

    // ------------------------------------------------------------------ util

    private void NotBuiltYet(string what)
    {
        StatusText.Text = what + " - not built yet";
        MessageBox.Show(what + " hasn't been built yet.", "Coming soon",
            MessageBoxButton.OK, MessageBoxImage.Information);
    }
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
