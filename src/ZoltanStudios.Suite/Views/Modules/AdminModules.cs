using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>
/// The admin-panel sections that live only on the server: projects, messages,
/// 3D print quotes and API tokens. They read and write the API directly (the
/// same calls admin.html makes), so they need a connection - and say so
/// plainly rather than showing an empty list.
///
/// All of them use <see cref="ApiClient.Shared"/>. The session lives in that
/// client's cookie jar; a fresh ApiClient would be signed out.
/// </summary>
public abstract class LiveModule : ModuleBase
{
    protected readonly StackPanel Toolbar = new() { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
    protected readonly StackPanel List = new();
    private readonly TextBlock _status = new() { FontSize = 11, Margin = new Thickness(0, 8, 0, 0), TextWrapping = TextWrapping.Wrap };

    protected static ApiClient Api => ApiClient.Shared;

    protected LiveModule(string title, string subtitle) : base(title, subtitle)
    {
        Toolbar.Children.Add(Forms.Btn("Refresh", async (_, _) => await ReloadAsync()));
        Body.Children.Add(Toolbar);
        Body.Children.Add(List);
        Body.Children.Add(_status);
        Loaded += async (_, _) => { if (!_loadedOnce) { _loadedOnce = true; await ReloadAsync(); } };
    }

    private bool _loadedOnce;

    protected Window? Owner => Window.GetWindow(this);

    public async Task ReloadAsync()
    {
        List.Children.Clear();
        List.Children.Add(Ui.Empty("Loading from the server..."));
        SetStatus("");

        if (!Api.IsSignedIn && !await Api.RestoreSessionAsync())
        {
            List.Children.Clear();
            List.Children.Add(Ui.Empty(
                "Not signed in to zoltanstudios.au. Use Sync ▸ Sync Settings to sign in, then press Refresh."));
            return;
        }

        try
        {
            await LoadAsync();
        }
        catch (Exception ex)
        {
            // Never swallow: a blank page with no reason is worse than an error.
            List.Children.Clear();
            List.Children.Add(Ui.Empty("Something went wrong loading this page: " + ex.Message));
        }
    }

    protected abstract Task LoadAsync();

    protected void SetStatus(string text, string brush = "FaintText")
    {
        _status.Text = text;
        _status.Foreground = Ui.Res(brush);
    }

    protected void ShowLoadError(string what, ApiResult r)
    {
        List.Children.Clear();
        List.Children.Add(Ui.Empty($"Couldn't load {what}: {r.Error}"));
    }

    /// <summary>Runs an action, reports a failure in full, reloads on success.</summary>
    protected async Task<bool> Act(Func<Task<ApiResult>> call, string done)
    {
        IsEnabled = false;
        try
        {
            var r = await call();
            if (!r.Ok)
            {
                Forms.Error(Owner, Title(), r.Error);
                return false;
            }
            await ReloadAsync();
            SetStatus(done, "OkBrush");
            return true;
        }
        finally { IsEnabled = true; }
    }

    private string Title() => GetType().Name.Replace("Module", "");

    protected static DataGrid Grid(IEnumerable<(string Header, string Path, double Width)> cols)
    {
        var g = Ui.Grid();
        foreach (var (h, p, w) in cols) g.Columns.Add(Ui.Col(h, p, w));
        return g;
    }
}

// ==================================================================== projects

public sealed class ProjectsModule : LiveModule
{
    public static readonly string[] Statuses = { "Queued", "In Progress", "Review", "Completed" };

    private DataGrid? _grid;
    private List<ServerUser> _users = new();

    public ProjectsModule() : base("Projects", "Client projects shown in their portal. Edit status and progress, and choose who can see each one.")
    {
        Toolbar.Children.Insert(0, Forms.Btn("New Project", (_, _) => Edit(null), primary: true));
        Toolbar.Children.Add(Forms.Btn("Edit", (_, _) => { if (Selected() is { } p) Edit(p); }));
        Toolbar.Children.Add(Forms.Btn("Access...", (_, _) => { if (Selected() is { } p) Access(p); }));
        Toolbar.Children.Add(Forms.Btn("Delete", async (_, _) => await Delete()));
    }

    private ProjectRow? Selected()
    {
        if (_grid?.SelectedItem is ProjectRow p) return p;
        SetStatus("Select a project first.", "WarnBrush");
        return null;
    }

    protected override async Task LoadAsync()
    {
        var r = await Api.CallGetAsync("api/data.php?resource=projects&action=list");
        if (!r.Ok) { ShowLoadError("projects", r); return; }
        (_users, _) = await ServerUser.LoadAsync();

        var rows = r.Rows().Select(ProjectRow.From).ToList();
        foreach (var p in rows)
            p.ClientName = _users.FirstOrDefault(u => u.Id == p.UserId)?.Display ?? "(unknown client)";

        List.Children.Clear();
        if (rows.Count == 0) { List.Children.Add(Ui.Empty("No projects yet. Use New Project to add one.")); return; }

        _grid = Grid(new[]
        {
            ("Project", nameof(ProjectRow.Name), 0.0),
            ("Client", nameof(ProjectRow.ClientName), 200.0),
            ("Status", nameof(ProjectRow.Status), 100.0),
            ("Progress", nameof(ProjectRow.ProgressText), 70.0),
            ("Updated", nameof(ProjectRow.Updated), 130.0),
        });
        _grid.ItemsSource = rows;
        _grid.MouseDoubleClick += (_, _) => { if (_grid.SelectedItem is ProjectRow p) Edit(p); };
        List.Children.Add(_grid);
        SetStatus($"{rows.Count} project(s). Double-click to edit.");
    }

    private async void Edit(ProjectRow? p)
    {
        var dlg = new ProjectEditorWindow(p, _users) { Owner = Owner };
        if (dlg.ShowDialog() == true) { await ReloadAsync(); SetStatus("Project saved.", "OkBrush"); }
    }

    private void Access(ProjectRow p) => new ProjectAccessWindow(p, _users) { Owner = Owner }.ShowDialog();

    private async Task Delete()
    {
        if (Selected() is not { } p) return;
        if (!Forms.Confirm(Owner, "Delete project",
                $"Delete \"{p.Name}\"? The client will no longer see it in their portal. This can't be undone.")) return;
        await Act(() => Api.CallPostAsync("api/data.php?resource=projects&action=delete", new { id = p.Id }),
            "Project deleted.");
    }
}

public sealed class ProjectEditorWindow : EditorDialog
{
    private readonly ProjectRow? _p;
    private readonly List<ServerUser> _clients;
    private readonly TextBox _name, _description, _progress;
    private readonly ComboBox _client, _status;

    public ProjectEditorWindow(ProjectRow? p, List<ServerUser> users)
        : base(p is null ? "New Project" : "Project — " + p.Name, 600, 500)
    {
        _p = p;
        _clients = users.Where(u => !u.IsAdmin || u.Id == p?.UserId).ToList();

        _name = Forms.Tb(p?.Name ?? "");
        _description = Forms.Tb(p?.Description ?? "", multiline: true);
        _progress = Forms.Tb((p?.Progress ?? 0).ToString());
        _client = Forms.Combo(_clients.Select(u => u.Display));
        var ci = _clients.FindIndex(u => u.Id == p?.UserId);
        _client.SelectedIndex = ci >= 0 ? ci : (_clients.Count > 0 ? 0 : -1);
        _status = Forms.Combo(ProjectsModule.Statuses, p?.Status ?? "Queued");
        if (p is not null && _status.SelectedItem as string != p.Status && p.Status.Length > 0)
        {
            _status.Items.Add(p.Status);   // keep an unfamiliar status rather than overwrite it
            _status.SelectedItem = p.Status;
        }

        FormPanel.Children.Add(Forms.Field("Project name", _name));
        FormPanel.Children.Add(Forms.Field("Client", _client));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Status", _status), Forms.Field("Progress (0–100 %)", _progress)));
        FormPanel.Children.Add(Forms.Field("Description", _description));
        if (_clients.Count == 0)
            FormPanel.Children.Add(Forms.Note("No client accounts on the server yet. Add the client under Clients and sync first.", "WarnBrush"));

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", async (_, _) => await Save(), primary: true));
    }

    private async Task Save()
    {
        if (_name.Text.Trim().Length == 0) { Forms.Error(this, Title, "Give the project a name."); return; }
        if (_client.SelectedIndex < 0) { Forms.Error(this, Title, "Choose the client this project belongs to."); return; }
        if (!int.TryParse(_progress.Text.Trim().TrimEnd('%'), out var progress) || progress is < 0 or > 100)
        { Forms.Error(this, Title, "Progress must be a whole number from 0 to 100."); return; }

        var body = new Dictionary<string, object>
        {
            ["projectName"] = _name.Text.Trim(),
            ["userId"] = _clients[_client.SelectedIndex].Id,
            ["status"] = _status.SelectedItem as string ?? "Queued",
            ["progress"] = progress,
            ["description"] = _description.Text,
        };
        var action = "create";
        if (_p is not null) { body["id"] = _p.Id; action = "update"; }

        var r = await Busy(() => ApiClient.Shared.CallPostAsync($"api/data.php?resource=projects&action={action}", body));
        if (!r.Ok) { Forms.Error(this, Title, r.Error); return; }
        DialogResult = true;
    }
}

/// <summary>
/// Replaces admin-tools.html (the old Firebase "Project Access Manager"):
/// gives other portal accounts access to a project, or takes it away.
/// </summary>
public sealed class ProjectAccessWindow : EditorDialog
{
    public static readonly string[] Roles = { "viewer", "manager", "owner" };

    private readonly ProjectRow _p;
    private readonly List<ServerUser> _users;
    private readonly StackPanel _members = new();
    private readonly ComboBox _user, _role;
    private DataGrid? _grid;

    private sealed record Member(string UserId, string Name, string Email, string Role, string Added);

    public ProjectAccessWindow(ProjectRow p, List<ServerUser> users) : base("Project access — " + p.Name, 640, 520)
    {
        _p = p;
        _users = users.Where(u => !u.IsAdmin && u.Id != p.UserId).ToList();

        FormPanel.Children.Add(Forms.Note(
            $"The owning client ({p.ClientName}) always sees this project. Add anyone else who should see it in their portal."));
        FormPanel.Children.Add(_members);

        _user = Forms.Combo(_users.Select(u => u.Display));
        _role = Forms.Combo(Roles, "viewer");
        FormPanel.Children.Add(new TextBlock
        {
            Text = "Give access", FontWeight = FontWeights.SemiBold, Margin = new Thickness(0, 14, 0, 6),
            Foreground = Forms.Res("HeadingText"),
        });
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Account", _user), Forms.Field("Role", _role)));
        FormPanel.Children.Add(Forms.Btn("Add", async (_, _) => await Add(), primary: true));

        ButtonBar.Children.Add(Forms.Btn("Remove selected", async (_, _) => await Remove()));
        ButtonBar.Children.Add(Forms.Btn("Close", (_, _) => Close()));

        Loaded += async (_, _) => await LoadMembers();
    }

    private async Task LoadMembers()
    {
        _members.Children.Clear();
        var r = await ApiClient.Shared.CallGetAsync(
            "api/data.php?resource=projects&action=members&projectId=" + Uri.EscapeDataString(_p.Id));
        if (!r.Ok)
        {
            _members.Children.Add(Forms.Note(
                r.Error.StartsWith("Unknown action", StringComparison.OrdinalIgnoreCase)
                    ? "The server's data.php is older than this app, so current members can't be listed. Upload the new api/data.php. Adding access still works."
                    : "Couldn't load members: " + r.Error, "WarnBrush"));
            return;
        }

        var rows = r.Rows().Select(m => new Member(Json.Str(m, "userId"), Json.Str(m, "name"), Json.Str(m, "email"),
            Json.Str(m, "role"), Json.LocalTime(Json.Str(m, "addedAt")))).ToList();
        if (rows.Count == 0) { _members.Children.Add(Ui.Empty("Nobody else has access.")); return; }

        _grid = Ui.Grid();
        _grid.MinHeight = 120;
        _grid.Columns.Add(Ui.Col("Name", nameof(Member.Name)));
        _grid.Columns.Add(Ui.Col("Email", nameof(Member.Email), 200));
        _grid.Columns.Add(Ui.Col("Role", nameof(Member.Role), 80));
        _grid.Columns.Add(Ui.Col("Added", nameof(Member.Added), 120));
        _grid.ItemsSource = rows;
        _members.Children.Add(_grid);
    }

    private async Task Add()
    {
        if (_user.SelectedIndex < 0) { Forms.Error(this, Title, "Choose an account."); return; }
        var r = await Busy(() => ApiClient.Shared.CallPostAsync("api/data.php?resource=projects&action=add_member", new
        {
            projectId = _p.Id,
            userId = _users[_user.SelectedIndex].Id,
            role = _role.SelectedItem as string ?? "viewer",
        }));
        if (!r.Ok) { Forms.Error(this, Title, r.Error); return; }
        await LoadMembers();
    }

    private async Task Remove()
    {
        if (_grid?.SelectedItem is not Member m) { Forms.Error(this, Title, "Select a member in the list first."); return; }
        if (!Forms.Confirm(this, Title, $"Remove {m.Name}'s access to this project?")) return;
        var r = await Busy(() => ApiClient.Shared.CallPostAsync("api/data.php?resource=projects&action=remove_member",
            new { projectId = _p.Id, userId = m.UserId }));
        if (!r.Ok) { Forms.Error(this, Title, r.Error); return; }
        await LoadMembers();
    }
}

// ==================================================================== messages

public sealed class MessagesModule : LiveModule
{
    private DataGrid? _grid;
    private List<ServerUser> _users = new();

    public MessagesModule() : base("Messages", "Conversations with clients from the portal. Open one to read the thread and reply.")
    {
        Toolbar.Children.Insert(0, Forms.Btn("New Message", (_, _) => New(), primary: true));
        Toolbar.Children.Add(Forms.Btn("Open", (_, _) => Open()));
    }

    protected override async Task LoadAsync()
    {
        var r = await Api.CallGetAsync("api/messages.php?action=list");
        if (!r.Ok) { ShowLoadError("messages", r); return; }
        (_users, _) = await ServerUser.LoadAsync();

        var rows = r.Rows().Select(ConversationRow.From).ToList();
        List.Children.Clear();
        if (rows.Count == 0) { List.Children.Add(Ui.Empty("No conversations yet.")); return; }

        _grid = Grid(new[]
        {
            ("", nameof(ConversationRow.State), 70.0),
            ("Client", nameof(ConversationRow.Client), 170.0),
            ("Subject", nameof(ConversationRow.Subject), 200.0),
            ("Last message", nameof(ConversationRow.Preview), 0.0),
            ("Updated", nameof(ConversationRow.Updated), 125.0),
        });
        _grid.ItemsSource = rows;
        _grid.MouseDoubleClick += (_, _) => Open();
        List.Children.Add(_grid);
        var unread = rows.Count(x => x.Unread && !x.IsClosed);
        SetStatus($"{rows.Count} conversation(s), {unread} with new messages. Double-click to open.");
    }

    private async void Open()
    {
        if (_grid?.SelectedItem is not ConversationRow c) { SetStatus("Select a conversation first.", "WarnBrush"); return; }
        new ConversationWindow(c) { Owner = Owner }.ShowDialog();
        await ReloadAsync();
    }

    private async void New()
    {
        var dlg = new NewConversationWindow(_users) { Owner = Owner };
        if (dlg.ShowDialog() == true) { await ReloadAsync(); SetStatus("Message sent.", "OkBrush"); }
    }
}

public sealed class ConversationWindow : EditorDialog
{
    private readonly ConversationRow _c;
    private readonly StackPanel _thread = new();
    private readonly TextBox _reply = Forms.Tb("", multiline: true);
    private readonly Button _send, _close;
    private bool _closed;

    public ConversationWindow(ConversationRow c) : base(c.Subject + " — " + c.Client, 720, 680)
    {
        _c = c;
        _closed = c.IsClosed;

        FormPanel.Children.Add(new TextBlock
        {
            Text = c.Subject, FontSize = 16, FontWeight = FontWeights.SemiBold,
            Foreground = Forms.Res("HeadingText"), TextWrapping = TextWrapping.Wrap,
        });
        FormPanel.Children.Add(Forms.Note($"{c.Client}  ·  {c.ClientEmail}"));
        FormPanel.Children.Add(_thread);
        FormPanel.Children.Add(Forms.Field("Reply", _reply));

        _close = Forms.Btn("Close Conversation", async (_, _) => await CloseConversation());
        _send = Forms.Btn("Send Reply", async (_, _) => await Send(), primary: true);
        ButtonBar.Children.Add(_close);
        ButtonBar.Children.Add(Forms.Btn("Done", (_, _) => Close()));
        ButtonBar.Children.Add(_send);

        Loaded += async (_, _) => await LoadThread();
    }

    private async Task LoadThread()
    {
        var r = await ApiClient.Shared.CallGetAsync("api/messages.php?action=get&id=" + Uri.EscapeDataString(_c.Id));
        if (!r.Ok) { _thread.Children.Add(Forms.Note("Couldn't load the conversation: " + r.Error, "BadBrush")); return; }
        _closed = Json.Bool(r.Data, "isClosed");
        Render(r.Data.TryGetProperty("thread", out var t) ? t : default);

        // Opening it counts as reading it, same as the admin panel.
        await ApiClient.Shared.CallPostAsync("api/messages.php?action=mark_read", new { id = _c.Id });
    }

    private void Render(JsonElement thread)
    {
        _thread.Children.Clear();
        if (thread.ValueKind == JsonValueKind.Array)
        {
            foreach (var p in thread.EnumerateArray())
            {
                var admin = Json.Str(p, "senderRole") == "admin";
                var box = new StackPanel();
                box.Children.Add(new TextBlock
                {
                    Text = $"{Json.Str(p, "senderName")}{(admin ? " (you)" : "")}  ·  {Json.LocalTime(Json.Str(p, "timestamp"))}",
                    FontSize = 11, Foreground = Forms.Res("MutedText"), Margin = new Thickness(0, 0, 0, 4),
                });
                box.Children.Add(new TextBox
                {
                    Text = Json.Str(p, "message"), IsReadOnly = true, BorderThickness = new Thickness(0),
                    Background = Brushes.Transparent, TextWrapping = TextWrapping.Wrap, FontSize = 13,
                });
                _thread.Children.Add(new Border
                {
                    Background = admin ? new SolidColorBrush(Color.FromRgb(239, 246, 255)) : Brushes.White,
                    BorderBrush = Forms.Res("BorderBrush"), BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(8), Padding = new Thickness(12, 8, 12, 8),
                    Margin = new Thickness(admin ? 60 : 0, 0, admin ? 0 : 60, 8),
                    Child = box,
                });
            }
        }
        if (_closed)
            _thread.Children.Add(Forms.Note("This conversation is closed. The client can't reply to it.", "WarnBrush"));
        _send.IsEnabled = !_closed;
        _reply.IsEnabled = !_closed;
        _close.IsEnabled = !_closed;
    }

    private async Task Send()
    {
        var text = _reply.Text.Trim();
        if (text.Length == 0) return;
        var r = await Busy(() => ApiClient.Shared.CallPostAsync("api/messages.php?action=reply", new { id = _c.Id, message = text }));
        if (!r.Ok) { Forms.Error(this, "Reply", r.Error); return; }
        _reply.Text = "";
        Render(r.Data.ValueKind == JsonValueKind.Object && r.Data.TryGetProperty("thread", out var t) ? t : default);
        await ApiClient.Shared.CallPostAsync("api/messages.php?action=mark_read", new { id = _c.Id });
    }

    private async Task CloseConversation()
    {
        if (!Forms.Confirm(this, "Close conversation", "Close this conversation? The client won't be able to reply to it.")) return;
        var r = await Busy(() => ApiClient.Shared.CallPostAsync("api/messages.php?action=close", new { id = _c.Id }));
        if (!r.Ok) { Forms.Error(this, "Close", r.Error); return; }
        await LoadThread();
    }
}

public sealed class NewConversationWindow : EditorDialog
{
    private readonly List<ServerUser> _clients;
    private readonly ComboBox _client;
    private readonly ComboBox _project = Forms.Combo(new[] { "(none)" });
    private readonly TextBox _subject = Forms.Tb();
    private readonly TextBox _message = Forms.Tb("", multiline: true);
    private List<ProjectRow> _projects = new();

    public NewConversationWindow(List<ServerUser> users) : base("New Message", 600, 520)
    {
        _clients = users.Where(u => !u.IsAdmin).ToList();
        _client = Forms.Combo(_clients.Select(u => u.Display));
        _client.SelectionChanged += (_, _) => FillProjects();

        FormPanel.Children.Add(Forms.Field("To", _client));
        FormPanel.Children.Add(Forms.Field("About project (optional)", _project));
        FormPanel.Children.Add(Forms.Field("Subject", _subject));
        FormPanel.Children.Add(Forms.Field("Message", _message));
        FormPanel.Children.Add(Forms.Note("The client is notified in their portal."));

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Send", async (_, _) => await Send(), primary: true));

        Loaded += async (_, _) =>
        {
            var r = await ApiClient.Shared.CallGetAsync("api/data.php?resource=projects&action=list");
            _projects = r.Rows().Select(ProjectRow.From).ToList();
            FillProjects();
        };
    }

    private List<ProjectRow> ClientProjects()
        => _client.SelectedIndex < 0 ? new() : _projects.Where(p => p.UserId == _clients[_client.SelectedIndex].Id).ToList();

    private void FillProjects()
    {
        _project.Items.Clear();
        _project.Items.Add("(none)");
        foreach (var p in ClientProjects()) _project.Items.Add(p.Name);
        _project.SelectedIndex = 0;
    }

    private async Task Send()
    {
        if (_client.SelectedIndex < 0) { Forms.Error(this, Title, "Choose who the message is for."); return; }
        if (_subject.Text.Trim().Length == 0 || _message.Text.Trim().Length == 0)
        { Forms.Error(this, Title, "Enter a subject and a message."); return; }

        var body = new Dictionary<string, object>
        {
            ["clientId"] = _clients[_client.SelectedIndex].Id,
            ["subject"] = _subject.Text.Trim(),
            ["message"] = _message.Text.Trim(),
        };
        var projects = ClientProjects();
        if (_project.SelectedIndex > 0 && _project.SelectedIndex - 1 < projects.Count)
            body["projectId"] = projects[_project.SelectedIndex - 1].Id;

        var r = await Busy(() => ApiClient.Shared.CallPostAsync("api/messages.php?action=create", body));
        if (!r.Ok) { Forms.Error(this, Title, r.Error); return; }
        DialogResult = true;
    }
}

// ====================================================================== quotes

public sealed class QuotesModule : LiveModule
{
    /// <summary>The only statuses services.php accepts.</summary>
    public static readonly string[] Statuses = { "draft", "sent", "accepted", "declined" };

    private DataGrid? _grid;
    private readonly ComboBox _setStatus = Forms.Combo(Statuses);

    public QuotesModule() : base("Quotes", "3D printing quotes, as kept by the admin panel. Save one from the 3D Printing Quote tool, or add it here.")
    {
        Toolbar.Children.Insert(0, Forms.Btn("New Quote", (_, _) => Edit(null), primary: true));
        Toolbar.Children.Add(Forms.Btn("Edit", (_, _) => { if (Selected() is { } q) Edit(q); }));
        _setStatus.Margin = new Thickness(8, 0, 6, 0);
        _setStatus.MinWidth = 100;
        Toolbar.Children.Add(new TextBlock { Text = "Mark as", VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(8, 0, 0, 0), Foreground = Ui.Res("MutedText") });
        Toolbar.Children.Add(_setStatus);
        Toolbar.Children.Add(Forms.Btn("Apply", async (_, _) => await SetStatus()));
        Toolbar.Children.Add(Forms.Btn("Delete", async (_, _) => await Delete()));
    }

    private QuoteRow? Selected()
    {
        if (_grid?.SelectedItem is QuoteRow q) return q;
        SetStatus("Select a quote first.", "WarnBrush");
        return null;
    }

    protected override async Task LoadAsync()
    {
        var r = await Api.CallGetAsync("api/services.php?resource=quotes&action=list");
        if (!r.Ok) { ShowLoadError("quotes", r); return; }
        var rows = r.Rows().Select(QuoteRow.From).ToList();

        List.Children.Clear();
        if (rows.Count == 0) { List.Children.Add(Ui.Empty("No quotes yet.")); return; }

        _grid = Grid(new[]
        {
            ("Quote", nameof(QuoteRow.Number), 75.0),
            ("Customer", nameof(QuoteRow.CustomerName), 150.0),
            ("Item", nameof(QuoteRow.ItemName), 0.0),
            ("Material", nameof(QuoteRow.Material), 80.0),
            ("Qty", nameof(QuoteRow.Quantity), 45.0),
            ("Total", nameof(QuoteRow.TotalText), 80.0),
            ("Status", nameof(QuoteRow.Status), 80.0),
            ("Created", nameof(QuoteRow.Created), 125.0),
        });
        _grid.ItemsSource = rows;
        _grid.MouseDoubleClick += (_, _) => { if (_grid.SelectedItem is QuoteRow q) Edit(q); };
        List.Children.Add(_grid);

        var open = rows.Where(q => q.Status is "draft" or "sent").Sum(q => q.Total);
        SetStatus($"{rows.Count} quote(s). ${open:0.00} in draft or sent quotes. Double-click to edit.");
    }

    private async void Edit(QuoteRow? q)
    {
        var dlg = new QuoteEditorWindow(q) { Owner = Owner };
        if (dlg.ShowDialog() == true) { await ReloadAsync(); SetStatus("Quote saved.", "OkBrush"); }
    }

    private async Task SetStatus()
    {
        if (Selected() is not { } q) return;
        var status = _setStatus.SelectedItem as string ?? "draft";
        await Act(() => Api.CallPostAsync("api/services.php?resource=quotes&action=update_status", new { id = q.Id, status }),
            $"Quote {q.Number} marked {status}.");
    }

    private async Task Delete()
    {
        if (Selected() is not { } q) return;
        if (!Forms.Confirm(Owner, "Delete quote", $"Delete quote {q.Number}? This can't be undone.")) return;
        await Act(() => Api.CallPostAsync("api/services.php?resource=quotes&action=delete", new { id = q.Id }), "Quote deleted.");
    }
}

/// <summary>
/// Create or edit a 3D print quote. The server works the total out itself as
/// (material + time + setup) × quantity, so the preview here uses the same sum.
/// </summary>
public sealed class QuoteEditorWindow : EditorDialog
{
    public static readonly string[] Materials = { "PLA", "PETG", "ABS", "TPU", "Composite" };

    private readonly QuoteRow? _q;
    private List<ServerUser> _clients = new();
    private readonly ComboBox _client = Forms.Combo(new[] { "(not a portal client)" });
    private readonly TextBox _name, _email, _item, _weight, _hours, _infill, _qty, _mat, _time, _setup, _notes;
    private readonly ComboBox _material;
    private readonly TextBlock _total = new() { FontSize = 15, FontWeight = FontWeights.Bold, Margin = new Thickness(0, 6, 0, 0) };

    public QuoteEditorWindow(QuoteRow? q) : base(q is null ? "New Quote" : "Quote " + q.Number, 640, 640)
    {
        _q = q;
        q ??= new QuoteRow();

        _name = Forms.Tb(q.CustomerName);
        _email = Forms.Tb(q.CustomerEmail);
        _item = Forms.Tb(q.ItemName);
        _material = Forms.Combo(Materials, q.Material);
        if (_material.SelectedItem as string != q.Material && q.Material.Length > 0)
        {
            _material.Items.Add(q.Material);
            _material.SelectedItem = q.Material;
        }
        _weight = Forms.Tb(q.WeightGrams.ToString("0.##"));
        _hours = Forms.Tb(q.PrintHours.ToString("0.##"));
        _infill = Forms.Tb(q.Infill.ToString());
        _qty = Forms.Tb(q.Quantity.ToString());
        _mat = Forms.Tb(q.MaterialCost.ToString("0.00"));
        _time = Forms.Tb(q.TimeCost.ToString("0.00"));
        _setup = Forms.Tb(q.SetupFee.ToString("0.00"));
        _notes = Forms.Tb(q.Notes, multiline: true);

        FormPanel.Children.Add(Forms.Field("Portal client (optional — fills in name and email)", _client));
        FormPanel.Children.Add(Forms.Grid(2, Forms.Field("Customer name", _name), Forms.Field("Customer email", _email)));
        FormPanel.Children.Add(Forms.Field("Item", _item));
        FormPanel.Children.Add(Forms.Grid(4, Forms.Field("Material", _material), Forms.Field("Weight (g)", _weight),
            Forms.Field("Print hours", _hours), Forms.Field("Infill (%)", _infill)));
        FormPanel.Children.Add(Forms.Grid(4, Forms.Field("Material cost ($)", _mat), Forms.Field("Time cost ($)", _time),
            Forms.Field("Setup fee ($)", _setup), Forms.Field("Quantity", _qty)));
        FormPanel.Children.Add(_total);
        FormPanel.Children.Add(Forms.Field("Notes", _notes));

        foreach (var t in new[] { _mat, _time, _setup, _qty }) t.TextChanged += (_, _) => UpdateTotal();
        UpdateTotal();

        _client.SelectionChanged += (_, _) =>
        {
            if (_client.SelectedIndex <= 0) return;
            var u = _clients[_client.SelectedIndex - 1];
            _name.Text = u.Name.Length > 0 ? u.Name : _name.Text;
            _email.Text = u.Email;
        };

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", async (_, _) => await Save(), primary: true));

        Loaded += async (_, _) =>
        {
            (var users, _) = await ServerUser.LoadAsync();
            _clients = users.Where(u => !u.IsAdmin).ToList();
            foreach (var u in _clients) _client.Items.Add(u.Display);
            var i = _clients.FindIndex(u => u.Id == _q?.ClientId);
            if (i >= 0) _client.SelectedIndex = i + 1;
        };
    }

    /// <summary>Prefill from the 3D Printing Quote calculator.</summary>
    public void Prefill(string material, double grams, double hours, int infill, int qty,
        double materialCost, double timeCost, double setup, string notes)
    {
        var m = Materials.FirstOrDefault(x => material.StartsWith(x, StringComparison.OrdinalIgnoreCase)) ?? material;
        if (!_material.Items.Contains(m)) _material.Items.Add(m);
        _material.SelectedItem = m;
        _weight.Text = grams.ToString("0.#");
        _hours.Text = hours.ToString("0.##");
        _infill.Text = infill.ToString();
        _qty.Text = qty.ToString();
        _mat.Text = materialCost.ToString("0.00");
        _time.Text = timeCost.ToString("0.00");
        _setup.Text = setup.ToString("0.00");
        _notes.Text = notes;
        UpdateTotal();
    }

    private void UpdateTotal()
    {
        var qty = Math.Max(1, (int)Forms.Num(_qty));
        var total = Math.Round((Math.Round(Forms.Num(_mat), 2) + Math.Round(Forms.Num(_time), 2) + Math.Round(Forms.Num(_setup), 2)) * qty, 2);
        _total.Text = $"Total ${total:0.00}";
        _total.Foreground = Forms.Res("AccentBrush");
    }

    private async Task Save()
    {
        if (_item.Text.Trim().Length == 0) { Forms.Error(this, Title, "Enter what is being printed."); return; }
        var body = new Dictionary<string, object?>
        {
            ["clientId"] = _client.SelectedIndex > 0 ? _clients[_client.SelectedIndex - 1].Id : "",
            ["customerName"] = _name.Text.Trim(),
            ["customerEmail"] = _email.Text.Trim(),
            ["itemName"] = _item.Text.Trim(),
            ["material"] = _material.SelectedItem as string ?? "PLA",
            ["weightGrams"] = Forms.Num(_weight),
            ["printHours"] = Forms.Num(_hours),
            ["infillPercent"] = (int)Forms.Num(_infill),
            ["quantity"] = Math.Max(1, (int)Forms.Num(_qty)),
            ["materialCost"] = Forms.Num(_mat),
            ["timeCost"] = Forms.Num(_time),
            ["setupFee"] = Forms.Num(_setup),
            ["notes"] = _notes.Text,
        };
        var action = "create";
        if (_q is not null) { body["id"] = _q.Id; action = "update"; }

        var r = await Busy(() => ApiClient.Shared.CallPostAsync($"api/services.php?resource=quotes&action={action}", body));
        if (!r.Ok) { Forms.Error(this, Title, r.Error); return; }
        if (_q is null)
            MessageBox.Show(this, $"Saved as quote {r.Str("quoteNumber")}, total ${Json.Num(r.Data, "total"):0.00}.",
                Title, MessageBoxButton.OK, MessageBoxImage.Information);
        DialogResult = true;
    }
}

// ================================================================== api tokens

/// <summary>
/// API tokens let the test and tag app (desktop wrapper, offline copies) push
/// and pull jobs without a login. A new token is shown once and never again -
/// the server only keeps its SHA-256 hash.
/// </summary>
public sealed class TokensModule : LiveModule
{
    private DataGrid? _grid;
    private readonly TextBox _label = new() { Width = 200, Padding = new Thickness(6, 4, 6, 4), Margin = new Thickness(8, 0, 8, 0), Text = "Desktop app" };

    public TokensModule() : base("API Tokens", "Keys the test and tag app uses to sync without signing in. Revoke any you no longer use.")
    {
        Toolbar.Children.Add(new TextBlock { Text = "Label", VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(8, 0, 0, 0), Foreground = Ui.Res("MutedText") });
        Toolbar.Children.Add(_label);
        Toolbar.Children.Add(Forms.Btn("Create Token", async (_, _) => await Create(), primary: true));
        Toolbar.Children.Add(Forms.Btn("Revoke", async (_, _) => await Revoke(), danger: true));
    }

    protected override async Task LoadAsync()
    {
        var r = await Api.CallGetAsync("api/services.php?resource=tokens&action=list");
        if (!r.Ok) { ShowLoadError("tokens", r); return; }
        var rows = r.Rows().Select(TokenRow.From).ToList();

        List.Children.Clear();
        if (rows.Count == 0) { List.Children.Add(Ui.Empty("No tokens. Create one to connect the test and tag app.")); return; }
        _grid = Grid(new[]
        {
            ("Label", nameof(TokenRow.Label), 0.0),
            ("Scope", nameof(TokenRow.Scope), 120.0),
            ("Last used", nameof(TokenRow.LastUsed), 130.0),
            ("Created", nameof(TokenRow.Created), 130.0),
        });
        _grid.ItemsSource = rows;
        List.Children.Add(_grid);
        SetStatus($"{rows.Count} token(s).");
    }

    private async Task Create()
    {
        var label = _label.Text.Trim();
        if (label.Length == 0) { SetStatus("Give the token a label so you know what uses it.", "WarnBrush"); return; }
        IsEnabled = false;
        ApiResult r;
        try { r = await Api.CallPostAsync("api/services.php?resource=tokens&action=create", new { label }); }
        finally { IsEnabled = true; }
        if (!r.Ok) { Forms.Error(Owner, "API Tokens", r.Error); return; }

        new TokenShownWindow(r.Str("token"), label) { Owner = Owner }.ShowDialog();
        await ReloadAsync();
    }

    private async Task Revoke()
    {
        if (_grid?.SelectedItem is not TokenRow t) { SetStatus("Select a token first.", "WarnBrush"); return; }
        if (!Forms.Confirm(Owner, "Revoke token",
                $"Revoke \"{t.Label}\"? Anything using it will stop syncing until given a new token.")) return;
        await Act(() => Api.CallPostAsync("api/services.php?resource=tokens&action=revoke", new { id = t.Id }), "Token revoked.");
    }
}

public sealed class TokenShownWindow : EditorDialog
{
    public TokenShownWindow(string token, string label) : base("New API token", 560, 300)
    {
        FormPanel.Children.Add(Forms.Note($"Token for \"{label}\". Copy it now — it is shown only once. The server keeps only a hash of it.", "WarnBrush"));
        var box = new TextBox
        {
            Text = token, IsReadOnly = true, FontFamily = new FontFamily("Consolas"), FontSize = 13,
            Padding = new Thickness(8), TextWrapping = TextWrapping.Wrap,
        };
        FormPanel.Children.Add(box);
        ButtonBar.Children.Add(Forms.Btn("Copy", (_, _) => { Clipboard.SetText(token); Title = "Copied"; }));
        ButtonBar.Children.Add(Forms.Btn("Done", (_, _) => Close(), primary: true));
        Loaded += (_, _) => { box.Focus(); box.SelectAll(); };
    }
}
