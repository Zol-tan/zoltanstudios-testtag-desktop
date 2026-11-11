<?php
// ============================================================
// Repair parts  ->  /api/parts.php?action=...
//
//   list    GET                     every part, with stock and low flags
//   save    POST  part fields       create or update one part
//   usage   GET   jobId             parts fitted on a job, for invoicing
//
// Stock is changed by saving a job (see _parts.php), never directly by
// "using" a part here - that keeps the web app and the desktop suite from
// counting the same repair twice.
//
// Auth matches capture.php: a logged-in session, or a Bearer token with the
// 'testtag_push' scope for the desktop/mobile shells.
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/_parts.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function parts_bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $hdr = (string)$v; break; }
        }
    }
    return preg_match('/Bearer\s+(\S+)/i', (string)$hdr, $m) ? $m[1] : '';
}

/** Session first, then token. CSRF only applies to cookie-authenticated writes. */
function parts_require_auth(bool $isWrite): void
{
    if (current_user()) {
        if ($isWrite) require_csrf();
        return;
    }
    $token = parts_bearer_token();
    if ($token !== '') {
        $s = db()->prepare('SELECT id FROM api_tokens WHERE token_hash = ? AND scope = ?');
        $s->execute([hash('sha256', $token), 'testtag_push']);
        if ($s->fetch()) return;
    }
    json_error(401, 'Please sign in to the admin panel, or configure a valid API token.');
}

switch (action()) {

    case 'list':
        parts_require_auth(false);
        json_ok(parts_list());
        break;

    case 'save': {
        parts_require_auth(true);
        parts_ensure_schema();

        $name = trim((string)field('name', ''));
        if ($name === '') json_error(400, 'A part needs a name.');

        $cost = max(0, (float)field('cost', 0));
        $consumable = filter_var(field('consumable', false), FILTER_VALIDATE_BOOLEAN);
        // A blank sell price means "work it out from the markup".
        $sellIn = field('sell', '');
        $sell = ($sellIn === '' || $sellIn === null)
            ? ($consumable ? 0.0 : parts_suggested_sell($cost))
            : max(0, (float)$sellIn);

        // The stock count is only written when the client sends it, i.e. when
        // someone has actually counted stock. Editing a price must not send a
        // stale count back and undo parts fitted from another device since.
        $onHandIn = field('onHand', null);
        $setStock = $onHandIn !== null && $onHandIn !== '';

        $catalogue = [
            (string)field('sku', ''), $name, $cost, $sell, max(0, (int)field('lowAt', 2)),
            filter_var(field('active', true), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            $consumable ? 1 : 0, now(),
        ];

        // Clients may supply the id, so a part created offline in the desktop
        // app keeps the same id once it reaches the server.
        $id = trim((string)field('id', ''));
        if ($id !== '' && !preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) {
            json_error(400, 'Invalid part id.');
        }

        $exists = false;
        if ($id !== '') {
            $q = db()->prepare('SELECT 1 FROM testtag_parts WHERE id = ?');
            $q->execute([$id]);
            $exists = (bool)$q->fetch();
        } else {
            $id = new_id();
        }

        // Supplier and product link: only changed when sent, so the web app
        // (which doesn't know about them) can't blank them.
        $url = trim((string)field('url', ''));
        if ($url !== '' && !preg_match('#^https?://#i', $url)) json_error(400, 'The product link must start with http:// or https://');

        if ($exists) {
            db()->prepare(
                'UPDATE testtag_parts SET sku=?, name=?, cost=?, sell=?, low_at=?,
                   active=?, consumable=?, updated_at=? WHERE id=?'
            )->execute([...$catalogue, $id]);
            if ($setStock) {
                db()->prepare('UPDATE testtag_parts SET on_hand=? WHERE id=?')
                    ->execute([max(0, (int)$onHandIn), $id]);
            }
            if (field('supplier', null) !== null) {
                db()->prepare('UPDATE testtag_parts SET supplier=? WHERE id=?')
                    ->execute([substr(trim((string)field('supplier', '')), 0, 60), $id]);
            }
            if (field('url', null) !== null) {
                db()->prepare('UPDATE testtag_parts SET url=? WHERE id=?')->execute([substr($url, 0, 500), $id]);
            }
        } else {
            db()->prepare(
                'INSERT INTO testtag_parts (sku,name,cost,sell,low_at,active,consumable,updated_at,id,on_hand)
                 VALUES (?,?,?,?,?,?,?,?,?,?)'
            )->execute([...$catalogue, $id, $setStock ? max(0, (int)$onHandIn) : 0]);
            db()->prepare('UPDATE testtag_parts SET supplier=?, url=? WHERE id=?')
                ->execute([substr(trim((string)field('supplier', '')), 0, 60), substr($url, 0, 500), $id]);
        }

        $q = db()->prepare('SELECT * FROM testtag_parts WHERE id = ?');
        $q->execute([$id]);
        json_ok(parts_out($q->fetch()));
        break;
    }

    // Stock bought: adds to the count (never sets it), so parts fitted from
    // another device in the meantime still come off. Idempotent by id.
    case 'receive': {
        parts_require_auth(true);
        parts_ensure_schema();
        $pid = trim((string)field('id', ''));
        $partId = trim((string)field('partId', ''));
        $qty = (int)field('quantity', 0);
        if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $pid)) json_error(400, 'Invalid purchase id.');
        if ($qty < 1 || $qty > 10000) json_error(400, 'Quantity must be at least 1.');
        $q = db()->prepare('SELECT * FROM testtag_parts WHERE id = ?');
        $q->execute([$partId]);
        $part = $q->fetch();
        if (!$part) json_error(404, 'That part is not on the server yet.');

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $seen = $pdo->prepare('SELECT 1 FROM testtag_part_purchases WHERE id = ?');
            $seen->execute([$pid]);
            if (!$seen->fetch()) {
                $when = (string)field('purchasedAt', '');
                if (!preg_match('/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/', $when)) $when = now();
                $pdo->prepare('INSERT INTO testtag_part_purchases (id,part_id,part_name,supplier,quantity,unit_cost,purchased_at)
                               VALUES (?,?,?,?,?,?,?)')
                    ->execute([$pid, $partId, (string)$part['name'], substr(trim((string)field('supplier', '')), 0, 60),
                               $qty, max(0, (float)field('unitCost', 0)), $when]);
                $pdo->prepare('UPDATE testtag_parts SET on_hand = on_hand + ?, updated_at = ? WHERE id = ?')
                    ->execute([$qty, now(), $partId]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        $q->execute([$partId]);
        json_ok(parts_out($q->fetch()));
        break;
    }

    case 'purchases':
        parts_require_auth(false);
        parts_ensure_schema();
        $s = db()->query('SELECT * FROM testtag_part_purchases ORDER BY purchased_at DESC, id LIMIT 1000');
        json_ok(array_map(fn($r) => [
            'id' => $r['id'], 'partId' => $r['part_id'], 'partName' => $r['part_name'], 'supplier' => $r['supplier'],
            'quantity' => (int)$r['quantity'], 'unitCost' => (float)$r['unit_cost'], 'purchasedAt' => $r['purchased_at'],
        ], $s->fetchAll()));
        break;

    case 'usage':
        parts_require_auth(false);
        $jobId = trim((string)field('jobId', $_GET['jobId'] ?? ''));
        if ($jobId === '') json_error(400, 'A job id is required.');
        json_ok(parts_used_on($jobId));
        break;

    default:
        json_error(400, 'Unknown action.');
}
