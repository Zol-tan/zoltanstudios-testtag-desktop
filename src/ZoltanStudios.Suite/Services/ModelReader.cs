using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace ZoltanStudios.Suite.Services;

/// <summary>What was read out of a model or sliced file.</summary>
public sealed record ModelInfo(
    string FileName,
    string Format,
    double VolumeCm3,
    double LengthMm,
    double WidthMm,
    double HeightMm,
    int Triangles,
    double? SlicerGrams = null,
    double? SlicerMinutes = null,
    string? Note = null)
{
    /// <summary>
    /// A sliced file already knows the real answer — the slicer accounted for
    /// walls, infill, supports and brim. Trust it over a geometric estimate.
    /// </summary>
    public bool IsSliced => SlicerGrams is > 0;
}

/// <summary>
/// Reads 3D model files to get an accurate size, rather than making the
/// customer measure a bounding box.
///
/// Supported: STL (binary and ASCII), OBJ, 3MF, and G-code from the common
/// slicers. STEP, IGES and native CAD files (F3D, SLDPRT) are not — those are
/// boundary representations needing a full CAD kernel, not meshes. Export to
/// STL or 3MF first.
/// </summary>
public static class ModelReader
{
    public static readonly string[] SupportedExtensions =
        { ".stl", ".obj", ".3mf", ".gcode", ".gco", ".g" };

    public static string FileFilter =>
        "3D models and sliced files|*.stl;*.obj;*.3mf;*.gcode;*.gco;*.g|"
      + "STL mesh|*.stl|OBJ mesh|*.obj|3MF|*.3mf|G-code|*.gcode;*.gco;*.g|All files|*.*";

    public static ModelInfo Read(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".stl" => ReadStl(path),
            ".obj" => ReadObj(path),
            ".3mf" => Read3mf(path),
            ".gcode" or ".gco" or ".g" => ReadGcode(path),
            _ => throw new NotSupportedException(
                $"{ext} isn't a mesh format this can read. Export to STL or 3MF, "
              + "or open the sliced G-code for an exact figure."),
        };
    }

    // ------------------------------------------------------------------- mesh

    /// <summary>
    /// Signed volume of the tetrahedron each triangle forms with the origin.
    /// Summed over a closed mesh these cancel to the enclosed volume,
    /// regardless of where the origin sits.
    /// </summary>
    private static double SignedVolume(
        double ax, double ay, double az,
        double bx, double by, double bz,
        double cx, double cy, double cz)
        => (ax * (by * cz - bz * cy)
          - ay * (bx * cz - bz * cx)
          + az * (bx * cy - by * cx)) / 6.0;

    private sealed class MeshAccumulator
    {
        public double Volume;
        public int Triangles;
        public double MinX = double.MaxValue, MinY = double.MaxValue, MinZ = double.MaxValue;
        public double MaxX = double.MinValue, MaxY = double.MinValue, MaxZ = double.MinValue;

        public void Add(double ax, double ay, double az,
                        double bx, double by, double bz,
                        double cx, double cy, double cz)
        {
            Volume += SignedVolume(ax, ay, az, bx, by, bz, cx, cy, cz);
            Triangles++;
            Track(ax, ay, az); Track(bx, by, bz); Track(cx, cy, cz);
        }

        private void Track(double x, double y, double z)
        {
            if (x < MinX) MinX = x; if (x > MaxX) MaxX = x;
            if (y < MinY) MinY = y; if (y > MaxY) MaxY = y;
            if (z < MinZ) MinZ = z; if (z > MaxZ) MaxZ = z;
        }

        public ModelInfo ToInfo(string file, string format)
        {
            // Negative means the winding is inverted; the magnitude is still
            // correct, so don't reject an otherwise usable model over it.
            var mm3 = Math.Abs(Volume);
            return new ModelInfo(
                file, format,
                mm3 / 1000.0,
                Triangles == 0 ? 0 : MaxX - MinX,
                Triangles == 0 ? 0 : MaxY - MinY,
                Triangles == 0 ? 0 : MaxZ - MinZ,
                Triangles);
        }
    }

    // -------------------------------------------------------------------- STL

    private static ModelInfo ReadStl(string path)
    {
        // An ASCII STL starts with "solid", but so do some binary files from
        // careless exporters. The reliable test is whether the declared
        // triangle count matches the actual file length.
        using var fs = File.OpenRead(path);
        var header = new byte[84];
        if (fs.Read(header, 0, 84) < 84)
            throw new InvalidDataException("That STL file is too short to be valid.");

        var declared = BitConverter.ToUInt32(header, 80);
        var expected = 84L + declared * 50L;
        fs.Position = 0;

        return fs.Length == expected
            ? ReadBinaryStl(fs, path, declared)
            : ReadAsciiStl(path);
    }

    private static ModelInfo ReadBinaryStl(FileStream fs, string path, uint count)
    {
        var acc = new MeshAccumulator();
        using var br = new BinaryReader(fs);
        br.ReadBytes(84); // header + count

        for (var i = 0; i < count; i++)
        {
            br.ReadBytes(12); // normal, not needed
            var v = new float[9];
            for (var j = 0; j < 9; j++) v[j] = br.ReadSingle();
            br.ReadUInt16(); // attribute byte count
            acc.Add(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]);
        }

        return acc.ToInfo(Path.GetFileName(path), "STL (binary)");
    }

    private static ModelInfo ReadAsciiStl(string path)
    {
        var acc = new MeshAccumulator();
        var verts = new List<double[]>(3);

        foreach (var raw in File.ReadLines(path))
        {
            var line = raw.AsSpan().Trim();
            if (!line.StartsWith("vertex")) continue;

            var parts = line.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 4) continue;

            verts.Add(new[]
            {
                Dbl(parts[1]), Dbl(parts[2]), Dbl(parts[3]),
            });

            if (verts.Count == 3)
            {
                acc.Add(verts[0][0], verts[0][1], verts[0][2],
                        verts[1][0], verts[1][1], verts[1][2],
                        verts[2][0], verts[2][1], verts[2][2]);
                verts.Clear();
            }
        }

        return acc.ToInfo(Path.GetFileName(path), "STL (ASCII)");
    }

    // -------------------------------------------------------------------- OBJ

    private static ModelInfo ReadObj(string path)
    {
        var acc = new MeshAccumulator();
        var verts = new List<double[]>();

        foreach (var raw in File.ReadLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line[0] == '#') continue;

            if (line.StartsWith("v ", StringComparison.Ordinal))
            {
                var p = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (p.Length >= 4) verts.Add(new[] { Dbl(p[1]), Dbl(p[2]), Dbl(p[3]) });
            }
            else if (line.StartsWith("f ", StringComparison.Ordinal))
            {
                var p = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var idx = new List<int>();
                for (var i = 1; i < p.Length; i++)
                {
                    // Faces may be "v", "v/vt", "v//vn" or "v/vt/vn".
                    var token = p[i].Split('/')[0];
                    if (!int.TryParse(token, out var n)) continue;
                    // OBJ is 1-based, and negative indices count back from the end.
                    idx.Add(n > 0 ? n - 1 : verts.Count + n);
                }

                // Fan-triangulate polygons so quads and n-gons still count.
                for (var i = 1; i + 1 < idx.Count; i++)
                {
                    if (idx[0] >= verts.Count || idx[i] >= verts.Count || idx[i + 1] >= verts.Count) continue;
                    var a = verts[idx[0]]; var b = verts[idx[i]]; var c = verts[idx[i + 1]];
                    acc.Add(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
                }
            }
        }

        return acc.ToInfo(Path.GetFileName(path), "OBJ");
    }

    // -------------------------------------------------------------------- 3MF

    private static ModelInfo Read3mf(string path)
    {
        using var zip = ZipFile.OpenRead(path);
        var model = zip.Entries.FirstOrDefault(e =>
            e.FullName.EndsWith(".model", StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidDataException("No model found inside that 3MF file.");

        using var stream = model.Open();
        var doc = XDocument.Load(stream);
        XNamespace ns = doc.Root?.GetDefaultNamespace() ?? "";

        var acc = new MeshAccumulator();

        foreach (var mesh in doc.Descendants(ns + "mesh"))
        {
            var verts = mesh.Element(ns + "vertices")?.Elements(ns + "vertex")
                .Select(v => new[]
                {
                    Dbl(v.Attribute("x")?.Value), Dbl(v.Attribute("y")?.Value), Dbl(v.Attribute("z")?.Value),
                }).ToList();
            if (verts is null || verts.Count == 0) continue;

            foreach (var t in mesh.Element(ns + "triangles")?.Elements(ns + "triangle") ?? Enumerable.Empty<XElement>())
            {
                if (!int.TryParse(t.Attribute("v1")?.Value, out var i1) ||
                    !int.TryParse(t.Attribute("v2")?.Value, out var i2) ||
                    !int.TryParse(t.Attribute("v3")?.Value, out var i3)) continue;
                if (i1 >= verts.Count || i2 >= verts.Count || i3 >= verts.Count) continue;

                var a = verts[i1]; var b = verts[i2]; var c = verts[i3];
                acc.Add(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
            }
        }

        return acc.ToInfo(Path.GetFileName(path), "3MF");
    }

    // ------------------------------------------------------------------ gcode

    /// <summary>
    /// Slicers write a summary in comments — filament used and estimated time.
    /// That beats any geometric guess because it accounts for walls, infill,
    /// supports and brim, so it's read in preference to the mesh.
    /// </summary>
    private static ModelInfo ReadGcode(string path)
    {
        double? grams = null, minutes = null, lengthMm = null, cm3 = null;
        double? x = null, y = null, z = null;
        var slicer = "G-code";

        // The summary is at the end in PrusaSlicer/SuperSlicer and near the
        // start in Cura, so scan both ends rather than the whole file.
        var lines = new List<string>();
        using (var sr = new StreamReader(path))
        {
            string? line;
            var n = 0;
            while ((line = sr.ReadLine()) is not null && n++ < 400) lines.Add(line);
        }
        lines.AddRange(TailLines(path, 400));

        foreach (var line in lines)
        {
            if (line.Length == 0 || line[0] != ';') continue;
            var l = line.ToLowerInvariant();

            if (l.Contains("prusaslicer")) slicer = "G-code (PrusaSlicer)";
            else if (l.Contains("supersliced") || l.Contains("superslicer")) slicer = "G-code (SuperSlicer)";
            else if (l.Contains("cura")) slicer = "G-code (Cura)";
            else if (l.Contains("orca")) slicer = "G-code (OrcaSlicer)";
            else if (l.Contains("bambu")) slicer = "G-code (Bambu Studio)";

            grams ??= Match(l, @"filament used \[g\]\s*[:=]\s*([\d.]+)")
                   ?? Match(l, @"total filament used \[g\]\s*[:=]\s*([\d.]+)")
                   ?? Match(l, @"filament_weight\s*[:=]\s*([\d.]+)");

            cm3 ??= Match(l, @"filament used \[cm3\]\s*[:=]\s*([\d.]+)");
            lengthMm ??= Match(l, @"filament used \[mm\]\s*[:=]\s*([\d.]+)")
                      ?? Match(l, @"filament length\s*[:=]\s*([\d.]+)");

            // Cura gives seconds; Prusa gives a human-readable duration.
            var secs = Match(l, @"time\s*[:=]\s*(\d+)\s*$");
            if (secs is not null && l.Contains("time")) minutes ??= secs / 60.0;

            if (minutes is null && l.Contains("estimated printing time"))
            {
                var h = Match(l, @"(\d+)h") ?? 0;
                var m = Match(l, @"(\d+)m") ?? 0;
                if (h > 0 || m > 0) minutes = h * 60 + m;
            }

            x ??= Match(l, @"max_x\s*[:=]\s*([\d.]+)");
            y ??= Match(l, @"max_y\s*[:=]\s*([\d.]+)");
            z ??= Match(l, @"max_z\s*[:=]\s*([\d.]+)")
               ?? Match(l, @"object_height\s*[:=]\s*([\d.]+)");
        }

        if (grams is null && cm3 is not null) grams = cm3 * 1.24;      // PLA
        if (grams is null && lengthMm is not null)
        {
            // 1.75mm filament: area 2.405mm², so mm -> cm³ -> grams.
            var volumeCm3 = lengthMm.Value * 2.405 / 1000.0;
            grams = volumeCm3 * 1.24;
        }

        if (grams is null)
            throw new InvalidDataException(
                "No filament summary found in that G-code. Re-slice with the "
              + "slicer's summary comments enabled, or use the model file instead.");

        return new ModelInfo(
            Path.GetFileName(path), slicer,
            cm3 ?? grams.Value / 1.24,
            x ?? 0, y ?? 0, z ?? 0,
            0, grams, minutes,
            "Filament and time taken from the slicer, so walls, infill and supports are included.");
    }

    private static IEnumerable<string> TailLines(string path, int count)
    {
        var all = new LinkedList<string>();
        foreach (var line in File.ReadLines(path))
        {
            all.AddLast(line);
            if (all.Count > count) all.RemoveFirst();
        }
        return all;
    }

    private static double? Match(string text, string pattern)
    {
        var m = Regex.Match(text, pattern);
        return m.Success && double.TryParse(m.Groups[1].Value,
            NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : null;
    }

    private static double Dbl(string? s)
        => double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : 0;
}
