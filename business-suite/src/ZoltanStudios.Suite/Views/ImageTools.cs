using System.IO;
using System.Windows;
using System.Windows.Ink;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using ZoltanStudios.Suite.Services;

namespace ZoltanStudios.Suite.Views;

/// <summary>Turning images into data URLs and back, for photos, signatures and QR codes.</summary>
internal static class ImageTools
{
    /// <summary>Longest side of a photo once added - plenty for a certificate, and keeps sync small.</summary>
    public const int PhotoMaxSide = 1600;

    public static BitmapSource? FromBytes(byte[]? bytes)
    {
        if (bytes is null || bytes.Length == 0) return null;
        try
        {
            var img = new BitmapImage();
            img.BeginInit();
            img.CacheOption = BitmapCacheOption.OnLoad;
            img.StreamSource = new MemoryStream(bytes);
            img.EndInit();
            img.Freeze();
            return img;
        }
        catch (Exception e) when (e is NotSupportedException or FileFormatException or InvalidOperationException)
        {
            return null;
        }
    }

    public static BitmapSource? FromDataUrl(string dataUrl) => FromBytes(new Attachment { DataUrl = dataUrl }.Bytes());

    /// <summary>
    /// A photo from a file, turned the right way up (phones save most photos
    /// sideways with a rotation tag that Windows' decoder ignores) and shrunk
    /// to <see cref="PhotoMaxSide"/>, as a JPEG data URL.
    /// </summary>
    public static string PhotoFromFile(string path)
    {
        BitmapFrame frame;
        double angle;
        using (var fs = File.OpenRead(path))
        {
            frame = BitmapFrame.Create(fs, BitmapCreateOptions.IgnoreColorProfile | BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
            angle = OrientationAngle(frame); // metadata is read from the stream, so before it closes
        }

        BitmapSource src = frame;
        if (angle != 0) src = new TransformedBitmap(src, new RotateTransform(angle));

        var scale = Math.Min(1.0, PhotoMaxSide / (double)Math.Max(src.PixelWidth, src.PixelHeight));
        if (scale < 1.0) src = new TransformedBitmap(src, new ScaleTransform(scale, scale));

        // JPEG has no alpha: flatten onto white so transparent PNGs don't go black.
        if (src.Format != PixelFormats.Bgr24 && src.Format != PixelFormats.Bgr32)
            src = new FormatConvertedBitmap(Flatten(src), PixelFormats.Bgr24, null, 0);

        var enc = new JpegBitmapEncoder { QualityLevel = 82 };
        enc.Frames.Add(BitmapFrame.Create(src));
        using var ms = new MemoryStream();
        enc.Save(ms);
        return "data:image/jpeg;base64," + Convert.ToBase64String(ms.ToArray());
    }

    private static BitmapSource Flatten(BitmapSource src)
    {
        var v = new DrawingVisual();
        using (var dc = v.RenderOpen())
        {
            var r = new Rect(0, 0, src.PixelWidth, src.PixelHeight);
            dc.DrawRectangle(Brushes.White, null, r);
            dc.DrawImage(src, r);
        }
        var rtb = new RenderTargetBitmap(src.PixelWidth, src.PixelHeight, 96, 96, PixelFormats.Pbgra32);
        rtb.Render(v);
        return rtb;
    }

    /// <summary>The EXIF orientation as a clockwise rotation (0 if none or unreadable).</summary>
    private static double OrientationAngle(BitmapFrame frame)
    {
        try
        {
            if (frame.Metadata is BitmapMetadata md && md.ContainsQuery("System.Photo.Orientation"))
            {
                return Convert.ToInt32(md.GetQuery("System.Photo.Orientation")) switch
                {
                    3 => 180,
                    6 => 90,
                    8 => 270,
                    _ => 0,
                };
            }
        }
        catch (Exception e) when (e is NotSupportedException or InvalidOperationException or ArgumentException or InvalidCastException or FormatException)
        {
            // PNGs and some cameras' files have no readable metadata: leave it as is.
        }
        return 0;
    }

    /// <summary>
    /// Signature strokes, cropped to the ink with a small margin, on white, as
    /// a PNG data URL - so it sits on the certificate's line rather than as a
    /// small scribble in a big empty box. Null if nothing was drawn.
    /// </summary>
    public static string? SignatureFromStrokes(StrokeCollection strokes)
    {
        if (strokes.Count == 0) return null;
        var b = strokes.GetBounds();
        const double pad = 10, scale = 2;
        b.Inflate(pad, pad);

        var v = new DrawingVisual();
        using (var dc = v.RenderOpen())
        {
            dc.PushTransform(new ScaleTransform(scale, scale));
            dc.PushTransform(new TranslateTransform(-b.X, -b.Y));
            dc.DrawRectangle(Brushes.White, null, b);
            strokes.Draw(dc);
        }
        var w = (int)Math.Ceiling(b.Width * scale);
        var h = (int)Math.Ceiling(b.Height * scale);
        var rtb = new RenderTargetBitmap(Math.Max(1, w), Math.Max(1, h), 96, 96, PixelFormats.Pbgra32);
        rtb.Render(v);

        var enc = new PngBitmapEncoder();
        enc.Frames.Add(BitmapFrame.Create(rtb));
        using var ms = new MemoryStream();
        enc.Save(ms);
        return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
    }

    /// <summary>A QR code for a link.</summary>
    public static BitmapSource? Qr(string text)
    {
        using var gen = new QRCoder.QRCodeGenerator();
        using var data = gen.CreateQrCode(text, QRCoder.QRCodeGenerator.ECCLevel.M);
        var png = new QRCoder.PngByteQRCode(data).GetGraphic(8);
        return FromBytes(png);
    }
}
