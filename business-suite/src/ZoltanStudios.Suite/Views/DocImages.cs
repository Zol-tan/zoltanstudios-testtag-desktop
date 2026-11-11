using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>Photos and signatures inside the printable certificate and invoice.</summary>
internal static class DocImages
{
    /// <summary>Photos three to a row, each with its caption.</summary>
    public static Block PhotoGrid(IEnumerable<Attachment> photos)
    {
        var wrap = new WrapPanel { Width = 660 };
        foreach (var p in photos)
        {
            var src = ImageTools.FromDataUrl(p.DataUrl);
            if (src is null) continue;
            var box = new StackPanel { Width = 210, Margin = new Thickness(0, 0, 10, 10) };
            box.Children.Add(new Border
            {
                BorderBrush = Brushes.Gainsboro,
                BorderThickness = new Thickness(1),
                Child = new Image { Source = src, Width = 208, Height = 156, Stretch = Stretch.UniformToFill },
            });
            if (p.Note.Length > 0)
                box.Children.Add(new TextBlock { Text = p.Note, FontSize = 9, Foreground = Brushes.DimGray, TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 3, 0, 0) });
            wrap.Children.Add(box);
        }
        return new BlockUIContainer(wrap) { Margin = new Thickness(0, 0, 0, 6) };
    }

    /// <summary>A signature line: the signature image on it if there is one, the name and label under it.</summary>
    public static TableCell SignatureCell(string? dataUrl, string name, string label)
    {
        var cell = new TableCell { Padding = new Thickness(0, 18, 20, 0) };
        var src = dataUrl is null ? null : ImageTools.FromDataUrl(dataUrl);
        var line = new Border
        {
            BorderBrush = Brushes.Gray,
            BorderThickness = new Thickness(0, 0, 0, 1),
            Height = 56,
            Margin = new Thickness(0, 0, 0, 3),
        };
        if (src is not null)
            line.Child = new Image
            {
                Source = src,
                MaxHeight = 52,
                MaxWidth = 240,
                Stretch = Stretch.Uniform,
                HorizontalAlignment = HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Bottom,
            };
        cell.Blocks.Add(new BlockUIContainer(line) { Margin = new Thickness(0) });
        cell.Blocks.Add(new Paragraph(new Run(name)) { FontSize = 11, Margin = new Thickness(0) });
        cell.Blocks.Add(new Paragraph(new Run(label)) { FontSize = 9, Foreground = Brushes.Gray, Margin = new Thickness(0) });
        return cell;
    }
}
