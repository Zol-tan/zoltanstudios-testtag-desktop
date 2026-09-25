using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>Shared building blocks for the editor dialogs, so they all look alike.</summary>
internal static class Forms
{
    public static Brush Res(string key) => (Brush)Application.Current.Resources[key];

    public static TextBox Tb(string text = "", bool multiline = false) => new()
    {
        Text = text,
        Padding = new Thickness(6, 4, 6, 4),
        Margin = new Thickness(0, 0, 0, 10),
        AcceptsReturn = multiline,
        TextWrapping = multiline ? TextWrapping.Wrap : TextWrapping.NoWrap,
        MinHeight = multiline ? 90 : 0,
        VerticalScrollBarVisibility = multiline ? ScrollBarVisibility.Auto : ScrollBarVisibility.Disabled,
    };

    public static ComboBox Combo(IEnumerable<string> items, string? selected = null)
    {
        var c = new ComboBox { Padding = new Thickness(6, 4, 6, 4), Margin = new Thickness(0, 0, 0, 10) };
        foreach (var i in items) c.Items.Add(i);
        var idx = selected is null ? 0 : c.Items.IndexOf(selected);
        c.SelectedIndex = idx >= 0 ? idx : (c.Items.Count > 0 ? 0 : -1);
        return c;
    }

    public static Button Btn(string text, RoutedEventHandler click, bool primary = false, bool danger = false)
    {
        var b = new Button
        {
            Content = text,
            Padding = new Thickness(13, 6, 13, 6),
            Margin = new Thickness(0, 0, 8, 0),
            MinWidth = 80,
        };
        if (primary || danger)
        {
            b.Background = Res(danger ? "BadBrush" : "AccentBrush");
            b.Foreground = Brushes.White;
            b.FontWeight = FontWeights.SemiBold;
        }
        b.Click += click;
        return b;
    }

    /// <summary>A labelled field stacked vertically.</summary>
    public static StackPanel Field(string label, FrameworkElement input)
    {
        var s = new StackPanel();
        s.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = 11,
            Foreground = Res("MutedText"),
            Margin = new Thickness(0, 0, 0, 3),
        });
        s.Children.Add(input);
        return s;
    }

    /// <summary>Places fields into a grid with a fixed number of columns.</summary>
    public static Grid Grid(int columns, params FrameworkElement[] cells)
    {
        var g = new Grid();
        for (var i = 0; i < columns; i++)
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        var rows = (cells.Length + columns - 1) / columns;
        for (var i = 0; i < rows; i++) g.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        for (var i = 0; i < cells.Length; i++)
        {
            var cell = cells[i];
            cell.Margin = new Thickness(0, 0, i % columns == columns - 1 ? 0 : 12, 0);
            System.Windows.Controls.Grid.SetRow(cell, i / columns);
            System.Windows.Controls.Grid.SetColumn(cell, i % columns);
            g.Children.Add(cell);
        }
        return g;
    }

    public static TextBlock Note(string text, string brush = "MutedText") => new()
    {
        Text = text,
        FontSize = 11,
        Foreground = Res(brush),
        TextWrapping = TextWrapping.Wrap,
        Margin = new Thickness(0, 4, 0, 8),
    };

    public static void Error(Window? owner, string title, string message)
    {
        if (owner is not null)
            MessageBox.Show(owner, message, title, MessageBoxButton.OK, MessageBoxImage.Warning);
        else
            MessageBox.Show(message, title, MessageBoxButton.OK, MessageBoxImage.Warning);
    }

    public static bool Confirm(Window? owner, string title, string message)
    {
        var r = owner is not null
            ? MessageBox.Show(owner, message, title, MessageBoxButton.YesNo, MessageBoxImage.Question)
            : MessageBox.Show(message, title, MessageBoxButton.YesNo, MessageBoxImage.Question);
        return r == MessageBoxResult.Yes;
    }

    public static double Num(TextBox t)
        => double.TryParse(t.Text.Trim(), System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.CurrentCulture, out var d) ? d
         : double.TryParse(t.Text.Trim(), System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture, out d) ? d : 0;
}

/// <summary>
/// Base for a modal editor: a scrollable form above a right-aligned button bar.
/// </summary>
public abstract class EditorDialog : Window
{
    protected readonly StackPanel FormPanel = new();
    protected readonly StackPanel ButtonBar = new()
    {
        Orientation = Orientation.Horizontal,
        HorizontalAlignment = HorizontalAlignment.Right,
        Margin = new Thickness(0, 12, 0, 0),
    };

    protected EditorDialog(string title, double width = 620, double height = 560)
    {
        Title = title;
        Width = width;
        Height = height;
        MinWidth = 420;
        MinHeight = 300;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        var root = new DockPanel { Margin = new Thickness(18) };
        DockPanel.SetDock(ButtonBar, Dock.Bottom);
        root.Children.Add(ButtonBar);
        root.Children.Add(new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = FormPanel,
        });
        Content = root;
    }

    /// <summary>Disables the buttons while a call is in flight so nothing is sent twice.</summary>
    protected async Task<ApiResult> Busy(Func<Task<ApiResult>> call)
    {
        ButtonBar.IsEnabled = false;
        Cursor = System.Windows.Input.Cursors.Wait;
        try { return await call(); }
        finally
        {
            ButtonBar.IsEnabled = true;
            Cursor = null;
        }
    }
}
