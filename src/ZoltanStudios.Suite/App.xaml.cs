using System.Windows;

namespace ZoltanStudios.Suite;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // The local database is the source of truth. Creating it here means
        // the app is usable immediately on a machine that has never run it,
        // with or without a connection.
        Services.Database.Initialise();
        Services.PartsCatalogue.EnsureSchema();
    }
}
