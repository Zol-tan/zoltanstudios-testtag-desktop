using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

// ===================================================================== helpers

internal static class Ui
{
    public static Brush Res(string key) => (Brush)Application.Current.Resources[key];

    /// <summary>A DataGrid styled consistently for every list in the app.</summary>
    public static DataGrid Grid()
    {
        return new DataGrid
        {
            AutoGenerateColumns = false,
            IsReadOnly = true,
            CanUserAddRows = false,
            HeadersVisibility = DataGridHeadersVisibility.Column,
            GridLinesVisibility = DataGridGridLinesVisibility.Horizontal,
            HorizontalGridLinesBrush = Res("BorderBrush"),
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            Background = Brushes.White,
            RowBackground = Brushes.White,
            AlternatingRowBackground = new SolidColorBrush(Color.FromRgb(250, 251, 252)),
            FontSize = 12,
            RowHeight = 30,
            MinHeight = 240,
        };
    }

    public static DataGridTextColumn Col(string header, string path, double width = 0)
    {
        var c = new DataGridTextColumn
        {
            Header = header,
            Binding = new System.Windows.Data.Binding(path),
        };
        c.Width = width > 0
            ? new DataGridLength(width)
            : new DataGridLength(1, DataGridLengthUnitType.Star);
        return c;
    }

    /// <summary>Small stat tile used across the dashboard.</summary>
    public static Border Tile(string number, string label, string brushKey = "HeadingText")
    {
        var stack = new StackPanel();
        stack.Children.Add(new TextBlock
        {
            Text = number, FontSize = 26, FontWeight = FontWeights.Bold,
            Foreground = Res(brushKey),
        });
        stack.Children.Add(new TextBlock
        {
            Text = label, FontSize = 11, Foreground = Res("MutedText"),
        });
        return new Border
        {
            Background = Brushes.White,
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(16, 12, 16, 12),
            Margin = new Thickness(0, 0, 10, 0),
            MinWidth = 116,
            Child = stack,
        };
    }

    public static TextBlock Empty(string message) => new()
    {
        Text = message,
        Foreground = Res("MutedText"),
        FontSize = 13,
        Margin = new Thickness(0, 10, 0, 0),
        TextWrapping = TextWrapping.Wrap,
    };
}

// =================================================================== dashboard

public sealed class DashboardModule : ModuleBase
{
    public DashboardModule() : base(
        "Dashboard",
        "Retests due, outstanding invoices and recent activity.")
    {
        var jobs = Repository.GetJobs();
        var invoices = Repository.GetInvoices();

        var overdue = jobs.Count(j => j.DaysUntilRetest < 0);
        var dueSoon = jobs.Count(j => j.DaysUntilRetest is >= 0 and <= 60);
        var unpaid = invoices.Count(i => i.IsUnpaid);
        var pending = Repository.PendingSyncCount();

        var tiles = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 20) };
        tiles.Children.Add(Ui.Tile(jobs.Count.ToString(), "Jobs"));
        tiles.Children.Add(Ui.Tile(overdue.ToString(), "Retests overdue", overdue > 0 ? "BadBrush" : "HeadingText"));
        tiles.Children.Add(Ui.Tile(dueSoon.ToString(), "Due in 60 days", dueSoon > 0 ? "WarnBrush" : "HeadingText"));
        tiles.Children.Add(Ui.Tile(unpaid.ToString(), "Unpaid invoices", unpaid > 0 ? "WarnBrush" : "HeadingText"));
        tiles.Children.Add(Ui.Tile(pending.ToString(), "Waiting to sync", pending > 0 ? "AccentBrush" : "HeadingText"));
        Body.Children.Add(tiles);

        var due = jobs.Where(j => j.DaysUntilRetest <= 60)
                      .OrderBy(j => j.DaysUntilRetest).Take(10).ToList();

        Body.Children.Add(new TextBlock
        {
            Text = "Coming up", FontSize = 14, FontWeight = FontWeights.SemiBold,
            Foreground = Ui.Res("HeadingText"), Margin = new Thickness(0, 0, 0, 8),
        });

        if (due.Count == 0)
        {
            Body.Children.Add(Ui.Empty(jobs.Count == 0
                ? "No jobs yet. Sync with the server, or create one under Test & Tag."
                : "Nothing due in the next 60 days."));
        }
        else
        {
            var g = Ui.Grid();
            g.Columns.Add(Ui.Col("Certificate", nameof(Job.CertNumber), 110));
            g.Columns.Add(Ui.Col("Site", nameof(Job.SiteAddress)));
            g.Columns.Add(Ui.Col("Tested", nameof(Job.TestDate), 100));
            g.Columns.Add(Ui.Col("Due", nameof(Job.NextDue), 100));
            g.ItemsSource = due;
            Body.Children.Add(g);
        }
    }
}

// ==================================================================== test&tag

public sealed class TestTagModule : ModuleBase
{
    public TestTagModule(string view = "") : base(
        Heading(view),
        "AS/NZS 3760:2022 compliance records, certificates and generator inspections.")
    {
        var jobs = Repository.GetJobs(includeItems: true);

        var filtered = view switch
        {
            "due"       => jobs.Where(j => j.DaysUntilRetest <= 60).OrderBy(j => j.DaysUntilRetest).ToList(),
            "generator" => jobs.Where(j => j.IsGenerator).ToList(),
            _           => jobs,
        };

        if (view == "assets")
        {
            BuildAssetRegister(jobs);
            return;
        }

        var bar = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        var newBtn = new Button
        {
            Content = "New Job",
            Padding = new Thickness(14, 6, 14, 6),
            Background = Ui.Res("AccentBrush"),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
        };
        newBtn.Click += (_, _) => OpenJob(null);
        bar.Children.Add(newBtn);
        Body.Children.Add(bar);

        if (filtered.Count == 0)
        {
            Body.Children.Add(Ui.Empty(jobs.Count == 0
                ? "No jobs stored locally yet. Use Sync ▸ Sync Now to pull them from the server."
                : "No jobs match this view."));
            return;
        }

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("Certificate", nameof(Job.CertNumber), 110));
        g.Columns.Add(Ui.Col("Site", nameof(Job.SiteAddress)));
        g.Columns.Add(Ui.Col("Tested", nameof(Job.TestDate), 100));
        g.Columns.Add(Ui.Col("Next due", nameof(Job.NextDue), 100));
        g.Columns.Add(Ui.Col("Items", nameof(Job.ItemCount), 60));
        g.Columns.Add(Ui.Col("Failed", nameof(Job.FailCount), 60));
        g.ItemsSource = filtered;

        // Double-click is what people expect from a list in a desktop app.
        g.MouseDoubleClick += (_, _) =>
        {
            if (g.SelectedItem is Job j) OpenJob(j);
        };

        Body.Children.Add(new TextBlock
        {
            Text = "Double-click a job to open it.",
            FontSize = 11,
            Foreground = Ui.Res("FaintText"),
            Margin = new Thickness(0, 6, 0, 0),
        });
        Body.Children.Add(g);
    }

    private void BuildAssetRegister(List<Job> jobs)
    {
        var rows = jobs.SelectMany(j => j.Items.Select(i => new
        {
            Certificate = j.CertNumber,
            Site = j.SiteAddress,
            Tag = i.TagNumber,
            i.Description,
            i.Location,
            Class = i.EquipmentClass,
            i.Result,
            Due = j.NextDue,
        })).ToList();

        if (rows.Count == 0)
        {
            Body.Children.Add(Ui.Empty("No tested items stored locally yet."));
            return;
        }

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("Tag", "Tag", 90));
        g.Columns.Add(Ui.Col("Description", "Description"));
        g.Columns.Add(Ui.Col("Location", "Location", 130));
        g.Columns.Add(Ui.Col("Class", "Class", 55));
        g.Columns.Add(Ui.Col("Result", "Result", 70));
        g.Columns.Add(Ui.Col("Certificate", "Certificate", 105));
        g.Columns.Add(Ui.Col("Next due", "Due", 100));
        g.ItemsSource = rows;
        Body.Children.Add(g);
    }

    /// <summary>Opens the editor, then reloads so the list reflects any change.</summary>
    private void OpenJob(Job? job)
    {
        var full = job is null ? null : Repository.GetJob(job.Id);
        var editor = new JobEditorWindow(full) { Owner = Window.GetWindow(this) };
        if (editor.ShowDialog() == true)
        {
            // Rebuilding the module is the simplest way to refresh every
            // derived figure (counts, due dates) without tracking them.
            if (Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
        }
    }

    private static string Heading(string view) => view switch
    {
        "due"       => "Retest Due",
        "generator" => "Generator Reports",
        "assets"    => "Asset Register",
        _           => "Test & Tag",
    };
}

// ===================================================================== clients

public sealed class ClientsModule : ModuleBase
{
    public ClientsModule() : base(
        "Clients",
        "Contact details, sites and job history.")
    {
        var clients = Repository.GetClients();
        if (clients.Count == 0)
        {
            Body.Children.Add(Ui.Empty(
                "No clients stored locally yet. Use Sync ▸ Sync Now to pull them from the server."));
            return;
        }

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("Name", nameof(Client.Name), 170));
        g.Columns.Add(Ui.Col("Company", nameof(Client.Company)));
        g.Columns.Add(Ui.Col("Email", nameof(Client.Email), 200));
        g.Columns.Add(Ui.Col("Phone", nameof(Client.Phone), 130));
        g.ItemsSource = clients;
        g.MouseDoubleClick += (_, _) => { if (g.SelectedItem is Client c) Edit(c); };
        Body.Children.Add(g);
        Body.Children.Add(new TextBlock
        {
            Text = "Double-click a client to edit.",
            FontSize = 11, Foreground = Ui.Res("FaintText"),
            Margin = new Thickness(0, 6, 0, 0),
        });
    }

    private void Edit(Client? c)
    {
        var w = new ClientEditorWindow(c) { Owner = Window.GetWindow(this) };
        if (w.ShowDialog() == true && Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
    }
}

// ==================================================================== invoices

public sealed class InvoicesModule : ModuleBase
{
    public InvoicesModule(string view = "") : base(
        view == "unpaid" ? "Unpaid Invoices" : "Invoices",
        "Raise invoices from completed jobs and track what's outstanding.")
    {
        var all = Repository.GetInvoices();
        var rows = view == "unpaid" ? all.Where(i => i.IsUnpaid).ToList() : all;

        var bar = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        var add = new Button
        {
            Content = "New Invoice",
            Padding = new Thickness(14, 6, 14, 6),
            Background = Ui.Res("AccentBrush"),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
        };
        add.Click += (_, _) => Edit(null);
        bar.Children.Add(add);

        var fromJob = new Button
        {
            Content = "Invoice a Job...",
            Padding = new Thickness(14, 6, 14, 6),
            Margin = new Thickness(8, 0, 0, 0),
        };
        fromJob.Click += (_, _) => Edit(null);
        bar.Children.Add(fromJob);
        Body.Children.Add(bar);

        if (rows.Count == 0)
        {
            Body.Children.Add(Ui.Empty(all.Count == 0
                ? "No invoices stored locally yet. Use Sync ▸ Sync Now to pull them from the server."
                : "Nothing outstanding."));
            return;
        }

        var g = Ui.Grid();
        g.Columns.Add(Ui.Col("Number", nameof(Invoice.Number), 120));
        g.Columns.Add(Ui.Col("Issued", nameof(Invoice.IssuedDate), 100));
        g.Columns.Add(Ui.Col("Due", nameof(Invoice.DueDate), 100));
        g.Columns.Add(Ui.Col("Total", nameof(Invoice.Total), 90));
        g.Columns.Add(Ui.Col("Status", nameof(Invoice.Status), 90));
        g.ItemsSource = rows;
        g.MouseDoubleClick += (_, _) => { if (g.SelectedItem is Invoice i) Edit(i); };
        Body.Children.Add(g);
        Body.Children.Add(new TextBlock
        {
            Text = "Double-click an invoice to edit. Use \"Invoice a Job\" to bill a completed job.",
            FontSize = 11, Foreground = Ui.Res("FaintText"),
            Margin = new Thickness(0, 6, 0, 0),
        });
    }

    private void Edit(Invoice? inv)
    {
        var w = new InvoiceEditorWindow(inv) { Owner = Window.GetWindow(this) };
        if (w.ShowDialog() == true && Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
    }
}

// ==================================================================== calendar

/// <summary>
/// Bookings (the website's "events") plus retests coming due. Bookings are
/// stored locally and synced, so they can be added and changed offline;
/// booking requests clients make in the portal arrive as "pending" and are
/// confirmed or declined here.
/// </summary>
public sealed class CalendarModule : ModuleBase
{
    private sealed class Row
    {
        public string When { get; init; } = "";
        public string What { get; init; } = "";
        public string Client { get; init; } = "";
        public string Status { get; init; } = "";
        public Appointment? Booking { get; init; }
    }

    private readonly DataGrid _grid = Ui.Grid();
    private readonly string _view;

    public CalendarModule(string view = "") : base(
        view == "pending" ? "Booking Requests" : "Calendar",
        view == "pending"
            ? "Requests clients made through the portal. Confirm or decline them; the client sees the change after the next sync."
            : "Bookings, site visits and scheduled retests. Changes sync to the client portal.")
    {
        _view = view;

        var bar = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        bar.Children.Add(Forms.Btn("New Booking", (_, _) => Edit(null), primary: true));
        bar.Children.Add(Forms.Btn("Edit", (_, _) => { if (Selected() is { } a) Edit(a); }));
        bar.Children.Add(Forms.Btn("Confirm", (_, _) => SetStatus("confirmed")));
        bar.Children.Add(Forms.Btn("Decline", (_, _) => SetStatus("cancelled")));
        bar.Children.Add(Forms.Btn("Delete", (_, _) => Delete()));
        Body.Children.Add(bar);

        var appts = Repository.GetAppointments();
        var clients = Repository.GetClients().ToDictionary(c => c.Id, c => c.Display);
        string ClientName(string? id) => id is not null && clients.TryGetValue(id, out var n) ? n : "";

        var from = DateTime.Today.AddDays(-30).ToString("yyyy-MM-dd");
        var bookings = appts
            .Where(a => view == "pending" ? a.Status == "pending" : string.CompareOrdinal(a.Date, from) >= 0)
            .Select(a => new Row
            {
                When = a.Date + (a.Time.Length > 0 ? " " + a.Time : ""),
                What = a.Title + (a.Location.Length > 0 ? " — " + a.Location : ""),
                Client = ClientName(a.ClientId),
                Status = a.Status,
                Booking = a,
            });

        var rows = view == "pending"
            ? bookings.OrderBy(r => r.When).ToList()
            : bookings.Concat(Repository.GetJobs()
                    .Where(j => j.DaysUntilRetest is >= 0 and <= 120)
                    .Select(j => new Row
                    {
                        When = j.NextDue,
                        What = "Retest due — " + (j.SiteAddress.Length > 0 ? j.SiteAddress : j.CertNumber),
                        Client = ClientName(j.ClientId),
                        Status = "retest",
                    }))
                .OrderBy(r => r.When).ToList();

        if (rows.Count == 0)
        {
            Body.Children.Add(Ui.Empty(view == "pending"
                ? "No booking requests waiting. Sync to check for new ones."
                : "Nothing scheduled from the last 30 days on, and no retests due in the next four months."));
            return;
        }

        _grid.Columns.Add(Ui.Col("Date", nameof(Row.When), 130));
        _grid.Columns.Add(Ui.Col("What", nameof(Row.What)));
        _grid.Columns.Add(Ui.Col("Client", nameof(Row.Client), 200));
        _grid.Columns.Add(Ui.Col("Status", nameof(Row.Status), 90));
        _grid.ItemsSource = rows;
        _grid.MouseDoubleClick += (_, _) => { if (Selected(quiet: true) is { } a) Edit(a); };
        Body.Children.Add(_grid);
        Body.Children.Add(new TextBlock
        {
            Text = "Double-click a booking to edit it. Retests come from test and tag jobs.",
            FontSize = 11, Foreground = Ui.Res("FaintText"), Margin = new Thickness(0, 6, 0, 0),
        });
    }

    private Appointment? Selected(bool quiet = false)
    {
        if (_grid.SelectedItem is Row { Booking: { } a }) return a;
        if (!quiet)
            MessageBox.Show(Window.GetWindow(this), "Select a booking first (retests can't be edited here).",
                "Calendar", MessageBoxButton.OK, MessageBoxImage.Information);
        return null;
    }

    private void Reload()
    {
        if (Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
    }

    private void Edit(Appointment? a)
    {
        if (new AppointmentEditorWindow(a) { Owner = Window.GetWindow(this) }.ShowDialog() == true) Reload();
    }

    private void SetStatus(string status)
    {
        if (Selected() is not { } a) return;
        a.Status = status;
        Repository.SaveAppointment(a);
        Reload();
    }

    private void Delete()
    {
        if (Selected() is not { } a) return;
        if (MessageBox.Show(Window.GetWindow(this), $"Delete \"{a.Title}\" on {a.Date}? It's removed from the website on the next sync.",
                "Delete booking", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes) return;
        Repository.DeleteAppointment(a.Id);
        Reload();
    }
}

// ==================================================================== settings

public sealed class SettingsModule : ModuleBase
{
    public SettingsModule() : base(
        "Settings",
        "Tester details, equipment and the connection to zoltanstudios.au.")
    {
        AddRow("Server", Repository.GetSetting("ServerUrl", "https://zoltanstudios.au"));
        AddRow("Signed in as", Repository.GetSetting("SignedInAs", "not signed in"));
        AddRow("Last sync", Repository.GetSetting("LastSync", "never"));
        AddRow("Waiting to sync", Repository.PendingSyncCount() + " change(s)");
        AddRow("Database", Database.Path);

        BuildSyncProblems();
        BuildRateEditor();
    }

    /// <summary>
    /// Changes the server refused, with its reason. Shown rather than retried
    /// silently forever - hidden failures caused real trouble before.
    /// </summary>
    private void BuildSyncProblems()
    {
        var problems = Repository.SyncProblems();
        Body.Children.Add(new TextBlock
        {
            Text = "Sync problems",
            FontSize = 15, FontWeight = FontWeights.SemiBold, Foreground = Ui.Res("HeadingText"),
            Margin = new Thickness(0, 24, 0, 6),
        });
        if (problems.Count == 0)
        {
            Body.Children.Add(Ui.Empty("None. Everything queued has been sent, or hasn't been tried yet."));
            return;
        }

        var g = Ui.Grid();
        g.MinHeight = 100;
        g.Columns.Add(Ui.Col("What", nameof(Repository.SyncProblem.Table), 100));
        g.Columns.Add(Ui.Col("Change", nameof(Repository.SyncProblem.Operation), 70));
        g.Columns.Add(Ui.Col("Tries", nameof(Repository.SyncProblem.Attempts), 50));
        g.Columns.Add(Ui.Col("Reason from the server", nameof(Repository.SyncProblem.Error)));
        g.ItemsSource = problems;
        Body.Children.Add(g);

        var discard = Forms.Btn("Stop trying to send selected", (_, _) =>
        {
            if (g.SelectedItem is not Repository.SyncProblem p) return;
            if (MessageBox.Show(Window.GetWindow(this),
                    "Stop sending this change? It stays in the suite but won't reach the website unless you edit and save it again.",
                    "Sync problems", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes) return;
            Repository.DiscardQueued(p.Table, p.RowId);
            if (Window.GetWindow(this) is MainWindow mw) mw.ReloadCurrent();
        });
        discard.HorizontalAlignment = HorizontalAlignment.Left;
        discard.Margin = new Thickness(0, 8, 0, 0);
        Body.Children.Add(discard);
    }

    /// <summary>
    /// Every price the quoting tools use, editable here so a rate change never
    /// needs a rebuild. Grouped by service because that's how they're changed.
    /// </summary>
    private void BuildRateEditor()
    {
        var rates = Rates.Load();
        var boxes = new Dictionary<string, TextBox>();

        Body.Children.Add(new TextBlock
        {
            Text = "Rates",
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = Ui.Res("HeadingText"),
            Margin = new Thickness(0, 24, 0, 2),
        });
        Body.Children.Add(new TextBlock
        {
            Text = "Used by the Quote Calculator. Test & tag and 3D printing match the website — "
                 + "if you change them here, change them on the site too.",
            FontSize = 11,
            Foreground = Ui.Res("MutedText"),
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 12),
        });

        void Group(string heading, params (string Prop, string Label)[] fields)
        {
            Body.Children.Add(new TextBlock
            {
                Text = heading,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = Ui.Res("BodyText"),
                Margin = new Thickness(0, 12, 0, 6),
            });

            var wrap = new WrapPanel();
            foreach (var (prop, label) in fields)
            {
                var pi = typeof(Rates).GetProperty(prop);
                if (pi is null) continue;

                var box = new TextBox
                {
                    Text = Convert.ToString(pi.GetValue(rates)) ?? "",
                    Width = 90,
                    Padding = new Thickness(5, 3, 5, 3),
                    Margin = new Thickness(0, 0, 0, 8),
                };
                boxes[prop] = box;

                var stack = new StackPanel { Margin = new Thickness(0, 0, 16, 0), Width = 150 };
                stack.Children.Add(new TextBlock
                {
                    Text = label, FontSize = 10,
                    Foreground = Ui.Res("MutedText"),
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 2),
                });
                stack.Children.Add(box);
                wrap.Children.Add(stack);
            }
            Body.Children.Add(wrap);
        }

        Group("Test & Tag",
            ("CallOut", "Call-out ($)"), ("CallOutIncludes", "Items included"),
            ("PerItemStandard", "Standard ($)"), ("PerItemPowerTool", "Power tool ($)"),
            ("PerItemRcd", "RCD ($)"), ("PerItemMicrowave", "Microwave ($)"),
            ("PerItem100", "100+ items ($)"), ("PerItem200", "200+ items ($)"));

        Group("PC Building",
            ("PcBuildLabour", "Build labour ($)"), ("PcBuildOsSetup", "OS setup ($)"),
            ("PcPartsMarkupPercent", "Parts handling (%)"));

        Group("Electronic Repairs",
            ("RepairDiagnostic", "Diagnostic ($)"), ("RepairHourly", "Hourly ($)"),
            ("RepairMinimum", "Minimum ($)"));

        Group("Data Recovery",
            ("RecoveryLogical", "Logical ($)"), ("RecoveryPhysical", "Physical ($)"),
            ("RecoveryPerGb", "Per GB ($)"));

        Group("Web & Marketing",
            ("WebSetup", "Web setup ($)"), ("WebPerPage", "Per page ($)"),
            ("WebHostingMonthly", "Hosting /mo ($)"), ("SeoMonthly", "SEO /mo ($)"),
            ("SocialMonthly", "Social /mo ($)"), ("ConsultingHourly", "Consulting /h ($)"));

        Group("Repair Parts",
            ("PartsMarkupPercent", "Parts markup (%) — applied to cost"));

        Group("General",
            ("GstPercent", "GST (%) — 0 if not registered"));

        var save = new Button
        {
            Content = "Save Rates",
            Padding = new Thickness(16, 6, 16, 6),
            HorizontalAlignment = HorizontalAlignment.Left,
            Background = Ui.Res("AccentBrush"),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(0, 12, 0, 0),
        };
        save.Click += (_, _) =>
        {
            foreach (var (prop, box) in boxes)
            {
                var pi = typeof(Rates).GetProperty(prop);
                if (pi is null) continue;
                if (pi.PropertyType == typeof(double) && double.TryParse(box.Text, out var d))
                    pi.SetValue(rates, d);
                else if (pi.PropertyType == typeof(int) && int.TryParse(box.Text, out var i))
                    pi.SetValue(rates, i);
            }
            rates.Save();
            MessageBox.Show("Rates saved.", "Settings",
                MessageBoxButton.OK, MessageBoxImage.Information);
        };
        Body.Children.Add(save);
    }

    private void AddRow(string label, string value)
    {
        var row = new Grid { Margin = new Thickness(0, 0, 0, 8) };
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(150) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        var l = new TextBlock
        {
            Text = label, FontSize = 12, Foreground = Ui.Res("MutedText"),
        };
        var v = new TextBlock
        {
            Text = value, FontSize = 12, Foreground = Ui.Res("BodyText"),
            TextWrapping = TextWrapping.Wrap,
        };
        Grid.SetColumn(v, 1);
        row.Children.Add(l);
        row.Children.Add(v);
        Body.Children.Add(row);
    }
}
