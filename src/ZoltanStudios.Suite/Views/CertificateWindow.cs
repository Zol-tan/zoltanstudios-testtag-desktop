using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>
/// The compliance certificate, rendered as a WPF FlowDocument.
///
/// Built as a document rather than an HTML preview so Windows can print it
/// and "Save as PDF" natively, with selectable text — the web app's PDF is a
/// flattened image because its layout uses flexbox.
/// </summary>
public sealed class CertificateWindow : Window
{
    private readonly Job _job;

    public CertificateWindow(Job job)
    {
        _job = job;
        Title = "Certificate " + job.CertNumber;
        Width = 900;
        Height = 820;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = (Brush)Application.Current.Resources["AppBackground"];

        var root = new DockPanel { Margin = new Thickness(12) };

        var bar = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 0, 0, 10),
        };
        DockPanel.SetDock(bar, Dock.Top);
        bar.Children.Add(Btn("Print / Save as PDF", Print));
        bar.Children.Add(Btn("Close", (_, _) => Close()));
        root.Children.Add(bar);

        root.Children.Add(new FlowDocumentScrollViewer
        {
            Document = BuildDocument(),
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Background = Brushes.White,
        });

        Content = root;
    }

    private static Button Btn(string text, RoutedEventHandler click)
    {
        var b = new Button { Content = text, Padding = new Thickness(14, 6, 14, 6), Margin = new Thickness(6, 0, 0, 0) };
        b.Click += click;
        return b;
    }

    // ------------------------------------------------------------------ print

    private void Print(object sender, RoutedEventArgs e)
    {
        var dlg = new System.Windows.Controls.PrintDialog();
        if (dlg.ShowDialog() != true) return;

        var doc = BuildDocument();
        doc.PageHeight = dlg.PrintableAreaHeight;
        doc.PageWidth = dlg.PrintableAreaWidth;
        doc.PagePadding = new Thickness(50);
        doc.ColumnGap = 0;
        doc.ColumnWidth = dlg.PrintableAreaWidth;

        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator,
            "Certificate " + _job.CertNumber);
    }

    // --------------------------------------------------------------- document

    private FlowDocument BuildDocument()
    {
        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 12,
            PagePadding = new Thickness(40),
            Background = Brushes.White,
            ColumnWidth = double.PositiveInfinity,
        };

        var pass = _job.Items.Count(i => i.Result == "pass");
        var fail = _job.Items.Count(i => i.Result == "fail");

        // ---- letterhead
        doc.Blocks.Add(new Paragraph(new Run("ZoltanStudios"))
        {
            FontSize = 22, FontWeight = FontWeights.Bold, Margin = new Thickness(0, 0, 0, 2),
        });
        doc.Blocks.Add(new Paragraph(new Run("Test & Tag Compliance Certificate"))
        {
            FontSize = 13, Foreground = Brushes.Gray, Margin = new Thickness(0, 0, 0, 4),
        });
        doc.Blocks.Add(new Paragraph(new Run("Melbourne, Victoria · zoltan@zoltanstudios.au"))
        {
            FontSize = 10, Foreground = Brushes.Gray, Margin = new Thickness(0, 0, 0, 14),
        });

        // ---- certificate number
        doc.Blocks.Add(new Paragraph(new Run("CERTIFICATE No.  " + _job.CertNumber))
        {
            FontSize = 15, FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(29, 78, 216)),
            Margin = new Thickness(0, 0, 0, 14),
        });

        // ---- summary
        doc.Blocks.Add(new Paragraph(new Run(
            $"{_job.Items.Count} items tested   ·   {pass} passed   ·   {fail} failed"))
        {
            FontWeight = FontWeights.SemiBold, Margin = new Thickness(0, 0, 0, 12),
        });

        // ---- details
        doc.Blocks.Add(Details());

        // ---- failures, called out before the table so they can't be missed
        if (fail > 0)
        {
            doc.Blocks.Add(new Paragraph(new Run("Items Removed from Service"))
            {
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(185, 28, 28)),
                Margin = new Thickness(0, 8, 0, 4),
            });
            foreach (var i in _job.Items.Where(x => x.Result == "fail"))
            {
                var text = $"{i.TagNumber} — {i.Description}";
                if (i.Location.Length > 0) text += $" ({i.Location})";
                if (i.FaultDescription.Length > 0) text += $"\nFault: {i.FaultDescription}";
                doc.Blocks.Add(new Paragraph(new Run(text))
                {
                    FontSize = 11,
                    Foreground = new SolidColorBrush(Color.FromRgb(185, 28, 28)),
                    Margin = new Thickness(10, 0, 0, 4),
                });
            }
        }

        // ---- item table
        doc.Blocks.Add(ItemTable());

        // ---- declaration
        doc.Blocks.Add(new Paragraph(new Run("Statutory Declaration"))
        {
            FontWeight = FontWeights.Bold, Margin = new Thickness(0, 14, 0, 4),
        });
        doc.Blocks.Add(new Paragraph(new Run(
            "I declare that the electrical equipment listed in this report has been inspected and "
          + "tested in accordance with AS/NZS 3760:2022, and that the results recorded above are a "
          + "true and accurate account of the condition of each item at the time of testing. This "
          + "testing has been carried out with regard to the duties and obligations set out under "
          + "the Occupational Health and Safety Act 2004 (Vic) and the Occupational Health and "
          + "Safety Regulations 2017. Equipment marked \"Fail\" has been removed from service and "
          + "must not be used until repaired and retested by a competent person. Testing scope is "
          + "limited to single-phase 230/240V cord-connected equipment and cord assemblies."))
        {
            FontSize = 10, Foreground = Brushes.DimGray, Margin = new Thickness(0, 0, 0, 20),
        });

        // ---- signatures
        var sig = new Table { CellSpacing = 0 };
        sig.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        sig.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        var sg = new TableRowGroup();
        var sr = new TableRow();
        sr.Cells.Add(SigCell(_job.TesterName, "Tester Signature & Date"));
        sr.Cells.Add(SigCell("", "Client Representative Signature & Date"));
        sg.Rows.Add(sr);
        sig.RowGroups.Add(sg);
        doc.Blocks.Add(sig);

        return doc;
    }

    private static TableCell SigCell(string name, string label)
    {
        var cell = new TableCell { Padding = new Thickness(0, 24, 20, 0) };
        cell.Blocks.Add(new Paragraph
        {
            BorderBrush = Brushes.Gray,
            BorderThickness = new Thickness(0, 0, 0, 1),
            Margin = new Thickness(0, 20, 0, 3),
        });
        cell.Blocks.Add(new Paragraph(new Run(name)) { FontSize = 11, Margin = new Thickness(0) });
        cell.Blocks.Add(new Paragraph(new Run(label))
        {
            FontSize = 9, Foreground = Brushes.Gray, Margin = new Thickness(0),
        });
        return cell;
    }

    private Table Details()
    {
        var t = new Table { CellSpacing = 0, Margin = new Thickness(0, 0, 0, 10) };
        t.Columns.Add(new TableColumn { Width = new GridLength(130) });
        t.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        t.Columns.Add(new TableColumn { Width = new GridLength(130) });
        t.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var g = new TableRowGroup();
        void Row(string l1, string v1, string l2, string v2)
        {
            var r = new TableRow();
            r.Cells.Add(Label(l1)); r.Cells.Add(Value(v1));
            r.Cells.Add(Label(l2)); r.Cells.Add(Value(v2));
            g.Rows.Add(r);
        }

        Row("Site address", _job.SiteAddress, "Environment", _job.Environment);
        Row("Test date", _job.TestDate, "Next test due", _job.NextDue);
        Row("Tested by", _job.TesterName, "Licence / cert no.", _job.TesterLicence);
        Row("Test equipment", _job.TestEquipment, "Calibrated", _job.CalibrationDate);

        t.RowGroups.Add(g);
        return t;
    }

    private static TableCell Label(string s) => new(new Paragraph(new Run(s))
    { FontSize = 10, Foreground = Brushes.Gray, Margin = new Thickness(0, 2, 0, 2) });

    private static TableCell Value(string s) => new(new Paragraph(new Run(s))
    { FontSize = 11, Margin = new Thickness(0, 2, 8, 2) });

    private Table ItemTable()
    {
        var t = new Table { CellSpacing = 0, Margin = new Thickness(0, 10, 0, 0) };
        double[] widths = { 70, 170, 45, 100, 55, 62, 68, 72, 55 };
        foreach (var w in widths)
            t.Columns.Add(new TableColumn { Width = new GridLength(w) });

        var head = new TableRowGroup();
        var hr = new TableRow { Background = new SolidColorBrush(Color.FromRgb(241, 245, 249)) };
        foreach (var h in new[] { "Tag", "Description", "Class", "Location", "Visual", "Earth Ω", "Insul. MΩ", "Operation", "Result" })
            hr.Cells.Add(new TableCell(new Paragraph(new Run(h))
            {
                FontSize = 9, FontWeight = FontWeights.Bold, Margin = new Thickness(0),
            })
            { Padding = new Thickness(4, 4, 4, 4), BorderBrush = Brushes.LightGray, BorderThickness = new Thickness(0, 0, 0, 1) });
        head.Rows.Add(hr);
        t.RowGroups.Add(head);

        var body = new TableRowGroup();
        foreach (var i in _job.Items)
        {
            var failed = i.Result == "fail";
            var r = new TableRow();
            if (failed) r.Background = new SolidColorBrush(Color.FromRgb(254, 242, 242));

            void Cell(string text, bool bold = false)
                => r.Cells.Add(new TableCell(new Paragraph(new Run(text))
                {
                    FontSize = 9,
                    FontWeight = bold ? FontWeights.Bold : FontWeights.Normal,
                    Foreground = failed && bold
                        ? new SolidColorBrush(Color.FromRgb(185, 28, 28))
                        : Brushes.Black,
                    Margin = new Thickness(0),
                })
                { Padding = new Thickness(4, 3, 4, 3), BorderBrush = Brushes.Gainsboro, BorderThickness = new Thickness(0, 0, 0, 1) });

            Cell(i.TagNumber);
            Cell(i.Description);
            Cell(i.EquipmentClass);
            Cell(i.Location);
            Cell(i.Visual);
            Cell(i.EquipmentClass == "I" ? i.EarthContinuity : "n/a");
            Cell(i.InsulationResistance);
            Cell(i.OperationTest == "n/a" ? "—" : i.OperationTest);
            Cell(i.Result.ToUpperInvariant(), bold: true);

            body.Rows.Add(r);
        }
        t.RowGroups.Add(body);
        return t;
    }
}
