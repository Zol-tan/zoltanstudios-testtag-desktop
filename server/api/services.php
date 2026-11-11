<?php
// ============================================================
// Test & Tag (job-based) + 3D Quotes  ->  /api/services.php
//
//   testtag  jobs        list | get                     (admin)
//            delete      admin session OR Bearer token; by id or externalId
//            job_save    create/update a whole job       (admin)
//            verify      PUBLIC - QR scan, by qr_id
//            push        DESKTOP - token auth, upsert job
//   quotes   list | create | update | update_status | delete  (admin)
//   tokens   list | create | revoke                     (admin)
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';

$resource = (string)($_GET['resource'] ?? '');
$act      = action();

// CORS for the desktop-app push endpoint only. The push is authenticated by
// a Bearer token (not cookies), so a wildcard origin is safe here. The
// browser sends an OPTIONS preflight first because of the Authorization
// header - answer it with the allow headers and stop.
if ($resource === 'testtag' && in_array($act, ['push', 'delete'], true)) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function bad_action(): void { json_error(400, 'Unknown action for this resource.'); }

require_once __DIR__ . '/_testtag.php';

switch ($resource) {

    case 'testtag':

        if ($act === 'verify') {
            $code = strtoupper(trim((string)field('id', '')));
            if (!preg_match('/^ZS-[A-Z0-9]{4,8}$/', $code)) {
                json_error(400, 'Invalid item code.');
            }
            $s = db()->prepare(
                'SELECT i.*, j.cert_number, j.test_date AS job_test_date, j.next_test_date,
                        j.tester_name, j.site_address
                 FROM tt_items i JOIN tt_jobs j ON j.id = i.job_id
                 WHERE i.qr_id = ?'
            );
            $s->execute([$code]);
            $r = $s->fetch();
            if (!$r) json_error(404, 'No record found for that item code.');
            $today = gmdate('Y-m-d');
            json_ok([
                'itemCode'     => $r['qr_id'],
                'appliance'    => $r['description'],
                'result'       => $r['overall_result'],
                'testDate'     => $r['job_test_date'],
                'nextTestDate' => $r['next_test_date'],
                'testedBy'     => $r['tester_name'] ?: 'ZoltanStudios',
                'certNumber'   => $r['cert_number'],
                'standard'     => 'AS/NZS 3760:2022',
                'currentlyValid' => $r['overall_result'] === 'pass'
                    && (!$r['next_test_date'] || $r['next_test_date'] >= $today),
            ]);
        }

        // ---- CLIENT certificate view (email + cert number, both must match) ----
        // No portal login needed. The client proves ownership with two facts:
        // the certificate number printed on their report AND the email the job
        // was recorded against. Both must match or access is denied. To avoid
        // leaking which half was wrong (and to slow guessing) a mismatch always
        // returns the same generic message.
        if ($act === 'certificate') {
            $cert  = strtoupper(trim((string)field('cert', '')));
            $email = strtolower(trim((string)field('email', '')));
            if (!preg_match('/^ZS[0-9]{4,8}$/', $cert) || $email === '' || !str_contains($email, '@')) {
                json_error(400, 'Please enter both your certificate number and the email address on the job.');
            }
            $s = db()->prepare('SELECT * FROM tt_jobs WHERE cert_number = ?');
            $s->execute([$cert]);
            $j = $s->fetch();

            // Match the supplied email against the job's client email, or the
            // linked portal user's email if the job is tied to a client.
            $ok = false;
            if ($j) {
                $jobEmail = strtolower(trim((string)$j['client_email']));
                if ($jobEmail !== '' && hash_equals($jobEmail, $email)) {
                    $ok = true;
                } elseif (!empty($j['client_id'])) {
                    $u = db()->prepare('SELECT email FROM users WHERE id = ?');
                    $u->execute([$j['client_id']]);
                    $ue = strtolower(trim((string)($u->fetchColumn() ?: '')));
                    if ($ue !== '' && hash_equals($ue, $email)) $ok = true;
                }
            }
            if (!$j || !$ok) {
                // Same message either way - never reveal which part failed.
                json_error(404, 'We could not find a certificate matching that number and email. Please check both and try again.');
            }

            $full = job_out($j);
            unset($full['clientEmail'], $full['clientPhone'], $full['externalId'], $full['source'], $full['clientId']);
            foreach ($full['items'] as &$it) { unset($it['notes'], $it['id']); }
            json_ok($full);
        }

        // ---- DESKTOP pull (token auth) - the hosted tester app loads all jobs ----
        if ($act === 'pull') {
            // Two ways in: a Bearer token (offline desktop app) OR a logged-in
            // admin session (the app hosted on this site, incl. on a phone).
            $token = tt_bearer_token();
            if ($token !== '') {
                $s = db()->prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND scope = ?');
                $s->execute([hash('sha256', $token), 'testtag_push']);
                $tok = $s->fetch();
                if (!$tok) json_error(401, 'Invalid API token.');
                db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);
            } else {
                require_admin();
            }
            $rows = db()->query('SELECT * FROM tt_jobs ORDER BY test_date DESC, created_at DESC')->fetchAll();
            // 'deleted' lists jobs removed on the server, so every copy of
            // the app (phone, desktop, Business Suite) drops them too.
            json_ok(array_map('job_out', $rows), ['deleted' => tt_tombstones()]);
        }

        // ---- DELETE: admin session (admin panel, Business Suite) OR a Bearer
        // token (the tester app on a phone / desktop, which has no session).
        // Finds the job by server id or by the app's own id (externalId),
        // puts any parts fitted on it back into stock, and records a
        // tombstone so other devices remove their copy on their next pull.
        // Deleting something already gone succeeds (it may have been
        // deleted from another device first).
        if ($act === 'delete') {
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                json_error(405, 'POST required.');
            }
            $token = tt_bearer_token();
            if ($token !== '') {
                tt_require_token($token);
            } else {
                require_admin();
                require_csrf();
            }
            $delId  = (string)field('id', '');
            $delExt = (string)field('externalId', '');
            if ($delId === '' && $delExt === '') {
                json_error(400, 'Missing job id.');
            }
            json_ok(tt_delete_job($delId, $delExt));
        }

        if ($act === 'push') {
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                json_error(405, 'POST required.');
            }
            $token = '';
            if (preg_match('/Bearer\s+(\S+)/i', $_SERVER['HTTP_AUTHORIZATION'] ?? '', $m)) {
                $token = $m[1];
            } else {
                $token = (string)(input()['token'] ?? '');
            }
            if ($token === '') json_error(401, 'Missing API token.');

            $s = db()->prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND scope = ?');
            $s->execute([hash('sha256', $token), 'testtag_push']);
            $tok = $s->fetch();
            if (!$tok) json_error(401, 'Invalid API token.');
            db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);

            $job = input()['job'] ?? input();
            if (!is_array($job) || empty($job['items'])) {
                json_error(400, 'Request must include a job with at least one item.');
            }
            $externalId = (string)($job['externalId'] ?? $job['id'] ?? '') ?: null;
            $jobId = upsert_job($job, 'desktop', $externalId);
            $q = db()->prepare('SELECT * FROM tt_jobs WHERE id = ?');
            $q->execute([$jobId]);
            json_ok(job_out($q->fetch()));
        }

        $admin = require_admin();

        if ($act === 'jobs') {
            $rows = db()->query('SELECT * FROM tt_jobs ORDER BY test_date DESC, created_at DESC')->fetchAll();
            json_ok(array_map(function ($j) {
                $c = db()->prepare("SELECT
                    SUM(overall_result='pass') p, SUM(overall_result='fail') f, COUNT(*) n
                    FROM tt_items WHERE job_id = ?");
                $c->execute([$j['id']]);
                $cc = $c->fetch();
                return [
                    'id' => $j['id'], 'certNumber' => $j['cert_number'],
                    'clientName' => $j['client_name'], 'clientCompany' => $j['client_company'],
                    'siteAddress' => $j['site_address'], 'testDate' => $j['test_date'],
                    'nextTestDate' => $j['next_test_date'], 'testerName' => $j['tester_name'],
                    'status' => $j['status'], 'source' => $j['source'],
                    'itemCount' => (int)$cc['n'], 'passCount' => (int)$cc['p'], 'failCount' => (int)$cc['f'],
                    'createdAt' => iso($j['created_at']),
                ];
            }, $rows));
        }

        if ($act === 'get') {
            $s = db()->prepare('SELECT * FROM tt_jobs WHERE id = ?');
            $s->execute([(string)field('id', '')]);
            $j = $s->fetch();
            if (!$j) json_error(404, 'Job not found.');
            json_ok(job_out($j));
        }

        if ($act === 'job_save') {
            require_csrf();
            $job = input()['job'] ?? input();
            if (!is_array($job)) json_error(400, 'Missing job data.');
            $jobId = upsert_job($job, (string)($job['source'] ?? 'panel'), $job['externalId'] ?? null);
            $q = db()->prepare('SELECT * FROM tt_jobs WHERE id = ?');
            $q->execute([$jobId]);
            json_ok(job_out($q->fetch()));
        }

bad_action();

    case 'tokens':
        require_admin();

        if ($act === 'list') {
            $rows = db()->query('SELECT id,label,scope,last_used,created_at FROM api_tokens ORDER BY created_at DESC')->fetchAll();
            json_ok(array_map(fn($r) => [
                'id' => $r['id'], 'label' => $r['label'], 'scope' => $r['scope'],
                'lastUsed' => iso($r['last_used']), 'createdAt' => iso($r['created_at']),
            ], $rows));
        }

        if ($act === 'create') {
            require_csrf();
            $label = trim((string)field('label', 'Desktop app'));
            $raw = 'zst_' . bin2hex(random_bytes(24));
            db()->prepare('INSERT INTO api_tokens (id,label,token_hash,scope,created_at) VALUES (?,?,?,?,?)')
                ->execute([new_id(), $label, hash('sha256', $raw), 'testtag_push', now()]);
            json_ok(['token' => $raw, 'label' => $label]);
        }

        if ($act === 'revoke') {
            require_csrf();
            db()->prepare('DELETE FROM api_tokens WHERE id = ?')->execute([(string)field('id', '')]);
            json_ok(null);
        }
        bad_action();

    case 'quotes':
        require_admin();

        if ($act === 'list') {
            $rows = db()->query('SELECT * FROM print_quotes ORDER BY created_at DESC')->fetchAll();
            json_ok(array_map(fn($r) => [
                'id' => $r['id'], 'quoteNumber' => $r['quote_number'], 'clientId' => $r['client_id'],
                'customerName' => $r['customer_name'], 'customerEmail' => $r['customer_email'],
                'itemName' => $r['item_name'], 'material' => $r['material'],
                'weightGrams' => (float)$r['weight_grams'], 'printHours' => (float)$r['print_hours'],
                'infillPercent' => (int)$r['infill_percent'], 'quantity' => (int)$r['quantity'],
                'materialCost' => (float)$r['material_cost'], 'timeCost' => (float)$r['time_cost'],
                'setupFee' => (float)$r['setup_fee'], 'total' => (float)$r['total'],
                'status' => $r['status'], 'notes' => $r['notes'], 'createdAt' => iso($r['created_at']),
            ], $rows));
        }

        if ($act === 'create') {
            require_csrf();
            $f = require_fields(['itemName']);
            $qty = max(1, (int)field('quantity', 1));
            $matCost = round((float)field('materialCost', 0), 2);
            $timeCost = round((float)field('timeCost', 0), 2);
            $setup = round((float)field('setupFee', 0), 2);
            $total = round(($matCost + $timeCost + $setup) * $qty, 2);
            $seq = (int)db()->query('SELECT COUNT(*) FROM print_quotes')->fetchColumn() + 1;
            do {
                $qnum = 'Q-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                $chk = db()->prepare('SELECT 1 FROM print_quotes WHERE quote_number = ?');
                $chk->execute([$qnum]); $taken = (bool)$chk->fetch(); $seq++;
            } while ($taken);
            $id = new_id();
            db()->prepare(
                'INSERT INTO print_quotes (id,quote_number,client_id,customer_name,customer_email,item_name,
                   material,weight_grams,print_hours,infill_percent,quantity,material_cost,time_cost,
                   setup_fee,total,status,notes,created_at,last_updated)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            )->execute([
                $id, $qnum, field('clientId') ?: null,
                (string)field('customerName', ''), (string)field('customerEmail', ''),
                trim((string)$f['itemName']), (string)field('material', 'PLA'),
                max(0, (float)field('weightGrams', 0)), max(0, (float)field('printHours', 0)),
                max(0, min(100, (int)field('infillPercent', 20))), $qty,
                $matCost, $timeCost, $setup, $total, 'draft', (string)field('notes', ''), now(), now(),
            ]);
            json_ok(['id' => $id, 'quoteNumber' => $qnum, 'total' => $total]);
        }

        if ($act === 'update') {
            require_csrf();
            $id = (string)field('id', '');
            $s = db()->prepare('SELECT * FROM print_quotes WHERE id = ?');
            $s->execute([$id]);
            $r = $s->fetch();
            if (!$r) json_error(404, 'Quote not found.');
            $qty = max(1, (int)field('quantity', $r['quantity']));
            $matCost = round((float)field('materialCost', $r['material_cost']), 2);
            $timeCost = round((float)field('timeCost', $r['time_cost']), 2);
            $setup = round((float)field('setupFee', $r['setup_fee']), 2);
            $total = round(($matCost + $timeCost + $setup) * $qty, 2);
            db()->prepare(
                'UPDATE print_quotes SET client_id=?, customer_name=?, customer_email=?, item_name=?,
                   material=?, weight_grams=?, print_hours=?, infill_percent=?, quantity=?,
                   material_cost=?, time_cost=?, setup_fee=?, total=?, notes=?, last_updated=? WHERE id=?'
            )->execute([
                field('clientId', $r['client_id']) ?: null,
                (string)field('customerName', $r['customer_name']),
                (string)field('customerEmail', $r['customer_email']),
                (string)field('itemName', $r['item_name']), (string)field('material', $r['material']),
                max(0, (float)field('weightGrams', $r['weight_grams'])),
                max(0, (float)field('printHours', $r['print_hours'])),
                max(0, min(100, (int)field('infillPercent', $r['infill_percent']))),
                $qty, $matCost, $timeCost, $setup, $total,
                (string)field('notes', $r['notes']), now(), $id,
            ]);
            json_ok(['total' => $total]);
        }

        if ($act === 'update_status') {
            require_csrf();
            $f = require_fields(['id', 'status']);
            if (!in_array($f['status'], ['draft', 'sent', 'accepted', 'declined'], true)) {
                json_error(400, 'Invalid quote status.');
            }
            db()->prepare('UPDATE print_quotes SET status = ?, last_updated = ? WHERE id = ?')
                ->execute([(string)$f['status'], now(), (string)$f['id']]);
            json_ok(null);
        }

        if ($act === 'delete') {
            require_csrf();
            db()->prepare('DELETE FROM print_quotes WHERE id = ?')->execute([(string)field('id', '')]);
            json_ok(null);
        }
        bad_action();

    default:
        json_error(400, 'Unknown resource.');
}
