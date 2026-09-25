using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// One quoting screen for every service. Pick the service, fill in the few
/// numbers that matter, get a figure you can read out on the phone.
///
/// All prices come from Rates, which is editable under Settings — so a rate
/// change never means a rebuild, and the tool can't quietly quote last year's
/// pricing.
/// </summary>
public sealed class QuoteModule : ModuleBase
{
    private readonly Rates _rates = Rates.Load();
    private readonly ComboBox _service = new();
    private readonly StackPanel _inputs = new();
    private readonly StackPanel _results = new();

    private static readonly string[] Services =
    {
        "Test & Tag",
        "PC Building",
        "Electronic Repairs",
        "Data Recovery",
        "Web Development",
        "SEO / Social Media",
        "IT Consulting",
    };

    public QuoteModule() : base(
        "Quote Calculator",
        "Estimates for any service. Rates are editable under Settings.")
    {
        foreach (var s in Services) _service.Items.Add(s);
        _service.SelectedIndex = 0;
        _service.Padding = new Thickness(6, 5, 6, 5);
        _service.Margin = new Thickness(0, 0, 0, 16);
        _service.MaxWidth = 300;
        _service.HorizontalAlignment = HorizontalAlignment.Left;
        _service.SelectionChanged += (_, _) => BuildInputs();

        Body.Children.Add(new TextBlock
        {
            Text = "Service", FontSize = 11,
            Foreground = Ui.Res("MutedText"), Margin = new Thickness(0, 0, 0, 3),
        });
        Body.Children.Add(_service);

        _inputs.MaxWidth = 620;
        _inputs.HorizontalAlignment = HorizontalAlignment.Left;
        Body.Children.Add(_inputs);

        _results.Width = 620;
        _results.HorizontalAlignment = HorizontalAlignment.Left;
        _results.Margin = new Thickness(0);
        var resultsCard = Ui.Card(_results, 22, new Thickness(0, 8, 0, 16));
        resultsCard.HorizontalAlignment = HorizontalAlignment.Left;
        Body.Children.Add(resultsCard);

        BuildInputs();
    }

    // ----------------------------------------------------------- input fields

    private readonly Dictionary<string, TextBox> _fields = new();

    private TextBox Field(string key, string label, string initial)
    {
        var box = new TextBox
        {
            Text = initial,
            Padding = new Thickness(6, 4, 6, 4),
            Margin = new Thickness(0, 0, 0, 10),
            Width = 130,
            HorizontalAlignment = HorizontalAlignment.Left,
        };
        box.TextChanged += (_, _) => Calculate();
        _fields[key] = box;

        var stack = new StackPanel { Margin = new Thickness(0, 0, 18, 0) };
        stack.Children.Add(new TextBlock
        {
            Text = label, FontSize = 11,
            Foreground = Ui.Res("MutedText"), Margin = new Thickness(0, 0, 0, 3),
        });
        stack.Children.Add(box);

        _row.Children.Add(stack);
        return box;
    }

    private WrapPanel _row = new();

    private void BuildInputs()
    {
        _inputs.Children.Clear();
        _fields.Clear();
        _row = new WrapPanel();
        _inputs.Children.Add(_row);

        switch (_service.SelectedIndex)
        {
            case 0: // Test & Tag
                Field("std", "Standard items", "30");
                Field("tools", "Power tools", "0");
                Field("rcd", "RCD tests", "0");
                Field("micro", "Microwaves", "0");
                Note($"Call-out ${_rates.CallOut:0} covers the first {_rates.CallOutIncludes} standard items. "
                   + $"Volume rates apply from 100 items (${_rates.PerItem100:0.00}) and 200 (${_rates.PerItem200:0.00}).");
                break;

            case 1: // PC Building
                Field("parts", "Parts cost ($)", "1500");
                Field("builds", "Number of builds", "1");
                Field("os", "OS setups", "1");
                break;

            case 2: // Electronic Repairs
                Field("hours", "Estimated hours", "1");
                Field("parts", "Parts cost ($)", "0");
                Field("diag", "Diagnostic only? (1/0)", "0");
                break;

            case 3: // Data Recovery
                Field("type", "Type: 1 logical, 2 physical", "1");
                Field("gb", "Data size (GB)", "500");
                break;

            case 4: // Web Development
                Field("pages", "Pages", "5");
                Field("months", "Hosting months", "12");
                break;

            case 5: // SEO / Social
                Field("seo", "SEO months", "3");
                Field("social", "Social months", "3");
                break;

            case 6: // Consulting
                Field("hours", "Hours", "4");
                break;
        }

        Calculate();
    }

    private void Note(string text) => _inputs.Children.Add(new TextBlock
    {
        Text = text,
        FontSize = 11,
        Foreground = Ui.Res("MutedText"),
        TextWrapping = TextWrapping.Wrap,
        Margin = new Thickness(0, 2, 0, 0),
    });

    // -------------------------------------------------------------- calculate

    private double Val(string key, double fallback = 0)
        => _fields.TryGetValue(key, out var b) && double.TryParse(b.Text, out var d) ? d : fallback;

    private void Calculate()
    {
        _results.Children.Clear();
        var lines = new List<(string Label, double Amount)>();
        // Shown under the total. (These used to be added to the input panel on
        // every keystroke, so the same note piled up again and again.)
        var notes = new List<string>();
        double total;

        switch (_service.SelectedIndex)
        {
            case 0:
            {
                int std = (int)Val("std"), tools = (int)Val("tools"),
                    rcd = (int)Val("rcd"), micro = (int)Val("micro");
                var items = std + tools + rcd + micro;

                lines.Add(($"Call-out (includes first {_rates.CallOutIncludes} items)", _rates.CallOut));

                var chargeable = Math.Max(0, std - _rates.CallOutIncludes);
                var rate = items >= 200 ? _rates.PerItem200
                         : items >= 100 ? _rates.PerItem100
                         : _rates.PerItemStandard;
                if (chargeable > 0)
                    lines.Add(($"Standard × {chargeable} @ ${rate:0.00}", chargeable * rate));
                if (tools > 0)
                    lines.Add(($"Power tools × {tools} @ ${_rates.PerItemPowerTool:0.00}", tools * _rates.PerItemPowerTool));
                if (rcd > 0)
                    lines.Add(($"RCD tests × {rcd} @ ${_rates.PerItemRcd:0.00}", rcd * _rates.PerItemRcd));
                if (micro > 0)
                    lines.Add(($"Microwave leakage × {micro} @ ${_rates.PerItemMicrowave:0.00}", micro * _rates.PerItemMicrowave));

                total = lines.Sum(l => l.Amount);

                // The published offers, so a phone quote doesn't miss them.
                if (items > 0 && items <= _rates.IntroOfferItems && _rates.IntroOfferPrice < total)
                    notes.Add($"New customer? The intro offer is ${_rates.IntroOfferPrice:0} flat for up to {_rates.IntroOfferItems} items " +
                         $"(saves ${total - _rates.IntroOfferPrice:0.00}).");
                if (items > 0)
                    notes.Add($"On a contract: quarterly ${total * (1 - _rates.ContractQuarterlyPercent / 100):0.00} a visit " +
                         $"({_rates.ContractQuarterlyPercent:0}% off), annual ${total * (1 - _rates.ContractAnnualPercent / 100):0.00} " +
                         $"({_rates.ContractAnnualPercent:0}% off).");
                break;
            }

            case 1:
            {
                var parts = Val("parts");
                var builds = Math.Max(1, Val("builds"));
                var os = Val("os");
                var markup = parts * _rates.PcPartsMarkupPercent / 100.0;

                lines.Add(("Parts at cost", parts));
                if (markup > 0) lines.Add(($"Parts handling ({_rates.PcPartsMarkupPercent:0}%)", markup));
                lines.Add(($"Build labour × {builds:0}", _rates.PcBuildLabour * builds));
                if (os > 0) lines.Add(($"OS setup × {os:0}", _rates.PcBuildOsSetup * os));
                total = lines.Sum(l => l.Amount);
                break;
            }

            case 2:
            {
                var hours = Val("hours");
                var parts = Val("parts");
                var diagOnly = Val("diag") >= 1;

                if (diagOnly)
                {
                    lines.Add(("Diagnostic", _rates.RepairDiagnostic));
                    total = _rates.RepairDiagnostic;
                }
                else
                {
                    var labour = Math.Max(_rates.RepairMinimum, hours * _rates.RepairHourly);
                    lines.Add(($"Labour {hours:0.#}h @ ${_rates.RepairHourly:0}/h", labour));
                    if (labour == _rates.RepairMinimum && hours * _rates.RepairHourly < _rates.RepairMinimum)
                        notes.Add($"Minimum charge of ${_rates.RepairMinimum:0} applied.");
                    if (parts > 0) lines.Add(("Parts", parts));
                    total = lines.Sum(l => l.Amount);
                }
                break;
            }

            case 3:
            {
                var physical = Val("type") >= 2;
                var gb = Val("gb");
                var basePrice = physical ? _rates.RecoveryPhysical : _rates.RecoveryLogical;
                lines.Add((physical ? "Physical recovery" : "Logical recovery", basePrice));
                if (_rates.RecoveryPerGb > 0)
                    lines.Add(($"Data volume {gb:0} GB", gb * _rates.RecoveryPerGb));
                total = lines.Sum(l => l.Amount);
                break;
            }

            case 4:
            {
                var pages = Val("pages");
                var months = Val("months");
                lines.Add(("Setup", _rates.WebSetup));
                lines.Add(($"Pages × {pages:0} @ ${_rates.WebPerPage:0}", pages * _rates.WebPerPage));
                if (months > 0)
                    lines.Add(($"Hosting × {months:0} months @ ${_rates.WebHostingMonthly:0}",
                        months * _rates.WebHostingMonthly));
                total = lines.Sum(l => l.Amount);
                break;
            }

            case 5:
            {
                var seo = Val("seo");
                var social = Val("social");
                if (seo > 0) lines.Add(($"SEO × {seo:0} months", seo * _rates.SeoMonthly));
                if (social > 0) lines.Add(($"Social × {social:0} months", social * _rates.SocialMonthly));
                total = lines.Sum(l => l.Amount);
                break;
            }

            default:
            {
                var hours = Val("hours");
                lines.Add(($"Consulting {hours:0.#}h @ ${_rates.ConsultingHourly:0}/h",
                    hours * _rates.ConsultingHourly));
                total = lines.Sum(l => l.Amount);
                break;
            }
        }

        foreach (var (label, amount) in lines) Row(label, $"${amount:0.00}");

        if (_rates.GstPercent > 0)
        {
            var gst = total * _rates.GstPercent / 100.0;
            Divider();
            Row("Subtotal", $"${total:0.00}");
            Row($"GST ({_rates.GstPercent:0}%)", $"${gst:0.00}");
            total += gst;
        }

        Divider();
        Row("Total", $"${total:0.00}", "AccentBrush", big: true);

        foreach (var n in notes)
            _results.Children.Add(new TextBlock
            {
                Text = n, FontSize = 11.5, Foreground = Ui.Res("OkBrush"), TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 8, 0, 0),
            });

        // The placeholder rates are a real trap: quoting from them by mistake
        // would be worse than having no calculator at all.
        if (_service.SelectedIndex is not (0))
        {
            _results.Children.Add(new TextBlock
            {
                Text = "These rates are placeholders until you set your own under Settings.",
                FontSize = 11,
                Foreground = Ui.Res("WarnBrush"),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 12, 0, 0),
            });
        }
    }

    private void Row(string label, string value, string brushKey = "BodyText", bool big = false)
    {
        var g = new Grid { Margin = new Thickness(0, 3, 0, 3) };
        g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(130) });

        g.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = big ? 15 : 12,
            FontWeight = big ? FontWeights.SemiBold : FontWeights.Normal,
            Foreground = Ui.Res("MutedText"),
            TextWrapping = TextWrapping.Wrap,
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
