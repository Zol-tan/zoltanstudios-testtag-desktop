using System.Globalization;
using System.Text.Json;

namespace ZoltanStudios.Suite.Services;

/// <summary>What a supplier's product page says about the product.</summary>
public sealed record ProductInfo(string Name, string Sku, double? Price, string Url, bool IsProduct, bool PriceGuessed, string Supplier);

/// <summary>
/// The shops parts come from, and how to read their pages.
///
/// There's no public API for Bunnings, Jaycar, Altronics or Amazon, so the suite
/// opens their normal website in its built-in browser and reads the product
/// details the page itself publishes for search engines (schema.org
/// "Product" data: name, item number, price). Checked on the live Bunnings
/// and Jaycar product pages. Amazon publishes none, so its product page's
/// own title, ASIN and price are read instead.
/// </summary>
public static class Suppliers
{
    public sealed record Shop(string Name, string Home, string SearchTemplate, string Host);

    public static readonly Shop[] Shops =
    {
        new("Bunnings", "https://www.bunnings.com.au/", "https://www.bunnings.com.au/search/products?q={0}", "bunnings.com.au"),
        new("Jaycar", "https://www.jaycar.com.au/", "https://www.jaycar.com.au/search?q={0}", "jaycar.com.au"),
        new("Altronics", "https://www.altronics.com.au/", "https://www.altronics.com.au/search?q={0}", "altronics.com.au"),
        new("Amazon", "https://www.amazon.com.au/", "https://www.amazon.com.au/s?k={0}", "amazon.com.au"),
    };

    // ------------------------------------------------------------------ Amazon

    private static readonly System.Text.RegularExpressions.Regex AsinRe = new(@"^[A-Z0-9]{10}$");
    private static readonly System.Text.RegularExpressions.Regex AsinInUrl = new(@"/(?:dp|gp/product)/([A-Z0-9]{10})(?:[/?]|$)");

    /// <summary>A part's Amazon item number (ASIN): its item no. if it looks like one, else from its link.</summary>
    public static string AmazonAsin(string? sku, string? url)
    {
        var s = (sku ?? "").Trim().ToUpperInvariant();
        if (AsinRe.IsMatch(s) && s.Any(char.IsLetter)) return s;
        var m = AsinInUrl.Match(url ?? "");
        return m.Success ? m.Groups[1].Value : "";
    }

    /// <summary>
    /// One link that puts several Amazon items in your cart at once, with
    /// quantities: Amazon's "add to cart" form. Amazon shows a page to confirm
    /// them before they go in the cart. Null if nothing has an ASIN.
    /// </summary>
    public static string? AmazonCartUrl(IEnumerable<(string Asin, int Quantity)> items)
    {
        var list = items.Where(i => AsinRe.IsMatch(i.Asin) && i.Quantity > 0)
            .GroupBy(i => i.Asin).Select(g => (Asin: g.Key, Quantity: g.Sum(x => x.Quantity))).ToList();
        if (list.Count == 0) return null;
        var q = string.Join("&", list.Select((i, n) => $"ASIN.{n + 1}={i.Asin}&Quantity.{n + 1}={i.Quantity}"));
        return "https://www.amazon.com.au/gp/aws/cart/add.html?" + q;
    }

    public static readonly string[] Names = Shops.Select(s => s.Name).Concat(new[] { "Other" }).ToArray();

    public static string SearchUrl(string supplier, string query)
    {
        var shop = Shops.FirstOrDefault(s => s.Name.Equals(supplier, StringComparison.OrdinalIgnoreCase)) ?? Shops[0];
        return string.Format(CultureInfo.InvariantCulture, shop.SearchTemplate, Uri.EscapeDataString(query.Trim()));
    }

    /// <summary>Which shop a page belongs to, from its address ("" if none of them).</summary>
    public static string ShopFor(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var u)) return "";
        return Shops.FirstOrDefault(s => u.Host.EndsWith(s.Host, StringComparison.OrdinalIgnoreCase))?.Name ?? "";
    }

    /// <summary>
    /// Runs in the page. Reads schema.org Product data (JSON-LD), falling back
    /// to the page's meta tags, and as a last resort the first dollar amount
    /// on the page - flagged as a guess so the user confirms it.
    /// </summary>
    public const string ExtractScript = """
        (() => {
          const out = { name: '', sku: '', price: null, url: location.href, isProduct: false, priceGuessed: false };
          const visit = x => {
            if (!x || typeof x !== 'object') return;
            if (Array.isArray(x)) { x.forEach(visit); return; }
            if (x['@graph']) visit(x['@graph']);
            const t = x['@type'];
            const isP = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
            if (isP && !out.isProduct) {
              out.isProduct = true;
              out.name = String(x.name || '');
              out.sku = String(x.sku || x.mpn || x.productID || '');
              let o = x.offers;
              if (Array.isArray(o)) o = o[0];
              if (o) {
                const p = o['@type'] === 'AggregateOffer' ? (o.lowPrice ?? o.price) : (o.price ?? (o.priceSpecification && o.priceSpecification.price));
                if (p !== undefined && p !== null && p !== '') out.price = String(p);
                if (o.url) out.url = String(o.url);
              }
            }
          };
          document.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { visit(JSON.parse(s.textContent)); } catch (e) {} });
          // Amazon doesn't publish schema.org Product data: read its product page instead.
          if (!out.isProduct && /(^|\.)amazon\./.test(location.hostname)) {
            const title = document.getElementById('productTitle');
            if (title) {
              out.isProduct = true;
              out.name = title.textContent.trim();
              const asinEl = document.getElementById('ASIN') || document.querySelector('input[name="ASIN"]');
              const m = location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
              out.sku = (asinEl && asinEl.value) || (m && m[1]) || '';
              const priceEl = document.querySelector('#corePrice_feature_div .a-offscreen, #corePriceDisplay_desktop_feature_div .a-offscreen, #apex_desktop .a-price .a-offscreen, #price_inside_buybox, #priceblock_ourprice, .a-price .a-offscreen');
              if (priceEl && priceEl.textContent.trim()) out.price = priceEl.textContent.trim();
              if (out.sku) out.url = location.origin + '/dp/' + out.sku;
            }
          }
          if (!out.name) {
            const og = document.querySelector('meta[property="og:title"]');
            out.name = (og && og.content) || document.title || '';
          }
          if (out.price === null) {
            const m = document.querySelector('meta[property="product:price:amount"],meta[itemprop="price"],[itemprop="price"]');
            if (m) out.price = m.getAttribute('content') || m.textContent;
          }
          if (out.price === null && out.isProduct) {
            const h = document.querySelector('main') || document.body;
            const mm = (h.innerText || '').match(/\$\s?(\d{1,5}(?:\.\d{2}))/);
            if (mm) { out.price = mm[1]; out.priceGuessed = true; }
          }
          out.name = out.name.replace(/\s*[|\-–:]\s*(Bunnings|Jaycar|Altronics|Amazon)[^|]*$/i, '').replace(/^Amazon\.com\.au\s*:\s*/i, '').trim();
          return JSON.stringify(out);
        })()
        """;

    /// <summary>
    /// Runs in the page: on a search results page, the link to the product
    /// with this item number (Bunnings links end "_p1234567", Jaycar "/p/AB1234", Amazon "/dp/B0XXXXXXXX").
    /// </summary>
    public static string FindProductLinkScript(string sku) => $$"""
        (() => {
          const sku = {{JsonSerializer.Serialize(sku.Trim())}}.toLowerCase();
          if (!sku) return '';
          const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
          return links.find(h => { const l = h.toLowerCase(); return l.endsWith('_p' + sku) || l.includes('_p' + sku + '?') || l.includes('/p/' + sku) || l.includes('/dp/' + sku); }) || '';
        })()
        """;

    /// <summary>Reads what <see cref="ExtractScript"/> returned (WebView2 returns it JSON-encoded).</summary>
    public static ProductInfo? Parse(string? scriptResult, string pageUrl = "")
    {
        if (string.IsNullOrWhiteSpace(scriptResult) || scriptResult == "null") return null;
        try
        {
            var text = scriptResult.TrimStart().StartsWith('"')
                ? JsonSerializer.Deserialize<string>(scriptResult) ?? ""
                : scriptResult;
            using var doc = JsonDocument.Parse(text);
            var r = doc.RootElement;
            var url = Json.Str(r, "url", pageUrl);
            double? price = null;
            var raw = Json.Str(r, "price").Replace("$", "").Replace(",", "").Trim();
            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var p) && p >= 0) price = Math.Round(p, 2);
            return new ProductInfo(
                Json.Str(r, "name").Trim(),
                Json.Str(r, "sku").Trim(),
                price,
                url,
                Json.Bool(r, "isProduct"),
                Json.Bool(r, "priceGuessed"),
                ShopFor(url));
        }
        catch (JsonException) { return null; }
    }
}
