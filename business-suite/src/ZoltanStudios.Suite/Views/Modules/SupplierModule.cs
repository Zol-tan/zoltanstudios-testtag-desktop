using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// Search Bunnings, Jaycar and Altronics inside the suite, add what you find
/// as a part (name, item number, price and link filled in from the page), and
/// re-check the prices of every part you carry.
///
/// The shops are opened as normal web pages in Edge's engine; the product
/// details come from the data each page publishes for search engines.
/// </summary>
public sealed class SupplierModule : UserControl
{
    private readonly WebView2 _web = new();
    private readonly Grid _webHost = new();
    private readonly TextBox _query = new() { Width = 300, FontSize = 13.5 };
    private readonly ComboBox _shop = Forms.Combo(Suppliers.Shops.Select(s => s.Name));
    private readonly StackPanel _side = new();
    private readonly StackPanel _pageCard = new();
    private readonly StackPanel _checkCard = new();
    private readonly TextBlock _status = new() { FontSize = 11.5, Margin = new Thickness(10, 0, 0, 0), VerticalAlignment = VerticalAlignment.Center };
    private ProductInfo? _current;
    private bool _ready, _checking, _stop;
    private TaskCompletionSource<bool>? _nav;

    public SupplierModule()
    {
        var root = new DockPanel();

        // ---- top bar
        var bar = new DockPanel { LastChildFill = false };
        var left = new StackPanel { Orientation = Orientation.Horizontal };
        var badge = Ui.Badge("", "OkBrush", 30);
        badge.Margin = new Thickness(0, 0, 10, 0);
        left.Children.Add(badge);
        left.Children.Add(new TextBlock { Text = "Find Parts", FontSize = 15, FontWeight = FontWeights.SemiBold, Foreground = Ui.Res("HeadingText"), VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 16, 0) });
        _shop.Margin = new Thickness(0, 0, 8, 0);
        _shop.MinWidth = 120;
        left.Children.Add(_shop);
        _query.Margin = new Thickness(0, 0, 8, 0);
        _query.KeyDown += (_, e) => { if (e.Key == Key.Enter) Search(); };
        left.Children.Add(_query);
        left.Children.Add(Forms.Btn("Search", (_, _) => Search(), primary: true, glyph: Ui.GSearch));
        left.Children.Add(Forms.Btn("Back", (_, _) => { if (_web.CoreWebView2?.CanGoBack == true) _web.CoreWebView2.GoBack(); }, glyph: Ui.GBack));
        left.Children.Add(_status);
        bar.Children.Add(left);
        var barBorder = new Border
        {
            Background = Ui.Res("ChromeBrush"), BorderBrush = Ui.Res("BorderBrush"),
            BorderThickness = new Thickness(0, 0, 0, 1), Padding = new Thickness(16, 10, 16, 10), Child = bar,
        };
        DockPanel.SetDock(barBorder, Dock.Top);
        root.Children.Add(barBorder);

        // ---- side panel
        _side.Margin = new Thickness(14);
        _side.Children.Add(_pageCard);
        _side.Children.Add(_checkCard);
        var sideScroll = new ScrollViewer
        {
            Width = 340, VerticalScrollBarVisibility = ScrollBarVisibility.Auto, Content = _side,
            Background = Ui.Res("AppBackground"),
        };
        DockPanel.SetDock(sideScroll, Dock.Right);
        root.Children.Add(sideScroll);

        _webHost.Children.Add(_web);
        root.Children.Add(_webHost);
        Content = root;

        ShowPage(null);
        ShowCheckIntro();

        Loaded += async (_, _) => { if (!_ready) await StartAsync(); };
    }

    private void SetStatus(string text, string brush = "MutedText")
    {
        _status.Text = text;
        _status.Foreground = Ui.Res(brush);
    }

    private async Task StartAsync()
    {
        _ready = true;
        try
        {
            var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ZoltanStudios", "WebView2-Shops");
            Directory.CreateDirectory(dir);
            var env = await CoreWebView2Environment.CreateAsync(null, dir);
            await _web.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            _webHost.Children.Clear();
            _webHost.Children.Add(new StackPanel
            {
                Margin = new Thickness(30),
                Children =
                {
                    Ui.Empty("The built-in browser couldn't start (" + ex.Message + "). Microsoft Edge WebView2 is needed — it comes with Windows 10 and 11."),
                },
            });
            return;
        }

        _web.CoreWebView2.NavigationStarting += (_, _) => SetStatus("Loading…");
        _web.CoreWebView2.NavigationCompleted += async (_, e) =>
        {
            _nav?.TrySetResult(e.IsSuccess);
            SetStatus(e.IsSuccess ? "" : "The page didn't load (" + e.WebErrorStatus + ").", e.IsSuccess ? "MutedText" : "BadBrush");
            if (!_checking) await ReadPageAsync();
        };
        // Links that open a new window stay in this browser.
        _web.CoreWebView2.NewWindowRequested += (_, e) => { e.Handled = true; _web.CoreWebView2.Navigate(e.Uri); };

        if (_pendingUrl is not null) { _web.CoreWebView2.Navigate(_pendingUrl); _pendingUrl = null; }
        else _web.CoreWebView2.Navigate(Suppliers.Shops[0].Home);
    }

    private string? _pendingUrl;

    /// <summary>Opens a search (or a product link) - used by the Parts page.</summary>
    public void Open(string shop, string query, string? url = null)
    {
        var i = Array.FindIndex(Suppliers.Shops, s => s.Name.Equals(shop, StringComparison.OrdinalIgnoreCase));
        if (i >= 0) _shop.SelectedIndex = i;
        _query.Text = query;
        var target = !string.IsNullOrWhiteSpace(url) ? url! : Suppliers.SearchUrl(_shop.SelectedItem as string ?? "Bunnings", query);
        if (_web.CoreWebView2 is null) _pendingUrl = target;
        else _web.CoreWebView2.Navigate(target);
    }

    private void Search()
    {
        var q = _query.Text.Trim();
        if (q.Length == 0 || _web.CoreWebView2 is null) return;
        _web.CoreWebView2.Navigate(Suppliers.SearchUrl(_shop.SelectedItem as string ?? "Bunnings", q));
    }

    // ------------------------------------------------------------ this page

    private async Task<ProductInfo?> ExtractAsync()
    {
        if (_web.CoreWebView2 is null) return null;
        try
        {
            var raw = await _web.CoreWebView2.ExecuteScriptAsync(Suppliers.ExtractScript);
            return Suppliers.Parse(raw, _web.CoreWebView2.Source);
        }
        catch { return null; }
    }

    private async Task ReadPageAsync()
    {
        // Shops fill in their data after load; give them a moment.
        await Task.Delay(900);
        _current = await ExtractAsync();
        ShowPage(_current);
    }

    private void ShowPage(ProductInfo? p)
    {
        _pageCard.Children.Clear();
        var s = new StackPanel();
        s.Children.Add(Ui.Heading("This page", Ui.GInfo, 14));
        s.Children.Add(new Border { Height = 10 });

        if (p is null || !p.IsProduct)
        {
            s.Children.Add(Forms.Note("Search above, then open a product. Its name, item number and price appear here, ready to add to your parts."));
            _pageCard.Children.Add(Ui.Card(s, 16, new Thickness(0, 0, 0, 12)));
            return;
        }

        s.Children.Add(new TextBlock { Text = p.Name, FontSize = 14, FontWeight = FontWeights.SemiBold, Foreground = Ui.Res("HeadingText"), TextWrapping = TextWrapping.Wrap });
        s.Children.Add(Forms.Note($"{(p.Supplier.Length > 0 ? p.Supplier : "Shop")} · item {(p.Sku.Length > 0 ? p.Sku : "—")}"));
        s.Children.Add(new TextBlock
        {
            Text = p.Price is { } pr ? $"${pr:0.00}" + (p.PriceGuessed ? "  (read from the page — check it)" : "") : "Price not shown",
            FontSize = 20, FontWeight = FontWeights.Bold,
            Foreground = Ui.Res(p.PriceGuessed || p.Price is null ? "WarnBrush" : "OkBrush"), Margin = new Thickness(0, 4, 0, 10),
            TextWrapping = TextWrapping.Wrap,
        });

        var existing = PartsCatalogue.All(includeInactive: true).FirstOrDefault(x =>
            (p.Sku.Length > 0 && string.Equals(x.Sku, p.Sku, StringComparison.OrdinalIgnoreCase))
            || (x.Url.Length > 0 && string.Equals(x.Url, p.Url, StringComparison.OrdinalIgnoreCase)));
        if (existing is not null)
        {
            s.Children.Add(Forms.Note($"You carry this: {existing.Name} — cost ${existing.Cost:0.00}, {existing.OnHand} in stock.",
                p.Price is { } np && Math.Abs(np - existing.Cost) > 0.004 ? "WarnBrush" : "OkBrush"));
            s.Children.Add(Forms.Btn("Bought This — Add to Stock…", (_, _) =>
            {
                if (new BoughtWindow(existing, p.PriceGuessed ? null : p.Price) { Owner = Window.GetWindow(this) }.ShowDialog() == true)
                {
                    ShowPage(p);
                    SetStatus("Added to stock. The website's count updates on the next sync.", "OkBrush");
                }
            }, primary: true, glyph: Ui.GCheck));
            s.Children.Add(new Border { Height = 8 });
            s.Children.Add(Forms.Btn("Update My Part From This Page", (_, _) => UpdatePart(existing, p), glyph: Ui.GRefresh));
        }
        else
        {
            s.Children.Add(Forms.Btn("Add as a New Part…", (_, _) => AddPart(p), primary: true, glyph: Ui.GAdd));
            s.Children.Add(new Border { Height = 8 });
            s.Children.Add(Forms.Btn("Link to an Existing Part…", (_, _) => LinkPart(p), glyph: Ui.GLink));
        }
        _pageCard.Children.Add(Ui.Card(s, 16, new Thickness(0, 0, 0, 12)));
    }

    private void AddPart(ProductInfo p)
    {
        var part = new Part
        {
            Name = p.Name,
            Sku = p.Sku,
            Supplier = p.Supplier,
            Url = p.Url,
            Cost = p.Price ?? 0,
            Sell = PartsCatalogue.SuggestedSell(p.Price ?? 0),
            OnHand = 0,
            LowAt = 1,
        };
        if (new PartEditorWindow(part, isNew: true) { Owner = Window.GetWindow(this) }.ShowDialog() == true)
            ShowPage(p);
    }

    private void UpdatePart(Part part, ProductInfo p)
    {
        var msg = $"Update \"{part.Name}\" from this page?\n\n" +
                  (p.Price is { } np ? $"Cost: ${part.Cost:0.00} → ${np:0.00}\n" : "") +
                  $"Link: {p.Url}";
        if (MessageBox.Show(Window.GetWindow(this), msg, "Update part", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes) return;
        if (p.Price is { } price) part.Cost = price;
        part.Url = p.Url;
        if (p.Supplier.Length > 0) part.Supplier = p.Supplier;
        if (part.Sku.Length == 0) part.Sku = p.Sku;
        part.CatalogueDirty = true;
        PartsCatalogue.Save(part);
        ShowPage(p);
        SetStatus("Part updated — sell price unchanged (use Reprice on the Parts page to apply your markup).", "OkBrush");
    }

    private void LinkPart(ProductInfo p)
    {
        var parts = PartsCatalogue.All().OrderBy(x => x.Name).ToList();
        var pick = new PartPickerWindow(parts, "Which part is this?") { Owner = Window.GetWindow(this) };
        if (pick.ShowDialog() == true && pick.Picked is { } part) UpdatePart(part, p);
    }

    // ------------------------------------------------------------ price check

    private sealed class CheckRow
    {
        public Part Part { get; init; } = null!;
        public string Name => Part.Name;
        public string Old => $"${Part.Cost:0.00}";
        public double? NewPrice { get; set; }
        public string New => NewPrice is { } n ? $"${n:0.00}" : "—";
        public string ProductUrl { get; set; } = "";
        public string Note { get; set; } = "";
        public bool Apply { get; set; }
        public string Change => NewPrice is { } n ? (Math.Abs(n - Part.Cost) < 0.005 ? "same" : n > Part.Cost ? $"+${n - Part.Cost:0.00}" : $"−${Part.Cost - n:0.00}") : Note;
    }

    private void ShowCheckIntro()
    {
        _checkCard.Children.Clear();
        var s = new StackPanel();
        s.Children.Add(Ui.Heading("Check my prices", Ui.GRefresh, 14));
        s.Children.Add(new Border { Height = 8 });
        var withLinks = PartsCatalogue.All().Count(p => p.Url.Length > 0 || (p.SupplierOrGuess.Length > 0 && p.Sku.Length > 0));
        s.Children.Add(Forms.Note($"Visits the product page of each of your {withLinks} part(s) with a shop link or item number and compares today's price with your cost. Nothing changes until you choose."));
        s.Children.Add(Forms.Btn("Check Prices Now", async (_, _) => await CheckPricesAsync(), primary: true, glyph: Ui.GRefresh));
        _checkCard.Children.Add(Ui.Card(s, 16));
    }

    private async Task<bool> GoAsync(string url, int timeoutMs = 25000)
    {
        _nav = new TaskCompletionSource<bool>();
        _web.CoreWebView2.Navigate(url);
        var done = await Task.WhenAny(_nav.Task, Task.Delay(timeoutMs));
        return done == _nav.Task && _nav.Task.Result;
    }

    private async Task CheckPricesAsync()
    {
        if (_web.CoreWebView2 is null || _checking) return;
        var parts = PartsCatalogue.All().Where(p => p.Url.Length > 0 || (p.SupplierOrGuess.Length > 0 && p.Sku.Length > 0)).ToList();
        if (parts.Count == 0) { SetStatus("No parts have a shop link or item number yet.", "WarnBrush"); return; }

        _checking = true;
        _stop = false;
        var rows = new List<CheckRow>();
        _checkCard.Children.Clear();
        var progress = new TextBlock { Foreground = Ui.Res("MutedText"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 8) };
        var s0 = new StackPanel();
        s0.Children.Add(Ui.Heading("Checking prices…", Ui.GRefresh, 14));
        s0.Children.Add(progress);
        s0.Children.Add(Forms.Btn("Stop", (_, _) => _stop = true, glyph: ""));
        _checkCard.Children.Add(Ui.Card(s0, 16));

        try
        {
            for (var i = 0; i < parts.Count && !_stop; i++)
            {
                var p = parts[i];
                progress.Text = $"{i + 1} of {parts.Count}: {p.Name}";
                var row = new CheckRow { Part = p };
                var url = p.Url.Length > 0 ? p.Url : Suppliers.SearchUrl(p.SupplierOrGuess, p.Sku);

                if (!await GoAsync(url)) { row.Note = "page didn't load"; rows.Add(row); continue; }
                await Task.Delay(1500);
                var info = await ExtractAsync();

                // A search page: follow the result with this item number.
                if ((info is null || !info.IsProduct) && p.Sku.Length > 0)
                {
                    var link = await _web.CoreWebView2.ExecuteScriptAsync(Suppliers.FindProductLinkScript(p.Sku));
                    var href = System.Text.Json.JsonSerializer.Deserialize<string>(link) ?? "";
                    if (href.Length > 0 && await GoAsync(href))
                    {
                        await Task.Delay(1500);
                        info = await ExtractAsync();
                    }
                }

                if (info is { IsProduct: true, Price: { } price } && !info.PriceGuessed)
                {
                    row.NewPrice = price;
                    row.ProductUrl = info.Url;
                    row.Apply = Math.Abs(price - p.Cost) >= 0.005;
                }
                else row.Note = info is { IsProduct: true } ? "price not found" : "product not found";
                rows.Add(row);
            }
        }
        finally { _checking = false; }

        ShowCheckResults(rows);
    }

    private void ShowCheckResults(List<CheckRow> rows)
    {
        _checkCard.Children.Clear();
        var s = new StackPanel();
        var changed = rows.Count(r => r.NewPrice is { } n && Math.Abs(n - r.Part.Cost) >= 0.005);
        s.Children.Add(Ui.Heading($"{changed} price change(s)", Ui.GRefresh, 14));
        s.Children.Add(Forms.Note($"{rows.Count} checked. Ticked rows will have their cost updated (and their link saved)."));

        var g = new DataGrid
        {
            AutoGenerateColumns = false, CanUserAddRows = false, ItemsSource = rows, MinHeight = 120, MaxHeight = 420,
            HeadersVisibility = DataGridHeadersVisibility.Column,
        };
        g.Columns.Add(new DataGridCheckBoxColumn { Header = "", Binding = new System.Windows.Data.Binding(nameof(CheckRow.Apply)), Width = new DataGridLength(30) });
        g.Columns.Add(new DataGridTextColumn { Header = "Part", Binding = new System.Windows.Data.Binding(nameof(CheckRow.Name)), Width = new DataGridLength(1, DataGridLengthUnitType.Star), IsReadOnly = true });
        g.Columns.Add(new DataGridTextColumn { Header = "Was", Binding = new System.Windows.Data.Binding(nameof(CheckRow.Old)), Width = new DataGridLength(55), IsReadOnly = true });
        g.Columns.Add(new DataGridTextColumn { Header = "Now", Binding = new System.Windows.Data.Binding(nameof(CheckRow.Change)), Width = new DataGridLength(70), IsReadOnly = true });
        s.Children.Add(g);

        var reprice = new CheckBox { Content = $"Also set sell prices from my markup ({PartsCatalogue.Markup():0}%)", Margin = new Thickness(0, 10, 0, 8) };
        s.Children.Add(reprice);
        s.Children.Add(Forms.Btn("Apply Ticked", (_, _) =>
        {
            g.CommitEdit(DataGridEditingUnit.Row, true);
            var n = 0;
            foreach (var r in rows.Where(r => r.Apply && r.NewPrice is not null))
            {
                r.Part.Cost = r.NewPrice!.Value;
                if (r.ProductUrl.Length > 0) r.Part.Url = r.ProductUrl;
                if (r.Part.Supplier.Length == 0) r.Part.Supplier = Suppliers.ShopFor(r.ProductUrl);
                if (reprice.IsChecked == true && !r.Part.Consumable) r.Part.Sell = PartsCatalogue.SuggestedSell(r.Part.Cost);
                r.Part.CatalogueDirty = true;
                PartsCatalogue.Save(r.Part);
                n++;
            }
            SetStatus($"{n} part(s) updated. They go to the website on the next sync.", "OkBrush");
            ShowCheckIntro();
        }, primary: true, glyph: Ui.GCheck));
        s.Children.Add(new Border { Height = 6 });
        s.Children.Add(Forms.Btn("Done", (_, _) => ShowCheckIntro()));
        _checkCard.Children.Add(Ui.Card(s, 16));
    }
}

/// <summary>Choose one of your parts.</summary>
public sealed class PartPickerWindow : EditorDialog
{
    private readonly ListBox _list = new() { MinHeight = 320 };
    private readonly TextBox _search = Forms.Tb();
    private readonly List<Part> _parts;
    public Part? Picked { get; private set; }

    public PartPickerWindow(List<Part> parts, string title) : base(title, 520, 560)
    {
        _parts = parts;
        FormPanel.Children.Add(Forms.Field("Search", _search));
        FormPanel.Children.Add(_list);
        _search.TextChanged += (_, _) => Fill();
        _list.MouseDoubleClick += (_, _) => Done();
        Fill();
        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Choose", (_, _) => Done(), primary: true));
    }

    private void Fill()
    {
        _list.Items.Clear();
        var q = _search.Text.Trim();
        foreach (var p in _parts.Where(p => q.Length == 0 || p.Name.Contains(q, StringComparison.OrdinalIgnoreCase) || p.Sku.Contains(q, StringComparison.OrdinalIgnoreCase)))
            _list.Items.Add(new ListBoxItem { Tag = p, Padding = new Thickness(8, 6, 8, 6), Content = $"{p.Name}   ·   {(p.Sku.Length > 0 ? p.Sku : "no item no.")}   ·   ${p.Cost:0.00}" });
    }

    private void Done()
    {
        if (_list.SelectedItem is not ListBoxItem { Tag: Part p }) return;
        Picked = p;
        DialogResult = true;
    }
}

/// <summary>Add or edit one part, with where it's bought.</summary>
public sealed class PartEditorWindow : EditorDialog
{
    private readonly Part _p;
    private readonly bool _isNew;
    private readonly int _loadedOnHand;
    private readonly TextBox _name, _sku, _url, _cost, _sell, _onHand, _lowAt;
    private readonly ComboBox _supplier;
    private readonly CheckBox _kit, _active;

    public PartEditorWindow(Part p, bool isNew = false) : base(isNew ? "New Part" : "Part — " + p.Name, 600, 560)
    {
        _p = p;
        _isNew = isNew;
        _loadedOnHand = p.OnHand;
        _name = Forms.Tb(p.Name);
        _sku = Forms.Tb(p.Sku);
        _url = Forms.Tb(p.Url);
        _cost = Forms.Tb(p.Cost.ToString("0.00"));
        _sell = Forms.Tb(p.Sell.ToString("0.00"));
        _onHand = Forms.Tb(p.OnHand.ToString());
        _lowAt = Forms.Tb(p.LowAt.ToString());
        _supplier = Forms.Combo(Suppliers.Names, p.SupplierOrGuess.Length > 0 ? p.SupplierOrGuess : "Other");
        _supplier.IsEditable = true;
        _supplier.Text = p.SupplierOrGuess;
        _kit = new CheckBox { Content = "Kit / consumable (tracked for restock, never billed per fit)", IsChecked = p.Consumable, Margin = new Thickness(0, 4, 0, 6) };
        _active = new CheckBox { Content = "Active (untick to archive)", IsChecked = p.Active, Margin = new Thickness(0, 0, 0, 10) };

        FormPanel.Children.Add(Forms.Field("Part name", _name));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Supplier", _supplier), Forms.Field("Supplier item no. (Bunnings I/N, Jaycar cat. no.)", _sku)));
        FormPanel.Children.Add(Forms.Field("Product page link", _url));
        FormPanel.Children.Add(Forms.Grid(4, Forms.Field("Cost ($)", _cost), Forms.Field("Sell, fitted ($)", _sell),
            Forms.Field("In stock", _onHand), Forms.Field("Warn at", _lowAt)));
        FormPanel.Children.Add(Forms.Btn($"Sell = cost + {PartsCatalogue.Markup():0}% markup", (_, _) => _sell.Text = PartsCatalogue.SuggestedSell(Forms.Num(_cost)).ToString("0.00"), glyph: Ui.GCalc));
        FormPanel.Children.Add(new Border { Height = 8 });
        FormPanel.Children.Add(_kit);
        FormPanel.Children.Add(_active);

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", (_, _) => Save(), primary: true, glyph: Ui.GSave));
    }

    private void Save()
    {
        if (_name.Text.Trim().Length == 0) { Forms.Error(this, Title, "Give the part a name."); return; }
        var url = _url.Text.Trim();
        if (url.Length > 0 && !(url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
        { Forms.Error(this, Title, "The product link must start with https://"); return; }
        if (!int.TryParse(_onHand.Text.Trim(), out var onHand) || onHand < 0 || !int.TryParse(_lowAt.Text.Trim(), out var lowAt) || lowAt < 0)
        { Forms.Error(this, Title, "Stock and warn-at must be whole numbers, 0 or more."); return; }

        _p.Name = _name.Text.Trim();
        _p.Sku = _sku.Text.Trim();
        _p.Supplier = (_supplier.Text ?? "").Trim() == "Other" ? "" : (_supplier.Text ?? "").Trim();
        _p.Url = url;
        _p.Cost = Math.Max(0, Forms.Num(_cost));
        _p.Sell = Math.Max(0, Forms.Num(_sell));
        _p.OnHand = onHand;
        _p.LowAt = lowAt;
        _p.Consumable = _kit.IsChecked == true;
        _p.Active = _active.IsChecked == true;
        _p.CatalogueDirty = true;
        // Only a changed count (a stocktake or restock) is sent as stock.
        if (_isNew || onHand != _loadedOnHand) _p.StockDirty = true;
        PartsCatalogue.Save(_p);
        DialogResult = true;
    }
}
