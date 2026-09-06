<?php
// ============================================================
// Certificate verification  ->  /api/verify.php?action=...
//
//   record   POST  certNumber, sha256, [meta]   (auth) - store a hash
//   check    GET   certNumber[, sha256]         (public) - verify
//
// When a certificate PDF is emailed, its SHA-256 is stored here against the
// certificate number. Anyone holding the document can then confirm it is
// genuine and unaltered: changing a single byte changes the hash.
//
// This is tamper EVIDENCE, not a cryptographic identity signature. It shows
// a document matches what was issued; it does not, by itself, prove who
// issued it. That distinction is stated plainly on the verify page.
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function verify_bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $hdr = (string)$v; break; }
        }
    }
    return preg_match('/Bearer\s+(\S+)/i', (string)$hdr, $m) ? $m[1] : '';
}

function verify_authed(): bool
{
    if (current_user()) return true;
    $token = verify_bearer_token();
    if ($token === '') return false;
    $s = db()->prepare('SELECT id FROM api_tokens WHERE token_hash = ? AND scope = ?');
    $s->execute([hash('sha256', $token), 'testtag_push']);
    return (bool)$s->fetch();
}

switch (action()) {

    // ----------------------------------------------------- store a hash
    case 'record': {
        if (!verify_authed()) json_error(401, 'Not authorised.');

        $in = input();
        $cert = strtoupper(trim((string)($in['certNumber'] ?? '')));
        $hash = strtolower(trim((string)($in['sha256'] ?? '')));

        if ($cert === '')                       json_error(400, 'A certificate number is required.');
        if (!preg_match('/^[a-f0-9]{64}$/', $hash)) json_error(400, 'A valid SHA-256 hash is required.');

        // One live hash per certificate number. Re-issuing a certificate
        // replaces it, so the latest document is the one that verifies.
        db()->prepare('DELETE FROM testtag_verify WHERE cert_number = ?')->execute([$cert]);
        db()->prepare(
            'INSERT INTO testtag_verify
             (id, cert_number, sha256, client_name, site_address, test_date, next_due, issued_at)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([
            new_id(), $cert, $hash,
            trim((string)($in['clientName'] ?? '')),
            trim((string)($in['siteAddress'] ?? '')),
            trim((string)($in['testDate'] ?? '')),
            trim((string)($in['nextTestDue'] ?? '')),
            now(),
        ]);

        json_ok(['certNumber' => $cert, 'sha256' => $hash]);
        break;
    }

    // ----------------------------------------------------- public check
    case 'check': {
        $cert = strtoupper(trim((string)field('certNumber', '')));
        $hash = strtolower(trim((string)field('sha256', '')));
        if ($cert === '') json_error(400, 'Enter a certificate number.');

        $s = db()->prepare('SELECT * FROM testtag_verify WHERE cert_number = ?');
        $s->execute([$cert]);
        $row = $s->fetch();

        if (!$row) {
            json_ok(['found' => false]);
            break;
        }

        // Deliberately limited: enough to confirm the certificate is real,
        // without exposing the client's full record to anyone guessing
        // certificate numbers.
        $out = [
            'found'      => true,
            'certNumber' => $row['cert_number'],
            'issuedAt'   => $row['issued_at'],
            'testDate'   => $row['test_date'],
            'nextDue'    => $row['next_due'],
            'site'       => $row['site_address'] !== '' ? preg_replace('/^(.{0,18}).*$/u', '$1…', $row['site_address']) : '',
        ];

        if ($hash !== '') {
            if (!preg_match('/^[a-f0-9]{64}$/', $hash)) json_error(400, 'That is not a valid SHA-256 hash.');
            $out['hashMatches'] = hash_equals($row['sha256'], $hash);
        }

        json_ok($out);
        break;
    }

    default:
        json_error(400, 'Unknown action.');
}
