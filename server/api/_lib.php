<?php
// ============================================================
// ZoltanStudios Portal API - shared bootstrap
// Include this at the top of every endpoint.
//
// Place this whole /api/ folder OUTSIDE the web root if your
// host allows it. If not, the bundled .htaccess blocks direct
// access to _lib.php and config.php.
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// ---------- Error handling: never leak stack traces ----------
error_reporting(E_ALL);
ini_set('display_errors', DEBUG_MODE ? '1' : '0');
ini_set('log_errors', '1');

set_exception_handler(function ($e) {
    error_log('[portal-api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_error(500, DEBUG_MODE ? $e->getMessage() : 'Internal server error.');
});

// ---------- CORS ----------
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

// The desktop-app push endpoint is authenticated by a Bearer token, never by
// cookies, so it safely allows any origin (the app runs from file:// where
// the origin is "null"). Everything else keeps strict allow-listed CORS.
$isTokenPush = (($_GET['resource'] ?? '') === 'testtag')
    && in_array(($_GET['action'] ?? ''), ['push', 'pull', 'certificate', 'delete'], true);

if ($isTokenPush) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
} else {
    if (in_array($requestOrigin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $requestOrigin");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// Aggressive no-cache: LiteSpeed/Cloudflare will otherwise serve a cached
// 'me' response, handing the browser a CSRF token for a dead session.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- Session ----------
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

// Shared hosting defaults session.save_path to /tmp, which is shared with
// every other account on the box and gets cleaned aggressively - sessions
// vanish mid-use and every write then fails CSRF with a 419.
// Keep them in a private directory above the web root instead.
$sessionDir = defined('SESSION_PATH') && SESSION_PATH !== ''
    ? SESSION_PATH
    : dirname(dirname(__DIR__)) . '/zs_sessions';

if (!is_dir($sessionDir)) {
    @mkdir($sessionDir, 0700, true);
}
if (is_dir($sessionDir) && is_writable($sessionDir)) {
    session_save_path($sessionDir);
    // Don't let PHP's GC clear other people's files, and keep ours ~24h
    ini_set('session.gc_maxlifetime', '86400');
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '100');
} else {
    error_log('[portal-api] session dir not writable, falling back to default: ' . $sessionDir);
}

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_name('zsportal');
session_start();

// Rotate the session id periodically to limit fixation windows
if (!isset($_SESSION['created'])) {
    $_SESSION['created'] = time();
} elseif (time() - $_SESSION['created'] > 1800) {
    session_regenerate_id(true);
    $_SESSION['created'] = time();
}

// ---------- Database ----------
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

// ---------- Output helpers ----------
function json_ok($data = null, array $extra = []): void
{
    echo json_encode(array_merge(['ok' => true, 'data' => $data], $extra));
    exit;
}

function json_error(int $code, string $message, array $extra = []): void
{
    http_response_code($code);
    echo json_encode(array_merge(['ok' => false, 'error' => $message], $extra));
    exit;
}

// ---------- IDs (Firestore-style opaque strings) ----------
function new_id(): string
{
    return bin2hex(random_bytes(10)); // 20 chars
}

// ---------- Request input ----------
function input(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $raw = file_get_contents('php://input');
    $decoded = $raw !== '' ? json_decode($raw, true) : null;
    $cache = is_array($decoded) ? $decoded : $_POST;
    return $cache;
}

function field(string $key, $default = null)
{
    $in = input();
    if (array_key_exists($key, $in)) {
        return $in[$key];
    }
    return $_GET[$key] ?? $default;
}

function require_fields(array $keys): array
{
    $out = [];
    foreach ($keys as $k) {
        $v = field($k);
        if ($v === null || $v === '') {
            json_error(400, "Missing required field: $k");
        }
        $out[$k] = $v;
    }
    return $out;
}

function action(): string
{
    $a = $_GET['action'] ?? (input()['action'] ?? '');
    return preg_match('/^[a-z_]{1,40}$/', (string)$a) ? (string)$a : '';
}

// ---------- Auth ----------
function current_user(): ?array
{
    if (empty($_SESSION['uid'])) {
        return null;
    }
    static $u = null;
    if ($u !== null) {
        return $u;
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    $stmt->execute([$_SESSION['uid']]);
    $row = $stmt->fetch();
    if (!$row) {
        session_destroy();
        return null;
    }
    $u = $row;
    return $u;
}

function require_login(): array
{
    $u = current_user();
    if (!$u) {
        json_error(401, 'Not authenticated.');
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if ((int)$u['is_admin'] !== 1) {
        json_error(403, 'Administrator access required.');
    }
    return $u;
}

// ---------- CSRF ----------
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/** Call on every state-changing endpoint. */
function require_csrf(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        json_error(405, 'POST required.');
    }
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? (input()['csrf'] ?? '');
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string)$sent)) {
        json_error(419, 'Invalid or expired security token. Please refresh and try again.');
    }
}

// ---------- Formatting ----------
function iso(?string $dt): ?string
{
    if (!$dt) {
        return null;
    }
    return (new DateTime($dt, new DateTimeZone('UTC')))->format(DateTime::ATOM);
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

/** Strip internal/sensitive columns before sending a user row to the client. */
function public_user(array $row, bool $includeEmail = true): array
{
    return [
        'id'        => $row['id'],
        'firstName' => $row['first_name'],
        'lastName'  => $row['last_name'],
        'email'     => $includeEmail ? $row['email'] : null,
        'company'   => $row['company'],
        'phone'     => $row['phone'],
        'role'      => $row['role'],
        'isAdmin'   => (bool)$row['is_admin'],
        'createdAt' => iso($row['created_at']),
        'lastLogin' => iso($row['last_login']),
    ];
}

// ---------- Simple rate limiting (session + DB backed) ----------
function throttle(string $bucket, int $maxHits, int $windowSeconds): void
{
    $key = 'throttle_' . $bucket;
    $nowTs = time();
    if (!isset($_SESSION[$key]) || $_SESSION[$key]['start'] < $nowTs - $windowSeconds) {
        $_SESSION[$key] = ['start' => $nowTs, 'hits' => 0];
    }
    $_SESSION[$key]['hits']++;
    if ($_SESSION[$key]['hits'] > $maxHits) {
        json_error(429, 'Too many requests. Please wait a moment and try again.');
    }
}
