using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>
/// The printable invoice. A FlowDocument rather than an HTML preview so
/// Windows prints it and "Save as PDF" produces selectable text.
/// </summary>
public sealed class InvoiceDocumentWindow : Window
{
    private readonly Invoice _invoice;
    private readonly List<InvoiceLine> _lines;
    private readonly string _clientName;
    private readonly Rates _rates;
    private readonly List<Attachment> _attachments;

    public InvoiceDocumentWindow(Invoice invoice, List<InvoiceLine> lines, string clientName, Rates rates,
        List<Attachment>? attachments = null)
    {
        _attachments = attachments ?? AttachmentStore.Get(AttachmentStore.InvoiceOwner, invoice.Id);
        _invoice = invoice;
        _lines = lines;
        _clientName = clientName;
        _rates = rates;

        Title = "Invoice " + invoice.Number;
        Width = 880;
        Height = 800;
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

        var print = new Button { Content = "Print / Save as PDF", Padding = new Thickness(14, 6, 14, 6), Margin = new Thickness(6, 0, 0, 0) };
        print.Click += (_, _) => DoPrint();
        bar.Children.Add(print);

        var close = new Button { Content = "Close", Padding = new Thickness(14, 6, 14, 6), Margin = new Thickness(6, 0, 0, 0) };
        close.Click += (_, _) => Close();
        bar.Children.Add(close);

        root.Children.Add(bar);
        root.Children.Add(new FlowDocumentScrollViewer
        {
            Document = Build(),
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Background = Brushes.White,
        });

        Content = root;
    }

    private void DoPrint()
    {
        var dlg = new PrintDialog();
        if (dlg.ShowDialog() != true) return;

        var doc = Build();
        doc.PageHeight = dlg.PrintableAreaHeight;
        doc.PageWidth = dlg.PrintableAreaWidth;
        doc.PagePadding = new Thickness(50);
        doc.ColumnGap = 0;
        doc.ColumnWidth = dlg.PrintableAreaWidth;

        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, "Invoice " + _invoice.Number);
    }

    private FlowDocument Build()
    {
        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 12,
            PagePadding = new Thickness(40),
            Background = Brushes.White,
            ColumnWidth = double.PositiveInfinity,
        };

        doc.Blocks.Add(new Paragraph(new Run("ZoltanStudios"))
        { FontSize = 22, FontWeight = FontWeights.Bold, Margin = new Thickness(0, 0, 0, 2) });
        doc.Blocks.Add(new Paragraph(new Run("Melbourne, Victoria  ·  zoltan@zoltanstudios.au"))
        { FontSize = 10, Foreground = Brushes.Gray, Margin = new Thickness(0, 0, 0, 16) });

        doc.Blocks.Add(new Paragraph(new Run("TAX INVOICE " + _invoice.Number))
        {
            FontSize = 16,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(29, 78, 216)),
            Margin = new Thickness(0, 0, 0, 12),
        });

        var meta = new Table { CellSpacing = 0, Margin = new Thickness(0, 0, 0, 16) };
        meta.Columns.Add(new TableColumn { Width = new GridLength(110) });
        meta.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        var mg = new TableRowGroup();
        void MetaRow(string l, string v)
        {
            var r = new TableRow();
            r.Cells.Add(new TableCell(new Paragraph(new Run(l))
            { FontSize = 10, Foreground = Brushes.Gray, Margin = new Thickness(0, 2, 0, 2) }));
            r.Cells.Add(new TableCell(new Paragraph(new Run(v))
            { FontSize = 11, Margin = new Thickness(0, 2, 0, 2) }));
            mg.Rows.Add(r);
        }
        if (_clientName.Length > 0) MetaRow("Bill to", _clientName);
        MetaRow("Issued", _invoice.IssuedDate);
        MetaRow("Due", _invoice.DueDate);
        if (_invoice.Notes.Length > 0) MetaRow("Reference", _invoice.Notes);
        meta.RowGroups.Add(mg);
        doc.Blocks.Add(meta);

        var t = new Table { CellSpacing = 0 };
        t.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        t.Columns.Add(new TableColumn { Width = new GridLength(70) });
        t.Columns.Add(new TableColumn { Width = new GridLength(90) });
        t.Columns.Add(new TableColumn { Width = new GridLength(100) });

        var head = new TableRowGroup();
        var hr = new TableRow { Background = new SolidColorBrush(Color.FromRgb(241, 245, 249)) };
        foreach (var h in new[] { "Description", "Qty", "Rate", "Amount" })
            hr.Cells.Add(new TableCell(new Paragraph(new Run(h))
            { FontSize = 10, FontWeight = FontWeights.Bold, Margin = new Thickness(0) })
            { Padding = new Thickness(6, 5, 6, 5) });
        head.Rows.Add(hr);
        t.RowGroups.Add(head);

        var body = new TableRowGroup();
        foreach (var l in _lines)
        {
            var r = new TableRow();
            void Cell(string s, bool right = false)
                => r.Cells.Add(new TableCell(new Paragraph(new Run(s))
                {
                    FontSize = 11,
                    TextAlignment = right ? TextAlignment.Right : TextAlignment.Left,
                    Margin = new Thickness(0),
                })
                { Padding = new Thickness(6, 4, 6, 4), BorderBrush = Brushes.Gainsboro, BorderThickness = new Thickness(0, 0, 0, 1) });

            Cell(l.Description);
            Cell(l.Quantity.ToString("0.##"), true);
            Cell("$" + l.Rate.ToString("0.00"), true);
            Cell("$" + l.Amount.ToString("0.00"), true);
            body.Rows.Add(r);
        }
        t.RowGroups.Add(body);

        var foot = new TableRowGroup();
        void Total(string label, double amount, bool bold = false)
        {
            var r = new TableRow();
            r.Cells.Add(new TableCell(new Paragraph()) { ColumnSpan = 2 });
            r.Cells.Add(new TableCell(new Paragraph(new Run(label))
            {
                FontSize = bold ? 13 : 11,
                FontWeight = bold ? FontWeights.Bold : FontWeights.Normal,
                TextAlignment = TextAlignment.Right,
                Margin = new Thickness(0),
            })
            { Padding = new Thickness(6, 5, 6, 5) });
            r.Cells.Add(new TableCell(new Paragraph(new Run("$" + amount.ToString("0.00")))
            {
                FontSize = bold ? 13 : 11,
                FontWeight = bold ? FontWeights.Bold : FontWeights.Normal,
                TextAlignment = TextAlignment.Right,
                Margin = new Thickness(0),
            })
            { Padding = new Thickness(6, 5, 6, 5) });
            foot.Rows.Add(r);
        }

        var sub = _lines.Sum(l => l.Amount);
        if (_rates.GstPercent > 0)
        {
            Total("Subtotal", sub);
            Total($"GST ({_rates.GstPercent:0}%)", sub * _rates.GstPercent / 100.0);
            Total("Total", sub * (1 + _rates.GstPercent / 100.0), bold: true);
        }
        else
        {
            Total("Total", sub, bold: true);
        }
        t.RowGroups.Add(foot);
        doc.Blocks.Add(t);

        doc.Blocks.Add(new Paragraph(new Run(
            "Payment due by " + _invoice.DueDate + ". "
          + (_rates.GstPercent > 0 ? "" : "No GST has been charged on this invoice.")))
        {
            FontSize = 10,
            Foreground = Brushes.Gray,
            Margin = new Thickness(0, 20, 0, 0),
        });

        var photos = _attachments.Where(a => !a.IsSignature).ToList();
        if (photos.Count > 0)
        {
            doc.Blocks.Add(new Paragraph(new Run("Photos"))
            { FontWeight = FontWeights.Bold, Margin = new Thickness(0, 18, 0, 6) });
            doc.Blocks.Add(DocImages.PhotoGrid(photos));
        }

        // A signature on an invoice is the client accepting the work.
        var sig = AttachmentStore.LatestSignature(_attachments);
        if (sig is not null)
        {
            var t2 = new Table { CellSpacing = 0, Margin = new Thickness(0, 10, 0, 0) };
            t2.Columns.Add(new TableColumn { Width = new GridLength(320) });
            t2.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
            var g2 = new TableRowGroup();
            var r2 = new TableRow();
            r2.Cells.Add(DocImages.SignatureCell(sig.DataUrl, sig.Note.Length > 0 ? sig.Note : _clientName,
                "Work accepted — signed " + sig.LocalDate));
            r2.Cells.Add(new TableCell(new Paragraph()));
            g2.Rows.Add(r2);
            t2.RowGroups.Add(g2);
            doc.Blocks.Add(t2);
        }

        return doc;
    }
}
