using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

// =================================================================== dashboard

public sealed class DashboardModule : ModuleBase
{
    private sealed class Upcoming
    {
        public string When { get; init; } = "";
        public string What { get; init; } = "";
        public string Kind { get; init; } = "";
        public Job? Job { get; init; }
        public Appointment? Booking { get; init; }
    }

    public DashboardModule() : base("Dashboard", Greeting())
    {
        var jobs = Repository.GetJobs();
        var invoices = Repository.GetInvoices();
        var bookings = Repository.GetAppointments();
        var clients = Repository.GetClients().ToDictionary(c => c.Id, c => c.Display);
        string ClientName(string? id) => id is not null && clients.TryGetValue(id, out var n) ? n : "";

        var overdue = jobs.Count(j => j.DaysUntilRetest < 0);
        var dueSoon = jobs.Count(j => j.DaysUntilRetest is >= 0 and <= 60);
        var unpaid = invoices.Where(i => i.IsUnpaid && Invoice.Normalise(i.Status) != "draft").ToList();
        var requests = bookings.Count(b => b.Status == "pending");
        var pending = Repository.PendingSyncCount();
        var problems = Repository.SyncProblems().Count;
        var lowParts = PartsCatalogue.LowStock().Count;
        var lowFilament = FilamentStock.Low().Count;
        var thisMonth = jobs.Count(j => j.TestDate.StartsWith(DateTime.Today.ToString("yyyy-MM")));

        MainWindow? Shell() => Window.GetWindow(this) as MainWindow;

        // ---- quick actions
        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("New Job", (_, _) => Shell()?.NewJob(), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Test & Tag App", (_, _) => Shell()?.Navigate("webapp"), glyph: Ui.GGlobe),
            Forms.Btn("New Invoice", (_, _) => Shell()?.NewInvoice(), glyph: Ui.GMoney),
            Forms.Btn("New Booking", (_, _) => Shell()?.NewBooking(), glyph: Ui.GCalendar),
            Forms.Btn("Sync Now", (_, _) => Shell()?.SyncNow(), glyph: Ui.GSync),
            Forms.Btn("Find", (_, _) => Shell()?.Navigate("find"), glyph: Ui.GSearch)));

        // ---- tiles
        var tiles = new WrapPanel { Margin = new Thickness(0, 0, 0, 4) };
        tiles.Children.Add(Clickable(Ui.Tile(thisMonth.ToString(), "Jobs this month", "AccentBrush", Ui.GBolt), "testtag"));
        tiles.Children.Add(Clickable(Ui.Tile(overdue.ToString(), "Retests overdue", overdue > 0 ? "BadBrush" : "OkBrush", Ui.GWarn), "testtag.due"));
        tiles.Children.Add(Clickable(Ui.Tile(dueSoon.ToString(), "Retests in 60 days", dueSoon > 0 ? "WarnBrush" : "OkBrush", Ui.GClock), "testtag.due"));
        tiles.Children.Add(Clickable(Ui.Tile($"${unpaid.Sum(i => i.Total):0}", $"Unpaid · {unpaid.Count} invoice(s)", unpaid.Count > 0 ? "WarnBrush" : "OkBrush", Ui.GMoney), "invoices.unpaid"));
        tiles.Children.Add(Clickable(Ui.Tile(requests.ToString(), "Booking requests", requests > 0 ? "VioletBrush" : "OkBrush", Ui.GCalendar), "calendar.pending"));
        tiles.Children.Add(Clickable(Ui.Tile((lowParts + lowFilament).ToString(), "Stock running low", lowParts + lowFilament > 0 ? "WarnBrush" : "OkBrush", Ui.GRepair), lowParts > 0 ? "parts.restock" : "filament"));
        tiles.Children.Add(Clickable(Ui.Tile(pending.ToString(), problems > 0 ? $"Waiting to sync · {problems} problem(s)" : "Waiting to sync",
            problems > 0 ? "BadBrush" : pending > 0 ? "AccentBrush" : "OkBrush", Ui.GSync), "settings"));
        Body.Children.Add(tiles);

        // ---- two columns: coming up / money
        var cols = new Grid();
        cols.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(3, GridUnitType.Star) });
        cols.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(16) });
        cols.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(2, GridUnitType.Star) });

        var today = DateTime.Today.ToString("yyyy-MM-dd");
        var horizon = DateTime.Today.AddDays(30).ToString("yyyy-MM-dd");
        var upcoming = jobs.Where(j => j.DaysUntilRetest <= 30)
            .Select(j => new Upcoming
            {
                When = j.NextDue,
                Kind = j.DaysUntilRetest < 0 ? "overdue" : "retest",
                What = (ClientName(j.ClientId) is { Length: > 0 } cn ? cn + " · " : "") + (j.SiteAddress.Length > 0 ? j.SiteAddress : j.CertNumber),
                Job = j,
            })
            .Concat(bookings.Where(b => b.Status != "cancelled" && string.CompareOrdinal(b.Date, today) >= 0 && string.CompareOrdinal(b.Date, horizon) <= 0)
                .Select(b => new Upcoming
                {
                    When = b.Date + (b.Time.Length > 0 ? " " + b.Time : ""),
                    Kind = b.Status == "pending" ? "pending" : "booking",
                    What = b.Title + (ClientName(b.ClientId) is { Length: > 0 } cn ? " · " + cn : ""),
                    Booking = b,
                }))
            .OrderBy(u => u.When).Take(12).ToList();

        FrameworkElement left;
        if (upcoming.Count == 0)
            left = Ui.Card(Ui.Heading("Nothing due in the next 30 days", Ui.GCheck, 14), 18);
        else
        {
            var g = Ui.Grid();
            g.Columns.Add(Ui.Col("Date", nameof(Upcoming.When), 120));
            g.Columns.Add(Ui.StatusCol("", nameof(Upcoming.Kind), 90));
            g.Columns.Add(Ui.Col("What", nameof(Upcoming.What)));
            g.ItemsSource = upcoming;
            g.MouseDoubleClick += (_, _) =>
            {
                if (g.SelectedItem is Upcoming { Job: { } j } && Repository.GetJob(j.Id) is { } full)
                { if (new JobEditorWindow(full) { Owner = Window.GetWindow(this) }.ShowDialog() == true) Shell()?.ReloadCurrent(); }
                else if (g.SelectedItem is Upcoming { Booking: { } b })
                { if (new AppointmentEditorWindow(b) { Owner = Window.GetWindow(this) }.ShowDialog() == true) Shell()?.ReloadCurrent(); }
            };
            left = Ui.GridCard(g, "Coming up — next 30 days", Ui.GCalendar);
        }
        cols.Children.Add(left);

        FrameworkElement right;
        var owing = unpaid.OrderBy(i => i.DueDate).Take(8)
            .Select(i => new { i.Number, Client = ClientName(i.ClientId), Total = $"${i.Total:0.00}", Status = Invoice.Normalise(i.Status), Inv = i })
            .ToList();
        if (owing.Count == 0)
            right = Ui.Card(Ui.Heading("No unpaid invoices", Ui.GCheck, 14), 18);
        else
        {
            var g = Ui.Grid();
            g.Columns.Add(Ui.Col("Invoice", "Number", 90));
            g.Columns.Add(Ui.Col("Client", "Client"));
            g.Columns.Add(Ui.Col("Total", "Total", 80));
            g.Columns.Add(Ui.StatusCol("", "Status", 80));
            g.ItemsSource = owing;
            right = Ui.GridCard(g, "Waiting to be paid", Ui.GMoney);
        }
        Grid.SetColumn(right, 2);
        cols.Children.Add(right);
        Body.Children.Add(cols);

        if (jobs.Count == 0)
            Body.Children.Add(Ui.Empty("No jobs on this PC yet. Sign in under Sync ▸ Sync Settings and press F5 to pull everything from the website."));

        FrameworkElement Clickable(FrameworkElement tile, string key)
        {
            tile.Cursor = System.Windows.Input.Cursors.Hand;
            tile.ToolTip = "Open";
            tile.MouseLeftButtonUp += (_, _) => Shell()?.Navigate(key);
            return tile;
        }
    }

    private static string Greeting()
    {
        var h = DateTime.Now.Hour;
        var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
        var name = Repository.GetSetting("TesterName", "").Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return $"{part}{(name is null ? "" : ", " + name)} — {DateTime.Today:dddd d MMMM yyyy}.";
    }
}

// ==================================================================== test&tag

public sealed class TestTagModule : ModuleBase
{
    private sealed class JobRow
    {
        public Job Job { get; init; } = null!;
        public string Client { get; init; } = "";
        public string Cert => Job.CertNumber;
        public string Site => Job.SiteAddress;
        public string Tested => Job.TestDate;
        public string Due => Job.NextDue;
        public int Items => Job.ItemCount;
        public int Failed => Job.FailCount;
        public string State => Job.DaysUntilRetest < 0 ? "overdue" : Job.DaysUntilRetest <= 60 ? "due soon" : Job.FailCount > 0 ? "fail" : "pass";
    }

    public TestTagModule(string view = "") : base(
        Heading(view),
        view switch
        {
            "due" => "Jobs due for retest in the next 60 days, and any overdue. Email the client a reminder straight from here.",
            "generator" => "Generator inspection reports (AS/NZS 3010 observations).",
            "assets" => "Every tested item across every job — the equipment register AS/NZS 3760 expects you to keep.",
            _ => "AS/NZS 3760:2022 jobs stored in the suite. For photos, signatures and emailing, use the Test & Tag App.",
        })
    {
        var jobs = Repository.GetJobs(includeItems: true);
        var clients = Repository.GetClients();
        var names = clients.ToDictionary(c => c.Id, c => c.Display);

        if (view == "assets")
        {
            BuildAssetRegister(jobs);
            return;
        }

        var filtered = view switch
        {
            "due"       => jobs.Where(j => j.DaysUntilRetest <= 60).OrderBy(j => j.DaysUntilRetest).ToList(),
            "generator" => jobs.Where(j => j.IsGenerator).ToList(),
            _           => jobs,
        };
        var rows = filtered.Select(j => new JobRow { Job = j, Client = j.ClientId is not null && names.TryGetValue(j.ClientId, out var n) ? n : "" }).ToList();

        var g = Ui.Grid();
        var bar = Ui.Toolbar(
            Forms.Btn("New Job", (_, _) => OpenJob(null), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Open", (_, _) => { if (g.SelectedItem is JobRow r) OpenJob(r.Job); }, glyph: Ui.GEdit),
            Forms.Btn("Test & Tag App", (_, _) => (Window.GetWindow(this) as MainWindow)?.Navigate("webapp"), glyph: Ui.GGlobe));
        if (view == "due")
            bar.Children.Add(Forms.Btn("Email Reminder…", (_, _) => { if (g.SelectedItem is JobRow r) EmailReminder(r.Job, clients); }, glyph: Ui.GMail));
        Body.Children.Add(bar);

        if (rows.Count == 0)
        {
            Body.Children.Add(Ui.Empty(jobs.Count == 0
                ? "No jobs stored locally yet. Use Sync ▸ Sync Now (F5) to pull them from the server."
                : view == "due" ? "Nothing due in the next 60 days and nothing overdue." : "No jobs match this view."));
            return;
        }

        g.Columns.Add(Ui.StatusCol("", nameof(JobRow.State), 90));
        g.Columns.Add(Ui.Col("Certificate", nameof(JobRow.Cert), 105));
        g.Columns.Add(Ui.Col("Client", nameof(JobRow.Client), 180));
        g.Columns.Add(Ui.Col("Site", nameof(JobRow.Site)));
        g.Columns.Add(Ui.Col("Tested", nameof(JobRow.Tested), 95));
        g.Columns.Add(Ui.Col("Next due", nameof(JobRow.Due), 95));
        g.Columns.Add(Ui.Col("Items", nameof(JobRow.Items), 60));
        g.Columns.Add(Ui.Col("Failed", nameof(JobRow.Failed), 60));
        g.ItemsSource = rows;
        g.MouseDoubleClick += (_, _) => { if (g.SelectedItem is JobRow r) OpenJob(r.Job); };

        Body.Children.Add(Ui.GridCard(g, $"{rows.Count} job(s)", Ui.GBolt,
            new TextBlock { Text = "Double-click a job to open it", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
    }

    /// <summary>Opens the default mail program with a retest reminder filled in.</summary>
    private void EmailReminder(Job job, List<Client> clients)
    {
        var client = clients.FirstOrDefault(c => c.Id == job.ClientId);
        if (client is null || client.Email.Length == 0)
        {
            MessageBox.Show(Window.GetWindow(this), "This job has no client with an email address. Set the client on the job first.",
                "Email reminder", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        var first = client.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "there";
        var due = DateTime.TryParse(job.NextDue, out var d) ? d.ToString("d MMMM yyyy") : job.NextDue;
        var subject = $"Test and tag due {(job.DaysUntilRetest < 0 ? "(overdue)" : "soon")} — {job.SiteAddress}";
        var body =
            $"Hi {first},\n\n" +
            $"The electrical test and tag at {(job.SiteAddress.Length > 0 ? job.SiteAddress : "your site")} " +
            $"(certificate {job.CertNumber}, {job.ItemCount} items) is due for retest on {due}.\n\n" +
            "Reply to this email or call me to book a time that suits.\n\n" +
            $"Thanks,\n{Repository.GetSetting("TesterName", "ZoltanStudios")}\nZoltanStudios · zoltanstudios.au";
        var url = $"mailto:{Uri.EscapeDataString(client.Email)}?subject={Uri.EscapeDataString(subject)}&body={Uri.EscapeDataString(body)}";
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(url) { UseShellExecute = true }); }
        catch
        {
            Clipboard.SetText(body);
            MessageBox.Show(Window.GetWindow(this), $"No mail program is set up on this PC. The reminder text was copied — paste it into an email to {client.Email}.",
                "Email reminder", MessageBoxButton.OK, MessageBoxImage.Information);
        }
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
        g.Columns.Add(Ui.StatusCol("Result", "Result", 80));
        g.Columns.Add(Ui.Col("Tag", "Tag", 90));
        g.Columns.Add(Ui.Col("Description", "Description"));
        g.Columns.Add(Ui.Col("Location", "Location", 140));
        g.Columns.Add(Ui.Col("Class", "Class", 60));
        g.Columns.Add(Ui.Col("Certificate", "Certificate", 105));
        g.Columns.Add(Ui.Col("Site", "Site", 200));
        g.Columns.Add(Ui.Col("Next due", "Due", 95));
        g.ItemsSource = rows;
        Body.Children.Add(Ui.GridCard(g, $"{rows.Count} item(s) · {rows.Count(r => r.Result == "fail")} failed", Ui.GList));
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
        "Everyone you work for. Clients sync to the website as portal accounts.")
    {
        var clients = Repository.GetClients();
        var jobs = Repository.GetJobs();
        var invoices = Repository.GetInvoices();

        var g = Ui.Grid();
        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("New Client", (_, _) => Edit(null), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Edit", (_, _) => { if (Ui.Prop(g.SelectedItem, "C") is { } sel) Edit((Client)sel); }, glyph: Ui.GEdit)));

        if (clients.Count == 0)
        {
            Body.Children.Add(Ui.Empty("No clients stored locally yet. Use Sync ▸ Sync Now to pull them from the server, or add one."));
            return;
        }

        var rows = clients.Select(c => new
        {
            C = c,
            c.Name,
            c.Company,
            c.Email,
            c.Phone,
            Jobs = jobs.Count(j => j.ClientId == c.Id),
            Owing = invoices.Where(i => i.ClientId == c.Id && i.IsUnpaid && Invoice.Normalise(i.Status) != "draft").Sum(i => i.Total) is var o && o > 0 ? $"${o:0.00}" : "",
            Web = string.IsNullOrEmpty(c.ServerId) ? (c.Email.Length == 0 ? "no email" : "pending") : "active",
        }).ToList();

        g.Columns.Add(Ui.Col("Name", "Name", 170));
        g.Columns.Add(Ui.Col("Company", "Company"));
        g.Columns.Add(Ui.Col("Email", "Email", 210));
        g.Columns.Add(Ui.Col("Phone", "Phone", 120));
        g.Columns.Add(Ui.Col("Jobs", "Jobs", 55));
        g.Columns.Add(Ui.Col("Owing", "Owing", 85));
        g.Columns.Add(Ui.StatusCol("Portal", "Web", 90));
        g.ItemsSource = rows;
        g.MouseDoubleClick += (_, _) => { if (Ui.Prop(g.SelectedItem, "C") is { } sel) Edit((Client)sel); };
        Body.Children.Add(Ui.GridCard(g, $"{rows.Count} client(s)", Ui.GPeople,
            new TextBlock { Text = "Double-click to edit", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
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
        "Raise invoices from completed jobs and track what's outstanding. Anything but a draft appears in the client's portal.")
    {
        var all = Repository.GetInvoices();
        var names = Repository.GetClients().ToDictionary(c => c.Id, c => c.Display);
        var rows = (view == "unpaid" ? all.Where(i => i.IsUnpaid).ToList() : all)
            .Select(i => new
            {
                Inv = i,
                i.Number,
                Client = i.ClientId is not null && names.TryGetValue(i.ClientId, out var n) ? n : "",
                Issued = i.IssuedDate,
                Due = i.DueDate,
                Total = $"${i.Total:0.00}",
                Status = Invoice.Normalise(i.Status),
            }).ToList();

        var g = Ui.Grid();
        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("New Invoice", (_, _) => Edit(null), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Invoice a Job…", (_, _) => Edit(null), glyph: Ui.GBolt),
            Forms.Btn("Open", (_, _) => { if (Ui.Prop(g.SelectedItem, "Inv") is { } sel) Edit((Invoice)sel); }, glyph: Ui.GEdit)));

        var unpaid = all.Where(i => i.IsUnpaid && Invoice.Normalise(i.Status) != "draft").ToList();
        var tiles = new WrapPanel();
        tiles.Children.Add(Ui.Tile($"${unpaid.Sum(i => i.Total):0.00}", $"Outstanding · {unpaid.Count} invoice(s)", unpaid.Count > 0 ? "WarnBrush" : "OkBrush", Ui.GMoney));
        var overdueCount = unpaid.Count(i => string.CompareOrdinal(i.DueDate, DateTime.Today.ToString("yyyy-MM-dd")) < 0);
        tiles.Children.Add(Ui.Tile(overdueCount.ToString(), "Past their due date", overdueCount > 0 ? "BadBrush" : "OkBrush", Ui.GWarn));
        var month = DateTime.Today.ToString("yyyy-MM");
        tiles.Children.Add(Ui.Tile($"${all.Where(i => Invoice.Normalise(i.Status) == "paid" && i.IssuedDate.StartsWith(month)).Sum(i => i.Total):0.00}", "Paid, issued this month", "OkBrush", Ui.GCheck));
        Body.Children.Add(tiles);

        if (rows.Count == 0)
        {
            Body.Children.Add(Ui.Empty(all.Count == 0
                ? "No invoices stored locally yet. Use Sync ▸ Sync Now to pull them from the server."
                : "Nothing outstanding."));
            return;
        }

        g.Columns.Add(Ui.StatusCol("Status", "Status", 95));
        g.Columns.Add(Ui.Col("Number", "Number", 110));
        g.Columns.Add(Ui.Col("Client", "Client"));
        g.Columns.Add(Ui.Col("Issued", "Issued", 100));
        g.Columns.Add(Ui.Col("Due", "Due", 100));
        g.Columns.Add(Ui.Col("Total", "Total", 95));
        g.ItemsSource = rows;
        g.MouseDoubleClick += (_, _) => { if (Ui.Prop(g.SelectedItem, "Inv") is { } sel) Edit((Invoice)sel); };
        Body.Children.Add(Ui.GridCard(g, $"{rows.Count} invoice(s)", Ui.GMoney,
            new TextBlock { Text = "Double-click to open · Invoice a Job fills the lines from a job", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
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

        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("New Booking", (_, _) => Edit(null), primary: true, glyph: Ui.GAdd),
            Forms.Btn("Edit", (_, _) => { if (Selected() is { } a) Edit(a); }, glyph: Ui.GEdit),
            Forms.Btn("Confirm", (_, _) => SetStatus("confirmed"), glyph: Ui.GCheck),
            Forms.Btn("Decline", (_, _) => SetStatus("cancelled"), glyph: "\uE711"),
            Forms.Btn("Delete", (_, _) => Delete(), glyph: Ui.GDelete)));

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

        _grid.Columns.Add(Ui.StatusCol("Status", nameof(Row.Status), 100));
        _grid.Columns.Add(Ui.Col("Date", nameof(Row.When), 130));
        _grid.Columns.Add(Ui.Col("What", nameof(Row.What)));
        _grid.Columns.Add(Ui.Col("Client", nameof(Row.Client), 220));
        _grid.ItemsSource = rows;
        _grid.MouseDoubleClick += (_, _) => { if (Selected(quiet: true) is { } a) Edit(a); };
        Body.Children.Add(Ui.GridCard(_grid, $"{rows.Count} entr{(rows.Count == 1 ? "y" : "ies")}", Ui.GCalendar,
            new TextBlock { Text = "Double-click a booking to edit · retests come from jobs", Foreground = Ui.Res("FaintText"), FontSize = 11.5, VerticalAlignment = VerticalAlignment.Center }));
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
        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("Tester Defaults…", (_, _) =>
            {
                if (new TesterDefaultsWindow { Owner = Window.GetWindow(this) }.ShowDialog() == true)
                    (Window.GetWindow(this) as MainWindow)?.ReloadCurrent();
            }, glyph: Ui.GEdit),
            Forms.Btn("Pricing", (_, _) => (Window.GetWindow(this) as MainWindow)?.Navigate("pricing"), glyph: Ui.GTag)));

        _info = new StackPanel();
        _info.Children.Add(Ui.Heading("Connection and data", Ui.GSync, 14));
        _info.Children.Add(new Border { Height = 12 });
        AddRow("Server", Repository.GetSetting("ServerUrl", "https://zoltanstudios.au"));
        AddRow("Signed in as", Repository.GetSetting("SignedInAs", "not signed in"));
        AddRow("Last sync", Repository.GetSetting("LastSync", "never"));
        AddRow("Waiting to sync", Repository.PendingSyncCount() + " change(s)");
        AddRow("Database", Database.Path);
        AddRow("Tester", $"{Repository.GetSetting("TesterName", "(not set)")} · {Repository.GetSetting("TesterLicence", "no licence no. set")}");
        AddRow("Test equipment", $"{Repository.GetSetting("TestEquipment", "Wavecom TnT RCD")}" +
            (Repository.GetSetting("CalibrationDate", "") is { Length: > 0 } cd ? $" · calibrated {cd}" : " · calibration date not set"));
        Body.Children.Add(Ui.Card(_info, 18));

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
        Body.Children.Add(Ui.GridCard(g));

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
        var rateCard = new StackPanel();

        rateCard.Children.Add(new TextBlock
        {
            Text = "Rates",
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = Ui.Res("HeadingText"),
            Margin = new Thickness(0, 0, 0, 2),
        });
        rateCard.Children.Add(new TextBlock
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
            rateCard.Children.Add(new TextBlock
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
            rateCard.Children.Add(wrap);
        }

        Group("Test & Tag",
            ("CallOut", "Call-out ($)"), ("CallOutIncludes", "Items included"),
            ("PerItemStandard", "Standard ($)"), ("PerItemPowerTool", "Power tool ($)"),
            ("PerItemRcd", "RCD ($)"), ("PerItemMicrowave", "Microwave ($)"),
            ("PerItem100", "100+ items ($)"), ("PerItem200", "200+ items ($)"),
            ("IntroOfferPrice", "Intro offer ($ flat)"), ("IntroOfferItems", "Intro offer items"),
            ("ContractQuarterlyPercent", "Quarterly contract (% off)"), ("ContractAnnualPercent", "Annual contract (% off)"));

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
            BorderBrush = Ui.Res("AccentBrush"),
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
        rateCard.Children.Add(save);
        Body.Children.Add(Ui.Card(rateCard, 18));
    }

    private StackPanel _info = new();

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
        _info.Children.Add(row);
    }
}
