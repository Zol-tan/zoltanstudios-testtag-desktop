<?php
// ============================================================
// Repair parts: catalogue and stock, shared by the web app and the desktop
// suite. Loaded by _testtag.php so a job save updates stock in the same
// transaction as the job itself.
//
// Stock is worked out per JOB, not per item: tt_items rows get fresh ids on
// every save, so "which part was fitted on which item row" can't be tracked
// across saves - but "which parts does this job use" can. Re-saving a job
// puts its old parts back and takes the new ones out, so saving twice never
// counts a part twice.
// ============================================================

declare(strict_types=1);

const PARTS_DEFAULT_MARKUP = 250; // percent over cost

// The van stock, seeded on first use. I/N numbers are Bunnings item numbers.
// Kits are consumables: tracked for restocking, never billed per fit.
const PARTS_SEED = [
    ['4330985', 'DETA 10A Side Entry Plug Top - Black',         4.16, 1, false],
    ['4430411', 'DETA 10A Plug Top - White',                    3.59, 1, false],
    ['4430413', 'DETA 10A Plug Top - Grey',                     3.59, 1, false],
    ['4430439', 'DETA 10A Extension Socket - Clear',            5.27, 1, false],
    ['4430436', 'DETA 10A Extension Socket - White',            5.27, 1, false],
    ['4430437', 'DETA 10A Extension Socket - Grey',             5.90, 1, false],
    ['0189135', 'Click Cable Management Kit - 150 pieces',     10.45, 1, true],
    ['0381120', 'Click Multicolour Heatshrink Kit - 80 pieces', 10.58, 1, true],
    ['0381146', 'Click Heatshrink Kit - 127 pieces',           10.58, 1, true],
    ['0255490', 'Click 0.9m 4-Outlet Powerboard - White',       7.18, 2, false],
    ['0255495', 'Click 0.9m 6-Outlet Powerboard - White',      10.46, 2, false],
];

/** Cost plus markup, rounded up to the dollar. */
function parts_suggested_sell(float $cost, float $markup = PARTS_DEFAULT_MARKUP): float
{
    return (float)ceil($cost * (1 + $markup / 100));
}

/**
 * Creates the tables and adds tt_items.part_id if missing, so nothing has to
 * be run by hand in phpMyAdmin.
 *
 * Must be called OUTSIDE a transaction: in MySQL, CREATE and ALTER commit any
 * open transaction implicitly, which would silently break the job save.
 */
function parts_ensure_schema(): void
{
    static $done = false;
    if ($done) return;
    $pdo = db();

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS testtag_parts (
            id          VARCHAR(64)   NOT NULL PRIMARY KEY,
            sku         VARCHAR(32)   NOT NULL DEFAULT \'\',
            name        VARCHAR(160)  NOT NULL DEFAULT \'\',
            cost        DECIMAL(10,2) NOT NULL DEFAULT 0,
            sell        DECIMAL(10,2) NOT NULL DEFAULT 0,
            on_hand     INT           NOT NULL DEFAULT 0,
            low_at      INT           NOT NULL DEFAULT 2,
            active      TINYINT       NOT NULL DEFAULT 1,
            consumable  TINYINT       NOT NULL DEFAULT 0,
            updated_at  DATETIME      NULL
        )'
    );
    // Stock bought: each purchase adds to the count once (by its id), so a
    // retried request can't add it twice.
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS testtag_part_purchases (
            id           VARCHAR(64)   NOT NULL PRIMARY KEY,
            part_id      VARCHAR(64)   NOT NULL,
            part_name    VARCHAR(160)  NOT NULL DEFAULT \'\',
            supplier     VARCHAR(60)   NOT NULL DEFAULT \'\',
            quantity     INT           NOT NULL DEFAULT 1,
            unit_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
            purchased_at DATETIME      NOT NULL
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS testtag_parts_used (
            id        VARCHAR(64)   NOT NULL PRIMARY KEY,
            job_id    VARCHAR(64)   NOT NULL,
            part_id   VARCHAR(64)   NOT NULL,
            quantity  INT           NOT NULL DEFAULT 1,
            sell      DECIMAL(10,2) NOT NULL DEFAULT 0,
            used_at   DATETIME      NULL
        )'
    );

    // Portable "does this column exist" - works on MySQL and SQLite alike.
    // Where a part is bought and its product page, for re-ordering and price checks.
    try { $pdo->query('SELECT supplier FROM testtag_parts LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec("ALTER TABLE testtag_parts ADD COLUMN supplier VARCHAR(60) NOT NULL DEFAULT ''"); }
    try { $pdo->query('SELECT url FROM testtag_parts LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec("ALTER TABLE testtag_parts ADD COLUMN url VARCHAR(500) NOT NULL DEFAULT ''"); }

    try {
        $pdo->query('SELECT part_id FROM tt_items LIMIT 0');
    } catch (PDOException $e) {
        $pdo->exec("ALTER TABLE tt_items ADD COLUMN part_id VARCHAR(64) NOT NULL DEFAULT ''");
    }

    if ((int)$pdo->query('SELECT COUNT(*) FROM testtag_parts')->fetchColumn() === 0) {
        $ins = $pdo->prepare(
            'INSERT INTO testtag_parts (id,sku,name,cost,sell,on_hand,low_at,active,consumable,updated_at)
             VALUES (?,?,?,?,?,?,?,1,?,?)'
        );
        foreach (PARTS_SEED as [$sku, $name, $cost, $qty, $consumable]) {
            $ins->execute([
                new_id(), $sku, $name, $cost,
                $consumable ? 0 : parts_suggested_sell($cost),
                $qty, $consumable ? 0 : 2, $consumable ? 1 : 0, now(),
            ]);
        }
    }

    $done = true;
}

function parts_out(array $r): array
{
    $onHand = (int)$r['on_hand'];
    $lowAt = (int)$r['low_at'];
    $active = (int)$r['active'] === 1;
    return [
        'id' => $r['id'], 'sku' => $r['sku'], 'name' => $r['name'],
        'cost' => (float)$r['cost'], 'sell' => (float)$r['sell'],
        'onHand' => $onHand, 'lowAt' => $lowAt,
        'active' => $active, 'consumable' => (int)$r['consumable'] === 1,
        'isLow' => $active && $onHand <= $lowAt,
        'supplier' => (string)($r['supplier'] ?? ''), 'url' => (string)($r['url'] ?? ''),
    ];
}

function parts_list(): array
{
    parts_ensure_schema();
    $rows = db()->query('SELECT * FROM testtag_parts ORDER BY name')->fetchAll();
    return array_map('parts_out', $rows);
}

/**
 * Makes this job's recorded usage match the parts named on its items.
 * Runs inside the caller's transaction.
 *
 * Old usage goes back into stock first, then the current usage comes out.
 * Stock never goes below zero - clamping hides a miscount less badly than a
 * negative count confuses a restock.
 */
function parts_set_job_usage(PDO $pdo, string $jobId, array $items): void
{
    $old = $pdo->prepare('SELECT part_id, quantity FROM testtag_parts_used WHERE job_id = ?');
    $old->execute([$jobId]);
    $restore = $pdo->prepare('UPDATE testtag_parts SET on_hand = on_hand + ? WHERE id = ?');
    foreach ($old->fetchAll() as $u) {
        $restore->execute([(int)$u['quantity'], $u['part_id']]);
    }
    $pdo->prepare('DELETE FROM testtag_parts_used WHERE job_id = ?')->execute([$jobId]);

    $counts = [];
    foreach ($items as $it) {
        $pid = trim((string)($it['partId'] ?? ''));
        if ($pid !== '') $counts[$pid] = ($counts[$pid] ?? 0) + 1;
    }
    if (!$counts) return;

    $get = $pdo->prepare('SELECT id, sell, on_hand, consumable FROM testtag_parts WHERE id = ?');
    $use = $pdo->prepare(
        'INSERT INTO testtag_parts_used (id,job_id,part_id,quantity,sell,used_at) VALUES (?,?,?,?,?,?)'
    );
    $dec = $pdo->prepare('UPDATE testtag_parts SET on_hand = ? WHERE id = ?');

    foreach ($counts as $pid => $qty) {
        $get->execute([$pid]);
        $p = $get->fetch();
        // Unknown ids and consumable kits are ignored rather than rejected:
        // a stale id shouldn't stop a certificate being saved.
        if (!$p || (int)$p['consumable'] === 1) continue;

        $use->execute([new_id(), $jobId, $pid, $qty, (float)$p['sell'], now()]);
        $dec->execute([max(0, (int)$p['on_hand'] - $qty), $pid]);
    }
}

/** Parts fitted on a job, priced as they were at the time, for invoicing. */
function parts_used_on(string $jobId): array
{
    parts_ensure_schema();
    $s = db()->prepare(
        'SELECT p.name, u.quantity, u.sell, u.part_id
         FROM testtag_parts_used u JOIN testtag_parts p ON p.id = u.part_id
         WHERE u.job_id = ? ORDER BY p.name'
    );
    $s->execute([$jobId]);
    return array_map(fn($r) => [
        'partId' => $r['part_id'], 'name' => $r['name'],
        'quantity' => (int)$r['quantity'], 'sell' => (float)$r['sell'],
    ], $s->fetchAll());
}
