using System.Windows;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

public partial class SignInWindow : Window
{
    private readonly ApiClient _api;

    public SignInWindow(ApiClient api)
    {
        InitializeComponent();
        _api = api;
        EmailBox.Text = Services.Repository.GetSetting("SignedInAs", "");
        EmailBox.Focus();
    }

    private async void SignIn_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        OkButton.IsEnabled = false;
        OkButton.Content = "Signing in…";

        var (ok, error) = await _api.SignInAsync(EmailBox.Text.Trim(), PasswordBox.Password);

        if (ok)
        {
            Repository.SetSetting("SignedInAs", _api.SignedInAs ?? EmailBox.Text.Trim());
            DialogResult = true;
            Close();
            return;
        }

        ErrorText.Text = error ?? "Sign-in failed.";
        ErrorText.Visibility = Visibility.Visible;
        OkButton.IsEnabled = true;
        OkButton.Content = "Sign in";
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
