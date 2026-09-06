<?php
// ============================================================
// Email a certificate to a client  ->  /api/email.php?action=...
//
//   send   POST  jobId, to, [subject], [message], [kind]
//                kind = certificate | record | generator   (default certificate)
//
// Auth mirrors capture.php: a logged-in admin session, or a Bearer API
// token with the 'testtag_push' scope (used by the desktop / mobile shell,
// which runs on its own origin and so sends no session cookie).
//
// The certificate HTML is built by the front end and posted here, so the
// emailed document is byte-for-byte what the tester saw on screen.
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/_mail.php';

// CORS - the desktop shell sends an Authorization header, which triggers a
// preflight before the POST.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Address certificates are sent from. Must be a real mailbox on this domain
// or most providers will reject or spam-bin the message.
const MAIL_FROM_ADDRESS = 'zoltan@zoltanstudios.au';
const MAIL_FROM_NAME    = 'ZoltanStudios';
const MAX_ATTACH_BYTES  = 4000000;

// ---------------------------------------------------------------- auth
function email_bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $hdr = (string)$v; break; }
        }
    }
    return preg_match('/Bearer\s+(\S+)/i', (string)$hdr, $m) ? $m[1] : '';
}

function email_token_valid(): bool
{
    $token = email_bearer_token();
    if ($token === '') return false;
    $s = db()->prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND scope = ?');
    $s->execute([hash('sha256', $token), 'testtag_push']);
    $tok = $s->fetch();
    if (!$tok) return false;
    db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);
    return true;
}

function email_require_auth(): void
{
    if (current_user()) { require_csrf(); return; }
    if (email_token_valid()) return;
    json_error(401, 'Please sign in to the admin panel, or configure a valid API token.');
}

// ---------------------------------------------------------------- sending
/**
 * Sends an HTML email with one HTML file attached.
 *
 * _mail.php's send_mail() takes only (to, subject, body) and can't attach a
 * file, so the MIME message is built here and handed to mail() directly.
 */
function send_mail_with_attachment(
    string $to,
    string $subject,
    string $htmlBody,
    string $attachmentName,
    string $attachmentContent,
    string $attachmentMime = 'text/html'
): bool {
    $boundary = '=_zs_' . bin2hex(random_bytes(12));
    $from = sprintf('%s <%s>', MAIL_FROM_NAME, MAIL_FROM_ADDRESS);

    $headers = [
        'From: ' . $from,
        'Reply-To: ' . MAIL_FROM_ADDRESS,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
        'X-Mailer: ZoltanStudios Test and Tag',
    ];

    $eol = "\r\n";
    $body  = 'This is a multi-part message in MIME format.' . $eol . $eol;

    // Readable part
    $body .= '--' . $boundary . $eol;
    $body .= 'Content-Type: text/html; charset=UTF-8' . $eol;
    $body .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
    $body .= chunk_split(base64_encode($htmlBody)) . $eol;

    // Attachment
    $body .= '--' . $boundary . $eol;
    $body .= 'Content-Type: ' . $attachmentMime . '; name="' . $attachmentName . '"' . $eol;
    $body .= 'Content-Transfer-Encoding: base64' . $eol;
    $body .= 'Content-Disposition: attachment; filename="' . $attachmentName . '"' . $eol . $eol;
    $body .= chunk_split(base64_encode($attachmentContent)) . $eol;

    $body .= '--' . $boundary . '--' . $eol;

    return @mail($to, $subject, $body, implode($eol, $headers), '-f' . MAIL_FROM_ADDRESS);
}

// ---------------------------------------------------------------- routes
switch (action()) {

    case 'send': {
        email_require_auth();

        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            json_error(405, 'POST required.');
        }

        $in = input();

        $to = strtolower(trim((string)($in['to'] ?? '')));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            json_error(400, 'A valid client email address is required.');
        }

        $html = (string)($in['html'] ?? '');
        if ($html === '') json_error(400, 'No document was supplied to send.');
        if (strlen($html) > MAX_ATTACH_BYTES) {
            json_error(413, 'That document is too large to email. Try removing some photos.');
        }

        $kind    = (string)($in['kind'] ?? 'certificate');
        $certNo  = trim((string)($in['certNumber'] ?? ''));
        $client  = trim((string)($in['clientName'] ?? ''));
        $site    = trim((string)($in['siteAddress'] ?? ''));
        $nextDue = trim((string)($in['nextTestDue'] ?? ''));
        $note    = trim((string)($in['message'] ?? ''));

        $labels = [
            'certificate' => 'Test and Tag Compliance Certificate',
            'record'      => 'Test and Tag Job Record',
            'generator'   => 'Generator Inspection Report',
        ];
        $label = $labels[$kind] ?? $labels['certificate'];

        $subject = (string)($in['subject'] ?? '')
            ?: ($label . ($certNo !== '' ? ' - ' . $certNo : '') . ' - ZoltanStudios');

        // Filename the client sees. Keep it descriptive; they may keep it for years.
        $safe = preg_replace('/[^A-Za-z0-9._-]+/', '-', $client !== '' ? $client : 'client');
        $filename = strtolower(trim((string)$kind, '-')) . '-'
                  . ($certNo !== '' ? $certNo . '-' : '')
                  . trim((string)$safe, '-') . '.html';

        // Body. email_template() gives the same styling as the portal's other
        // mail, so this looks like it came from the same business.
        $intro = '<p>Hi' . ($client !== '' ? ' ' . htmlspecialchars($client, ENT_QUOTES) : '') . ',</p>'
               . '<p>Your ' . htmlspecialchars(strtolower($label), ENT_QUOTES)
               . ' is attached to this email.</p>';

        $facts = '<ul style="line-height:1.7">';
        if ($certNo !== '')  $facts .= '<li><strong>Certificate number:</strong> ' . htmlspecialchars($certNo, ENT_QUOTES) . '</li>';
        if ($site !== '')    $facts .= '<li><strong>Site:</strong> ' . htmlspecialchars($site, ENT_QUOTES) . '</li>';
        if ($nextDue !== '') $facts .= '<li><strong>Next test due:</strong> ' . htmlspecialchars($nextDue, ENT_QUOTES) . '</li>';
        $facts .= '</ul>';

        $custom = $note !== ''
            ? '<p>' . nl2br(htmlspecialchars($note, ENT_QUOTES)) . '</p>'
            : '';

        $outro = '<p>Open the attached file in any web browser to view or print it. '
               . 'Keep it with your safety records.</p>'
               . '<p>Any questions, just reply to this email.</p>';

        $bodyHtml = function_exists('email_template')
            ? email_template($label, $intro . $facts . $custom . $outro, '', '')
            : ('<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b">'
               . $intro . $facts . $custom . $outro . '</div>');

        $ok = send_mail_with_attachment($to, $subject, $bodyHtml, $filename, $html);
        if (!$ok) {
            json_error(500, 'The server could not send that email. Check the mail settings in cPanel.');
        }

        json_ok(['to' => $to, 'subject' => $subject, 'filename' => $filename]);
        break;
    }

    default:
        json_error(400, 'Unknown action.');
}
