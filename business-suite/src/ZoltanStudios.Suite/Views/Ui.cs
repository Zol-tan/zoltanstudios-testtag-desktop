using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// Shared visual building blocks: cards, stat tiles, status pills, icons.
/// Pages are built in code, so keeping the look in one place is what stops
/// every screen drifting into its own style.
/// </summary>
internal static class Ui
{
    public static Brush Res(string key) => (Brush)Application.Current.Resources[key];

    public static FontFamily IconFont => (FontFamily)Application.Current.Resources["IconFont"];

    // ------------------------------------------------------------ glyphs
    // Segoe Fluent Icons / Segoe MDL2 Assets code points.
    public const string GHome = "", GBolt = "", GGlobe = "", GClock = "",
        GList = "", GPeople = "", GWork = "", GChat = "", GDoc = "",
        GCalendar = "", GCalc = "", GBox = "", GTag = "", GBook = "",
        GRepair = "", GWarn = "", GKey = "", GSettings = "", GHelp = "",
        GSchool = "", GInfo = "", GSearch = "", GSync = "", GAdd = "",
        GCheck = "", GMail = "", GMoney = "", GPrint = "", GFlag = "",
        GEdit = "", GDelete = "", GRefresh = "", GOpen = "", GSave = "",
        GFolder = "", GCopy = "", GBack = "", GForward = "", GLink = "";

    public static TextBlock Icon(string glyph, double size = 14, Brush? brush = null) => new()
    {
        Text = glyph,
        FontFamily = IconFont,
        FontSize = size,
        Foreground = brush ?? Res("MutedText"),
        VerticalAlignment = VerticalAlignment.Center,
    };

    /// <summary>A rounded square with an icon in it - the page and tile badge.</summary>
    public static Border Badge(string glyph, string brushKey = "AccentBrush", double size = 36)
    {
        var soft = brushKey switch
        {
            "OkBrush" => "OkSoft",
            "WarnBrush" => "WarnSoft",
            "BadBrush" => "BadSoft",
            "VioletBrush" => "VioletSoft",
            _ => "AccentSoft",
        };
        return new Border
        {
            Width = size,
            Height = size,
            CornerRadius = new CornerRadius(size / 3.6),
            Background = Res(soft),
            Child = new TextBlock
            {
                Text = glyph,
                FontFamily = IconFont,
                FontSize = size * 0.46,
                Foreground = Res(brushKey),
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
            },
        };
    }

    // ------------------------------------------------------------- cards

    private static Effect? _shadow;

    /// <summary>
    /// A white rounded card. The shadow sits on a separate layer behind the
    /// content, so text and grids inside aren't rendered through an effect.
    /// </summary>
    public static Grid Card(UIElement content, double padding = 18, Thickness? margin = null)
    {
        _shadow ??= new DropShadowEffect
        {
            BlurRadius = 16, ShadowDepth = 1, Direction = 270, Opacity = 0.07,
            Color = Color.FromRgb(15, 23, 42),
        };
        var g = new Grid { Margin = margin ?? new Thickness(0, 0, 0, 16) };
        g.Children.Add(new Border { Background = Brushes.White, CornerRadius = new CornerRadius(12), Effect = _shadow });
        g.Children.Add(new Border
        {
            Background = Res("CardBrush"),
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(padding),
            Child = content,
        });
        return g;
    }

    /// <summary>A card holding a list, with a title row above the grid.</summary>
    public static Grid GridCard(DataGrid grid, string? title = null, string? glyph = null, UIElement? right = null)
    {
        grid.BorderThickness = new Thickness(0);
        var dock = new DockPanel();
        if (title is not null)
        {
            var head = new DockPanel { Margin = new Thickness(14, 12, 14, 10) };
            if (right is not null) { DockPanel.SetDock(right, Dock.Right); head.Children.Add(right); }
            head.Children.Add(Heading(title, glyph, 14));
            DockPanel.SetDock(head, Dock.Top);
            dock.Children.Add(head);
        }
        dock.Children.Add(grid);
        return Card(dock, 4);
    }

    public static StackPanel Heading(string text, string? glyph = null, double size = 15)
    {
        var s = new StackPanel { Orientation = Orientation.Horizontal };
        if (glyph is not null)
        {
            var i = Icon(glyph, size, Res("AccentBrush"));
            i.Margin = new Thickness(0, 0, 8, 0);
            s.Children.Add(i);
        }
        s.Children.Add(new TextBlock
        {
            Text = text, FontSize = size, FontWeight = FontWeights.SemiBold,
            Foreground = Res("HeadingText"), VerticalAlignment = VerticalAlignment.Center,
        });
        return s;
    }

    /// <summary>A section heading between cards.</summary>
    public static FrameworkElement Section(string text, string? glyph = null)
    {
        var h = Heading(text, glyph, 15);
        h.Margin = new Thickness(2, 8, 0, 10);
        return h;
    }

    /// <summary>Stat tile: coloured icon badge, big number, label.</summary>
    public static FrameworkElement Tile(string number, string label, string brushKey = "HeadingText", string? glyph = null)
    {
        var colour = brushKey == "HeadingText" ? "AccentBrush" : brushKey;
        var row = new DockPanel();
        var badge = Badge(glyph ?? GInfo, colour, 40);
        badge.Margin = new Thickness(0, 0, 12, 0);
        DockPanel.SetDock(badge, Dock.Left);
        row.Children.Add(badge);
        var text = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
        text.Children.Add(new TextBlock
        {
            Text = number, FontSize = 24, FontWeight = FontWeights.Bold,
            Foreground = Res(brushKey == "HeadingText" ? "HeadingText" : brushKey),
        });
        text.Children.Add(new TextBlock
        {
            Text = label, FontSize = 11.5, Foreground = Res("MutedText"), TextWrapping = TextWrapping.Wrap,
        });
        row.Children.Add(text);
        var card = Card(row, 14, new Thickness(0, 0, 12, 12));
        card.MinWidth = 170;
        return card;
    }

    /// <summary>A friendly empty state.</summary>
    public static FrameworkElement Empty(string message)
    {
        var s = new StackPanel { Margin = new Thickness(0, 10, 0, 6) };
        var row = new StackPanel { Orientation = Orientation.Horizontal };
        var i = Icon(GInfo, 16, Res("FaintText"));
        i.Margin = new Thickness(0, 0, 10, 0);
        row.Children.Add(i);
        row.Children.Add(new TextBlock
        {
            Text = message, Foreground = Res("MutedText"), FontSize = 13,
            TextWrapping = TextWrapping.Wrap, MaxWidth = 760, VerticalAlignment = VerticalAlignment.Center,
        });
        s.Children.Add(row);
        return Card(s, 16);
    }

    // ------------------------------------------------------------- grids

    /// <summary>A read-only list. The look comes from the DataGrid styles in Theme.xaml.</summary>
    public static DataGrid Grid() => new()
    {
        AutoGenerateColumns = false,
        IsReadOnly = true,
        CanUserAddRows = false,
        CanUserDeleteRows = false,
        MinHeight = 120,
        SelectionMode = DataGridSelectionMode.Single,
    };

    public static DataGridTextColumn Col(string header, string path, double width = 0)
    {
        var c = new DataGridTextColumn
        {
            Header = header,
            Binding = new Binding(path),
        };
        c.Width = width > 0
            ? new DataGridLength(width)
            : new DataGridLength(1, DataGridLengthUnitType.Star);
        return c;
    }

    /// <summary>A column that shows its value as a coloured pill (pass, paid, overdue...).</summary>
    public static DataGridTemplateColumn StatusCol(string header, string path, double width = 100)
    {
        var border = new FrameworkElementFactory(typeof(Border));
        border.SetValue(Border.CornerRadiusProperty, new CornerRadius(9));
        border.SetValue(Border.PaddingProperty, new Thickness(8, 1, 8, 2));
        border.SetValue(FrameworkElement.HorizontalAlignmentProperty, HorizontalAlignment.Left);
        border.SetBinding(Border.BackgroundProperty, new Binding(path) { Converter = StatusColour.Soft });
        var text = new FrameworkElementFactory(typeof(TextBlock));
        text.SetBinding(TextBlock.TextProperty, new Binding(path) { Converter = StatusColour.Label });
        text.SetBinding(TextBlock.ForegroundProperty, new Binding(path) { Converter = StatusColour.Strong });
        text.SetValue(TextBlock.FontSizeProperty, 11.5);
        text.SetValue(TextBlock.FontWeightProperty, FontWeights.SemiBold);
        border.AppendChild(text);

        return new DataGridTemplateColumn
        {
            Header = header,
            Width = width > 0 ? new DataGridLength(width) : new DataGridLength(1, DataGridLengthUnitType.Star),
            CellTemplate = new DataTemplate { VisualTree = border },
            SortMemberPath = path,
        };
    }

    /// <summary>A pill on its own (outside grids).</summary>
    public static Border Pill(string status) => new()
    {
        CornerRadius = new CornerRadius(9),
        Padding = new Thickness(8, 1, 8, 2),
        Background = (Brush)StatusColour.Soft.Convert(status, typeof(Brush), null!, CultureInfo.CurrentCulture),
        HorizontalAlignment = HorizontalAlignment.Left,
        VerticalAlignment = VerticalAlignment.Center,
        Child = new TextBlock
        {
            Text = (string)StatusColour.Label.Convert(status, typeof(string), null!, CultureInfo.CurrentCulture),
            FontSize = 11.5, FontWeight = FontWeights.SemiBold,
            Foreground = (Brush)StatusColour.Strong.Convert(status, typeof(Brush), null!, CultureInfo.CurrentCulture),
        },
    };

    /// <summary>Reads a property from a list row (rows are often anonymous types).</summary>
    public static object? Prop(object? row, string name) => row?.GetType().GetProperty(name)?.GetValue(row);

    /// <summary>A toolbar of buttons with room between them.</summary>
    public static WrapPanel Toolbar(params UIElement[] items)
    {
        var w = new WrapPanel { Margin = new Thickness(0, 0, 0, 14) };
        foreach (var i in items) w.Children.Add(i);
        return w;
    }
}

/// <summary>Maps a status word to its colour: green = good, amber = needs attention, red = bad.</summary>
public sealed class StatusColour : IValueConverter
{
    private enum Part { Soft, Strong, Label }
    private readonly Part _part;
    private StatusColour(Part p) => _part = p;

    public static readonly StatusColour Soft = new(Part.Soft);
    public static readonly StatusColour Strong = new(Part.Strong);
    public static readonly StatusColour Label = new(Part.Label);

    public static string Tone(string s) => s.Trim().ToLowerInvariant() switch
    {
        "pass" or "paid" or "confirmed" or "accepted" or "completed" or "final" or "active" or "ok" or "in stock" => "Ok",
        "fail" or "failed" or "overdue" or "declined" or "cancelled" or "closed" or "out" or "revoked" => "Bad",
        "pending" or "due" or "partial" or "sent" or "review" or "retest" or "low" or "● new" or "new" or "due soon" => "Warn",
        "in progress" or "queued" or "deadline" or "open" or "booking" => "Accent",
        _ => "Neutral",
    };

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var s = value?.ToString() ?? "";
        if (_part == Part.Label) return s.Length == 0 ? "—" : char.ToUpper(s[0]) + s[1..];
        var tone = Tone(s);
        var key = (tone, _part) switch
        {
            ("Ok", Part.Soft) => "OkSoft", ("Ok", _) => "OkBrush",
            ("Bad", Part.Soft) => "BadSoft", ("Bad", _) => "BadBrush",
            ("Warn", Part.Soft) => "WarnSoft", ("Warn", _) => "WarnBrush",
            ("Accent", Part.Soft) => "AccentSoft", ("Accent", _) => "AccentBrush",
            (_, Part.Soft) => "RowHover", _ => "MutedText",
        };
        return Application.Current.Resources[key];
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
