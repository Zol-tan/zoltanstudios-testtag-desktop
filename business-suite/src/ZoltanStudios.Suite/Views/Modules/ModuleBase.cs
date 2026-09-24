using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// Shared scaffolding for a module page: a title, a subtitle and a body.
/// Modules are plain UserControls so each can be built out independently
/// without the shell needing to change.
/// </summary>
public abstract class ModuleBase : UserControl
{
    protected ModuleBase(string title, string subtitle)
    {
        var panel = new StackPanel { Margin = new Thickness(26, 22, 26, 22) };

        panel.Children.Add(new TextBlock
        {
            Text = title,
            Style = (Style)Application.Current.Resources["PageTitle"],
        });
        panel.Children.Add(new TextBlock
        {
            Text = subtitle,
            Style = (Style)Application.Current.Resources["PageSubtitle"],
        });

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
    protected void AddPlaceholder(string message)
    {
        Body.Children.Add(new Border
        {
            Background = Brushes.White,
            BorderBrush = (Brush)Application.Current.Resources["BorderBrush"],
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(20),
            Child = new TextBlock
            {
                Text = message,
                TextWrapping = TextWrapping.Wrap,
                Foreground = (Brush)Application.Current.Resources["MutedText"],
                FontSize = 13,
            },
        });
    }
}
