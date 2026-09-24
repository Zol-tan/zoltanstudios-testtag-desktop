using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>Add or change a booking. Saved locally and sent on the next sync.</summary>
public sealed class AppointmentEditorWindow : EditorDialog
{
    private readonly Appointment _a;
    private readonly List<Client> _clients = Repository.GetClients();
    private readonly TextBox _title, _date, _time, _location, _notes;
    private readonly ComboBox _client, _status;

    public AppointmentEditorWindow(Appointment? existing) : base(existing is null ? "New Booking" : "Booking — " + existing.Title, 600, 560)
    {
        _a = existing ?? new Appointment
        {
            StartsAt = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd") + "T09:00",
            Status = "confirmed",
        };

        _title = Forms.Tb(_a.Title);
        _date = Forms.Tb(_a.Date);
        _time = Forms.Tb(_a.Time.Length > 0 ? _a.Time : "09:00");
        _location = Forms.Tb(_a.Location);
        _notes = Forms.Tb(_a.Notes, multiline: true);
        _client = Forms.Combo(new[] { "(no client — my own calendar)" }.Concat(_clients.Select(c => c.Display)));
        var ci = _clients.FindIndex(c => c.Id == _a.ClientId);
        _client.SelectedIndex = ci >= 0 ? ci + 1 : 0;
        _status = Forms.Combo(Appointment.Statuses, _a.Status);

        FormPanel.Children.Add(Forms.Field("Title", _title));
        FormPanel.Children.Add(Forms.Field("Client (sees it in their portal)", _client));
        FormPanel.Children.Add(Forms.Grid(3, Forms.Field("Date (yyyy-mm-dd)", _date), Forms.Field("Time (hh:mm)", _time),
            Forms.Field("Status", _status)));
        FormPanel.Children.Add(Forms.Field("Location (kept in the suite only)", _location));
        FormPanel.Children.Add(Forms.Field("Notes", _notes));
        FormPanel.Children.Add(Forms.Note("pending = a request waiting for you · confirmed = booked · deadline = a project deadline · cancelled = declined or called off"));

        ButtonBar.Children.Add(Forms.Btn("Cancel", (_, _) => Close()));
        ButtonBar.Children.Add(Forms.Btn("Save", (_, _) => Save(), primary: true));
    }

    private void Save()
    {
        var date = _date.Text.Trim();
        var time = _time.Text.Trim();
        if (_title.Text.Trim().Length == 0) { Forms.Error(this, Title, "Give the booking a title."); return; }
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
        { Forms.Error(this, Title, "Enter the date as yyyy-mm-dd, e.g. 2026-10-03."); return; }
        if (!TimeSpan.TryParseExact(time, @"hh\:mm", CultureInfo.InvariantCulture, out var t) &&
            !TimeSpan.TryParseExact(time, @"h\:mm", CultureInfo.InvariantCulture, out t))
        { Forms.Error(this, Title, "Enter the time as hh:mm (24-hour), e.g. 14:30."); return; }

        _a.Title = _title.Text.Trim();
        _a.StartsAt = date + "T" + t.ToString(@"hh\:mm");
        _a.Location = _location.Text.Trim();
        _a.Notes = _notes.Text;
        _a.Status = _status.SelectedItem as string ?? "confirmed";
        _a.ClientId = _client.SelectedIndex > 0 ? _clients[_client.SelectedIndex - 1].Id : null;

        Repository.SaveAppointment(_a);
        DialogResult = true;
    }
}
