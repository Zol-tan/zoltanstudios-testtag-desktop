<?php
// ============================================================
// Phone -> laptop capture relay  ->  /api/capture.php?action=...
//
//   start        POST  jobId[,label,mode]   (logged in)  -> {token, url, expiresAt}
//   session      GET   token                (public)     -> {jobId, valid, label, mode}
//   upload       POST  token,kind,data      (public)     -> {id, kind}
//   poll         GET   jobId[,since]        (logged in)  -> [{id,kind,dataUrl,createdAt}]
//   delete       POST  id                   (logged in)
//
// The phone never logs in. It presents a short-lived single-job token
// obtained by scanning a QR code shown on the already-authenticated
// laptop. The token grants upload rights to ONE job and nothing else.
//
// "jobId" is any record the laptop wants photos or a signature for: a job,
// an invoice ("invoice-<id>"), or the tester's own signature. "mode" tells
// the phone page what to show: both (default), photos, signature (a client
// signs) or tester (the tester signs - no name box).
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/_files.php';

// CORS for the desktop / mobile shell, which runs on its own origin and
// authenticates with a Bearer token rather than cookies. The browser sends
// an OPTIONS preflight because of the Authorization header.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Where the image files live. Keep OUTSIDE public_html if you can;
// falls back to a protected folder under the api directory.
const CAPTURE_DIR      = __DIR__ . '/../testtag_uploads';
const TOKEN_TTL_MIN    = 60;          // capture link lifetime
const CAPTURE_MAX_BYTES = 6000000;     // ~6MB per image after base64 decode
const KEEP_DAYS        = 30;          // captures are copied into the record; the relay copy is cleared after this
const CAPTURE_MODES    = ['both', 'photos', 'signature', 'tester'];

/**
 * Creates the relay tables if capture-schema.sql was never run (before this
 * the relay failed with a database error until someone ran it by hand), and
 * adds the label/mode columns to an existing install. Portable SQL so the
 * test harness's SQLite runs the same code.
 */
function capture_ensure_schema(): void
{
    static $done = false;
    if ($done) return;
    $pdo = db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS testtag_capture_tokens (
        id VARCHAR(64) NOT NULL PRIMARY KEY, user_id VARCHAR(64) NOT NULL, job_id VARCHAR(64) NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS testtag_captures (
        id VARCHAR(64) NOT NULL PRIMARY KEY, user_id VARCHAR(64) NOT NULL, job_id VARCHAR(64) NOT NULL,
        kind VARCHAR(20) NOT NULL DEFAULT 'photo', filename VARCHAR(128) NOT NULL, mime VARCHAR(64) NOT NULL,
        bytes INT NOT NULL DEFAULT 0, note VARCHAR(255) NOT NULL DEFAULT '', created_at DATETIME NOT NULL)");
    try { $pdo->query('SELECT label FROM testtag_capture_tokens LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec("ALTER TABLE testtag_capture_tokens ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT ''"); }
    try { $pdo->query('SELECT mode FROM testtag_capture_tokens LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec("ALTER TABLE testtag_capture_tokens ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'both'"); }
    $done = true;
}

/** Clears expired links, and relay copies older than KEEP_DAYS (files too). */
function capture_housekeeping(): void
{
    $pdo = db();
    $pdo->prepare('DELETE FROM testtag_capture_tokens WHERE expires_at < ?')
        ->execute([gmdate('Y-m-d H:i:s', time() - 86400)]);
    $old = $pdo->prepare('SELECT id, filename FROM testtag_captures WHERE created_at < ?');
    $old->execute([gmdate('Y-m-d H:i:s', time() - KEEP_DAYS * 86400)]);
    foreach ($old->fetchAll() as $r) {
        @unlink(CAPTURE_DIR . '/' . basename((string)$r['filename']));
        $pdo->prepare('DELETE FROM testtag_captures WHERE id = ?')->execute([$r['id']]);
    }
}

/**
 * Auth for the capture endpoints.
 *
 * Two ways in, matching services.php:
 *   - a logged-in admin session (app opened in a browser on this site)
 *   - a Bearer API token with the 'testtag_push' scope (desktop / mobile
 *     shell, which runs on its own origin so no session cookie is sent)
 *
 * api_tokens has no user_id, so token-authenticated callers are attributed
 * to the first admin account - consistent with services.php treating the
 * token as a single business-wide credential.
 */
function capture_bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $hdr = (string)$v; break; }
        }
    }
    if (preg_match('/Bearer\s+(\S+)/i', (string)$hdr, $m)) {
        return $m[1];
    }
    return '';
}

/** Validates the token the same way services.php does. */
function capture_token_valid(): bool
{
    $token = capture_bearer_token();
    if ($token === '') return false;

    $s = db()->prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND scope = ?');
    $s->execute([hash('sha256', $token), 'testtag_push']);
    $tok = $s->fetch();
    if (!$tok) return false;

    db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);
    return true;
}

/** Session first, then token. Returns the user row to attribute captures to. */
function capture_require_user(): array
{
    $u = current_user();
    if ($u) return $u;

    if (capture_token_valid()) {
        $s = db()->prepare("SELECT * FROM users WHERE is_admin = 1 ORDER BY created_at ASC LIMIT 1");
        $s->execute();
        $admin = $s->fetch();
        if ($admin) return $admin;
        json_error(500, 'No administrator account exists to attribute captures to.');
    }

    json_error(401, 'Please sign in to the admin panel, or configure a valid API token.');
}

/** CSRF only applies to cookie-authenticated requests. */
function capture_require_csrf_if_session(): void
{
    if (current_user()) {
        require_csrf();
    }
}

function capture_dir(): string
{
    if (!is_dir(CAPTURE_DIR)) {
        @mkdir(CAPTURE_DIR, 0755, true);
        // Belt and braces: deny direct web access if it ends up servable
        @file_put_contents(CAPTURE_DIR . '/.htaccess', "Require all denied\n");
        @file_put_contents(CAPTURE_DIR . '/index.html', '');
    }
    return CAPTURE_DIR;
}

/** Resolve a capture token to its row, or null if missing/expired. */
function capture_session(string $token): ?array
{
    if ($token === '') return null;
    $stmt = db()->prepare(
        'SELECT * FROM testtag_capture_tokens
         WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()'
    );
    $stmt->execute([hash('sha256', $token)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

capture_ensure_schema();

switch (action()) {

    // --------------------------------------------------------
    // Laptop: mint a short-lived token for one job.
    case 'start': {
        capture_require_csrf_if_session();
        $u = capture_require_user();

        $jobId = trim((string)field('jobId', ''));
        if ($jobId === '') json_error(400, 'A job id is required.');
        if (strlen($jobId) > 64) json_error(400, 'That record id is too long.');
        $label = substr(trim((string)field('label', '')), 0, 200);
        $mode  = (string)field('mode', 'both');
        if (!in_array($mode, CAPTURE_MODES, true)) $mode = 'both';

        capture_housekeeping();

        // One live token per job per user - drop any earlier ones
        db()->prepare('DELETE FROM testtag_capture_tokens WHERE user_id = ? AND job_id = ?')
            ->execute([$u['id'], $jobId]);

        $token   = bin2hex(random_bytes(16));
        $expires = gmdate('Y-m-d H:i:s', time() + TOKEN_TTL_MIN * 60);

        db()->prepare(
            'INSERT INTO testtag_capture_tokens (id,user_id,job_id,token_hash,expires_at,created_at,label,mode)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([new_id(), $u['id'], $jobId, hash('sha256', $token), $expires, now(), $label, $mode]);

        json_ok([
            'token'     => $token,
            'url'       => rtrim(SITE_URL, '/') . '/capture.html?t=' . $token,
            'expiresAt' => $expires,
            'expiresIn' => TOKEN_TTL_MIN,
        ]);
        break;
    }

    // --------------------------------------------------------
    // Phone: confirm the scanned token is still good.
    case 'session': {
        $s = capture_session(trim((string)field('token', '')));
        if (!$s) json_error(403, 'This capture link has expired. Generate a new QR code on the laptop.');
        json_ok([
            'jobId'     => $s['job_id'],
            'valid'     => true,
            'label'     => (string)($s['label'] ?? ''),
            'mode'      => (string)($s['mode'] ?? 'both') ?: 'both',
            'expiresAt' => $s['expires_at'],
        ]);
        break;
    }

    // --------------------------------------------------------
    // Phone: upload a photo or a signature. No login, token only.
    case 'upload': {
        $s = capture_session(trim((string)field('token', '')));
        if (!$s) json_error(403, 'This capture link has expired. Generate a new QR code on the laptop.');

        // The link is the credential: limit how fast one phone can use it.
        throttle('capture_upload', 120, 600);

        $kind = (string)field('kind', 'photo');
        if (!in_array($kind, ['photo', 'signature'], true)) {
            json_error(400, 'Unknown capture kind.');
        }
        $mode = (string)($s['mode'] ?? 'both') ?: 'both';
        if ($kind === 'photo' && in_array($mode, ['signature', 'tester'], true)) {
            json_error(400, 'This link is for a signature only.');
        }
        if ($kind === 'signature' && $mode === 'photos') {
            json_error(400, 'This link is for photos only.');
        }

        $data = (string)field('data', '');
        if (!preg_match('#^data:image/(png|jpeg|jpg|webp);base64,#i', $data, $m)) {
            json_error(400, 'Expected a base64 image data URL.');
        }
        $ext = strtolower($m[1]) === 'jpg' ? 'jpeg' : strtolower($m[1]);

        $raw = base64_decode(substr($data, strpos($data, ',') + 1), true);
        if ($raw === false || $raw === '') json_error(400, 'Image data could not be decoded.');
        if (strlen($raw) > CAPTURE_MAX_BYTES) json_error(413, 'That image is too large. Please try again.');

        // Verify it really is an image, not something renamed
        $info = @getimagesizefromstring($raw);
        if ($info === false) json_error(400, 'That file is not a valid image.');

        $id   = new_id();
        $name = $id . '.' . $ext;
        if (@file_put_contents(capture_dir() . '/' . $name, $raw) === false) {
            json_error(500, 'Could not store the image on the server.');
        }

        db()->prepare(
            'INSERT INTO testtag_captures (id,user_id,job_id,kind,filename,mime,bytes,note,created_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id, $s['user_id'], $s['job_id'], $kind, $name,
            'image/' . $ext, strlen($raw),
            substr(trim((string)field('note', '')), 0, 255), now(),
        ]);

        // A tester link sets the tester's signature for every app straight
        // away, even if the laptop that asked for it is closed.
        if ($mode === 'tester' && $kind === 'signature') {
            files_tester_set($data);
        }

        json_ok(['id' => $id, 'kind' => $kind]);
        break;
    }

    // --------------------------------------------------------
    // Laptop: fetch captures for a job. Images come back as data URLs
    // so the front end can drop them straight into the record.
    case 'poll': {
        $u = capture_require_user();
        $jobId = trim((string)field('jobId', ''));
        if ($jobId === '') json_error(400, 'A job id is required.');

        $since = trim((string)field('since', ''));
        $sql   = 'SELECT * FROM testtag_captures WHERE user_id = ? AND job_id = ?';
        $args  = [$u['id'], $jobId];
        // ">=" not ">": created_at has one-second resolution, so with ">"
        // a second upload in the same second as the last one polled was never
        // delivered. Callers skip ids they already have.
        if ($since !== '') { $sql .= ' AND created_at >= ?'; $args[] = $since; }
        $sql .= ' ORDER BY created_at ASC LIMIT 200';

        $stmt = db()->prepare($sql);
        $stmt->execute($args);

        $out = [];
        foreach ($stmt->fetchAll() as $r) {
            $path = capture_dir() . '/' . $r['filename'];
            if (!is_file($path)) continue;
            $out[] = [
                'id'        => $r['id'],
                'kind'      => $r['kind'],
                'note'      => $r['note'],
                'createdAt' => $r['created_at'],
                'dataUrl'   => 'data:' . $r['mime'] . ';base64,' . base64_encode((string)file_get_contents($path)),
            ];
        }
        json_ok($out);
        break;
    }

    // --------------------------------------------------------
    case 'delete': {
        capture_require_csrf_if_session();
        $u = capture_require_user();
        $id = trim((string)field('id', ''));

        $stmt = db()->prepare('SELECT * FROM testtag_captures WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $u['id']]);
        $r = $stmt->fetch();
        if (!$r) json_error(404, 'Capture not found.');

        @unlink(capture_dir() . '/' . $r['filename']);
        db()->prepare('DELETE FROM testtag_captures WHERE id = ?')->execute([$id]);
        json_ok(null);
        break;
    }

    // --------------------------------------------------------
    default:
        json_error(400, 'Unknown action.');
}
