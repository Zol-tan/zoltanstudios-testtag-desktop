using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>A single billable line.</summary>
public sealed class InvoiceLine
{
    public string Description { get; set; } = "";
    public double Quantity { get; set; } = 1;
    public double Rate { get; set; }
    public double Amount => Math.Round(Quantity * Rate, 2);
}

/// <summary>
/// Create or edit an invoice, optionally generating the lines from a
/// completed test and tag job.
///
/// Generating from a job is the point of this screen: the item counts and
/// rates are already known, so doing it by hand is slower and easier to get
/// wrong.
/// </summary>
public sealed class InvoiceEditorWindow : Window
{
    private readonly Invoice _invoice;
    private readonly Rates _rates = Rates.Load();
    private readonly ObservableCollection<InvoiceLine> _lines = new();

    private readonly TextBox _number = Tb(), _issued = Tb(), _due = Tb(), _notes = Tb();
    private readonly ComboBox _client = new();
    private readonly List<Client> _clients = Repository.GetClients();
    private readonly ComboBox _status = new();
    private readonly TextBlock _totals = new();
    private DataGrid _grid = null!;

    public InvoiceEditorWindow(Invoice? existing = null, Job? fromJob = null, bool pickJob = false)
    {
        _invoice = existing ?? new Invoice
        {
            Number = NextNumber(),
            IssuedDate = DateTime.Today.ToString("yyyy-MM-dd"),
            DueDate = DateTime.Today.AddDays(14).ToString("yyyy-MM-dd"),
        };

        Title = existing is null ? "New Invoice" : "Invoice " + _invoice.Number;
        Width = 900;
        Height = 660;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = (Brush)Application.Current.Resources["AppBackground"];

        Content = BuildLayout();
        Load();

        if (fromJob is not null) GenerateFrom(fromJob);
        Recalculate();

        // "Invoice a Job..." goes straight to choosing the job.
        if (pickJob) Loaded += (_, _) => PickJob();
    }

    private static string NextNumber()
    {
        var highest = Repository.GetInvoices()
            .Select(i => i.Number)
            .Where(n => n.StartsWith("INV-", StringComparison.OrdinalIgnoreCase))
            .Select(n => int.TryParse(n[4..], out var v) ? v : 0)
            .DefaultIfEmpty(0)
            .Max();
        return "INV-" + (highest + 1).ToString("0000");
    }

    private static TextBox Tb() => new()
    {
        Padding = new Thickness(6, 4, 6, 4),
        Margin = new Thickness(0, 0, 12, 8),
    };

    // ------------------------------------------------------------------ layout

    private UIElement BuildLayout()
    {
        var root = new DockPanel { Margin = new Thickness(16) };

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
        };
        DockPanel.SetDock(buttons, Dock.Bottom);
        buttons.Children.Add(Btn("Generate from Job...", (_, _) => PickJob()));
        buttons.Children.Add(Btn("Add Line", (_, _) => { _lines.Add(new InvoiceLine()); Recalculate(); }));
        buttons.Children.Add(Btn("Remove Line", (_, _) =>
        {
            if (_grid.SelectedItem is InvoiceLine l) _lines.Remove(l);
            Recalculate();
        }));
        buttons.Children.Add(Btn("Print...", (_, _) => Print()));
        buttons.Children.Add(Btn("Cancel", (_, _) => Close()));
        buttons.Children.Add(Btn("Save", (_, _) => Save(), primary: true));
        root.Children.Add(buttons);

        _totals.FontSize = 14;
        _totals.FontWeight = FontWeights.SemiBold;
        _totals.HorizontalAlignment = HorizontalAlignment.Right;
        _totals.Margin = new Thickness(0, 10, 6, 0);
        DockPanel.SetDock(_totals, Dock.Bottom);
        root.Children.Add(_totals);

        var form = new Grid { Margin = new Thickness(0, 0, 0, 12) };
        for (var i = 0; i < 3; i++)
            form.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        form.RowDefinitions.Add(new RowDefinition());
        form.RowDefinitions.Add(new RowDefinition());

        _client.Items.Add("(no client)");
        foreach (var c in _clients) _client.Items.Add(c.Display);
        _client.SelectedIndex = 0;
        _client.Padding = new Thickness(6, 4, 6, 4);
        _client.Margin = new Thickness(0, 0, 12, 8);

        foreach (var s in Invoice.Statuses)
            _status.Items.Add(s);
        _status.SelectedIndex = 0;
        _status.Padding = new Thickness(6, 4, 6, 4);
        _status.Margin = new Thickness(0, 0, 12, 8);

        Field(form, 0, 0, "Invoice number", _number);
        Field(form, 0, 1, "Client", _client);
        Field(form, 0, 2, "Status", _status);
        Field(form, 1, 0, "Issued (yyyy-mm-dd)", _issued);
        Field(form, 1, 1, "Due (yyyy-mm-dd)", _due);
        Field(form, 1, 2, "Notes", _notes);

        DockPanel.SetDock(form, Dock.Top);
        root.Children.Add(form);

        // What reaches the client portal, stated where the decision is made.
        var note = new TextBlock
        {
            Text = !string.IsNullOrEmpty(_invoice.ServerId)
                ? "Already on the website. Only a status change is sent from here - the website can't edit an issued invoice's lines."
                : "A draft stays in the suite. Any other status sends it to the website on the next sync, under the client's account.",
            FontSize = 11,
            Foreground = (Brush)Application.Current.Resources["MutedText"],
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, -4, 0, 8),
        };
        DockPanel.SetDock(note, Dock.Top);
        root.Children.Add(note);

        root.Children.Add(BuildGrid());
        return root;
    }

    private static void Field(Grid g, int row, int col, string label, FrameworkElement input)
    {
        var stack = new StackPanel();
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
        g.Children.Add(stack);
    }

    private static Button Btn(string text, RoutedEventHandler click, bool primary = false)
    {
        var b = new Button
        {
            Content = text,
            Padding = new Thickness(13, 6, 13, 6),
            Margin = new Thickness(6, 0, 0, 0),
            MinWidth = 88,
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
            ItemsSource = _lines,
        };

        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Description",
            Binding = new Binding(nameof(InvoiceLine.Description)),
            Width = new DataGridLength(1, DataGridLengthUnitType.Star),
        });
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Qty",
            Binding = new Binding(nameof(InvoiceLine.Quantity)),
            Width = new DataGridLength(80),
        });
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Rate",
            Binding = new Binding(nameof(InvoiceLine.Rate)) { StringFormat = "0.00" },
            Width = new DataGridLength(90),
        });
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Amount",
            Binding = new Binding(nameof(InvoiceLine.Amount)) { StringFormat = "0.00" },
            Width = new DataGridLength(100),
            IsReadOnly = true,
        });

        _grid.CellEditEnding += (_, _) =>
            Dispatcher.BeginInvoke(new Action(() => { _grid.Items.Refresh(); Recalculate(); }));

        return _grid;
    }

    // ------------------------------------------------------- generate from job

    private void PickJob()
    {
        var jobs = Repository.GetJobs(includeItems: true)
            .OrderByDescending(j => j.TestDate).Take(50).ToList();

        if (jobs.Count == 0)
        {
            MessageBox.Show("There are no jobs to invoice yet.", "Generate from job",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var pick = new Window
        {
            Title = "Choose a job",
            Width = 640,
            Height = 440,
            Owner = this,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Background = (Brush)Application.Current.Resources["AppBackground"],
        };

        var grid = new DataGrid
        {
            AutoGenerateColumns = false,
            IsReadOnly = true,
            CanUserAddRows = false,
            Margin = new Thickness(12),
            ItemsSource = jobs,
            FontSize = 12,
        };
        grid.Columns.Add(new DataGridTextColumn { Header = "Certificate", Binding = new Binding(nameof(Job.CertNumber)), Width = new DataGridLength(110) });
        grid.Columns.Add(new DataGridTextColumn { Header = "Site", Binding = new Binding(nameof(Job.SiteAddress)), Width = new DataGridLength(1, DataGridLengthUnitType.Star) });
        grid.Columns.Add(new DataGridTextColumn { Header = "Date", Binding = new Binding(nameof(Job.TestDate)), Width = new DataGridLength(100) });
        grid.Columns.Add(new DataGridTextColumn { Header = "Items", Binding = new Binding(nameof(Job.ItemCount)), Width = new DataGridLength(60) });

        grid.MouseDoubleClick += (_, _) =>
        {
            if (grid.SelectedItem is Job j) { GenerateFrom(j); pick.Close(); }
        };

        pick.Content = grid;
        pick.ShowDialog();
    }

    /// <summary>
    /// Builds lines from a job using the rates in Settings. The call-out
    /// covers the first N standard items, and volume tiers replace the
    /// standard rate rather than stacking with it - matching how the website
    /// quotes, so an invoice can't contradict the quote.
    /// </summary>
    private void GenerateFrom(Job job)
    {
        _lines.Clear();
        foreach (var l in JobRules.InvoiceLinesFor(job, _rates, PartsCatalogue.All(includeInactive: true), PartsCatalogue.UsedOn(job.Id)))
            _lines.Add(new InvoiceLine { Description = l.Description, Quantity = l.Quantity, Rate = l.Rate });
        _loadedWithoutLines = false;

        _invoice.JobId = job.Id;
        // The invoice goes to the job's client - without one it can't reach the website.
        var ci = _clients.FindIndex(c => c.Id == job.ClientId);
        if (ci >= 0) _client.SelectedIndex = ci + 1;
        if (_notes.Text.Length == 0)
            _notes.Text = $"Certificate {job.CertNumber}, tested {job.TestDate}";

        Recalculate();
    }

    // ------------------------------------------------------------------ totals

    private void Recalculate()
    {
        if (_loadedWithoutLines && _lines.Count == 0)
        {
            _totals.Text = $"Total ${_invoice.Total:0.00} (no line items stored)";
            return;
        }

        var sub = _lines.Sum(l => l.Amount);
        var gst = sub * _rates.GstPercent / 100.0;
        var total = sub + gst;

        _totals.Text = _rates.GstPercent > 0
            ? $"Subtotal ${sub:0.00}     GST ${gst:0.00}     Total ${total:0.00}"
            : $"Total ${total:0.00}";

        _invoice.Subtotal = sub;
        _invoice.Total = total;
    }

    // ------------------------------------------------------------------- print

    private void Warn(string message)
        => MessageBox.Show(this, message, Title, MessageBoxButton.OK, MessageBoxImage.Warning);

    private void Print()
    {
        Recalculate();
        _invoice.Number = _number.Text.Trim();
        _invoice.IssuedDate = _issued.Text.Trim();
        _invoice.DueDate = _due.Text.Trim();
        _invoice.Notes = _notes.Text.Trim();

        var clientName = _client.SelectedIndex > 0 ? _client.SelectedItem as string ?? "" : "";
        new InvoiceDocumentWindow(_invoice, _lines.ToList(), clientName, _rates) { Owner = this }.ShowDialog();
    }

    // ------------------------------------------------------------- load / save

    private void Load()
    {
        _number.Text = _invoice.Number;
        _issued.Text = _invoice.IssuedDate;
        _due.Text = _invoice.DueDate;
        _notes.Text = _invoice.Notes;

        var idx = _status.Items.IndexOf(Invoice.Normalise(_invoice.Status));
        if (idx >= 0) _status.SelectedIndex = idx;

        var ci = _clients.FindIndex(c => c.Id == _invoice.ClientId);
        _client.SelectedIndex = ci >= 0 ? ci + 1 : 0;

        // Lines were never stored before 0.2 - reopening an invoice showed
        // none and saving it again zeroed the total.
        _lines.Clear();
        foreach (var l in InvoiceLines.Read(_invoice.LinesJson).Where(l => l.Description != "GST"))
            _lines.Add(new InvoiceLine { Description = l.Description, Quantity = l.Quantity, Rate = l.Rate });
        _loadedWithoutLines = _lines.Count == 0 && _invoice.Total > 0;
    }

    /// <summary>An invoice from 0.1 (or the website with no lines) - keep its total.</summary>
    private bool _loadedWithoutLines;

    private void Save()
    {
        var number = _number.Text.Trim();
        if (number.Length == 0) { Warn("Give the invoice a number."); return; }
        if (Repository.GetInvoices().Any(i => i.Id != _invoice.Id && string.Equals(i.Number, number, StringComparison.OrdinalIgnoreCase)))
        { Warn($"Invoice number {number} is already used. The website won't accept it twice."); return; }
        foreach (var (label, value) in new[] { ("Issued", _issued.Text.Trim()), ("Due", _due.Text.Trim()) })
            if (!DateTime.TryParseExact(value, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out _))
            { Warn($"{label} date must be yyyy-mm-dd, e.g. {DateTime.Today:yyyy-MM-dd}."); return; }
        if (_lines.Any(l => l.Quantity < 0 || l.Rate < 0)) { Warn("Quantities and rates can't be negative."); return; }

        _invoice.Number = _number.Text.Trim();
        _invoice.IssuedDate = _issued.Text.Trim();
        _invoice.DueDate = _due.Text.Trim();
        _invoice.Notes = _notes.Text.Trim();
        _invoice.Status = _status.SelectedItem as string ?? "draft";

        _invoice.ClientId = _client.SelectedIndex > 0 ? _clients[_client.SelectedIndex - 1].Id : null;

        if (_loadedWithoutLines && _lines.Count == 0)
        {
            // Nothing to recalculate from: leave the stored total alone.
        }
        else
        {
            Recalculate();
            _invoice.LinesJson = InvoiceLines.Write(_lines.Select(l => new InvoiceLines.Line(l.Description, l.Quantity, l.Rate)));
        }
        Repository.SaveInvoice(_invoice);

        DialogResult = true;
        Close();
    }
}
