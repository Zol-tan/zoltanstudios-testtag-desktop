using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// Shared scaffolding for a page: an icon, a title, a subtitle, and a body.
/// Modules are plain UserControls so each can be built out independently
/// without the shell needing to change.
/// </summary>
public abstract class ModuleBase : UserControl
{
    /// <summary>Page icons, by page title. Pages not listed get a generic one.</summary>
    private static readonly Dictionary<string, (string Glyph, string Brush)> Icons = new()
    {
        ["Dashboard"] = (Ui.GHome, "AccentBrush"),
        ["Test & Tag"] = (Ui.GBolt, "AccentBrush"),
        ["Test & Tag App"] = (Ui.GGlobe, "AccentBrush"),
        ["Retest Due"] = (Ui.GClock, "WarnBrush"),
        ["Generator Reports"] = (Ui.GBolt, "VioletBrush"),
        ["Asset Register"] = (Ui.GList, "AccentBrush"),
        ["Clients"] = (Ui.GPeople, "AccentBrush"),
        ["Projects"] = (Ui.GWork, "VioletBrush"),
        ["Messages"] = (Ui.GChat, "AccentBrush"),
        ["Quotes"] = (Ui.GDoc, "VioletBrush"),
        ["Invoices"] = (Ui.GMoney, "OkBrush"),
        ["Unpaid Invoices"] = (Ui.GMoney, "WarnBrush"),
        ["Calendar"] = (Ui.GCalendar, "AccentBrush"),
        ["Booking Requests"] = (Ui.GCalendar, "WarnBrush"),
        ["Quote Calculator"] = (Ui.GCalc, "AccentBrush"),
        ["3D Printing Quote"] = (Ui.GBox, "VioletBrush"),
        ["Pricing"] = (Ui.GTag, "OkBrush"),
        ["Appliance Library"] = (Ui.GBook, "AccentBrush"),
        ["Parts"] = (Ui.GRepair, "AccentBrush"),
        ["Restock List"] = (Ui.GWarn, "WarnBrush"),
        ["Filament"] = (Ui.GBox, "VioletBrush"),
        ["API Tokens"] = (Ui.GKey, "AccentBrush"),
        ["Settings"] = (Ui.GSettings, "MutedText"),
        ["Find"] = (Ui.GSearch, "AccentBrush"),
        ["AS/NZS 3760 Reference"] = (Ui.GSchool, "AccentBrush"),
        ["Wavecom TnT Guide"] = (Ui.GHelp, "AccentBrush"),
    };

    protected ModuleBase(string title, string subtitle)
    {
        var panel = new StackPanel { Margin = new Thickness(30, 24, 30, 30), MaxWidth = 1500 };

        var header = new DockPanel { Margin = new Thickness(0, 0, 0, 20) };
        var (glyph, brush) = Icons.TryGetValue(title, out var ic) ? ic : (Ui.GInfo, "AccentBrush");
        var badge = Ui.Badge(glyph, brush == "MutedText" ? "AccentBrush" : brush, 46);
        badge.Margin = new Thickness(0, 0, 14, 0);
        DockPanel.SetDock(badge, Dock.Left);
        header.Children.Add(badge);

        var titles = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
        titles.Children.Add(new TextBlock
        {
            Text = title,
            Style = (Style)Application.Current.Resources["PageTitle"],
        });
        titles.Children.Add(new TextBlock
        {
            Text = subtitle,
            Style = (Style)Application.Current.Resources["PageSubtitle"],
        });
        header.Children.Add(titles);
        panel.Children.Add(header);

        Body = new StackPanel();
        panel.Children.Add(Body);

        Content = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = panel,
        };
    }

    protected StackPanel Body { get; }

    /// <summary>Placeholder card so an unbuilt module still looks deliberate.</summary>
    protected void AddPlaceholder(string message) => Body.Children.Add(Ui.Empty(message));
}
