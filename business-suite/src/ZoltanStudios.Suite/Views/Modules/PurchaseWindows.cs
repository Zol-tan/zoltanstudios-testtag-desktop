using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>A line on the shopping list.</summary>
public sealed class BuyRow : INotifyPropertyChanged
{
    public Part Part { get; }
    private bool _buy;
    private int _qty;
    private double _price;

    public BuyRow(Part p, bool buy)
    {
        Part = p;
        _buy = buy;
        _qty = PartsCatalogue.SuggestedBuy(p);
        _price = p.Cost;
    }

    public bool Buy { get => _buy; set { _buy = value; Changed(nameof(Buy)); } }
    public int Qty { get => _qty; set { _qty = Math.Max(0, value); Changed(nameof(Qty)); Changed(nameof(Total)); } }
    public double Price { get => _price; set { _price = Math.Max(0, Math.Round(value, 2)); Changed(nameof(Price)); Changed(nameof(Total)); } }
    public double Total => Math.Round(Qty * Price, 2);

    public string Shop => Part.SupplierOrGuess.Length > 0 ? Part.SupplierOrGuess : "Other";
    public string Sku => Part.Sku;
    public string Name => Part.Name;
    public int OnHand => Part.OnHand;
    public int LowAt => Part.LowAt;

    public event PropertyChangedEventHandler? PropertyChanged;
    private void Changed(string n) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
}

/// <summary>
/// Buying stock in one place: what needs buying (or anything), grouped by
/// shop with how many to get. Open the product pages in your own browser -
/// where you're signed in to Bunnings / Jaycar - to buy, then "Bought" adds
/// them to stock at the price paid.
/// </summary>
public sealed class BuyStockWindow : Window
{
    private readonly ObservableCollection<BuyRow> _rows = new();
    private readonly DataGrid _grid = Ui.Grid();
    private readonly CheckBox _all = new() { Content = "Show all parts, not just low ones", VerticalAlignment = VerticalAlignment.Center };
    private readonly TextBlock _total = new() { FontSize = 13, FontWeight = FontWeights.SemiBold, VerticalAlignment = VerticalAlignment.Center };

    /// <summary>True once anything was added to stock (the Parts page reloads).</summary>
    public bool Changed { get; private set; }

    public BuyStockWindow()
    {
        Title = "Buy Stock";
        Width = 1040;
        Height = 680;
        MinWidth = 760;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        var root = new DockPanel { Margin = new Thickness(18) };

        var head = new StackPanel { Margin = new Thickness(0, 0, 0, 10) };
        head.Children.Add(Ui.Heading("Buy Stock", Ui.GBox));
        head.Children.Add(Forms.Note("1. Tick what you're buying and set how many.   2. Open in My Browser: Amazon items go straight into your Amazon cart "
            + "(all at once, with quantities); other shops open at each product page.   3. Buy, then press Bought — it's added to stock at the price paid, "
            + "and the website's count goes up on the next sync."));
        DockPanel.SetDock(head, Dock.Top);
        root.Children.Add(head);

        // ---- bottom bar
        var bottom = new DockPanel { Margin = new Thickness(0, 12, 0, 0), LastChildFill = false };
        var left = new StackPanel { Orientation = Orientation.Horizontal };
        left.Children.Add(_all);
        left.Children.Add(new Border { Width = 18 });
        left.Children.Add(_total);
        DockPanel.SetDock(left, Dock.Left);
        bottom.Children.Add(left);
        var right = new StackPanel { Orientation = Orientation.Horizontal };
        right.Children.Add(Forms.Btn("History…", (_, _) => new PurchaseHistoryWindow { Owner = this }.ShowDialog()));
        right.Children.Add(Forms.Btn("Copy List", (_, _) => CopyList(), glyph: Ui.GCopy));
        right.Children.Add(Forms.Btn("Open in My Browser", (_, _) => OpenTicked(), glyph: Ui.GGlobe));
        right.Children.Add(Forms.Btn("Bought — Add to Stock", (_, _) => Bought(), primary: true, glyph: Ui.GCheck));
        right.Children.Add(Forms.Btn("Close", (_, _) => Close()));
        foreach (var b in right.Children.OfType<Button>()) b.Margin = new Thickness(8, 0, 0, 0);
        DockPanel.SetDock(right, Dock.Right);
        bottom.Children.Add(right);
        DockPanel.SetDock(bottom, Dock.Bottom);
        root.Children.Add(bottom);

        // ---- grid
        _grid.IsReadOnly = false;
        _grid.CanUserAddRows = false;
        _grid.Columns.Add(new DataGridCheckBoxColumn
        {
            Header = "Buy",
            Binding = new Binding(nameof(BuyRow.Buy)) { UpdateSourceTrigger = UpdateSourceTrigger.PropertyChanged },
            Width = new DataGridLength(46),
        });
        _grid.Columns.Add(ReadOnly("Shop", nameof(BuyRow.Shop), 90));
        _grid.Columns.Add(ReadOnly("Item no.", nameof(BuyRow.Sku), 90));
        _grid.Columns.Add(ReadOnly("Part", nameof(BuyRow.Name), 0));
        _grid.Columns.Add(ReadOnly("In stock", nameof(BuyRow.OnHand), 70));
        _grid.Columns.Add(ReadOnly("Low at", nameof(BuyRow.LowAt), 60));
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Qty to buy",
            Binding = new Binding(nameof(BuyRow.Qty)) { UpdateSourceTrigger = UpdateSourceTrigger.LostFocus },
            Width = new DataGridLength(80),
        });
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Price each $",
            Binding = new Binding(nameof(BuyRow.Price)) { StringFormat = "0.00", UpdateSourceTrigger = UpdateSourceTrigger.LostFocus },
            Width = new DataGridLength(90),
        });
        _grid.Columns.Add(ReadOnly("Total $", nameof(BuyRow.Total), 80, "0.00"));
        _grid.ItemsSource = _rows;
        _grid.MouseDoubleClick += (_, e) =>
        {
            // Double-click the part name to see it at the shop.
            if (_grid.SelectedItem is BuyRow r && _grid.CurrentColumn is { } col && col.IsReadOnly)
                try { Process.Start(new ProcessStartInfo(PartsCatalogue.BuyLink(r.Part)) { UseShellExecute = true }); }
                catch (Exception ex) when (ex is Win32Exception or InvalidOperationException) { Forms.Error(this, Title, ex.Message); }
        };
        root.Children.Add(Ui.GridCard(_grid));

        _all.Checked += (_, _) => Load();
        _all.Unchecked += (_, _) => Load();
        _rows.CollectionChanged += (_, _) => UpdateTotal();
        Content = root;
        Load();
    }

    private static DataGridTextColumn ReadOnly(string header, string path, double width, string? format = null)
    {
        var c = Ui.Col(header, path, width);
        c.IsReadOnly = true;
        if (format is not null) ((Binding)c.Binding).StringFormat = format;
        return c;
    }

    private void Load()
    {
        foreach (var r in _rows) r.PropertyChanged -= RowChanged;
        _rows.Clear();
        var parts = PartsCatalogue.All().Where(p => _all.IsChecked == true || p.IsLow);
        foreach (var p in parts.OrderBy(p => p.SupplierOrGuess.Length > 0 ? p.SupplierOrGuess : "~").ThenBy(p => p.Name))
        {
            var row = new BuyRow(p, buy: p.IsLow);
            row.PropertyChanged += RowChanged;
            _rows.Add(row);
        }
        UpdateTotal();
    }

    private void RowChanged(object? sender, PropertyChangedEventArgs e) => UpdateTotal();

    private List<BuyRow> Ticked => _rows.Where(r => r.Buy && r.Qty > 0).ToList();

    private void UpdateTotal()
    {
        var t = Ticked;
        var byShop = t.GroupBy(r => r.Shop).Select(g => $"{g.Key} ${g.Sum(r => r.Total):0.00}");
        _total.Text = t.Count == 0 ? (_rows.Count == 0 ? "Nothing is low on stock. Tick \"Show all parts\" to buy anything." : "Nothing ticked.")
            : $"{t.Count} item(s), ${t.Sum(r => r.Total):0.00}   ({string.Join(" · ", byShop)})";
    }

    /// <summary>Opens product pages in the default browser, where the user is signed in to each shop.</summary>
    private void OpenTicked()
    {
        _grid.CommitEdit(DataGridEditingUnit.Row, true);
        var t = Ticked;
        if (t.Count == 0) { Forms.Error(this, Title, "Tick the parts you're buying first."); return; }
        if (t.Count > 8 && !Forms.Confirm(this, Title, $"Open {t.Count} pages in your browser?")) return;
        OpenInBrowser(t);
    }

    /// <summary>
    /// Amazon items with an ASIN all go into the Amazon cart through one link,
    /// with their quantities (Amazon asks you to confirm). Everything else
    /// opens at its product page (or a search at its shop).
    /// </summary>
    private void OpenInBrowser(IEnumerable<BuyRow> rows)
    {
        var list = rows.ToList();
        var amazon = list.Where(r => r.Shop == "Amazon")
            .Select(r => (Row: r, Asin: Suppliers.AmazonAsin(r.Part.Sku, r.Part.Url)))
            .Where(x => x.Asin.Length > 0).ToList();
        var links = new List<string>();
        if (Suppliers.AmazonCartUrl(amazon.Select(x => (x.Asin, x.Row.Qty))) is { } cart) links.Add(cart);
        var inCart = amazon.Select(x => x.Row).ToHashSet();
        links.AddRange(list.Where(r => !inCart.Contains(r)).Select(r => PartsCatalogue.BuyLink(r.Part)));
        foreach (var url in links)
        {
            try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
            catch (Exception e) when (e is Win32Exception or InvalidOperationException)
            {
                Forms.Error(this, Title, "Couldn't open your browser: " + e.Message);
                return;
            }
        }
        if (amazon.Count > 0)
        {
            _total.Text = $"{amazon.Count} Amazon item(s) sent to your Amazon cart in one go - confirm them there. Then press Bought here.";
            _total.Foreground = Forms.Res("OkBrush");
        }
    }

    private void CopyList()
    {
        _grid.CommitEdit(DataGridEditingUnit.Row, true);
        var t = Ticked;
        if (t.Count == 0) { Forms.Error(this, Title, "Tick the parts you're buying first."); return; }
        var sb = new System.Text.StringBuilder("Shopping list - ZoltanStudios - " + DateTime.Today.ToString("d MMM yyyy") + "\n");
        foreach (var g in t.GroupBy(r => r.Shop))
        {
            sb.Append('\n').Append(g.Key).Append('\n');
            foreach (var r in g)
                sb.Append("  ").Append(r.Qty).Append(" x ").Append(r.Name)
                  .Append(r.Sku.Length > 0 ? " (" + r.Sku + ")" : "").Append("  $").Append(r.Price.ToString("0.00")).Append(" each\n");
            sb.Append("  Subtotal $").Append(g.Sum(r => r.Total).ToString("0.00")).Append('\n');
        }
        sb.Append("\nTotal $").Append(t.Sum(r => r.Total).ToString("0.00")).Append('\n');
        Clipboard.SetText(sb.ToString());
        _total.Text = "Copied to the clipboard.";
    }

    private void Bought()
    {
        _grid.CommitEdit(DataGridEditingUnit.Row, true);
        var t = Ticked;
        if (t.Count == 0) { Forms.Error(this, Title, "Tick what you bought first."); return; }
        var summary = string.Join("\n", t.Select(r => $"  {r.Qty} x {r.Name} @ ${r.Price:0.00}"));
        if (!Forms.Confirm(this, Title, $"Add these to stock?\n\n{summary}\n\nTotal ${t.Sum(r => r.Total):0.00}")) return;
        foreach (var r in t) PartsCatalogue.RecordPurchase(r.Part, r.Qty, r.Price, r.Shop == "Other" ? "" : r.Shop);
        Changed = true;
        Load();
        _total.Text = $"Added {t.Sum(r => r.Qty)} item(s) to stock. The website's count updates on the next sync (F5).";
        _total.Foreground = Forms.Res("OkBrush");
    }
}

/// <summary>Stock bought, newest first, with a total per month.</summary>
public sealed class PurchaseHistoryWindow : Window
{
    public PurchaseHistoryWindow()
    {
        Title = "Stock Bought";
        Width = 820;
        Height = 560;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        var list = PartsCatalogue.Purchases();
        var root = new DockPanel { Margin = new Thickness(18) };
        var head = new StackPanel { Margin = new Thickness(0, 0, 0, 10) };
        head.Children.Add(Ui.Heading("Stock Bought", Ui.GMoney));
        var months = list.GroupBy(p => p.Date.Length >= 7 ? p.Date[..7] : "").Take(6)
            .Select(g => $"{(DateTime.TryParse(g.Key + "-01", out var d) ? d.ToString("MMM yyyy") : g.Key)}: ${g.Sum(p => p.Total):0.00}");
        head.Children.Add(Forms.Note(list.Count == 0 ? "Nothing bought through the suite yet." : string.Join("   ·   ", months)));
        DockPanel.SetDock(head, Dock.Top);
        root.Children.Add(head);

        var close = Forms.Btn("Close", (_, _) => Close());
        close.HorizontalAlignment = HorizontalAlignment.Right;
        close.Margin = new Thickness(0, 12, 0, 0);
        DockPanel.SetDock(close, Dock.Bottom);
        root.Children.Add(close);

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("Date", nameof(PartsCatalogue.Purchase.Date), 90));
        g.Columns.Add(Ui.Col("Shop", nameof(PartsCatalogue.Purchase.Supplier), 90));
        g.Columns.Add(Ui.Col("Part", nameof(PartsCatalogue.Purchase.PartName)));
        g.Columns.Add(Ui.Col("Qty", nameof(PartsCatalogue.Purchase.Quantity), 50));
        var each = Ui.Col("Each $", nameof(PartsCatalogue.Purchase.UnitCost), 70); ((Binding)each.Binding).StringFormat = "0.00"; g.Columns.Add(each);
        var tot = Ui.Col("Total $", nameof(PartsCatalogue.Purchase.Total), 80); ((Binding)tot.Binding).StringFormat = "0.00"; g.Columns.Add(tot);
        g.Columns.Add(new DataGridTextColumn
        {
            Header = "Website",
            Binding = new Binding(nameof(PartsCatalogue.Purchase.Sent)) { Converter = new SentText() },
            Width = new DataGridLength(90),
        });
        g.ItemsSource = list;
        root.Children.Add(Ui.GridCard(g));
        Content = root;
    }

    private sealed class SentText : IValueConverter
    {
        public object Convert(object value, Type t, object p, System.Globalization.CultureInfo c) => value is true ? "counted" : "next sync";
        public object ConvertBack(object value, Type t, object p, System.Globalization.CultureInfo c) => Binding.DoNothing;
    }
}

/// <summary>"Bought this": how many, at what price, straight into stock.</summary>
public sealed class BoughtWindow : EditorDialog
{
    private readonly Part _part;
    private readonly TextBox _qty, _price;

    public BoughtWindow(Part part, double? pagePrice) : base("Bought — " + part.Name, 460, 330)
    {
        _part = part;
        _qty = Forms.Tb(PartsCatalogue.SuggestedBuy(part).ToString());
        _price = Forms.Tb((pagePrice ?? part.Cost).ToString("0.00"));
        FormPanel.Children.Add(Forms.Note($"{part.Name} — {part.OnHand} in stock now."));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("How many", _qty), Forms.Field("Price each $", _price)));
        FormPanel.Children.Add(Forms.Note("Added to stock now, and to the website's count on the next sync. A different price becomes the part's cost."));
        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Add to Stock", (_, _) => Save(), primary: true, glyph: Ui.GCheck));
        Loaded += (_, _) => { _qty.Focus(); _qty.SelectAll(); };
    }

    private void Save()
    {
        if (!int.TryParse(_qty.Text.Trim(), out var q) || q < 1 || q > 10000) { Forms.Error(this, Title, "Enter how many you bought."); return; }
        var price = Forms.Num(_price);
        if (price < 0) { Forms.Error(this, Title, "The price can't be negative."); return; }
        PartsCatalogue.RecordPurchase(_part, q, price);
        DialogResult = true;
    }
}
