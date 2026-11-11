using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using ZoltanStudios.Suite.Services;
using ZoltanStudios.Suite.Views.Modules;

namespace ZoltanStudios.Suite.Views;

internal static class Glyphs
{
    public const string Phone = "", Camera = "", Pen = "", Photo = "", Close = "", Job = "";
}

// ================================================================ sign here

/// <summary>
/// A signature pad on the laptop itself - mouse, touchscreen or pen. For a
/// client signing on the PC, or the tester's own signature.
/// </summary>
public sealed class SignaturePadWindow : Window
{
    private readonly InkCanvas _ink = new()
    {
        Background = Brushes.White,
        Height = 230,
        Cursor = Cursors.Pen,
    };
    private readonly TextBox? _name;

    /// <summary>The signature, once "Use Signature" is pressed.</summary>
    public Attachment? Result { get; private set; }

    public SignaturePadWindow(string title, string prompt, bool askName, string defaultName = "")
    {
        Title = title;
        Width = 640;
        SizeToContent = SizeToContent.Height;
        ResizeMode = ResizeMode.NoResize;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        _ink.DefaultDrawingAttributes = new System.Windows.Ink.DrawingAttributes
        {
            Color = Color.FromRgb(15, 23, 42),
            Width = 2.6,
            Height = 2.6,
            FitToCurve = true,
            IgnorePressure = false,
        };

        var root = new StackPanel { Margin = new Thickness(18) };
        root.Children.Add(Forms.Note(prompt));
        if (askName)
        {
            _name = Forms.Tb(defaultName);
            root.Children.Add(Forms.Field("Name of the person signing", _name));
        }
        root.Children.Add(new Border
        {
            BorderBrush = Forms.Res("BorderStrong"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Child = _ink,
            ClipToBounds = true,
        });
        root.Children.Add(new TextBlock
        {
            Text = "Sign above with the mouse, touchscreen or pen.",
            FontSize = 11,
            Foreground = Forms.Res("MutedText"),
            Margin = new Thickness(2, 6, 0, 0),
        });

        var bar = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(0, 14, 0, 0) };
        bar.Children.Add(Forms.Btn("Clear", (_, _) => _ink.Strokes.Clear()));
        bar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        bar.Children.Add(Forms.Btn("Use Signature", (_, _) => Use(askName), primary: true, glyph: Glyphs.Pen));
        root.Children.Add(bar);
        Content = root;
    }

    private void Use(bool askName)
    {
        var png = ImageTools.SignatureFromStrokes(_ink.Strokes);
        if (png is null) { Forms.Error(this, Title, "Nothing has been signed yet."); return; }
        var name = _name?.Text.Trim() ?? "";
        if (askName && name.Length == 0) { Forms.Error(this, Title, "Enter the name of the person signing."); _name!.Focus(); return; }
        Result = new Attachment { Kind = "signature", Note = name, DataUrl = png };
        DialogResult = true;
    }
}

// ============================================================== use my phone

/// <summary>
/// Shows a QR code for the website's capture page. Scan it with the phone
/// (no login needed), take photos or sign, and they appear here within a
/// few seconds. The phone page is the same one the web app uses.
/// </summary>
public sealed class PhoneCaptureWindow : Window
{
    private readonly string _record, _label, _mode;
    private readonly Image _qr = new() { Width = 230, Height = 230, Stretch = Stretch.Uniform };
    private readonly TextBox _link = new() { IsReadOnly = true, Padding = new Thickness(6, 4, 6, 4), FontSize = 11 };
    private readonly TextBlock _status = new() { TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 10, 0, 0) };
    private readonly WrapPanel _thumbs = new() { Margin = new Thickness(0, 10, 0, 0) };
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromSeconds(3) };
    private readonly HashSet<string> _have;
    private string _since = "";
    private bool _polling;

    /// <summary>Everything that arrived while the window was open, oldest first.</summary>
    public List<Attachment> Received { get; } = new();

    /// <param name="alreadyHave">Ids already on the record, so an old upload isn't added twice.</param>
    public PhoneCaptureWindow(string recordId, string label, string mode, IEnumerable<string> alreadyHave)
    {
        _record = recordId;
        _label = label;
        _mode = mode;
        _have = alreadyHave.ToHashSet();

        Title = mode is PhoneCapture.Modes.Tester or PhoneCapture.Modes.Signature ? "Sign on a Phone" : "Use My Phone";
        Width = 560;
        SizeToContent = SizeToContent.Height;
        ResizeMode = ResizeMode.NoResize;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        var root = new StackPanel { Margin = new Thickness(18) };
        root.Children.Add(Ui.Heading(Title, Glyphs.Phone));
        if (label.Length > 0) root.Children.Add(Forms.Note(label));

        var row = new Grid { Margin = new Thickness(0, 8, 0, 0) };
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        var qrBox = new Border
        {
            Background = Brushes.White,
            BorderBrush = Forms.Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(6),
            Child = _qr,
        };
        row.Children.Add(qrBox);

        var side = new StackPanel { Margin = new Thickness(16, 0, 0, 0) };
        side.Children.Add(new TextBlock { Text = "Scan with the phone's camera", FontWeight = FontWeights.SemiBold, Foreground = Forms.Res("HeadingText") });
        side.Children.Add(new TextBlock
        {
            Text = mode switch
            {
                PhoneCapture.Modes.Tester => "Opens a page where you sign with your finger. No login needed.",
                PhoneCapture.Modes.Signature => "Hand the phone to the client: they type their name and sign with a finger. No login needed.",
                PhoneCapture.Modes.Photos => "Take photos or pick them from the phone's library. No login needed.",
                _ => "Take photos, or hand the phone to the client to sign. No login needed.",
            },
            TextWrapping = TextWrapping.Wrap,
            FontSize = 12,
            Foreground = Forms.Res("BodyText"),
            Margin = new Thickness(0, 4, 0, 10),
        });
        side.Children.Add(new TextBlock { Text = "Or open this link on the phone:", FontSize = 11, Foreground = Forms.Res("MutedText") });
        side.Children.Add(_link);
        var copy = Forms.Btn("Copy Link", (_, _) => { if (_link.Text.Length > 0) Clipboard.SetText(_link.Text); }, glyph: Ui.GCopy);
        copy.Margin = new Thickness(0, 6, 0, 0);
        copy.HorizontalAlignment = HorizontalAlignment.Left;
        side.Children.Add(copy);
        side.Children.Add(_status);
        Grid.SetColumn(side, 1);
        row.Children.Add(side);
        root.Children.Add(row);
        root.Children.Add(_thumbs);

        var bar = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(0, 14, 0, 0) };
        bar.Children.Add(Forms.Btn("Done", (_, _) => Finish(), primary: true, glyph: Ui.GCheck));
        root.Children.Add(bar);
        Content = root;

        _timer.Tick += async (_, _) => await Poll();
        Loaded += async (_, _) => await Start();
        Closed += (_, _) => _timer.Stop();
    }

    private void SetStatus(string text, string brush = "MutedText")
    {
        _status.Text = text;
        _status.Foreground = Forms.Res(brush);
    }

    private async Task Start()
    {
        SetStatus("Getting a link from the website…");
        var (s, error) = await PhoneCapture.StartAsync(ApiClient.Shared, _record, _label, _mode);
        if (s is null) { SetStatus(error, "BadBrush"); return; }
        _since = s.StartedAt;
        _link.Text = s.Url;
        _qr.Source = ImageTools.Qr(s.Url);
        SetStatus($"Waiting for the phone… The link works for {s.ExpiresInMinutes} minutes.");
        _timer.Start();
    }

    private async Task Poll()
    {
        if (_polling) return; // a slow connection mustn't stack up calls
        _polling = true;
        try
        {
            var (items, error) = await PhoneCapture.PollAsync(ApiClient.Shared, _record, _since);
            if (error.Length > 0) { SetStatus("Can't reach the website: " + error + " (still trying)", "WarnBrush"); return; }
            foreach (var a in items)
            {
                if (string.CompareOrdinal(a.CreatedAt, _since) > 0) _since = a.CreatedAt;
                if (!_have.Add(a.Id)) continue;
                Received.Add(a);
                _thumbs.Children.Add(AttachmentsPanel.Thumb(a, null));
            }
            if (Received.Count > 0)
                SetStatus($"Received {Received.Count(a => !a.IsSignature)} photo(s), {Received.Count(a => a.IsSignature)} signature(s). "
                        + "Keep going, or press Done.", "OkBrush");

            // A signature-only link is finished once the signature is in.
            if (_mode is PhoneCapture.Modes.Tester or PhoneCapture.Modes.Signature && Received.Any(a => a.IsSignature))
            {
                _timer.Stop();
                SetStatus("Signature received.", "OkBrush");
                await Task.Delay(900);
                Finish();
            }
        }
        finally { _polling = false; }
    }

    private void Finish()
    {
        _timer.Stop();
        if (IsLoaded) DialogResult = Received.Count > 0;
    }
}

// ======================================================= photos & signature

/// <summary>
/// The photos and signatures on a job or invoice: thumbnails, plus ways to
/// add more - from a phone, signed on this PC, from files, or (for an
/// invoice) copied from its job.
/// </summary>
public sealed class AttachmentsPanel : StackPanel
{
    private readonly ObservableCollection<Attachment> _items;
    private readonly WrapPanel _thumbs = new();
    private readonly TextBlock _empty = new()
    {
        Text = "No photos or signatures yet.",
        Foreground = Forms.Res("FaintText"),
        Margin = new Thickness(0, 14, 0, 14),
        HorizontalAlignment = HorizontalAlignment.Center,
    };
    private readonly string _record, _label, _signerName;

    public List<Attachment> Items => _items.ToList();

    /// <param name="recordId">The id the phone relay files uploads under.</param>
    /// <param name="fromJob">For an invoice: its job's photos, offered for copying.</param>
    public AttachmentsPanel(string recordId, string label, IEnumerable<Attachment> items, string signerName,
        Func<List<Attachment>>? fromJob = null)
    {
        _record = recordId;
        _label = label;
        _signerName = signerName;
        _items = new ObservableCollection<Attachment>(items);
        _items.CollectionChanged += (_, _) => Render();

        var bar = new WrapPanel { Margin = new Thickness(0, 0, 0, 10) };
        bar.Children.Add(Forms.Btn("Use My Phone…", (_, _) => FromPhone(PhoneCapture.Modes.Both), primary: true, glyph: Glyphs.Phone));
        bar.Children.Add(Forms.Btn("Client Signs on Phone…", (_, _) => FromPhone(PhoneCapture.Modes.Signature), glyph: Glyphs.Phone));
        bar.Children.Add(Forms.Btn("Client Signs Here…", (_, _) => SignHere(), glyph: Glyphs.Pen));
        bar.Children.Add(Forms.Btn("Add Photos from PC…", (_, _) => AddFiles(), glyph: Glyphs.Photo));
        if (fromJob is not null)
            bar.Children.Add(Forms.Btn("Copy from Job…", (_, _) => CopyFromJob(fromJob), glyph: Glyphs.Job));
        foreach (var b in bar.Children.OfType<Button>()) b.Margin = new Thickness(0, 0, 8, 6);
        Children.Add(bar);

        Children.Add(new Border
        {
            Background = Forms.Res("CardBrush"),
            BorderBrush = Forms.Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(10),
            MinHeight = 120,
            Child = new StackPanel { Children = { _thumbs, _empty } },
        });
        Children.Add(Forms.Note("The latest signature goes on the certificate or invoice; photos print under the results. Double-click a photo to add a caption."));
        Render();
    }

    private void Render()
    {
        _thumbs.Children.Clear();
        foreach (var a in _items) _thumbs.Children.Add(Thumb(a, Remove));
        _empty.Visibility = _items.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
    }

    private void Remove(Attachment a)
    {
        var w = Window.GetWindow(this);
        if (Forms.Confirm(w, "Remove", a.IsSignature ? "Remove this signature?" : "Remove this photo?"))
            _items.Remove(a);
    }

    /// <summary>A thumbnail with a PHOTO/SIGNED badge; double-click to view or caption.</summary>
    internal static FrameworkElement Thumb(Attachment a, Action<Attachment>? onRemove)
    {
        var img = new Image
        {
            Source = ImageTools.FromDataUrl(a.DataUrl),
            Width = 128,
            Height = 96,
            Stretch = a.IsSignature ? Stretch.Uniform : Stretch.UniformToFill,
        };
        var grid = new Grid { Width = 128, Height = 96 };
        grid.Children.Add(img);
        grid.Children.Add(new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(170, 15, 23, 42)),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(5, 1, 5, 1),
            Margin = new Thickness(4),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Bottom,
            Child = new TextBlock
            {
                Text = a.IsSignature ? "SIGNED" + (a.Note.Length > 0 ? " · " + a.Note : "") : a.Note.Length > 0 ? a.Note : "PHOTO",
                Foreground = Brushes.White,
                FontSize = 9,
                FontWeight = FontWeights.Bold,
                MaxWidth = 110,
                TextTrimming = TextTrimming.CharacterEllipsis,
            },
        });
        if (onRemove is not null)
        {
            var x = new Button
            {
                Content = new TextBlock { Text = Glyphs.Close, FontFamily = Ui.IconFont, FontSize = 9 },
                Width = 22,
                Height = 22,
                Padding = new Thickness(0),
                Margin = new Thickness(3),
                HorizontalAlignment = HorizontalAlignment.Right,
                VerticalAlignment = VerticalAlignment.Top,
                ToolTip = "Remove",
            };
            x.Click += (_, _) => onRemove(a);
            grid.Children.Add(x);
        }
        var border = new Border
        {
            Child = grid,
            Background = Brushes.White,
            BorderBrush = Forms.Res(a.IsSignature ? "OkBrush" : "BorderBrush"),
            BorderThickness = new Thickness(a.IsSignature ? 2 : 1),
            CornerRadius = new CornerRadius(6),
            Margin = new Thickness(0, 0, 8, 8),
            ClipToBounds = true,
            ToolTip = (a.IsSignature ? "Signed" : "Photo") + (a.LocalDate.Length > 0 ? " " + a.LocalDate : "") + (a.Note.Length > 0 ? " - " + a.Note : ""),
            Cursor = Cursors.Hand,
        };
        border.MouseLeftButtonDown += (_, e) =>
        {
            if (e.ClickCount != 2) return;
            var owner = Window.GetWindow(border);
            var dlg = new ImagePreviewWindow(a, editable: onRemove is not null) { Owner = owner };
            if (dlg.ShowDialog() == true && onRemove is not null && owner is not null)
            {
                // Re-render the panel that owns this thumbnail with the new caption.
                var panel = FindParent<AttachmentsPanel>(border);
                panel?.Render();
            }
        };
        return border;
    }

    private static T? FindParent<T>(DependencyObject d) where T : DependencyObject
    {
        while (d is not null)
        {
            d = VisualTreeHelper.GetParent(d);
            if (d is T t) return t;
        }
        return null;
    }

    private void FromPhone(string mode)
    {
        var dlg = new PhoneCaptureWindow(_record, _label, mode, _items.Select(i => i.Id)) { Owner = Window.GetWindow(this) };
        dlg.ShowDialog();
        foreach (var a in dlg.Received) _items.Add(a); // kept even if the window was closed with the X
    }

    private void SignHere()
    {
        var dlg = new SignaturePadWindow("Client Signature", "Hand the laptop to the client to sign" + (_label.Length > 0 ? " for " + _label : "") + ".",
            askName: true, defaultName: _signerName) { Owner = Window.GetWindow(this) };
        if (dlg.ShowDialog() == true && dlg.Result is not null) _items.Add(dlg.Result);
    }

    private void AddFiles()
    {
        var dlg = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Add Photos",
            Filter = "Photos|*.jpg;*.jpeg;*.png;*.bmp;*.gif;*.tif;*.tiff;*.heic;*.webp|All files|*.*",
            Multiselect = true,
        };
        if (dlg.ShowDialog(Window.GetWindow(this)) != true) return;
        var failed = new List<string>();
        Cursor = Cursors.Wait;
        try
        {
            foreach (var f in dlg.FileNames)
            {
                try { _items.Add(new Attachment { Kind = "photo", DataUrl = ImageTools.PhotoFromFile(f) }); }
                catch (Exception e) when (e is NotSupportedException or System.IO.IOException or UnauthorizedAccessException or System.IO.FileFormatException or InvalidOperationException or ArgumentException)
                { failed.Add(System.IO.Path.GetFileName(f)); }
            }
        }
        finally { Cursor = null; }
        if (failed.Count > 0)
            Forms.Error(Window.GetWindow(this), "Add Photos", "Couldn't read: " + string.Join(", ", failed)
                + "\n\nHEIC photos need Microsoft's free \"HEIF Image Extensions\" from the Store - or send them with Use My Phone, which converts them.");
    }

    private void CopyFromJob(Func<List<Attachment>> fromJob)
    {
        var have = _items.Select(i => i.DataUrl).ToHashSet();
        var list = fromJob().Where(a => !a.IsSignature && !have.Contains(a.DataUrl)).ToList();
        if (list.Count == 0)
        {
            Forms.Error(Window.GetWindow(this), "Copy from Job", "The job has no photos that aren't already here. (Link a job with \"Invoice a Job…\" first.)");
            return;
        }
        foreach (var a in list)
            // A new id: the same photo on the job and on the invoice are stored separately.
            _items.Add(new Attachment { Kind = a.Kind, Note = a.Note, CreatedAt = a.CreatedAt, DataUrl = a.DataUrl });
    }
}

/// <summary>Hosts <see cref="AttachmentsPanel"/> as a dialog.</summary>
public sealed class AttachmentsWindow : EditorDialog
{
    public AttachmentsPanel Panel { get; }

    public AttachmentsWindow(string title, AttachmentsPanel panel) : base(title, 760, 560)
    {
        Panel = panel;
        FormPanel.Children.Add(panel);
        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("OK", (_, _) => DialogResult = true, primary: true, glyph: Ui.GCheck));
    }
}

/// <summary>A photo or signature at full size, with its caption.</summary>
public sealed class ImagePreviewWindow : Window
{
    public ImagePreviewWindow(Attachment a, bool editable)
    {
        Title = a.IsSignature ? "Signature" : "Photo";
        Width = 820;
        Height = 700;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = Forms.Res("AppBackground");

        var root = new DockPanel { Margin = new Thickness(14) };
        var bottom = new StackPanel { Margin = new Thickness(0, 10, 0, 0) };
        DockPanel.SetDock(bottom, Dock.Bottom);
        var note = Forms.Tb(a.Note);
        note.IsReadOnly = !editable;
        bottom.Children.Add(Forms.Field(a.IsSignature ? "Signed by" : "Caption (prints under the photo)", note));
        var bar = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
        bar.Children.Add(Forms.Btn(editable ? "Cancel" : "Close", (_, _) => Close()));
        if (editable)
            bar.Children.Add(Forms.Btn("OK", (_, _) => { a.Note = note.Text.Trim(); DialogResult = true; }, primary: true));
        bottom.Children.Add(bar);
        root.Children.Add(bottom);
        root.Children.Add(new Border
        {
            Background = Brushes.White,
            BorderBrush = Forms.Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            Child = new Image { Source = ImageTools.FromDataUrl(a.DataUrl), Stretch = Stretch.Uniform, Margin = new Thickness(6) },
        });
        Content = root;
    }
}
