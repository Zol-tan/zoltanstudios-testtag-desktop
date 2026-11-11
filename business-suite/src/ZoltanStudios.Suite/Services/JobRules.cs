using System.Text.RegularExpressions;
using ZoltanStudios.Suite.Models;

namespace ZoltanStudios.Suite.Services;

/// <summary>
/// Rules about jobs that more than one screen depends on, kept here so they
/// can be tested and can't drift apart.
/// </summary>
public static class JobRules
{
    // ------------------------------------------------------------ retests

    /// <summary>
    /// The jobs whose retest is still outstanding. A site retested since is
    /// no longer due: before this, every old job stayed "overdue" forever
    /// after its site had been done again.
    /// A site is the same client and site address (ignoring case, spaces and
    /// punctuation); jobs with neither are always kept.
    /// </summary>
    public static List<Job> CurrentForRetest(IEnumerable<Job> jobs)
    {
        var list = jobs.ToList();
        var latest = new Dictionary<string, Job>();
        var keep = new List<Job>();
        foreach (var j in list)
        {
            var key = SiteKey(j);
            if (key is null) { keep.Add(j); continue; }
            if (!latest.TryGetValue(key, out var cur) || string.CompareOrdinal(j.TestDate, cur.TestDate) > 0)
                latest[key] = j;
        }
        keep.AddRange(latest.Values);
        return keep;
    }

    private static string? SiteKey(Job j)
    {
        var site = Regex.Replace((j.SiteAddress ?? "").ToLowerInvariant(), "[^a-z0-9]", "");
        var client = j.ClientId ?? "";
        if (site.Length == 0 && client.Length == 0) return null;
        return client + "|" + site;
    }

    // ------------------------------------------------------------ tag roll

    private static readonly Regex TagRe = new(@"^(.*?)(\d+)\s*$");

    /// <summary>The tag after the highest one used in these items (same prefix as <paramref name="start"/>).</summary>
    public static string NextTagAfter(string start, IEnumerable<string> usedTags)
    {
        if (string.IsNullOrWhiteSpace(start)) start = "T-001";
        var m = TagRe.Match(start.Trim());
        if (!m.Success) return start;
        var prefix = m.Groups[1].Value;
        var width = m.Groups[2].Value.Length;
        var highest = int.Parse(m.Groups[2].Value) - 1;
        foreach (var t in usedTags)
        {
            var im = TagRe.Match(t ?? "");
            if (im.Success && im.Groups[1].Value == prefix && int.TryParse(im.Groups[2].Value, out var n))
                highest = Math.Max(highest, n);
        }
        return prefix + (highest + 1).ToString().PadLeft(width, '0');
    }

    /// <summary>
    /// The later of two positions on the roll. Saving an old job must never
    /// wind the roll back; a different prefix (a new roll) always wins.
    /// </summary>
    public static string LaterTag(string current, string candidate)
    {
        current ??= ""; candidate ??= "";
        var a = TagRe.Match(current);
        var b = TagRe.Match(candidate);
        if (!b.Success) return current;
        if (!a.Success || a.Groups[1].Value != b.Groups[1].Value) return candidate;
        return long.Parse(b.Groups[2].Value) > long.Parse(a.Groups[2].Value) ? candidate : current;
    }

    // ------------------------------------------------------------ invoices

    /// <summary>
    /// Invoice lines for a job, priced from Rates. The call-out covers the
    /// first N standard items; volume tiers replace the standard rate rather
    /// than stacking - matching the website's quote.
    /// Parts come from the job's items (so parts fitted in the web app are
    /// billed too), priced as recorded when fitted in the suite, else at the
    /// part's current sell price.
    /// </summary>
    public static List<InvoiceLines.Line> InvoiceLinesFor(Job job, Rates rates, List<Part> parts,
        List<(string Name, int Quantity, double Sell)> recordedUse)
    {
        var lines = new List<InvoiceLines.Line>();
        var items = job.Items;
        var std = items.Count(i => i.ItemType is "standard" or "");
        var tools = items.Count(i => i.ItemType == "power_tool");
        var rcd = items.Count(i => i.ItemType == "rcd");
        var micro = items.Count(i => i.ItemType == "microwave");
        var total = items.Count;

        lines.Add(new InvoiceLines.Line(
            rates.CallOutLabel($"Test and tag call-out - {job.SiteAddress}"), 1, rates.CallOut));

        var chargeable = Math.Max(0, std - rates.CallOutIncludes);
        var rate = total >= 200 ? rates.PerItem200 : total >= 100 ? rates.PerItem100 : rates.PerItemStandard;
        if (chargeable > 0)
            lines.Add(new InvoiceLines.Line(total >= 100 && rate != rates.PerItemStandard
                ? $"Additional items tested (volume rate, {total} items total)"
                : rates.CallOutIncludes > 0 ? "Additional items tested" : "Items tested", chargeable, rate));
        if (tools > 0) lines.Add(new InvoiceLines.Line("Power tools / heavy equipment", tools, rates.PerItemPowerTool));
        if (rcd > 0) lines.Add(new InvoiceLines.Line("RCD / safety switch testing", rcd, rates.PerItemRcd));
        if (micro > 0) lines.Add(new InvoiceLines.Line("Microwave leakage testing", micro, rates.PerItemMicrowave));

        if (recordedUse.Count > 0)
        {
            foreach (var (name, qty, sell) in recordedUse)
                lines.Add(new InvoiceLines.Line("Repair part fitted - " + name, qty, sell));
        }
        else
        {
            foreach (var g in items.Where(i => !string.IsNullOrEmpty(i.PartId)).GroupBy(i => i.PartId))
            {
                var p = parts.FirstOrDefault(x => x.Id == g.Key);
                if (p is null || p.Consumable) continue;
                lines.Add(new InvoiceLines.Line("Repair part fitted - " + p.Name, g.Count(), p.Sell));
            }
        }
        return lines;
    }
}
