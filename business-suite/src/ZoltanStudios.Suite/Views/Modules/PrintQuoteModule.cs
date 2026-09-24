using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// 3D printing quote calculator.
///
/// The pricing matches 3d-printing-services.html exactly, so a quote given
/// over the phone from the app can't contradict one a customer worked out on
/// the website. If the website pricing changes, change it here too — the two
/// have to agree.
/// </summary>
public sealed class PrintQuoteModule : ModuleBase
{
    // Cost per gram, matching materialCosts on the website.
    private static readonly (string Key, string Label, double PerGram)[] Materials =
    {
        ("pla",       "PLA",                       0.03),
        ("petg",      "PETG",                      0.04),
        ("abs",       "ABS",                       0.04),
        ("tpu",       "TPU (flexible)",            0.06),
        ("composite", "Composite (carbon / wood)", 0.08),
    };

    private const double Density = 1.25;   // average plastic density, g/cm³
    private const double SetupCost = 15.0; // minimum setup charge

    private readonly TextBox _length = Num("100");
    private readonly TextBox _width = Num("100");
    private readonly TextBox _height = Num("50");
    private readonly TextBox _infill = Num("20");
    private readonly TextBox _quantity = Num("1");
    private readonly ComboBox _material = new();
    private readonly StackPanel _results = new();

    public PrintQuoteModule() : base(
        "3D Printing Quote",
        "Same pricing as the website calculator, so quotes given over the phone match.")
    {
        foreach (var m in Materials) _material.Items.Add(m.Label);
        _material.SelectedIndex = 0;
        _material.Padding = new Thickness(6, 4, 6, 4);
        _material.Margin = new Thickness(0, 0, 0, 10);

        var form = new Grid { Margin = new Thickness(0, 0, 0, 6), MaxWidth = 620 };
        form.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        form.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        form.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        for (var i = 0; i < 3; i++) form.RowDefinitions.Add(new RowDefinition());

        Field(form, 0, 0, "Length (mm)", _length);
        Field(form, 0, 1, "Width (mm)", _width);
        Field(form, 0, 2, "Height (mm)", _height);
        Field(form, 1, 0, "Infill (%)", _infill);
        Field(form, 1, 1, "Quantity", _quantity);
        Field(form, 1, 2, "Material", _material);

        // Loading the real model beats asking the customer for a bounding box,
        // and a sliced file beats both because the slicer already knows.
        var loadBar = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 14) };
        var load = new Button
        {
            Content = "Load model or G-code…",
            Padding = new Thickness(14, 6, 14, 6),
        };
        load.Click += (_, _) => LoadModel();
        loadBar.Children.Add(load);
        loadBar.Children.Add(_loaded);
        Body.Children.Add(loadBar);

        Body.Children.Add(form);

        var calc = new Button
        {
            Content = "Calculate",
            Padding = new Thickness(18, 7, 18, 7),
            HorizontalAlignment = HorizontalAlignment.Left,
            Background = Ui.Res("AccentBrush"),
            BorderBrush = Ui.Res("AccentBrush"),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(0, 4, 0, 16),
        };
        calc.Click += (_, _) => Calculate();

        // Saves the figure as a quote on the server (the admin panel's Quotes list).
        var save = new Button
        {
            Content = "Save as Quote…",
            Padding = new Thickness(18, 7, 18, 7),
            Margin = new Thickness(8, 4, 0, 16),
        };
        save.Click += (_, _) => SaveAsQuote();
        var actions = new StackPanel { Orientation = Orientation.Horizontal };
        actions.Children.Add(calc);
        actions.Children.Add(save);
        Body.Children.Add(actions);

        _results.Width = 620;
        var resultsCard = Ui.Card(_results, 22, new Thickness(0, 8, 0, 16));
        resultsCard.HorizontalAlignment = HorizontalAlignment.Left;
        Body.Children.Add(resultsCard);

        // Recalculate as values change - a quote tool that needs a button
        // press to stay honest invites reading a stale number aloud.
        foreach (var box in new[] { _length, _width, _height, _infill, _quantity })
            box.TextChanged += (_, _) => Calculate();
        _material.SelectionChanged += (_, _) => Calculate();

        Calculate();
    }

    private readonly TextBlock _loaded = new()
    {
        FontSize = 11,
        Margin = new Thickness(12, 0, 0, 0),
        VerticalAlignment = VerticalAlignment.Center,
        TextWrapping = TextWrapping.Wrap,
        MaxWidth = 420,
    };

    private ModelInfo? _model;

    private sealed record LastQuote(string Material, double Grams, double Hours, int Infill, int Qty,
        double MaterialCost, double TimeCost, double Setup, double Discount, double Final);

    private LastQuote? _last;

    private void SaveAsQuote()
    {
        Calculate();
        if (_last is null)
        {
            MessageBox.Show("Enter the dimensions, infill and quantity first.", "Save as Quote",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        // The server stores (material + time + setup) x quantity and has no
        // discount field, so a volume discount is recorded in the notes.
        var notes = _model is not null ? "From " + System.IO.Path.GetFileName(_model.FileName) + ". " : "";
        if (_last.Discount > 0)
            notes += $"Volume discount {_last.Discount * 100:0}% applies: quoted total ${_last.Final:0.00}.";

        var dlg = new QuoteEditorWindow(null) { Owner = Window.GetWindow(this) };
        dlg.Prefill(_last.Material, _last.Grams, _last.Hours, _last.Infill, _last.Qty,
            Math.Round(_last.MaterialCost, 2), Math.Round(_last.TimeCost, 2), _last.Setup, notes.Trim());
        dlg.ShowDialog();
    }

    private void LoadModel()
    {
        var dlg = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Open a 3D model or sliced G-code",
            Filter = ModelReader.FileFilter,
        };
        if (dlg.ShowDialog() != true) return;

        try
        {
            _model = ModelReader.Read(dlg.FileName);

            _length.Text = _model.LengthMm.ToString("0.#");
            _width.Text = _model.WidthMm.ToString("0.#");
            _height.Text = _model.HeightMm.ToString("0.#");

            _loaded.Foreground = Ui.Res(_model.IsSliced ? "OkBrush" : "MutedText");
            _loaded.Text = _model.IsSliced
                ? $"{_model.FileName} — {_model.Format}. {_model.SlicerGrams:0.#} g"
                  + (_model.SlicerMinutes is > 0 ? $", {_model.SlicerMinutes / 60:0.#} h print" : "")
                  + ". Using the slicer's figures."
                : $"{_model.FileName} — {_model.Format}, {_model.Triangles:N0} triangles, "
                  + $"{_model.VolumeCm3:0.0} cm³ solid.";

            Calculate();
        }
        catch (Exception ex)
        {
            _model = null;
            _loaded.Foreground = Ui.Res("BadBrush");
            _loaded.Text = ex.Message;
        }
    }

    private static TextBox Num(string value) => new()
    {
        Text = value,
        Padding = new Thickness(6, 4, 6, 4),
        Margin = new Thickness(0, 0, 10, 10),
    };

    private static void Field(Grid g, int row, int col, string label, FrameworkElement input)
    {
        var stack = new StackPanel();
        stack.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = 11,
            Foreground = Ui.Res("MutedText"),
            Margin = new Thickness(0, 0, 0, 3),
        });
        stack.Children.Add(input);
        Grid.SetRow(stack, row);
        Grid.SetColumn(stack, col);
        g.Children.Add(stack);
    }

    private void Calculate()
    {
        _results.Children.Clear();

        if (!double.TryParse(_length.Text, out var l) ||
            !double.TryParse(_width.Text, out var w) ||
            !double.TryParse(_height.Text, out var h) ||
            !double.TryParse(_infill.Text, out var infill) ||
            !int.TryParse(_quantity.Text, out var qty) ||
            l <= 0 || w <= 0 || h <= 0 || qty <= 0)
        {
            _results.Children.Add(Ui.Empty("Enter the dimensions, infill and quantity."));
            return;
        }

        infill = Math.Clamp(infill, 0, 100);
        var material = Materials[Math.Max(0, _material.SelectedIndex)];

        double volumeCm3;
        double weightGrams;

        if (_model is { IsSliced: true })
        {
            // The slicer already accounted for walls, infill and supports.
            // Applying the infill percentage again would double-count it.
            volumeCm3 = _model.VolumeCm3;
            weightGrams = _model.SlicerGrams!.Value;
        }
        else if (_model is not null && _model.VolumeCm3 > 0)
        {
            // True mesh volume, so only the infill assumption is an estimate.
            volumeCm3 = _model.VolumeCm3;
            weightGrams = volumeCm3 * Density * (infill / 100.0);
        }
        else
        {
            // No file loaded - fall back to the bounding box, which
            // over-estimates anything that isn't a solid block.
            volumeCm3 = l * w * h / 1000.0;
            weightGrams = volumeCm3 * Density * (infill / 100.0);
        }
        var materialCost = weightGrams * material.PerGram;
        var timeCost = Math.Max(5, volumeCm3 * 0.1);

        var unit = SetupCost + materialCost + timeCost;
        var total = unit * qty;

        var discount = qty >= 10 ? 0.15 : qty >= 5 ? 0.10 : qty >= 3 ? 0.05 : 0.0;
        var final = total * (1 - discount);
        _last = new LastQuote(material.Label, weightGrams, (_model?.SlicerMinutes ?? 0) / 60.0,
            (int)Math.Round(infill), qty, materialCost, timeCost, SetupCost, discount, final);

        Row("Dimensions", $"{l:0.#} × {w:0.#} × {h:0.#} mm");
        Row("Volume", $"{volumeCm3:0.0} cm³"
            + (_model is null ? " (bounding box)" : _model.IsSliced ? " (from slicer)" : " (true mesh volume)"));
        Row("Material weight", $"{weightGrams:0.0} g of {material.Label}");
        Row("Material cost", $"${materialCost:0.00}");
        Row("Setup", $"${SetupCost:0.00}");
        Row("Print time", $"${timeCost:0.00}");
        Divider();
        Row("Unit price", $"${unit:0.00}");
        Row("Quantity", qty.ToString());

        if (discount > 0)
        {
            Row("Subtotal", $"${total:0.00}");
            Row($"Volume discount ({discount * 100:0}%)", $"−${total - final:0.00}", "OkBrush");
        }

        Divider();
        Row("Total", $"${final:0.00}", "AccentBrush", big: true);

        if (_model is null)
        {
            _results.Children.Add(new TextBlock
            {
                Text = "No model loaded, so this assumes a solid block of those dimensions — "
                     + "it will over-quote anything hollow or organic. Load the STL or G-code for a real figure.",
                FontSize = 11,
                Foreground = Ui.Res("WarnBrush"),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 10, 0, 0),
            });
        }
        else if (_model.SlicerMinutes is > 0)
        {
            _results.Children.Add(new TextBlock
            {
                Text = $"Slicer estimate: {_model.SlicerMinutes / 60:0.#} hours per part"
                     + (qty > 1 ? $", {_model.SlicerMinutes.Value * qty / 60:0.#} hours for {qty}." : "."),
                FontSize = 11,
                Foreground = Ui.Res("MutedText"),
                Margin = new Thickness(0, 10, 0, 0),
            });
        }

        if (discount == 0 && qty < 3)
        {
            _results.Children.Add(new TextBlock
            {
                Text = "3 or more gets 5% off, 5+ gets 10%, 10+ gets 15%.",
                FontSize = 11,
                Foreground = Ui.Res("MutedText"),
                Margin = new Thickness(0, 10, 0, 0),
            });
        }
    }

    private void Row(string label, string value, string brushKey = "BodyText", bool big = false)
    {
        var g = new Grid { Margin = new Thickness(0, 3, 0, 3) };
        g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(140) });

        g.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = big ? 15 : 12,
            FontWeight = big ? FontWeights.SemiBold : FontWeights.Normal,
            Foreground = Ui.Res("MutedText"),
        });

        var v = new TextBlock
        {
            Text = value,
            FontSize = big ? 18 : 12,
            FontWeight = big ? FontWeights.Bold : FontWeights.SemiBold,
            Foreground = Ui.Res(brushKey),
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        Grid.SetColumn(v, 1);
        g.Children.Add(v);

        _results.Children.Add(g);
    }

    private void Divider() => _results.Children.Add(new Border
    {
        BorderBrush = Ui.Res("BorderBrush"),
        BorderThickness = new Thickness(0, 1, 0, 0),
        Margin = new Thickness(0, 6, 0, 6),
    });
}
