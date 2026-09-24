using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>
/// Create or edit a test and tag job: the site details at the top, the tested
/// items in an editable grid below.
///
/// Built in code rather than XAML so the grid columns and the pass/fail logic
/// live next to each other — that logic is the part most likely to need
/// adjusting, and splitting it across two files makes it easy to miss.
/// </summary>
public sealed class JobEditorWindow : Window
{
    private readonly Job _job;
    private readonly ObservableCollection<Item> _items;

    private readonly TextBox _cert = Tb(), _site = Tb(), _date = Tb(),
                             _tester = Tb(), _licence = Tb(), _equipment = Tb(), _tagStart = Tb();
    private readonly ComboBox _client = new();
    private readonly List<Client> _clients = Repository.GetClients();
    private readonly ComboBox _environment = new();
    private readonly TextBlock _summary = new();

    public JobEditorWindow(Job? existing = null)
    {
        _job = existing ?? NewJob();
        _items = new ObservableCollection<Item>(_job.Items);

        Title = existing is null ? "New Job" : "Job " + _job.CertNumber;
        Width = 1150;
        Height = 760;
        MinWidth = 900;
        MinHeight = 560;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = (Brush)Application.Current.Resources["AppBackground"];

        Content = BuildLayout();
        LoadJob();
        RefreshSummary();
    }

    // ------------------------------------------------------------------ model

    private static Job NewJob()
    {
        var last = Repository.GetSetting("LastTagStart", "T-001");
        return new Job
        {
            CertNumber = "ZS" + Random.Shared.Next(100000, 999999),
            TesterName = Repository.GetSetting("TesterName", ""),
            TesterLicence = Repository.GetSetting("TesterLicence", ""),
            TestEquipment = Repository.GetSetting("TestEquipment", "Wavecom TnT RCD"),
            CalibrationDate = Repository.GetSetting("CalibrationDate", ""),
            TagStart = last,
            Items = { new Item { TagNumber = last } },
        };
    }

    // ------------------------------------------------------------------ layout

    private static TextBox Tb() => new() { Padding = new Thickness(6, 4, 6, 4), Margin = new Thickness(0, 0, 0, 8) };

    private UIElement BuildLayout()
    {
        var root = new DockPanel { Margin = new Thickness(16) };

        // ---- buttons along the bottom
        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
        };
        DockPanel.SetDock(buttons, Dock.Bottom);

        buttons.Children.Add(Button("Add Item", (_, _) => AddItem()));
        buttons.Children.Add(Button("Add from Library…", (_, _) => AddFromLibrary()));
        buttons.Children.Add(Button("Duplicate Item", (_, _) => DuplicateItem()));
        buttons.Children.Add(Button("Remove Item", (_, _) => RemoveItem()));
        buttons.Children.Add(new Separator { Width = 16, Opacity = 0 });
        buttons.Children.Add(Button("Certificate…", (_, _) => ShowCertificate()));
        buttons.Children.Add(Button("Cancel", (_, _) => Close()));
        buttons.Children.Add(Button("Save", (_, _) => Save(), primary: true));
        root.Children.Add(buttons);

        // ---- summary line
        _summary.Margin = new Thickness(0, 10, 0, 0);
        _summary.FontSize = 12;
        _summary.Foreground = (Brush)Application.Current.Resources["MutedText"];
        DockPanel.SetDock(_summary, Dock.Bottom);
        root.Children.Add(_summary);

        // ---- details form
        var form = new Grid { Margin = new Thickness(0, 0, 0, 14) };
        for (var i = 0; i < 4; i++)
            form.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        for (var i = 0; i < 4; i++) form.RowDefinitions.Add(new RowDefinition());

        foreach (var e in ENVIRONMENTS) _environment.Items.Add(e.Label);
        _environment.SelectedIndex = 4;
        _environment.Margin = new Thickness(0, 0, 0, 8);
        _environment.Padding = new Thickness(6, 4, 6, 4);

        _client.Margin = new Thickness(0, 0, 0, 8);
        _client.Padding = new Thickness(6, 4, 6, 4);
        _client.Items.Add("(none)");
        foreach (var c in _clients) _client.Items.Add(c.Display);
        _client.SelectedIndex = 0;

        Field(form, 0, 0, "Certificate No.", _cert);
        Field(form, 0, 1, "Client", _client);
        Field(form, 0, 2, "Site address", _site, span: 2);

        Field(form, 1, 0, "Test date (yyyy-mm-dd)", _date);
        Field(form, 1, 1, "Environment", _environment);
        Field(form, 1, 2, "Tag numbering starts at", _tagStart);
        Field(form, 1, 3, "Test equipment", _equipment);

        Field(form, 2, 0, "Tester name", _tester);
        Field(form, 2, 1, "Licence / cert no.", _licence);

        DockPanel.SetDock(form, Dock.Top);
        root.Children.Add(form);

        // ---- item grid fills the rest
        root.Children.Add(BuildGrid());
        return root;
    }

    private static Button Button(string text, RoutedEventHandler click, bool primary = false)
    {
        var b = new Button
        {
            Content = text,
            Padding = new Thickness(14, 6, 14, 6),
            Margin = new Thickness(6, 0, 0, 0),
            MinWidth = 92,
        };
        if (primary)
        {
            b.Background = (Brush)Application.Current.Resources["AccentBrush"];
            b.BorderBrush = b.Background;
            b.Foreground = Brushes.White;
            b.FontWeight = FontWeights.SemiBold;
        }
        b.Click += click;
        return b;
    }

    private static void Field(Grid g, int row, int col, string label, FrameworkElement input, int span = 1)
    {
        var stack = new StackPanel { Margin = new Thickness(0, 0, 12, 0) };
        stack.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = 11,
            Foreground = (Brush)Application.Current.Resources["MutedText"],
            Margin = new Thickness(0, 0, 0, 3),
        });
        stack.Children.Add(input);
        Grid.SetRow(stack, row);
        Grid.SetColumn(stack, col);
        Grid.SetColumnSpan(stack, span);
        g.Children.Add(stack);
    }

    private DataGrid _grid = null!;

    private UIElement BuildGrid()
    {
        _grid = new DataGrid
        {
            AutoGenerateColumns = false,
            CanUserAddRows = false,
            HeadersVisibility = DataGridHeadersVisibility.Column,
            GridLinesVisibility = DataGridGridLinesVisibility.All,
            HorizontalGridLinesBrush = (Brush)Application.Current.Resources["BorderBrush"],
            VerticalGridLinesBrush = (Brush)Application.Current.Resources["BorderBrush"],
            BorderBrush = (Brush)Application.Current.Resources["BorderBrush"],
            BorderThickness = new Thickness(1),
            Background = Brushes.White,
            RowBackground = Brushes.White,
            FontSize = 12,
            RowHeight = 28,
            ItemsSource = _items,
        };

        _grid.Columns.Add(Text("Tag", nameof(Item.TagNumber), 90));
        _grid.Columns.Add(Text("Description", nameof(Item.Description), 200));
        _grid.Columns.Add(Choice("Class", nameof(Item.EquipmentClass), new[] { "I", "II", "III" }, 60));
        // Drives the invoice: standard, power tool, RCD or microwave pricing.
        _grid.Columns.Add(Choice("Type", nameof(Item.ItemType), ApplianceLibrary.ItemTypes, 100));
        _grid.Columns.Add(Text("Location", nameof(Item.Location), 130));
        _grid.Columns.Add(Choice("Visual", nameof(Item.Visual), new[] { "pass", "fail" }, 72));
        _grid.Columns.Add(Text("Earth Ω", nameof(Item.EarthContinuity), 78));
        _grid.Columns.Add(Text("Insul. MΩ", nameof(Item.InsulationResistance), 84));
        _grid.Columns.Add(Text("Leak mA", nameof(Item.LeakageCurrent), 76));
        _grid.Columns.Add(Choice("RCD", nameof(Item.RcdTest), new[] { "n/a", "pass", "fail" }, 70));
        _grid.Columns.Add(Choice("Operation", nameof(Item.OperationTest), new[] { "n/a", "pass", "fail" }, 84));
        _grid.Columns.Add(Choice("Result", nameof(Item.Result), new[] { "pass", "fail" }, 72));
        _grid.Columns.Add(Text("Fault", nameof(Item.FaultDescription), 180));

        // Picking the part fitted puts it on the invoice and counts stock down.
        var parts = PartsCatalogue.Fittable();
        var partCol = new DataGridComboBoxColumn
        {
            Header = "Part fitted",
            ItemsSource = new[] { new Part { Id = "", Name = "(none)" } }.Concat(parts).ToList(),
            DisplayMemberPath = nameof(Part.Name),
            SelectedValuePath = nameof(Part.Id),
            SelectedValueBinding = new System.Windows.Data.Binding(nameof(Item.PartId)),
            Width = new DataGridLength(170),
        };
        _grid.Columns.Add(partCol);

        // Recalculating on every edit is what makes the result trustworthy —
        // a tester shouldn't have to remember to press anything.
        _grid.CellEditEnding += (_, _) => Dispatcher.BeginInvoke(new Action(() =>
        {
            foreach (var it in _items) Grade(it);
            _grid.Items.Refresh();
            RefreshSummary();
        }));

        return _grid;
    }

    private static DataGridTextColumn Text(string header, string path, double w) => new()
    {
        Header = header,
        Binding = new System.Windows.Data.Binding(path) { UpdateSourceTrigger = System.Windows.Data.UpdateSourceTrigger.PropertyChanged },
        Width = new DataGridLength(w),
    };

    private static DataGridComboBoxColumn Choice(string header, string path, string[] options, double w) => new()
    {
        Header = header,
        ItemsSource = options,
        SelectedItemBinding = new System.Windows.Data.Binding(path),
        Width = new DataGridLength(w),
    };

    // ------------------------------------------------------------- pass / fail

    /// <summary>
    /// Mirrors the thresholds the web app uses. Left alone when the tester has
    /// overridden the result — their judgement beats the calculator.
    /// </summary>
    public static void Grade(Item i)
    {
        if (i.ResultOverridden) return;

        string result = "pass";

        if (i.Visual == "fail" || i.CordCondition == "damaged" || i.PlugCondition == "damaged")
            result = "fail";
        else if (i.Polarity == "fail")
            result = "fail";
        else if (i.EquipmentClass == "I" && double.TryParse(i.EarthContinuity, out var earth))
        {
            // Longer leads are allowed more resistance: 1Ω up to 5m, then
            // +0.1Ω per extra metre.
            var limit = double.TryParse(i.CordLength, out var len) && len > 5
                ? 1 + 0.1 * (len - 5)
                : 1.0;
            if (earth > limit) result = "fail";
        }

        if (result == "pass" && double.TryParse(i.InsulationResistance, out var ins) && ins < 1)
            result = "fail";

        if (result == "pass" && double.TryParse(i.LeakageCurrent, out var leak))
        {
            var limit = i.EquipmentClass == "II" ? 1 : 5;
            if (leak > limit) result = "fail";
        }

        if (result == "pass" && (i.RcdTest == "fail" || i.OperationTest == "fail" || i.FuseCheck == "fail"))
            result = "fail";

        i.Result = result;
        if (result == "fail") i.RemovedFromService = true;
    }

    // ------------------------------------------------------------------ items

    /// <summary>
    /// New rows continue the tag sequence and inherit the previous row's
    /// location, class and type — on twenty identical monitors that is most
    /// of the typing gone.
    /// </summary>
    private void AddItem()
    {
        var prev = _items.LastOrDefault();
        _items.Add(new Item
        {
            TagNumber = NextTag(),
            Location = prev?.Location ?? "",
            EquipmentClass = prev?.EquipmentClass ?? "I",
            ItemType = prev?.ItemType ?? "standard",
            MakeModel = prev?.MakeModel ?? "",
            InsulationVoltage = prev?.InsulationVoltage ?? "500",
        });
        RefreshSummary();
    }

    /// <summary>Adds the picked appliances as new items, continuing the tag numbers.</summary>
    private void AddFromLibrary()
    {
        var dlg = new Modules.LibraryPickerWindow { Owner = this };
        if (dlg.ShowDialog() != true) return;

        // A new job opens with one blank row; replace it rather than leave it empty.
        if (_items.Count == 1 && IsBlank(_items[0])) _items.RemoveAt(0);

        var prev = _items.LastOrDefault();
        foreach (var a in dlg.Picked)
        {
            _items.Add(new Item
            {
                TagNumber = NextTag(),
                Description = a.Name,
                EquipmentClass = a.EquipmentClass,
                ItemType = a.ItemType,
                Location = prev?.Location ?? "",
                InsulationVoltage = prev?.InsulationVoltage ?? "500",
            });
        }
        foreach (var it in _items) Grade(it);
        _grid.Items.Refresh();
        RefreshSummary();
    }

    private static bool IsBlank(Item i) =>
        i.Description.Length == 0 && i.EarthContinuity.Length == 0 && i.InsulationResistance.Length == 0
        && i.LeakageCurrent.Length == 0 && i.Location.Length == 0;

    private void DuplicateItem()
    {
        if (_grid.SelectedItem is not Item src) { AddItem(); return; }
        _items.Add(new Item
        {
            TagNumber = NextTag(),
            Description = src.Description,
            MakeModel = src.MakeModel,
            Location = src.Location,
            EquipmentClass = src.EquipmentClass,
            ItemType = src.ItemType,
        });
        RefreshSummary();
    }

    private void RemoveItem()
    {
        if (_grid.SelectedItem is Item it) _items.Remove(it);
        RefreshSummary();
    }

    /// <summary>
    /// Continues from the highest tag already used so inserting or deleting a
    /// row mid-job can't produce a duplicate.
    /// </summary>
    private string NextTag()
    {
        var pattern = _tagStart.Text.Trim();
        if (pattern.Length == 0) pattern = "T-001";

        var m = System.Text.RegularExpressions.Regex.Match(pattern, @"^(.*?)(\d+)\s*$");
        if (!m.Success) return pattern;

        var prefix = m.Groups[1].Value;
        var width = m.Groups[2].Value.Length;
        var start = int.Parse(m.Groups[2].Value);

        var highest = start - 1;
        foreach (var it in _items)
        {
            var im = System.Text.RegularExpressions.Regex.Match(it.TagNumber ?? "", @"^(.*?)(\d+)\s*$");
            if (im.Success && im.Groups[1].Value == prefix)
                highest = Math.Max(highest, int.Parse(im.Groups[2].Value));
        }

        return prefix + (highest + 1).ToString().PadLeft(width, '0');
    }

    private void RefreshSummary()
    {
        var pass = _items.Count(i => i.Result == "pass");
        var fail = _items.Count(i => i.Result == "fail");
        var flagged = _items.Count(i => i.FollowUp);
        _summary.Text = $"{_items.Count} item(s) · {pass} passed · {fail} failed"
                      + (flagged > 0 ? $" · {flagged} flagged for follow-up" : "");
    }

    // ------------------------------------------------------------- load / save

    private void LoadJob()
    {
        _cert.Text = _job.CertNumber;
        _site.Text = _job.SiteAddress;
        _date.Text = _job.TestDate;
        _tester.Text = _job.TesterName;
        _licence.Text = _job.TesterLicence;
        _equipment.Text = _job.TestEquipment;
        _tagStart.Text = _job.TagStart.Length > 0 ? _job.TagStart : "T-001";

        var idx = Array.FindIndex(ENVIRONMENTS, e => e.Value == _job.Environment);
        if (idx >= 0) _environment.SelectedIndex = idx;

        // The client picker was never loaded or saved before 0.2, so jobs
        // reached the website with no client on them.
        var ci = _clients.FindIndex(c => c.Id == _job.ClientId);
        _client.SelectedIndex = ci >= 0 ? ci + 1 : 0;
    }

    private void Save()
    {
        _job.CertNumber = _cert.Text.Trim();
        _job.SiteAddress = _site.Text.Trim();
        _job.TestDate = _date.Text.Trim();
        _job.TesterName = _tester.Text.Trim();
        _job.TesterLicence = _licence.Text.Trim();
        _job.TestEquipment = _equipment.Text.Trim();
        _job.TagStart = _tagStart.Text.Trim();

        _job.ClientId = _client.SelectedIndex > 0 ? _clients[_client.SelectedIndex - 1].Id : null;

        var env = ENVIRONMENTS[Math.Max(0, _environment.SelectedIndex)];
        _job.Environment = env.Value;
        _job.RetestMonths = env.Months;

        foreach (var i in _items) Grade(i);
        _job.Items = _items.ToList();

        Repository.SaveJob(_job);

        // Rewrite this job's parts usage from scratch. Re-saving a job would
        // otherwise count the same part out of stock twice.
        PartsCatalogue.ClearUsageFor(_job.Id);
        foreach (var i in _job.Items.Where(i => !string.IsNullOrEmpty(i.PartId)))
            PartsCatalogue.RecordUse(_job.Id, i.Id, i.PartId);

        // Remember where the tag roll got to - it's continuous across jobs.
        Repository.SetSetting("LastTagStart", _job.TagStart);
        Repository.SetSetting("TesterName", _job.TesterName);
        Repository.SetSetting("TesterLicence", _job.TesterLicence);
        Repository.SetSetting("TestEquipment", _job.TestEquipment);

        DialogResult = true;
        Close();
    }

    private void ShowCertificate()
    {
        _job.CertNumber = _cert.Text.Trim();
        _job.SiteAddress = _site.Text.Trim();
        _job.TestDate = _date.Text.Trim();
        _job.TesterName = _tester.Text.Trim();
        _job.TesterLicence = _licence.Text.Trim();
        foreach (var i in _items) Grade(i);
        _job.Items = _items.ToList();

        new CertificateWindow(_job) { Owner = this }.ShowDialog();
    }

    // ------------------------------------------------------------ environments

    public readonly record struct EnvOption(string Value, string Label, int Months);

    public static readonly EnvOption[] ENVIRONMENTS =
    {
        new("construction", "Construction / Demolition Site", 3),
        new("hostile",      "Factory / Industrial / Hostile", 6),
        new("workshop",     "Workshop / Trade Tools", 12),
        new("hospitality",  "Hospitality / Commercial Kitchen", 12),
        new("office",       "Office / Retail / General Business", 12),
        new("school",       "School / Education Facility", 12),
        new("rental",       "Rental Property", 12),
    };
}
