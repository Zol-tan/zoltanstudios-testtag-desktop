<?php
// ============================================================
// Photos and signatures kept on the server's disk (not in the database):
// invoice photos from the Business Suite, and the tester's signature that
// the suite and the test-and-tag web app share.
//
// Images are re-compressed on arrival (GD): photos to a 1600 px JPEG,
// signatures to a small PNG. Files live in testtag_uploads/files, which is
// denied to the web (.htaccess) - they're only served through the API.
// ============================================================

declare(strict_types=1);

const FILES_DIR        = __DIR__ . '/../testtag_uploads/files';
const FILES_MAX_BYTES  = 8000000;   // what we accept before compressing
const FILES_PHOTO_SIDE = 1600;
const FILES_SIG_WIDTH  = 900;
const FILES_OWNER_TYPES = ['invoice', 'tester'];

/** A signed-in admin, or a test-and-tag API token. CSRF applies to session writes. */
function files_require_auth(bool $isWrite): void
{
    $u = current_user();
    if ($u) {
        if ((int)$u['is_admin'] !== 1) json_error(403, 'Administrator access required.');
        if ($isWrite) require_csrf();
        return;
    }
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/Bearer\s+(\S+)/i', (string)$h, $m)) {
        $s = db()->prepare('SELECT id FROM api_tokens WHERE token_hash = ? AND scope = ?');
        $s->execute([hash('sha256', $m[1]), 'testtag_push']);
        $tok = $s->fetch();
        if ($tok) {
            db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);
            return;
        }
        json_error(401, 'Invalid API token.');
    }
    json_error(401, 'Please sign in to the admin panel, or configure a valid API token.');
}

function files_ensure_schema(): void
{
    static $done = false;
    if ($done) return;
    db()->exec("CREATE TABLE IF NOT EXISTS zs_files (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        owner_type VARCHAR(20) NOT NULL,
        owner_id VARCHAR(64) NOT NULL,
        owner_ref VARCHAR(64) NOT NULL DEFAULT '',
        kind VARCHAR(20) NOT NULL DEFAULT 'photo',
        note VARCHAR(255) NOT NULL DEFAULT '',
        filename VARCHAR(128) NOT NULL DEFAULT '',
        mime VARCHAR(40) NOT NULL DEFAULT '',
        bytes INT NOT NULL DEFAULT 0,
        created_at VARCHAR(40) NOT NULL DEFAULT '',
        version VARCHAR(40) NOT NULL DEFAULT '',
        updated_at DATETIME NOT NULL)");
    $done = true;
}

function files_dir(): string
{
    if (!is_dir(FILES_DIR)) {
        @mkdir(FILES_DIR, 0755, true);
    }
    // Deny web access even if the parent's .htaccess is ever removed.
    if (!is_file(FILES_DIR . '/.htaccess')) {
        @file_put_contents(FILES_DIR . '/.htaccess', "Require all denied\n");
        @file_put_contents(FILES_DIR . '/index.html', '');
    }
    return FILES_DIR;
}

/**
 * Decodes an image data URL, checks it really is an image, and compresses
 * it. Returns [bytes, mime, ext]. Errors end the request.
 */
function files_decode_image(string $dataUrl, string $kind): array
{
    if (!preg_match('#^data:image/(png|jpeg|jpg|webp);base64,#i', $dataUrl)) {
        json_error(400, 'Expected a base64 image data URL.');
    }
    $raw = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
    if ($raw === false || $raw === '') json_error(400, 'Image data could not be decoded.');
    if (strlen($raw) > FILES_MAX_BYTES) json_error(413, 'That image is too large.');
    $info = @getimagesizefromstring($raw);
    if ($info === false) json_error(400, 'That file is not a valid image.');

    $mime = (string)$info['mime'];
    $out = [$raw, $mime, $mime === 'image/png' ? 'png' : ($mime === 'image/webp' ? 'webp' : 'jpg')];

    if (!function_exists('imagecreatefromstring')) return $out; // no GD: keep it as sent
    $img = @imagecreatefromstring($raw);
    if (!$img) return $out;

    $w = imagesx($img); $h = imagesy($img);
    $isSig = $kind === 'signature';
    $scale = $isSig ? min(1.0, FILES_SIG_WIDTH / max(1, $w)) : min(1.0, FILES_PHOTO_SIDE / max(1, $w, $h));
    $nw = max(1, (int)round($w * $scale)); $nh = max(1, (int)round($h * $scale));

    // Flatten onto white: signatures from some pads are transparent, and
    // JPEG has no transparency (it would turn black).
    $dst = imagecreatetruecolor($nw, $nh);
    imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
    imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imagedestroy($img);

    ob_start();
    if ($isSig) { imagepng($dst, null, 9); $m = 'image/png'; $e = 'png'; }
    else { imagejpeg($dst, null, 80); $m = 'image/jpeg'; $e = 'jpg'; }
    $bytes = (string)ob_get_clean();
    imagedestroy($dst);

    // Keep whichever is smaller - an already-small JPEG can grow on re-save.
    if ($bytes === '' || (strlen($bytes) >= strlen($raw) && $m === $mime)) return $out;
    return [$bytes, $m, $e];
}

/** Saves (or replaces) one file. Returns its row. */
function files_put(string $id, string $ownerType, string $ownerId, string $ownerRef, string $kind,
                   string $note, string $createdAt, string $dataUrl): array
{
    files_ensure_schema();
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) json_error(400, 'Invalid file id.');
    if (!in_array($ownerType, FILES_OWNER_TYPES, true)) json_error(400, 'Unknown owner type.');
    if ($ownerId === '' || strlen($ownerId) > 64) json_error(400, 'An owner id is required.');
    $kind = $kind === 'signature' ? 'signature' : 'photo';

    [$bytes, $mime, $ext] = files_decode_image($dataUrl, $kind);
    $name = $id . '.' . $ext;
    $old = files_row($id);
    if (@file_put_contents(files_dir() . '/' . $name, $bytes) === false) {
        json_error(500, 'Could not store the image on the server.');
    }
    if ($old && $old['filename'] !== '' && $old['filename'] !== $name) @unlink(files_dir() . '/' . basename($old['filename']));

    $row = [$ownerType, $ownerId, substr($ownerRef, 0, 64), $kind, substr($note, 0, 255), $name, $mime,
            strlen($bytes), substr($createdAt !== '' ? $createdAt : now(), 0, 40), now(), $id];
    if ($old) {
        db()->prepare('UPDATE zs_files SET owner_type=?, owner_id=?, owner_ref=?, kind=?, note=?, filename=?, mime=?,
                         bytes=?, created_at=?, updated_at=? WHERE id=?')->execute($row);
    } else {
        db()->prepare('INSERT INTO zs_files (owner_type,owner_id,owner_ref,kind,note,filename,mime,bytes,created_at,updated_at,id)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?)')->execute($row);
    }
    return files_row($id);
}

function files_row(string $id): ?array
{
    files_ensure_schema();
    $s = db()->prepare('SELECT * FROM zs_files WHERE id = ?');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}

function files_meta(array $r): array
{
    return [
        'id' => $r['id'], 'ownerType' => $r['owner_type'], 'ownerId' => $r['owner_id'], 'ref' => $r['owner_ref'],
        'kind' => $r['kind'], 'note' => $r['note'], 'createdAt' => $r['created_at'], 'bytes' => (int)$r['bytes'],
        'updatedAt' => $r['updated_at'],
    ];
}

function files_data_url(array $r): string
{
    if ($r['filename'] === '') return '';
    $path = files_dir() . '/' . basename((string)$r['filename']);
    if (!is_file($path)) return '';
    return 'data:' . $r['mime'] . ';base64,' . base64_encode((string)file_get_contents($path));
}

function files_delete(string $id): bool
{
    $r = files_row($id);
    if (!$r) return false;
    if ($r['filename'] !== '') @unlink(files_dir() . '/' . basename((string)$r['filename']));
    db()->prepare('DELETE FROM zs_files WHERE id = ?')->execute([$id]);
    return true;
}

// ------------------------------------------------------------ tester signature

const TESTER_SIG_ID = 'tester-signature';

/**
 * The tester's signature, shared by every app. "version" changes on every
 * set (including clearing it), so each app can tell whether its copy is current.
 */
function files_tester_get(): array
{
    $r = files_row(TESTER_SIG_ID);
    if (!$r) return ['dataUrl' => '', 'version' => ''];
    return ['dataUrl' => files_data_url($r), 'version' => (string)$r['version'], 'updatedAt' => iso((string)$r['updated_at'])];
}

/** Sets (or, with '', clears) the tester's signature. */
function files_tester_set(string $dataUrl): array
{
    files_ensure_schema();
    if ($dataUrl === '') {
        // Kept as an empty row so "cleared" has a version other apps can see.
        files_delete(TESTER_SIG_ID);
        db()->prepare("INSERT INTO zs_files (id,owner_type,owner_id,kind,filename,mime,bytes,created_at,updated_at)
                       VALUES (?,'tester','signature','signature','','',0,?,?)")->execute([TESTER_SIG_ID, now(), now()]);
    } else {
        files_put(TESTER_SIG_ID, 'tester', 'signature', '', 'signature', '', now(), $dataUrl);
    }
    // A new version on every set, even two in the same second.
    db()->prepare('UPDATE zs_files SET version = ? WHERE id = ?')->execute([bin2hex(random_bytes(8)), TESTER_SIG_ID]);
    return files_tester_get();
}
