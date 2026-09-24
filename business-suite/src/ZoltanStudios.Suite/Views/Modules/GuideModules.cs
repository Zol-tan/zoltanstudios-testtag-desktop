using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views.Modules;

/// <summary>Building blocks for the reference pages.</summary>
internal static class Guide
{
    public static FrameworkElement Card(string title, string glyph, string brush, params UIElement[] content)
    {
        var s = new StackPanel();
        var head = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
        var b = Ui.Badge(glyph, brush, 32);
        b.Margin = new Thickness(0, 0, 10, 0);
        head.Children.Add(b);
        head.Children.Add(new TextBlock
        {
            Text = title, FontSize = 15.5, FontWeight = FontWeights.SemiBold,
            Foreground = Ui.Res("HeadingText"), VerticalAlignment = VerticalAlignment.Center,
        });
        s.Children.Add(head);
        foreach (var c in content) s.Children.Add(c);
        return Ui.Card(s, 20);
    }

    public static TextBlock P(string text) => new()
    {
        Text = text, TextWrapping = TextWrapping.Wrap, FontSize = 13, LineHeight = 20,
        Foreground = Ui.Res("BodyText"), Margin = new Thickness(0, 0, 0, 10),
    };

    public static FrameworkElement Steps(params string[] steps)
    {
        var s = new StackPanel { Margin = new Thickness(0, 0, 0, 6) };
        for (var i = 0; i < steps.Length; i++)
        {
            var row = new DockPanel { Margin = new Thickness(0, 0, 0, 9) };
            var num = new Border
            {
                Width = 24, Height = 24, CornerRadius = new CornerRadius(12), Background = Ui.Res("AccentSoft"),
                Margin = new Thickness(0, 0, 12, 0), VerticalAlignment = VerticalAlignment.Top,
                Child = new TextBlock
                {
                    Text = (i + 1).ToString(), FontWeight = FontWeights.Bold, FontSize = 12,
                    Foreground = Ui.Res("AccentBrush"), HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                },
            };
            DockPanel.SetDock(num, Dock.Left);
            row.Children.Add(num);
            row.Children.Add(Rich(steps[i]));
            s.Children.Add(row);
        }
        return s;
    }

    public static FrameworkElement Bullets(params string[] items)
    {
        var s = new StackPanel { Margin = new Thickness(0, 0, 0, 6) };
        foreach (var t in items)
        {
            var row = new DockPanel { Margin = new Thickness(0, 0, 0, 7) };
            var dot = Ui.Icon("", 11, Ui.Res("OkBrush"));
            dot.Margin = new Thickness(2, 3, 12, 0);
            dot.VerticalAlignment = VerticalAlignment.Top;
            DockPanel.SetDock(dot, Dock.Left);
            row.Children.Add(dot);
            row.Children.Add(Rich(t));
            s.Children.Add(row);
        }
        return s;
    }

    /// <summary>Text where **double-starred** words are bold.</summary>
    public static TextBlock Rich(string text)
    {
        var tb = new TextBlock { TextWrapping = TextWrapping.Wrap, FontSize = 13, LineHeight = 20, Foreground = Ui.Res("BodyText") };
        var parts = text.Split("**");
        for (var i = 0; i < parts.Length; i++)
        {
            var run = new Run(parts[i]);
            if (i % 2 == 1) { run.FontWeight = FontWeights.SemiBold; run.Foreground = Ui.Res("HeadingText"); }
            tb.Inlines.Add(run);
        }
        return tb;
    }

    /// <summary>A simple ruled table. The first row is the header.</summary>
    public static FrameworkElement Table(double[] widths, params string[][] rows)
    {
        var g = new Grid { Margin = new Thickness(0, 2, 0, 10) };
        foreach (var w in widths)
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = w > 0 ? new GridLength(w) : new GridLength(1, GridUnitType.Star) });
        for (var r = 0; r < rows.Length; r++)
        {
            g.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            var bg = new Border
            {
                Background = r == 0 ? Ui.Res("AppBackground") : Brushes.Transparent,
                BorderBrush = Ui.Res("BorderBrush"),
                BorderThickness = new Thickness(0, 0, 0, 1),
            };
            Grid.SetRow(bg, r);
            Grid.SetColumnSpan(bg, widths.Length);
            g.Children.Add(bg);
            for (var c = 0; c < rows[r].Length && c < widths.Length; c++)
            {
                var t = Rich(rows[r][c]);
                t.Padding = new Thickness(10, 8, 10, 8);
                t.FontSize = r == 0 ? 11.5 : 12.5;
                t.LineHeight = double.NaN;
                if (r == 0 || c == 0) t.FontWeight = FontWeights.SemiBold;
                t.Foreground = Ui.Res(r == 0 ? "MutedText" : c == 0 ? "HeadingText" : "BodyText");
                Grid.SetRow(t, r);
                Grid.SetColumn(t, c);
                g.Children.Add(t);
            }
        }
        return new Border
        {
            BorderBrush = Ui.Res("BorderBrush"), BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(8),
            Margin = new Thickness(0, 0, 0, 10), Child = g,
        };
    }

    public static FrameworkElement Callout(string text, string brush = "WarnBrush")
    {
        var soft = brush switch { "BadBrush" => "BadSoft", "OkBrush" => "OkSoft", "AccentBrush" => "AccentSoft", _ => "WarnSoft" };
        var row = new DockPanel();
        var i = Ui.Icon(brush == "AccentBrush" ? Ui.GInfo : Ui.GWarn, 15, Ui.Res(brush));
        i.Margin = new Thickness(0, 1, 10, 0);
        i.VerticalAlignment = VerticalAlignment.Top;
        DockPanel.SetDock(i, Dock.Left);
        row.Children.Add(i);
        row.Children.Add(Rich(text));
        return new Border
        {
            Background = Ui.Res(soft), CornerRadius = new CornerRadius(8), Padding = new Thickness(14, 10, 14, 10),
            Margin = new Thickness(0, 0, 0, 12), Child = row,
        };
    }

    public static void OpenUrl(string url)
    {
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(url) { UseShellExecute = true }); }
        catch { /* no browser - nothing more to do */ }
    }
}

// =============================================================== AS/NZS 3760

public sealed class ReferenceModule : ModuleBase
{
    public ReferenceModule() : base("AS/NZS 3760 Reference",
        "In-service safety inspection and testing of electrical equipment and RCDs — the working summary. The Standard itself is the authority.")
    {
        Body.Children.Add(Guide.Callout(
            "This is a summary for use on site, not the Standard. Where it matters — an unusual appliance, a dispute, a client's " +
            "own risk assessment — check **AS/NZS 3760:2022** itself. Your work is limited to **single-phase 240 V** plug-in equipment; " +
            "generators get an **inspection report** (AS/NZS 3010 observations), never a compliance certificate.", "AccentBrush"));

        Body.Children.Add(Guide.Card("The tests, in order", Ui.GCheck, "AccentBrush",
            Guide.Steps(
                "**Visual and manual inspection** first, every time: plug, pins, cord, cord anchorage, enclosure, guards, controls, labels. Most faults are found here — a visual fail is a fail whatever the meter says.",
                "**Protective earth continuity** (Class I): from the plug's earth pin to exposed metal. Flex the cord along its length while measuring.",
                "**Insulation resistance** at **500 V d.c.** — or **250 V d.c.** where 500 V could make surge protection or electronics conduct.",
                "**Leakage current** (run test) where insulation testing isn't appropriate — e.g. equipment that must be switched on for its circuits to be tested.",
                "**Polarity and correct connection** for cord sets, extension leads and power boards.",
                "**RCDs**: push-button test, and an operating-time test at rated residual current."),
            Guide.P("Then tag it, record it, and take anything that failed out of service.")));

        Body.Children.Add(Guide.Card("Pass limits", Ui.GFlag, "OkBrush",
            Guide.Table(new double[] { 230, 0, 0 },
                new[] { "Test", "Limit", "How the suite grades it" },
                new[] { "Protective earth", "≤ 1 Ω", "1 Ω up to 5 m of cord, then +0.1 Ω per extra metre (same rule as the web app)" },
                new[] { "Insulation resistance", "≥ 1 MΩ", "Fail below 1 MΩ" },
                new[] { "Leakage current — Class I", "≤ 5 mA", "Fail above 5 mA" },
                new[] { "Leakage current — Class II", "≤ 1 mA", "Fail above 1 mA" },
                new[] { "RCD Type I (10 mA)", "Trips within 40 ms", "Record pass / fail in the RCD column" },
                new[] { "RCD Type II (30 mA)", "Trips within 300 ms", "Record pass / fail in the RCD column" }),
            Guide.Callout("The long-lead allowance on earth continuity is how the app has always graded. If a client queries a long extension lead, check the Standard's wording for cord sets before relying on it.")));

        Body.Children.Add(Guide.Card("How often", Ui.GClock, "WarnBrush",
            Guide.Table(new double[] { 260, 130, 0, 0 },
                new[] { "Environment", "Test & tag", "RCD push-button (fixed / portable)", "RCD trip time (fixed / portable)" },
                new[] { "Building, construction, demolition (AS/NZS 3012)", "3 months", "—", "—" },
                new[] { "Factories, workshops, places of manufacture, assembly, maintenance or fabrication", "6 months", "6 months / daily", "12 months / 12 months" },
                new[] { "Equipment subject to flexing or abuse, or in a hostile environment", "12 months", "6 months / 3 months", "12 months / 12 months" },
                new[] { "Residential-type areas (hotels, nursing homes, etc.)", "2 years", "6 months / 6 months", "2 years / 2 years" },
                new[] { "Equipment used for commercial cleaning", "6 months", "— / daily", "— / 6 months" },
                new[] { "No flexing, not open to abuse, not hostile", "5 years", "6 months / 3 months", "2 years / 2 years" }),
            Guide.P("Hire equipment is inspected before every hire, with its own test interval in the Standard. A client's risk assessment can always shorten an interval."),
            Guide.Callout("**Check the job editor's environments against this table.** The suite (and the web app) set **Workshop / Trade Tools to 12 months** and **Rental Property to 12 months**. " +
                          "The Standard's row for places of maintenance and fabrication is **6 months**, and residential-type areas are **2 years**. " +
                          "Shorter than the Standard is fine; longer isn't — confirm the workshop interval before your next workshop job.")));

        Body.Children.Add(Guide.Card("Tags and records", Ui.GTag, "VioletBrush",
            Guide.Bullets(
                "Every tag shows **when it was tested**, **who tested it**, **the result**, and **when it's due again**.",
                "Keep a full **equipment register** — the 2022 edition leans on records, not just tags. The suite's Asset Register and CSV export are that record.",
                "Failed equipment is **withdrawn from service** and labelled so nobody uses it until it's repaired and retested, or disposed of.",
                "Repaired or serviced equipment is retested before it goes back into use.")));

        Body.Children.Add(Guide.Card("What changed in 2022", Ui.GInfo, "AccentBrush",
            Guide.Bullets(
                "**RCDs are in the title** — the Standard now covers RCD inspection and testing alongside equipment.",
                "**Competent person**: skills are expected to be *maintained*, with clearer expectations about electrical risk.",
                "**Records**: more emphasis on keeping a complete equipment register rather than relying on a pass/fail tag.",
                "The intervals table was renumbered (it was Table 4 in 2010).")));
    }
}

// ================================================================== Wavecom

/// <summary>
/// The Wavecom TnT RCD, written from Wavecom's TnT RCD User Manual (in our
/// own words - the manual itself isn't redistributed). Button names match
/// the tester: F1-F3, ENTER, Menu A / Menu B.
/// </summary>
public sealed class WavecomGuideModule : ModuleBase
{
    private const string ManualUrl = "https://www.wavecom.com.au/documents/TnT-RCD-Manual.pdf";
    private const string ManualSetting = "WavecomManualPath";

    public WavecomGuideModule() : base("Wavecom TnT Guide",
        "Using the Wavecom TnT RCD on site — every test, the buttons, what the lights mean — and getting results into the suite.")
    {
        Body.Children.Add(Ui.Toolbar(
            Forms.Btn("Open the Manual", async (_, _) => await OpenManualAsync(), primary: true, glyph: Ui.GOpen),
            Forms.Btn("Use a Different Copy…", (_, _) => ChooseManual(), glyph: Ui.GFolder),
            Forms.Btn("AS/NZS 3760 Reference", (_, _) => (Window.GetWindow(this) as MainWindow)?.Navigate("guide.3760"), glyph: Ui.GSchool)));

        _manualNote.Margin = new Thickness(0, -6, 0, 14);
        Body.Children.Add(_manualNote);
        ShowManualState();

        Body.Children.Add(Guide.Callout(
            "This page is a working summary of Wavecom's **TnT RCD User Manual**; the manual is the authority for the tester. " +
            "The TnT RCD is **single-phase**, with a **10 A** maximum load for powered tests.", "AccentBrush"));

        // Fetch the manual quietly the first time this page is opened with a
        // connection, so it's already on the laptop when you're on site.
        Loaded += async (_, _) => { if (ManualPath() is null) await DownloadManualAsync(quiet: true); };

        // ------------------------------------------------------------ layout
        Body.Children.Add(Guide.Card("The tester at a glance", Ui.GInfo, "AccentBrush",
            Guide.Table(new double[] { 200, 0 },
                new[] { "Part", "What it's for" },
                new[] { "F1 · F2 · F3", "Start a test from the menu on screen; inside a test they pick options (F3 is usually go / confirm / override)." },
                new[] { "ENTER", "Switches between **Menu A** and **Menu B**; returns to the menu after a test. Held while charging, it blanks the screen." },
                new[] { "Appliance Test Socket", "The appliance, lead or power board plugs in here." },
                new[] { "IEC Test Socket", "Takes the black **earth clip lead** (Class I tests) or the orange **IEC lead** (extension leads, RCDs)." },
                new[] { "Supply LEDs A-N · A-E · N-E", "The mains supply check (see below). Green = good; they turn **red** on a fault, and all go green / red to show pass / fail after a test." },
                new[] { "Rear panel", "Power button (battery mode), **battery isolation switch** (must be ON), IEC charging port, 10 A fuse, circuit breaker." },
                new[] { "In the box", "Orange IEC test lead (500 mm), black earth lead with alligator clips (1.8 m), IEC power cable, case." }),
            Guide.Table(new double[] { 200, 0, 0, 0 },
                new[] { "Menu", "F1", "F2", "F3" },
                new[] { "Menu A (battery or mains)", "Class 1 — earthed appliance", "Class 2 — double insulated", "Lead test — extension leads & boards" },
                new[] { "Menu B (mains only)", "Power test (wattmeter)", "Leakage / run test", "RCD tests (trip time, ramp)" }),
            Guide.P("Hold F3 from the menu to enter Meter Mode (volts, amps, watts, VA).")));

        Body.Children.Add(Guide.Card("Power and the supply check", Ui.GBolt, "WarnBrush",
            Guide.Bullets(
                "**On mains** the tester switches on by itself and charges. **On battery**, hold the rear power button until it beeps — and make sure the rear **isolation switch is ON**, or nothing works.",
                "Battery is good for about **3,000 sets of tests** and takes about **4 hours** to charge. Wavecom advise against leaving it charging unattended or overnight.",
                "**Battery only does Menu A** (Class 1, Class 2, leads). Leakage / run, power test, Meter Mode and **all RCD tests need mains**."),
            Guide.Table(new double[] { 240, 0 },
                new[] { "Supply LEDs", "Meaning" },
                new[] { "A-N and A-E green, N-E off", "Supply is fine — carry on." },
                new[] { "N-E red", "Voltage between neutral and earth, or **no earth**. **Don't do leakage / run tests.** Earth bond and insulation tests are generally still OK. Normal on generators and inverters." },
                new[] { "N-E red and A-E green", "Fault in the mains supply — stop and get an electrician to look at the outlet." }),
            Guide.Callout("If you're powering the tester from a generator on site, expect N-E to light — use Menu A tests and skip anything that powers the appliance.")));

        // ------------------------------------------------------------ tests
        Body.Children.Add(Guide.Card("Class 1 — earthed appliance (Menu A · F1)", Ui.GBolt, "AccentBrush",
            Guide.Steps(
                "Visual inspection. If it fails, stop: **DANGER** tag, out of service — no other test needed.",
                "Plug the appliance into the **Appliance Test Socket**.",
                "Plug the black **earth clip lead** into the **IEC Test Socket** and clip it to **bare** metal on the appliance — paint and coatings don't make contact. (Wavecom sell a metal braid for items with nothing to clip to.)",
                "Menu A, press **F1**. It runs the supply check, checks the appliance is plugged in and switched on, then **earth bond** and **insulation**.",
                "Flexing the cord during the earth bond? Tap **ENTER** during the test to add **30 seconds** each press — handy for finding intermittent earths.",
                "Record the readings and tag it: pass tag with the next test date, or DANGER tag and remove from service."),
            Guide.Table(new double[] { 200, 0 },
                new[] { "Test", "TnT RCD pass level" },
                new[] { "Earth bond (200 mA)", "less than 1 Ω" },
                new[] { "Insulation (500 V or 250 V d.c.)", "more than 1 MΩ" }),
            Guide.Callout("Anything marked **surge protection fitted**, or containing MOVs, can fail at 500 V because the surge protection conducts. Set the tester to **250 V** and retest; if it still fails, it's out of service. " +
                          "The TnT RCD tests from active and neutral (joined inside the tester) to earth, so the 500 V test doesn't go through the electronics.")));

        Body.Children.Add(Guide.Card("Class 2 — double insulated (Menu A · F2)", Ui.GBolt, "VioletBrush",
            Guide.Steps(
                "Visual inspection, and check the compliance plate for the **double-insulated symbol** (square in a square) or the words DOUBLE INSULATION.",
                "Plug into the **Appliance Test Socket** — no earth lead needed.",
                "Menu A, press **F2**. Supply check, plugged-in check, then insulation.",
                "Pass is **more than 1 MΩ**. Tag and record."),
            Guide.P("Same 250 V rule for surge-protected gear — read the plate first, especially on power boards.")));

        Body.Children.Add(Guide.Card("Extension leads and power boards (Menu A · F3)", Ui.GLink, "OkBrush",
            Guide.Steps(
                "**Uncoil** the lead fully, then do the visual inspection.",
                "Plug the orange **IEC lead** into the tester's **IEC Test Socket**.",
                "Plug the lead's **plug** into the **Appliance Test Socket**.",
                "Plug the orange lead into the extension lead's **socket** end (or one outlet of the power board).",
                "Menu A, press **F3**: supply check, earth bond (< 1 Ω), insulation (> 1 MΩ), then **continuity and polarity**.",
                "Tag and record."),
            Guide.Callout("A loose IEC plug or a half-pushed-in adaptor shows up as a **continuity or polarity fail** — push everything home and retest before failing the lead.")));

        Body.Children.Add(Guide.Card("Leakage / run test (Menu B · F2) — mains only", Ui.GWarn, "WarnBrush",
            Guide.P("The alternative to insulation testing when that isn't suitable — the appliance is **powered and running** while the tester measures leakage."),
            Guide.Steps(
                "Visual inspection. **Secure the appliance** — it will switch on and anything that moves will move.",
                "Plug into the Appliance Test Socket. Class 1: earth clip lead into the IEC socket and onto bare metal.",
                "Press **ENTER** for Menu B, then **F2**. Choose: **F1** earth leakage (Class 1) · **F2** double insulated and extension leads · **F3** RCD leakage (not a trip-time test).",
                "The tester does the unpowered part first, then warns you. Press **F3** to power the appliance.",
                "It runs for the set time (default **20 s**, adjustable in 5 s steps in the options). Record and tag."),
            Guide.Table(new double[] { 200, 0 },
                new[] { "Class", "Pass level" },
                new[] { "Class 1", "5 mA or less" },
                new[] { "Class 2", "1 mA or less" }),
            Guide.Callout("If the outlet you're plugged into is on an RCD, a leaky appliance can trip it (somewhere around 10–30 mA) and kill your supply. Maximum load is **10 A**.")));

        Body.Children.Add(Guide.Card("RCDs — trip time and ramp (Menu B · F3) — mains only", Ui.GCheck, "BadBrush",
            Guide.P("Set up first — the RCD type sets the pass / fail limits:"),
            Guide.Steps(
                "ENTER for Menu B, **F3** for the RCD menu, **F1** for the Time Test.",
                "**F3** opens the options. **F3** there sets the **RCD type**: F1 = Type 1 (10 mA, must trip in under 40 ms — medical areas), F2 = Type 2 (30 mA, under 300 ms — nearly everything, and the default).",
                "It then asks about **Portable RCD (PRCD)** testing — turn it **on** for portable RCDs, **off** only for switchboard RCDs.",
                "**F2** in the options sets the test current (5–500 mA): F1 goes up by 1 mA, F2 down by 5 mA, **ENTER** saves it.",
                "Pick **0°** (positive) and press **F3** to trip it — the time shows in milliseconds. Then **Retest** on **180°**. Test both.",
                "After it trips the tester drops to battery. **Reconnect mains** before the next RCD test."),
            Guide.Table(new double[] { 200, 0 },
                new[] { "Multiplier (30 mA RCD)", "What should happen" },
                new[] { "×0.5 — 15 mA", "Should **not** trip" },
                new[] { "×1 — 30 mA", "Trips within the limit (300 ms for Type 2)" },
                new[] { "×5 — 150 mA", "Trips fast" }),
            Guide.Bullets(
                "**Ramp test** (RCD menu **F2**): raises the current until it trips, to find the actual trip current — useful for nuisance tripping. Add **2 mA** (the tester's own leakage) to the reading.",
                "Testing an RCD on a circuit with a **switchboard RCD** upstream will often trip that one instead, taking out the area. Wavecom's **isolation transformer** (WCM-ISOT) avoids that — check before tripping anything in a busy workplace.",
                "Portable RCDs with and without a switch need different hook-ups — the diagrams are on the RCD pages of the manual.")));

        Body.Children.Add(Guide.Card("Messages you'll see", Ui.GInfo, "AccentBrush",
            Guide.Table(new double[] { 220, 0 },
                new[] { "Screen / light", "What to do" },
                new[] { "Plug in the appliance / not detected (NCNT)", "The tester can't see a load. Check it's plugged in **and switched on**. If it really is, **F3** overrides — your call. Appliances on contactors (and 3-phase adaptors) usually need the override; holding the appliance's ON button sometimes lets it detect." },
                new[] { "Power-on warning", "Before any test that powers the appliance. Make sure it's secure, then F3." },
                new[] { "All LEDs red after a test", "Fail — DANGER tag, out of service." },
                new[] { "Nothing works on battery", "Rear isolation switch is off, or the battery is flat (LED 1 flashing = empty)." },
                new[] { "Tester dead after a faulty appliance", "Internal fuse blown: rear panel, next to the IEC socket. Replace only with a **10 A M205 fast-blow** (a spare may be in the fuse drawer)." })));

        Body.Children.Add(Guide.Card("Looking after it", Ui.GSettings, "OkBrush",
            Guide.Bullets(
                "**Calibrate every 12 months** (Wavecom Calibrations, Findon SA; book online). Calibrating within the first year extends the warranty from 12 to 24 months. Put the new date in **Tools ▸ Tester Defaults** — it prints on every certificate.",
                "Turn the **isolation switch off** before posting it for calibration.",
                "Charge between 0 °C and about 45 °C. Lithium batteries can't go as air freight.")));

        // ------------------------------------------------------------ suite
        Body.Children.Add(Guide.Card("Recording it in the suite", Ui.GEdit, "VioletBrush",
            Guide.Bullets(
                "**Test & Tag App** (sidebar) is the full site app — photos, client signature, emailing the certificate.",
                "**Jobs ▸ New Job** is the offline editor. **Add from Library** for common appliances; tag numbers count on for you.",
                "Enter **Earth Ω**, **Insul. MΩ** and **Leak mA**; set Visual, RCD and Operation to pass / fail. Set the item **Type** so the invoice prices it right.",
                "Save, then **Certificate…** to print or save the PDF. F5 syncs it to the website and the client portal.")));

        Body.Children.Add(Guide.Callout(
            "**Where the tester and the suite differ:** the TnT RCD fails any earth bond of **1 Ω or more**, whatever the cord length. The suite (like the web app) allows +0.1 Ω per metre past 5 m. " +
            "If the tester says FAIL, record a fail — override the result in the grid.", "BadBrush"));

        Body.Children.Add(Guide.Card("When something fails", Ui.GWarn, "BadBrush",
            Guide.Steps(
                "**DANGER** tag on the spot, out of service, and tell the person responsible.",
                "Note the fault in the item's **Fault** column (e.g. \"earth bond 3.2 Ω — damaged cord\").",
                "Repairable on site (plug top, cord)? Fit the part, pick it in **Part fitted** so it's billed and taken off stock, then retest.",
                "Not repairable: leave it failed and flagged for follow-up — it shows on the certificate.")));
    }

    private readonly TextBlock _manualNote = new() { FontSize = 11.5, TextWrapping = TextWrapping.Wrap };

    /// <summary>Where the offline copy is kept: %AppData%\ZoltanStudios\Manuals.</summary>
    private static string CachePath => System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ZoltanStudios", "Manuals", "Wavecom-TnT-RCD-Manual.pdf");

    /// <summary>The copy to open: one you picked, else the downloaded one, else none yet.</summary>
    private static string? ManualPath()
    {
        var chosen = Repository.GetSetting(ManualSetting, "");
        if (chosen.Length > 0 && System.IO.File.Exists(chosen)) return chosen;
        return System.IO.File.Exists(CachePath) ? CachePath : null;
    }

    private void ShowManualState()
    {
        var p = ManualPath();
        _manualNote.Text = p is null
            ? "The manual isn't on this PC yet — it downloads from Wavecom the first time you open it with internet, then works offline."
            : p == CachePath
                ? "Manual saved on this PC — opens with no internet."
                : "Opening your own copy: " + p;
        _manualNote.Foreground = Ui.Res(p is null ? "WarnBrush" : "OkBrush");
    }

    /// <summary>Downloads Wavecom's published manual straight from their site to this PC.</summary>
    private async Task<bool> DownloadManualAsync(bool quiet)
    {
        try
        {
            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(CachePath)!);
            using var http = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(60) };
            var bytes = await http.GetByteArrayAsync(ManualUrl);
            // Only keep it if it really is a PDF (not an error page).
            if (bytes.Length < 1000 || bytes[0] != (byte)'%' || bytes[1] != (byte)'P')
                throw new InvalidOperationException("Wavecom's site didn't return the PDF.");
            var tmp = CachePath + ".part";
            await System.IO.File.WriteAllBytesAsync(tmp, bytes);
            System.IO.File.Move(tmp, CachePath, overwrite: true);
            ShowManualState();
            return true;
        }
        catch (Exception ex)
        {
            if (!quiet)
                Forms.Error(Window.GetWindow(this), "Wavecom manual",
                    "The manual couldn't be downloaded (" + ex.Message + "). It will open in your browser instead; " +
                    "you can also save it yourself and pick it with Use a Different Copy.");
            return false;
        }
    }

    private async Task OpenManualAsync()
    {
        var p = ManualPath();
        if (p is null && await DownloadManualAsync(quiet: false)) p = ManualPath();
        Guide.OpenUrl(p ?? ManualUrl);
    }

    private void ChooseManual()
    {
        var dlg = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Choose your saved copy of the Wavecom TnT RCD manual",
            Filter = "PDF files (*.pdf)|*.pdf",
        };
        if (dlg.ShowDialog(Window.GetWindow(this)) != true) return;
        Repository.SetSetting(ManualSetting, dlg.FileName);
        (Window.GetWindow(this) as MainWindow)?.ReloadCurrent();
    }
}
