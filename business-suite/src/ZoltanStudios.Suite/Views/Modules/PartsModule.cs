using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// Van stock for on-site repairs, shared with the website through the server.
/// "stock" is the full catalogue; "restock" is just what needs buying.
/// </summary>
public sealed class PartsModule : ModuleBase
{
    private readonly string _view;
    private List<Part> _parts = new();
    private Dictionary<string, (string Sku, string Name, double Cost, double Sell, int LowAt, bool Consumable, bool Active, int OnHand)> _loaded = new();
    private readonly TextBox _search = new();
    private readonly ComboBox _filter = new();
    private DataGrid _grid = null!;

    public PartsModule(string view = "") : base(
        view == "restock" ? "Restock List" : "Parts",
        view == "restock"
            ? "Parts at or below their low level. Copy the list and take it to the trade desk."
            : "Van stock for on-site repairs. Shared with the website - stock comes off when a job is saved.")
    {
        _view = view;
        _parts = PartsCatalogue.All(includeInactive: true);
        _loaded = _parts.ToDictionary(p => p.Id, Snapshot);

        if (_view == "restock") BuildRestock();
        else BuildStock();
    }

    private static (string, string, double, double, int, bool, bool, int) Snapshot(Part p)
        => (p.Sku, p.Name, p.Cost, p.Sell, p.LowAt, p.Consumable, p.Active, p.OnHand);

    private List<Part> Low => _parts.Where(p => p.IsLow).OrderBy(p => p.OnHand).ThenBy(p => p.Name).ToList();

    // ================================================================ restock

    private void BuildRestock()
    {
        var low = Low;
        if (low.Count == 0)
        {
            Body.Children.Add(Ui.Empty("Nothing needs restocking."));
            return;
        }

        var copy = Button("Copy list", primary: true);
        copy.Click += (_, _) =>
        {
            Clipboard.SetText(PartsCatalogue.RestockText(low));
            copy.Content = "Copied";
        };
        Body.Children.Add(Bar(copy));

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("I/N", nameof(Part.Sku), 100));
        g.Columns.Add(Ui.Col("Part", nameof(Part.Name)));
        g.Columns.Add(Ui.Col("Left", nameof(Part.OnHand), 60));
        g.Columns.Add(Ui.Col("Low at", nameof(Part.LowAt), 70));
        g.ItemsSource = low;
        Body.Children.Add(Ui.GridCard(g, $"{low.Count} part(s) to reorder", Ui.GWarn));
    }

    // ================================================================== stock

    private void BuildStock()
    {
        var active = _parts.Where(p => p.Active).ToList();
        var low = Low;
        var valueCost = active.Sum(p => p.Cost * p.OnHand);
        var valueSell = active.Where(p => !p.Consumable).Sum(p => p.Sell * p.OnHand);

        var tiles = new WrapPanel { Margin = new Thickness(0, 0, 0, 16) };
        tiles.Children.Add(Ui.Tile(active.Count(p => !p.Consumable).ToString(), "Parts carried"));
        tiles.Children.Add(Ui.Tile(low.Count.ToString(), "Need restocking", low.Count > 0 ? "WarnBrush" : "HeadingText"));
        tiles.Children.Add(Ui.Tile(valueCost.ToString("$0.00"), "Stock value at cost"));
        tiles.Children.Add(Ui.Tile(valueSell.ToString("$0.00"), "Stock value at sell"));
        Body.Children.Add(tiles);

        if (low.Count > 0)
        {
            var box = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(254, 249, 231)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(253, 224, 71)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(14, 10, 14, 10),
                Margin = new Thickness(0, 0, 0, 16),
            };
            var row = new DockPanel();
            var copy = Button("Copy restock list");
            copy.Click += (_, _) => { Clipboard.SetText(PartsCatalogue.RestockText(low)); copy.Content = "Copied"; };
            DockPanel.SetDock(copy, Dock.Right);
            row.Children.Add(copy);
            row.Children.Add(new TextBlock
            {
                Text = $"{low.Count} to restock: " + string.Join(", ", low.Take(4).Select(p => p.Name))
                     + (low.Count > 4 ? $" and {low.Count - 4} more" : ""),
                Foreground = Ui.Res("WarnBrush"),
                FontWeight = FontWeights.SemiBold,
                TextWrapping = TextWrapping.Wrap,
                VerticalAlignment = VerticalAlignment.Center,
            });
            box.Child = row;
            Body.Children.Add(box);
        }

        // ---- search and filter
        _search.Width = 260;
        _search.Padding = new Thickness(6, 4, 6, 4);
        _search.ToolTip = "Search by name or Bunnings I/N";
        _search.TextChanged += (_, _) => ApplyFilter();

        foreach (var f in new[] { "All", "Running low", "Kits", "Archived" }) _filter.Items.Add(f);
        _filter.SelectedIndex = 0;
        _filter.Width = 140;
        _filter.Margin = new Thickness(8, 0, 0, 0);
        _filter.SelectionChanged += (_, _) => ApplyFilter();

        var add = Button("Add Part", primary: true);
        add.Click += (_, _) =>
        {
            PartsCatalogue.Save(new Part { Name = "New part", CatalogueDirty = true, StockDirty = true });
            Reload();
        };
        var reprice = Button("Reprice from markup");
        reprice.Click += (_, _) => Reprice();

        var bar = new DockPanel { Margin = new Thickness(0, 0, 0, 10), LastChildFill = false };
        var left = new StackPanel { Orientation = Orientation.Horizontal };
        left.Children.Add(new TextBlock { Text = "Search", Foreground = Ui.Res("MutedText"), VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 6, 0) });
        left.Children.Add(_search);
        left.Children.Add(_filter);
        var right = new StackPanel { Orientation = Orientation.Horizontal };
        right.Children.Add(reprice);
        right.Children.Add(add);
        DockPanel.SetDock(left, Dock.Left);
        DockPanel.SetDock(right, Dock.Right);
        bar.Children.Add(left);
        bar.Children.Add(right);
        Body.Children.Add(bar);

        // ---- the grid - edits save as you go and are sent on the next sync
        _grid = new DataGrid
        {
            AutoGenerateColumns = false,
            CanUserAddRows = false,
            HeadersVisibility = DataGridHeadersVisibility.Column,
            GridLinesVisibility = DataGridGridLinesVisibility.Horizontal,
            HorizontalGridLinesBrush = Ui.Res("BorderBrush"),
            BorderBrush = Ui.Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            Background = Brushes.White,
            RowBackground = Brushes.White,
            FontSize = 12,
            RowHeight = 30,
            MinHeight = 260,
        };
        _grid.Columns.Add(Text("Part", nameof(Part.Name), 0));
        _grid.Columns.Add(Text("I/N", nameof(Part.Sku), 85));
        _grid.Columns.Add(Text("Cost", nameof(Part.Cost), 70, "0.00"));
        _grid.Columns.Add(Text("Sell", nameof(Part.Sell), 70, "0.00"));
        _grid.Columns.Add(Text("In stock", nameof(Part.OnHand), 70));
        _grid.Columns.Add(Text("Low at", nameof(Part.LowAt), 65));
        _grid.Columns.Add(new DataGridCheckBoxColumn
        {
            Header = "Kit", Binding = new Binding(nameof(Part.Consumable)), Width = new DataGridLength(45),
        });
        _grid.Columns.Add(new DataGridCheckBoxColumn
        {
            Header = "Active", Binding = new Binding(nameof(Part.Active)), Width = new DataGridLength(55),
        });
        _grid.Columns.Add(new DataGridTextColumn
        {
            Header = "Status", Binding = new Binding(nameof(Part.StatusText)), Width = new DataGridLength(90), IsReadOnly = true,
        });

        _grid.CellEditEnding += (_, _) => Dispatcher.BeginInvoke(new Action(SaveEdits));
        Body.Children.Add(Ui.GridCard(_grid, "Parts catalogue", Ui.GRepair));

        Body.Children.Add(new TextBlock
        {
            Text = "Edits save as you go and go to the server on the next sync. Changing a price never changes "
                 + "the stock count - only typing a new count (a restock) does. Untick Active to archive a part "
                 + "without losing its history.",
            FontSize = 11,
            Foreground = Ui.Res("FaintText"),
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 10, 0, 0),
        });

        ApplyFilter();
    }

    private static DataGridTextColumn Text(string header, string path, double width, string? format = null)
    {
        var b = new Binding(path);
        if (format is not null) b.StringFormat = format;
        return new DataGridTextColumn
        {
            Header = header,
            Binding = b,
            Width = width > 0 ? new DataGridLength(width) : new DataGridLength(1, DataGridLengthUnitType.Star),
        };
    }

    private static Button Button(string text, bool primary = false)
    {
        var b = new Button { Content = text, Padding = new Thickness(14, 6, 14, 6), Margin = new Thickness(8, 0, 0, 0) };
        if (primary)
        {
            b.Background = Ui.Res("AccentBrush");
            b.BorderBrush = b.Background;
            b.Foreground = Brushes.White;
            b.FontWeight = FontWeights.SemiBold;
        }
        return b;
    }

    private static StackPanel Bar(params UIElement[] items)
    {
        var s = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        foreach (var i in items) s.Children.Add(i);
        return s;
    }

    private void ApplyFilter()
    {
        if (_grid is null) return;
        var q = _search.Text.Trim();
        IEnumerable<Part> list = _filter.SelectedIndex switch
        {
            1 => _parts.Where(p => p.IsLow),
            2 => _parts.Where(p => p.Active && p.Consumable),
            3 => _parts.Where(p => !p.Active),
            _ => _parts.Where(p => p.Active),
        };
        if (q.Length > 0)
            list = list.Where(p => p.Name.Contains(q, StringComparison.OrdinalIgnoreCase) || p.Sku.Contains(q));
        _grid.ItemsSource = list.ToList();
    }

    /// <summary>
    /// Flags only what actually changed, so a price edit isn't mistaken for a
    /// restock and a stale count never goes up to the server.
    /// </summary>
    private void SaveEdits()
    {
        foreach (var p in _parts)
        {
            if (!_loaded.TryGetValue(p.Id, out var was)) continue;
            var now = Snapshot(p);
            if (now == was) continue;

            p.CatalogueDirty |= was.Sku != p.Sku || was.Name != p.Name || was.Cost != p.Cost
                || was.Sell != p.Sell || was.LowAt != p.LowAt || was.Consumable != p.Consumable
                || was.Active != p.Active;
            p.StockDirty |= was.OnHand != p.OnHand;
            PartsCatalogue.Save(p);
            _loaded[p.Id] = now;
        }
        _grid.Items.Refresh();
    }

    private void Reprice()
    {
        var answer = MessageBox.Show(
            $"Set every sell price to cost plus {PartsCatalogue.Markup():0}%?\n\n"
          + "Any prices you've set by hand will be overwritten. Stock counts aren't touched.",
            "Reprice", MessageBoxButton.OKCancel, MessageBoxImage.Question);
        if (answer != MessageBoxResult.OK) return;

        foreach (var p in _parts.Where(x => !x.Consumable))
        {
            p.Sell = PartsCatalogue.SuggestedSell(p.Cost);
            p.CatalogueDirty = true;
            PartsCatalogue.Save(p);
        }
        Reload();
    }

    private void Reload()
    {
        if (Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
    }
}
