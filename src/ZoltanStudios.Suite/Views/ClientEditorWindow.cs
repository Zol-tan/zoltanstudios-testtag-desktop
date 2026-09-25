using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ZoltanStudios.Suite.Models;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>Create or edit a client.</summary>
public sealed class ClientEditorWindow : Window
{
    private readonly Client _client;
    private readonly TextBox _name = Tb(), _company = Tb(), _email = Tb(),
                             _phone = Tb(), _address = Tb(), _notes = Tb();

    public ClientEditorWindow(Client? existing = null)
    {
        _client = existing ?? new Client();

        Title = existing is null ? "New Client" : _client.Display;
        Width = 520;
        Height = 480;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        Background = (Brush)Application.Current.Resources["AppBackground"];

        _notes.AcceptsReturn = true;
        _notes.Height = 80;
        _notes.TextWrapping = TextWrapping.Wrap;
        _address.AcceptsReturn = true;
        _address.Height = 56;
        _address.TextWrapping = TextWrapping.Wrap;

        var panel = new StackPanel { Margin = new Thickness(20) };
        panel.Children.Add(Label("Name"));       panel.Children.Add(_name);
        panel.Children.Add(Label("Company"));    panel.Children.Add(_company);
        panel.Children.Add(Label("Email"));      panel.Children.Add(_email);
        panel.Children.Add(Label("Phone"));      panel.Children.Add(_phone);
        panel.Children.Add(Label("Address"));    panel.Children.Add(_address);
        panel.Children.Add(Label("Notes"));      panel.Children.Add(_notes);

        var row = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 10, 0, 0),
        };
        var cancel = new Button { Content = "Cancel", Padding = new Thickness(14, 6, 14, 6), Margin = new Thickness(6, 0, 0, 0), MinWidth = 88 };
        cancel.Click += (_, _) => Close();
        var save = new Button
        {
            Content = "Save",
            Padding = new Thickness(14, 6, 14, 6),
            Margin = new Thickness(6, 0, 0, 0),
            MinWidth = 88,
            Background = (Brush)Application.Current.Resources["AccentBrush"],
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
        };
        save.Click += (_, _) => Save();
        row.Children.Add(cancel);
        row.Children.Add(save);
        panel.Children.Add(row);

        Content = panel;
        Load();
    }

    private static TextBox Tb() => new() { Padding = new Thickness(6, 4, 6, 4), Margin = new Thickness(0, 0, 0, 10) };

    private static TextBlock Label(string s) => new()
    {
        Text = s,
        FontSize = 11,
        Foreground = (Brush)Application.Current.Resources["MutedText"],
        Margin = new Thickness(0, 0, 0, 3),
    };

    private void Load()
    {
        _name.Text = _client.Name;
        _company.Text = _client.Company;
        _email.Text = _client.Email;
        _phone.Text = _client.Phone;
        _address.Text = _client.Address;
        _notes.Text = _client.Notes;
    }

    private void Save()
    {
        if (_name.Text.Trim().Length == 0 && _company.Text.Trim().Length == 0)
        {
            MessageBox.Show("Enter a name or a company.", "Client",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        _client.Name = _name.Text.Trim();
        _client.Company = _company.Text.Trim();
        _client.Email = _email.Text.Trim();
        _client.Phone = _phone.Text.Trim();
        _client.Address = _address.Text.Trim();
        _client.Notes = _notes.Text.Trim();

        Repository.SaveClient(_client);
        DialogResult = true;
        Close();
    }
}
