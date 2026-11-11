using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

// ======================================================================== find

/// <summary>Search across clients, jobs, tested items, invoices and bookings (Ctrl+F).</summary>
public sealed class FindModule : ModuleBase
{
    private readonly TextBox _box = new() { FontSize = 15, Padding = new Thickness(36, 9, 10, 9) };
    private readonly StackPanel _results = new();
    private readonly DispatcherTimer _debounce = new() { Interval = TimeSpan.FromMilliseconds(220) };

    public FindModule() : base("Find", "Search clients, jobs, tag numbers, serials, invoices and bookings.")
    {
        var boxHost = new Grid { Margin = new Thickness(0, 0, 0, 16), MaxWidth = 760, HorizontalAlignment = HorizontalAlignment.Left };
        boxHost.Children.Add(_box);
        var icon = Ui.Icon(Ui.GSearch, 15, Ui.Res("FaintText"));
        icon.Margin = new Thickness(12, 0, 0, 0);
        icon.HorizontalAlignment = HorizontalAlignment.Left;
        icon.IsHitTestVisible = false;
        boxHost.Children.Add(icon);
        _box.Width = 760;
        Body.Children.Add(boxHost);
        Body.Children.Add(_results);

        _results.Children.Add(Ui.Empty("Type at least two letters — a name, certificate number, tag, serial, suburb or invoice number."));

        _debounce.Tick += (_, _) => { _debounce.Stop(); Run(); };
        _box.TextChanged += (_, _) => { _debounce.Stop(); _debounce.Start(); };
        _box.KeyDown += (_, e) => { if (e.Key == Key.Enter) { _debounce.Stop(); Run(); } };
        Loaded += (_, _) => Keyboard.Focus(_box);
    }

    private void Run()
    {
        _results.Children.Clear();
        var q = _box.Text.Trim();
        if (q.Length < 2)
        {
            _results.Children.Add(Ui.Empty("Type at least two letters — a name, certificate number, tag, serial, suburb or invoice number."));
            return;
        }

        var hits = SearchService.Search(q);
        if (hits.Count == 0)
        {
            _results.Children.Add(Ui.Empty($"Nothing found for \"{q}\". Only data synced to this PC is searched."));
            return;
        }

        var g = Ui.Grid();
        g.Columns.Add(Ui.StatusCol("Type", nameof(SearchHit.Kind), 90));
        g.Columns.Add(Ui.Col("Found", nameof(SearchHit.Title)));
        g.Columns.Add(Ui.Col("Details", nameof(SearchHit.Detail)));
        g.ItemsSource = hits;
        g.MouseDoubleClick += (_, _) => { if (g.SelectedItem is SearchHit h) Open(h); };
        g.KeyDown += (_, e) => { if (e.Key == Key.Enter && g.SelectedItem is SearchHit h) { e.Handled = true; Open(h); } };
        _results.Children.Add(Ui.GridCard(g, $"{hits.Count} result(s)" + (hits.Count >= 200 ? " — showing the first 200" : ""), Ui.GSearch,
            new TextBlock { Text = "Double-click to open", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
    }

    private void Open(SearchHit h)
    {
        var owner = Window.GetWindow(this);
        bool? saved = h.Kind switch
        {
            "Client" => Repository.GetClients().FirstOrDefault(c => c.Id == h.Id) is { } c
                ? new ClientEditorWindow(c) { Owner = owner }.ShowDialog() : null,
            "Job" or "Item" => Repository.GetJob(h.JobId) is { } j
                ? new JobEditorWindow(j) { Owner = owner }.ShowDialog() : null,
            "Invoice" => Repository.GetInvoices().FirstOrDefault(i => i.Id == h.Id) is { } inv
                ? new InvoiceEditorWindow(inv) { Owner = owner }.ShowDialog() : null,
            "Booking" => Repository.GetAppointments().FirstOrDefault(a => a.Id == h.Id) is { } a
                ? new AppointmentEditorWindow(a) { Owner = owner }.ShowDialog() : null,
            _ => null,
        };
        if (saved == true) Run();
    }
}

// ===================================================================== pricing

/// <summary>The published price list, laid out to read over the phone or paste into an email.</summary>
public sealed class PricingModule : ModuleBase
{
    public PricingModule() : base("Pricing", "Your current rates, from Settings. Copy them into a quote email, or edit them.")
    {
        var r = Rates.Load();

        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("Copy Price List", (_, _) =>
            {
                Clipboard.SetText(PriceListText(r));
                MessageBox.Show(Window.GetWindow(this), "Price list copied — paste it into an email or message.",
                    "Pricing", MessageBoxButton.OK, MessageBoxImage.Information);
            }, primary: true, glyph: Ui.GCopy),
            Forms.Btn("Edit Rates", (_, _) => (Window.GetWindow(this) as MainWindow)?.Navigate("settings"), glyph: Ui.GEdit),
            Forms.Btn("Quote Calculator", (_, _) => (Window.GetWindow(this) as MainWindow)?.Navigate("quote"), glyph: Ui.GCalc)));

        var wrap = new WrapPanel();
        wrap.Children.Add(PriceCard("Test & Tag", Ui.GBolt, "AccentBrush", new[]
        {
            ("Call-out (includes first " + r.CallOutIncludes + " items)", Money(r.CallOut)),
            ($"Standard item, {r.CallOutIncludes + 1}–99 items", Money(r.PerItemStandard)),
            ("100–199 items (replaces standard rate)", Money(r.PerItem100)),
            ("200+ items", Money(r.PerItem200)),
            ("Power tool / heavy equipment", Money(r.PerItemPowerTool)),
            ("RCD / safety switch test", Money(r.PerItemRcd)),
            ("Microwave leakage test", Money(r.PerItemMicrowave)),
            ("Quarterly / annual contract", $"{r.ContractQuarterlyPercent:0}% / {r.ContractAnnualPercent:0}% off"),
            ($"Intro offer (up to {r.IntroOfferItems} items)", Money(r.IntroOfferPrice) + " flat"),
        }, "Single-phase 240 V equipment. Generators receive an inspection report (AS/NZS 3010 observations), not a compliance certificate."));

        wrap.Children.Add(PriceCard("3D Printing", Ui.GBox, "VioletBrush", new[]
        {
            ("Setup (per part)", Money(r.PrintSetup)),
            ("PLA", Money(r.PrintPlaPerGram) + " / g"),
            ("PETG", Money(r.PrintPetgPerGram) + " / g"),
            ("ABS", Money(r.PrintAbsPerGram) + " / g"),
            ("TPU (flexible)", Money(r.PrintTpuPerGram) + " / g"),
            ("Composite", Money(r.PrintCompositePerGram) + " / g"),
        }, "Print time is added per part. Use the 3D Printing Quote tool for an exact figure."));

        wrap.Children.Add(PriceCard("Repairs & Data Recovery", Ui.GRepair, "WarnBrush", new[]
        {
            ("Diagnostic (waived if repaired)", Money(r.RepairDiagnostic)),
            ("Repair labour", Money(r.RepairHourly) + " / hr"),
            ("Repair minimum", Money(r.RepairMinimum)),
            ("Data recovery — logical", Money(r.RecoveryLogical)),
            ("Data recovery — physical", Money(r.RecoveryPhysical)),
            ("Parts markup on cost", $"{r.PartsMarkupPercent:0}%"),
        }, null));

        wrap.Children.Add(PriceCard("PC Builds, Web & IT", Ui.GGlobe, "OkBrush", new[]
        {
            ("PC build labour", Money(r.PcBuildLabour)),
            ("OS setup", Money(r.PcBuildOsSetup)),
            ("Parts handling", $"{r.PcPartsMarkupPercent:0}%"),
            ("Website setup", Money(r.WebSetup)),
            ("Per page", Money(r.WebPerPage)),
            ("Hosting", Money(r.WebHostingMonthly) + " / month"),
            ("SEO", Money(r.SeoMonthly) + " / month"),
            ("Social media", Money(r.SocialMonthly) + " / month"),
            ("Consulting", Money(r.ConsultingHourly) + " / hr"),
        }, null));

        Body.Children.Add(wrap);
        Body.Children.Add(Forms.Note(r.GstPercent > 0
            ? $"Prices exclude GST ({r.GstPercent:0.#}%)."
            : "GST is set to 0% (not registered). Change it under Settings if that changes."));
    }

    private static string Money(double v) => "$" + v.ToString(v % 1 == 0 ? "0" : "0.00");

    private static FrameworkElement PriceCard(string title, string glyph, string brush, (string Item, string Price)[] rows, string? note)
    {
        var s = new StackPanel { Width = 380 };
        var head = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        var b = Ui.Badge(glyph, brush, 32);
        b.Margin = new Thickness(0, 0, 10, 0);
        head.Children.Add(b);
        head.Children.Add(new TextBlock { Text = title, FontSize = 15, FontWeight = FontWeights.SemiBold, Foreground = Ui.Res("HeadingText"), VerticalAlignment = VerticalAlignment.Center });
        s.Children.Add(head);
        foreach (var (item, price) in rows)
        {
            var row = new DockPanel { Margin = new Thickness(0, 0, 0, 7) };
            var p = new TextBlock { Text = price, FontWeight = FontWeights.SemiBold, Foreground = Ui.Res("HeadingText") };
            DockPanel.SetDock(p, Dock.Right);
            row.Children.Add(p);
            row.Children.Add(new TextBlock { Text = item, Foreground = Ui.Res("BodyText"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 12, 0) });
            s.Children.Add(row);
        }
        if (note is not null) s.Children.Add(Forms.Note(note));
        return Ui.Card(s, 18, new Thickness(0, 0, 16, 16));
    }

    public static string PriceListText(Rates r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("ZoltanStudios — Test & Tag (AS/NZS 3760:2022)");
        sb.AppendLine($"  Call-out, includes the first {r.CallOutIncludes} items: {Money(r.CallOut)}");
        sb.AppendLine($"  Each additional standard item: {Money(r.PerItemStandard)} ({Money(r.PerItem100)} at 100+ items, {Money(r.PerItem200)} at 200+)");
        sb.AppendLine($"  Power tools / heavy equipment: {Money(r.PerItemPowerTool)} each");
        sb.AppendLine($"  RCD / safety switch test: {Money(r.PerItemRcd)} each");
        sb.AppendLine($"  Microwave leakage test: {Money(r.PerItemMicrowave)} each");
        sb.AppendLine($"  Quarterly / annual contracts: {r.ContractQuarterlyPercent:0}% / {r.ContractAnnualPercent:0}% off");
        sb.AppendLine($"  Intro offer: {Money(r.IntroOfferPrice)} flat for up to {r.IntroOfferItems} items");
        sb.AppendLine();
        sb.AppendLine("3D Printing");
        sb.AppendLine($"  Setup {Money(r.PrintSetup)} per part; PLA {Money(r.PrintPlaPerGram)}/g, PETG {Money(r.PrintPetgPerGram)}/g, ABS {Money(r.PrintAbsPerGram)}/g, TPU {Money(r.PrintTpuPerGram)}/g");
        if (r.GstPercent > 0) { sb.AppendLine(); sb.AppendLine($"Prices exclude GST ({r.GstPercent:0.#}%)."); }
        return sb.ToString();
    }
}

// =========================================================== appliance library

/// <summary>Edit the appliance quick-pick used by "Add from Library" in the job editor.</summary>
public sealed class ApplianceLibraryModule : ModuleBase
{
    private readonly ObservableCollection<Appliance> _rows;
    private readonly DataGrid _grid;

    public ApplianceLibraryModule() : base("Appliance Library",
        "Common appliances with the type and class they're tested as. Pick from these in the job editor to fill an item in one go.")
    {
        _rows = new ObservableCollection<Appliance>(ApplianceLibrary.Load());

        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("Save Changes", (_, _) => Save(), primary: true, glyph: Ui.GSave),
            Forms.Btn("Add Appliance", (_, _) =>
            {
                var a = new Appliance { Category = (_grid?.SelectedItem as Appliance)?.Category ?? "Other" };
                _rows.Add(a);
                _grid!.SelectedItem = a;
                _grid.ScrollIntoView(a);
            }, glyph: Ui.GAdd),
            Forms.Btn("Remove Selected", (_, _) => { if (_grid?.SelectedItem is Appliance a) _rows.Remove(a); }, glyph: Ui.GDelete),
            Forms.Btn("Reset to Defaults", (_, _) =>
            {
                if (!Forms.Confirm(Window.GetWindow(this), "Appliance Library", "Replace the library with the original 212 appliances? Your additions and edits will be lost.")) return;
                ApplianceLibrary.ResetToDefaults();
                (Window.GetWindow(this) as MainWindow)?.ReloadCurrent();
            }, glyph: Ui.GRefresh)));

        _grid = new DataGrid
        {
            AutoGenerateColumns = false,
            CanUserAddRows = false,
            ItemsSource = _rows,
            MinHeight = 300,
            SelectionMode = DataGridSelectionMode.Single,
        };
        _grid.Columns.Add(new DataGridTextColumn { Header = "Category", Binding = new System.Windows.Data.Binding(nameof(Appliance.Category)), Width = new DataGridLength(200) });
        _grid.Columns.Add(new DataGridTextColumn { Header = "Appliance", Binding = new System.Windows.Data.Binding(nameof(Appliance.Name)), Width = new DataGridLength(1, DataGridLengthUnitType.Star) });
        _grid.Columns.Add(new DataGridComboBoxColumn { Header = "Type (pricing)", ItemsSource = ApplianceLibrary.ItemTypes, SelectedItemBinding = new System.Windows.Data.Binding(nameof(Appliance.ItemType)), Width = new DataGridLength(140) });
        _grid.Columns.Add(new DataGridComboBoxColumn { Header = "Class", ItemsSource = ApplianceLibrary.Classes, SelectedItemBinding = new System.Windows.Data.Binding(nameof(Appliance.EquipmentClass)), Width = new DataGridLength(80) });
        Body.Children.Add(Ui.GridCard(_grid, $"{_rows.Count} appliances", Ui.GBook,
            new TextBlock { Text = "Click a cell to edit, then Save Changes", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
    }

    private void Save()
    {
        _grid.CommitEdit(DataGridEditingUnit.Row, true);
        ApplianceLibrary.Save(_rows);
        MessageBox.Show(Window.GetWindow(this), "Appliance library saved.", "Appliance Library", MessageBoxButton.OK, MessageBoxImage.Information);
    }
}

/// <summary>Pick one or more appliances to add to a job.</summary>
public sealed class LibraryPickerWindow : EditorDialog
{
    private readonly List<Appliance> _all = ApplianceLibrary.Load();
    private readonly TextBox _search = Forms.Tb();
    private readonly ComboBox _category;
    private readonly ListBox _list = new() { SelectionMode = SelectionMode.Extended, MinHeight = 320, BorderBrush = Forms.Res("BorderBrush") };

    public List<Appliance> Picked { get; } = new();

    public LibraryPickerWindow() : base("Add from Appliance Library", 620, 640)
    {
        _category = Forms.Combo(new[] { "All categories" }.Concat(_all.Select(a => a.Category).Distinct()));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Search", _search), Forms.Field("Category", _category)));
        FormPanel.Children.Add(_list);
        FormPanel.Children.Add(Forms.Note("Ctrl-click or Shift-click to add several. Each is added as its own item with the next tag number."));

        _search.TextChanged += (_, _) => Fill();
        _category.SelectionChanged += (_, _) => Fill();
        _list.MouseDoubleClick += (_, _) => Done();
        Fill();

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Add", (_, _) => Done(), primary: true, glyph: Ui.GAdd));
        Loaded += (_, _) => Keyboard.Focus(_search);
    }

    private void Fill()
    {
        var q = _search.Text.Trim();
        var cat = _category.SelectedIndex > 0 ? _category.SelectedItem as string : null;
        _list.Items.Clear();
        foreach (var a in _all.Where(a => (cat is null || a.Category == cat)
                                       && (q.Length == 0 || a.Name.Contains(q, StringComparison.OrdinalIgnoreCase))))
        {
            _list.Items.Add(new ListBoxItem
            {
                Tag = a,
                Padding = new Thickness(8, 6, 8, 6),
                Content = $"{a.Name}    ·  Class {a.EquipmentClass}  ·  {a.ItemType.Replace('_', ' ')}  ·  {a.Category}",
            });
        }
    }

    private void Done()
    {
        Picked.Clear();
        foreach (ListBoxItem i in _list.SelectedItems) Picked.Add((Appliance)i.Tag);
        if (Picked.Count == 0) { Forms.Error(this, Title, "Select at least one appliance."); return; }
        DialogResult = true;
    }
}

// ==================================================================== filament

public sealed class FilamentModule : ModuleBase
{
    private readonly DataGrid _grid = Ui.Grid();

    public FilamentModule() : base("Filament", "3D printer filament on hand. Log what each print uses and see what's running low.")
    {
        var spools = FilamentStock.All();

        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("Add Spool", (_, _) => Edit(null), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Edit", (_, _) => { if (_grid.SelectedItem is Spool s) Edit(s); }, glyph: Ui.GEdit),
            Forms.Btn("Log Use…", (_, _) => LogUse(), glyph: Ui.GBox),
            Forms.Btn("Delete", (_, _) => Delete(), glyph: Ui.GDelete)));

        var tiles = new WrapPanel();
        tiles.Children.Add(Ui.Tile(spools.Count.ToString(), "Spools", "AccentBrush", Ui.GBox));
        tiles.Children.Add(Ui.Tile($"{spools.Sum(s => s.RemainingGrams) / 1000:0.0} kg", "On hand", "VioletBrush", Ui.GBox));
        var low = spools.Count(s => s.IsLow);
        tiles.Children.Add(Ui.Tile(low.ToString(), "Running low", low > 0 ? "WarnBrush" : "OkBrush", Ui.GWarn));
        tiles.Children.Add(Ui.Tile($"${spools.Sum(s => s.ValueLeft):0}", "Stock value", "OkBrush", Ui.GMoney));
        Body.Children.Add(tiles);

        if (spools.Count == 0)
        {
            Body.Children.Add(Ui.Empty("No spools yet. Use Add Spool for each roll on the shelf."));
            return;
        }

        _grid.Columns.Add(Ui.StatusCol("Stock", nameof(Spool.State), 90));
        _grid.Columns.Add(Ui.Col("Material", nameof(Spool.Material), 90));
        _grid.Columns.Add(Ui.Col("Colour", nameof(Spool.Colour), 120));
        _grid.Columns.Add(Ui.Col("Brand", nameof(Spool.Brand)));
        _grid.Columns.Add(Ui.Col("Left (g)", nameof(Spool.RemainingGrams), 80));
        _grid.Columns.Add(Ui.Col("% left", nameof(Spool.PercentLeft), 70));
        _grid.Columns.Add(Ui.Col("$/kg", nameof(Spool.CostPerKg), 70));
        _grid.Columns.Add(Ui.Col("Low at (g)", nameof(Spool.LowAtGrams), 90));
        _grid.ItemsSource = spools;
        _grid.MouseDoubleClick += (_, _) => { if (_grid.SelectedItem is Spool s) Edit(s); };
        Body.Children.Add(Ui.GridCard(_grid, "Spools", Ui.GBox));

        var log = FilamentStock.Log(30);
        if (log.Count > 0)
        {
            var lg = Ui.Grid();
            lg.Columns.Add(Ui.Col("When", nameof(FilamentStock.LogEntry.At), 130));
            lg.Columns.Add(Ui.Col("Spool", nameof(FilamentStock.LogEntry.Spool), 220));
            lg.Columns.Add(Ui.Col("Grams", nameof(FilamentStock.LogEntry.Grams), 80));
            lg.Columns.Add(Ui.Col("For", nameof(FilamentStock.LogEntry.Note)));
            lg.ItemsSource = log;
            Body.Children.Add(Ui.GridCard(lg, "Recent use", Ui.GClock));
        }
    }

    private void Reload() => (Window.GetWindow(this) as MainWindow)?.ReloadCurrent();

    private void Edit(Spool? s)
    {
        if (new SpoolEditorWindow(s) { Owner = Window.GetWindow(this) }.ShowDialog() == true) Reload();
    }

    private void LogUse()
    {
        if (_grid.SelectedItem is not Spool s)
        {
            MessageBox.Show(Window.GetWindow(this), "Select the spool the print came off first.", "Filament", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        if (new FilamentUseWindow(s) { Owner = Window.GetWindow(this) }.ShowDialog() == true) Reload();
    }

    private void Delete()
    {
        if (_grid.SelectedItem is not Spool s) return;
        if (!Forms.Confirm(Window.GetWindow(this), "Filament", $"Delete {s.Display}?")) return;
        FilamentStock.Delete(s.Id);
        Reload();
    }
}

public sealed class SpoolEditorWindow : EditorDialog
{
    private readonly Spool _s;
    private readonly ComboBox _material;
    private readonly TextBox _colour, _brand, _spool, _left, _cost, _low, _notes;

    public SpoolEditorWindow(Spool? s) : base(s is null ? "Add Spool" : "Spool — " + s.Display, 560, 520)
    {
        _s = s ?? new Spool();
        _material = Forms.Combo(FilamentStock.Materials, _s.Material);
        if (_material.SelectedItem as string != _s.Material) { _material.Items.Add(_s.Material); _material.SelectedItem = _s.Material; }
        _colour = Forms.Tb(_s.Colour);
        _brand = Forms.Tb(_s.Brand);
        _spool = Forms.Tb(_s.SpoolGrams.ToString("0"));
        _left = Forms.Tb(_s.RemainingGrams.ToString("0"));
        _cost = Forms.Tb(_s.CostPerKg.ToString("0.00"));
        _low = Forms.Tb(_s.LowAtGrams.ToString("0"));
        _notes = Forms.Tb(_s.Notes, multiline: true);

        FormPanel.Children.Add(Forms.Grid(3, Forms.Field("Material", _material), Forms.Field("Colour", _colour), Forms.Field("Brand", _brand)));
        FormPanel.Children.Add(Forms.Grid(4, Forms.Field("Spool size (g)", _spool), Forms.Field("Left (g)", _left),
            Forms.Field("Cost per kg ($)", _cost), Forms.Field("Warn below (g)", _low)));
        FormPanel.Children.Add(Forms.Field("Notes", _notes));
        FormPanel.Children.Add(Forms.Note("Weigh a part-used spool and subtract the empty spool (usually 150–250 g) to get what's left."));

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", (_, _) => Save(), primary: true, glyph: Ui.GSave));
    }

    private void Save()
    {
        _s.Material = _material.SelectedItem as string ?? "PLA";
        _s.Colour = _colour.Text.Trim();
        _s.Brand = _brand.Text.Trim();
        _s.SpoolGrams = Forms.Num(_spool);
        _s.RemainingGrams = Forms.Num(_left);
        _s.CostPerKg = Forms.Num(_cost);
        _s.LowAtGrams = Forms.Num(_low);
        _s.Notes = _notes.Text;
        if (_s.SpoolGrams <= 0) { Forms.Error(this, Title, "Enter the spool size in grams, e.g. 1000."); return; }
        FilamentStock.Save(_s);
        DialogResult = true;
    }
}

public sealed class FilamentUseWindow : EditorDialog
{
    private readonly Spool _s;
    private readonly TextBox _grams = Forms.Tb();
    private readonly TextBox _note = Forms.Tb();

    public FilamentUseWindow(Spool s) : base("Log filament use — " + s.Display, 520, 330)
    {
        _s = s;
        FormPanel.Children.Add(Forms.Note($"{s.RemainingGrams:0} g left on this spool."));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Grams used (slicer figure)", _grams), Forms.Field("For (job, quote or customer)", _note)));
        FormPanel.Children.Add(Forms.Note("Enter a negative number to put filament back, e.g. to correct a mistake."));
        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Log", (_, _) => Save(), primary: true, glyph: Ui.GCheck));
        Loaded += (_, _) => Keyboard.Focus(_grams);
    }

    private void Save()
    {
        var g = Forms.Num(_grams);
        if (g == 0) { Forms.Error(this, Title, "Enter how many grams the print used."); return; }
        FilamentStock.Use(_s.Id, g, _note.Text.Trim());
        DialogResult = true;
    }
}

// ============================================================= tester defaults

/// <summary>What a new job is filled in with. Also updated whenever a job is saved.</summary>
public sealed class TesterDefaultsWindow : EditorDialog
{
    private readonly TextBox _name = Forms.Tb(Repository.GetSetting("TesterName", ""));
    private readonly TextBox _licence = Forms.Tb(Repository.GetSetting("TesterLicence", ""));
    private readonly TextBox _equipment = Forms.Tb(Repository.GetSetting("TestEquipment", "Wavecom TnT RCD"));
    private readonly TextBox _calibrated = Forms.Tb(Repository.GetSetting("CalibrationDate", ""));
    private readonly TextBox _tag = Forms.Tb(Repository.GetSetting("LastTagStart", "T-001"));

    // The tester's signature, drawn onto every certificate's tester line.
    private string _signature = AttachmentStore.TesterSignature;
    private readonly Image _sigImage = new() { Height = 70, MaxWidth = 300, Stretch = Stretch.Uniform, HorizontalAlignment = HorizontalAlignment.Left };
    private readonly TextBlock _sigNone = new() { Text = "No signature yet - certificates get a blank line to sign by hand.", Foreground = Forms.Res("FaintText"), VerticalAlignment = VerticalAlignment.Center };

    public TesterDefaultsWindow() : base("Tester Defaults", 600, 640)
    {
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Tester name", _name), Forms.Field("Licence / certificate no.", _licence)));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Test equipment", _equipment), Forms.Field("Calibration date (yyyy-mm-dd)", _calibrated)));
        FormPanel.Children.Add(Forms.Field("Next tag number on the roll", _tag));
        FormPanel.Children.Add(Forms.Note("New jobs start with these. Saving a job also updates the tester details and where the tag roll is up to."));

        FormPanel.Children.Add(new TextBlock { Text = "Your signature", FontSize = 11, Foreground = Forms.Res("MutedText"), Margin = new Thickness(0, 10, 0, 3) });
        FormPanel.Children.Add(new Border
        {
            Background = Brushes.White,
            BorderBrush = Forms.Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(10),
            MinHeight = 90,
            Child = new Grid { Children = { _sigImage, _sigNone } },
        });
        var sigBar = new WrapPanel { Margin = new Thickness(0, 8, 0, 0) };
        sigBar.Children.Add(Forms.Btn("Sign Here…", (_, _) => SignHere(), glyph: Glyphs.Pen));
        sigBar.Children.Add(Forms.Btn("Sign on My Phone…", (_, _) => SignOnPhone(), glyph: Glyphs.Phone));
        sigBar.Children.Add(Forms.Btn("Remove", (_, _) => { _signature = ""; ShowSignature(); }, glyph: Ui.GDelete));
        FormPanel.Children.Add(sigBar);
        FormPanel.Children.Add(Forms.Note("Goes on the tester line of every certificate. Kept on your website, so the Test & Tag app on your phone uses the same one - set it there, here, or with Sign on My Phone, and the others pick it up."));
        ShowSignature();

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", (_, _) => Save(), primary: true, glyph: Ui.GSave));
    }

    private void ShowSignature()
    {
        _sigImage.Source = _signature.Length > 0 ? ImageTools.FromDataUrl(_signature) : null;
        _sigNone.Visibility = _sigImage.Source is null ? Visibility.Visible : Visibility.Collapsed;
    }

    private void SignHere()
    {
        var dlg = new SignaturePadWindow("Your Signature", "Sign as you would on a certificate.", askName: false) { Owner = this };
        if (dlg.ShowDialog() == true && dlg.Result is not null) { _signature = dlg.Result.DataUrl; ShowSignature(); }
    }

    private void SignOnPhone()
    {
        var dlg = new PhoneCaptureWindow(PhoneCapture.TesterRecord, "Tester signature for certificates", PhoneCapture.Modes.Tester,
            Array.Empty<string>()) { Owner = this };
        dlg.ShowDialog();
        var sig = AttachmentStore.LatestSignature(dlg.Received);
        if (sig is not null) { _signature = sig.DataUrl; ShowSignature(); }
    }

    private void Save()
    {
        var cal = _calibrated.Text.Trim();
        if (cal.Length > 0 && !DateTime.TryParseExact(cal, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out _))
        { Forms.Error(this, Title, "Enter the calibration date as yyyy-mm-dd, or leave it blank."); return; }
        Repository.SetSetting("TesterName", _name.Text.Trim());
        Repository.SetSetting("TesterLicence", _licence.Text.Trim());
        Repository.SetSetting("TestEquipment", _equipment.Text.Trim());
        Repository.SetSetting("CalibrationDate", cal);
        if (_tag.Text.Trim().Length > 0) Repository.SetSetting("LastTagStart", _tag.Text.Trim());
        AttachmentStore.TesterSignature = _signature;
        DialogResult = true;
    }
}
