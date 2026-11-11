<?php
// Shared Test & Tag job helpers, used by services.php (HTTP endpoints)
// and migrate-jobs.php (CLI import). Requires _lib.php to be loaded first.
declare(strict_types=1);
require_once __DIR__ . '/_parts.php';

// The tester app upgrades old unit-code licences to the current licence
// number on load. Mirror that here so anything arriving by push, import or
// panel edit is stored with the current value too.
const CURRENT_TESTER_LICENSE = '14403607-9901941';
const LEGACY_TESTER_LICENSES = [
    'UEECD0007, UEERL0003, UEERL0004, UEERL0005',
    'UEESS00174',
];
function normalize_license(string $license): string
{
    $license = trim($license);
    if ($license === '' || in_array($license, LEGACY_TESTER_LICENSES, true)) {
        return CURRENT_TESTER_LICENSE;
    }
    return $license;
}

function next_test(string $testDate, int $months): ?string
{
    if ($months <= 0) return null;
    $d = DateTime::createFromFormat('Y-m-d', $testDate);
    if (!$d) return null;
    $d->modify("+{$months} months");
    return $d->format('Y-m-d');
}

function generate_qr_id(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($a = 0; $a < 25; $a++) {
        $code = 'ZS-';
        for ($i = 0; $i < 4; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        $chk = db()->prepare('SELECT 1 FROM tt_items WHERE qr_id = ?');
        $chk->execute([$code]);
        if (!$chk->fetch()) return $code;
    }
    return 'ZS-' . strtoupper(bin2hex(random_bytes(3)));
}

function generate_cert_number(): string
{
    for ($a = 0; $a < 50; $a++) {
        $cand = 'ZS' . str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $chk = db()->prepare('SELECT 1 FROM tt_jobs WHERE cert_number = ?');
        $chk->execute([$cand]);
        if (!$chk->fetch()) return $cand;
    }
    return 'ZS' . substr((string)time(), -6);
}

/**
 * tt_jobs.job_type and tt_jobs.extra_json, added on first use. Before these
 * existed the server dropped the job type, generator inspection details,
 * photos, the client signature and the insulation tester details - and
 * because the apps take the server's copy on every pull, those were wiped
 * from the phone too. Must run outside a transaction (MySQL ALTER commits).
 */
function tt_ensure_job_columns(): void
{
    static $done = false;
    if ($done) return;
    $pdo = db();
    try { $pdo->query('SELECT job_type FROM tt_jobs LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec("ALTER TABLE tt_jobs ADD COLUMN job_type VARCHAR(30) NOT NULL DEFAULT 'test_tag'"); }
    try { $pdo->query('SELECT extra_json FROM tt_jobs LIMIT 0'); }
    catch (PDOException $e) { $pdo->exec('ALTER TABLE tt_jobs ADD COLUMN extra_json LONGTEXT NULL'); }
    $done = true;
}

/** The job fields kept as JSON rather than columns. */
const TT_EXTRA_KEYS = ['generator', 'attachments', 'meggerEquipment', 'meggerCalibrationDate', 'fixedRcd', 'itemExtras'];

function job_out(array $j): array
{
    tt_ensure_job_columns();
    $extra = json_decode((string)($j['extra_json'] ?? ''), true);
    if (!is_array($extra)) $extra = [];
    $s = db()->prepare('SELECT * FROM tt_items WHERE job_id = ? ORDER BY sort_order, id');
    $s->execute([$j['id']]);
    $items = array_map(function ($r) {
        return [
            'id' => $r['id'], 'qrId' => $r['qr_id'], 'itemType' => $r['item_type'],
            'assetId' => $r['asset_id'], 'description' => $r['description'],
            'makeModel' => $r['make_model'], 'serialNumber' => $r['serial_number'],
            'location' => $r['location'], 'equipmentClass' => $r['equipment_class'],
            'visual' => $r['visual'], 'earthContinuity' => $r['earth_continuity'],
            'insulationResistance' => $r['insulation_resistance'],
            'insulationTestVoltage' => $r['insulation_test_voltage'],
            'leakageCurrent' => $r['leakage_current'], 'rcdTest' => $r['rcd_test'],
            'rcdTripTestEnabled' => (bool)$r['rcd_trip_enabled'], 'rcdType' => $r['rcd_type'],
            'rcdTestMode' => $r['rcd_test_mode'],
            'rcdTripCurrentSetting' => $r['rcd_trip_current_setting'],
            'rcdMeasuredTripTimeMs' => $r['rcd_measured_trip_time_ms'],
            'rcdMeasuredTripCurrentMa' => $r['rcd_measured_trip_current_ma'],
            'overallResult' => $r['overall_result'],
            'overrideResult' => (bool)$r['override_result'], 'notes' => $r['notes'],
            'partId' => (string)($r['part_id'] ?? ''),
        ];
    }, $s->fetchAll());

    return [
        'id' => $j['id'], 'certNumber' => $j['cert_number'], 'clientId' => $j['client_id'],
        'clientName' => $j['client_name'], 'clientCompany' => $j['client_company'],
        'clientEmail' => $j['client_email'], 'clientPhone' => $j['client_phone'],
        'siteAddress' => $j['site_address'], 'environment' => $j['environment'],
        'retestMonths' => (int)$j['retest_months'], 'testDate' => $j['test_date'],
        'nextTestDate' => $j['next_test_date'], 'testerName' => $j['tester_name'],
        'testerLicense' => $j['tester_license'], 'status' => $j['status'],
        'source' => $j['source'], 'externalId' => $j['external_id'], 'notes' => $j['notes'],
        'passCount' => count(array_filter($items, fn($i) => $i['overallResult'] === 'pass')),
        'failCount' => count(array_filter($items, fn($i) => $i['overallResult'] === 'fail')),
        'itemCount' => count($items),
        'createdAt' => iso($j['created_at']), 'lastUpdated' => iso($j['last_updated']),
        'jobType' => (string)($j['job_type'] ?? 'test_tag') ?: 'test_tag',
        'generator' => $extra['generator'] ?? null,
        'attachments' => is_array($extra['attachments'] ?? null) ? $extra['attachments'] : [],
        'meggerEquipment' => (string)($extra['meggerEquipment'] ?? ''),
        'meggerCalibrationDate' => (string)($extra['meggerCalibrationDate'] ?? ''),
        // Fixed RCD (switchboard safety switch) log from the web app.
        'fixedRcd' => is_array($extra['fixedRcd'] ?? null) ? $extra['fixedRcd'] : null,
        // App-only item fields (visual checklist, polarity, fault, repair), keyed by qrId.
        'itemExtras' => is_array($extra['itemExtras'] ?? null) ? $extra['itemExtras'] : (object)[],
        'items' => $items,
    ];
}

/**
 * Photos and signatures sent with a job.
 *
 * Without "attachmentsBase" the sent list replaces the server's (the web
 * app's behaviour). With it - the ids the sender had when it last pulled -
 * it's a merge: anything the sender never saw (a photo the phone added in
 * the meantime) is kept, and only ones it saw and removed are dropped. So
 * the suite adding a signature can't wipe a photo the phone just sent.
 * Entries that aren't image data are ignored.
 */
function tt_merge_attachments(array $server, $sent, $base): array
{
    $clean = function ($list): array {
        $out = [];
        $seen = [];
        foreach (is_array($list) ? $list : [] as $a) {
            if (!is_array($a)) continue;
            $url = (string)($a['dataUrl'] ?? '');
            if (!preg_match('#^data:image/(png|jpeg|jpg|webp);base64,#i', $url)) continue;
            // Older entries may have no id: give them a stable one so they
            // can take part in a merge.
            $id = (string)($a['id'] ?? '');
            if ($id === '') $id = 'att-' . substr(sha1($url), 0, 20);
            if (isset($seen[$id])) continue;
            $seen[$id] = true;
            $out[] = [
                'id'        => substr($id, 0, 64),
                'kind'      => ($a['kind'] ?? '') === 'signature' ? 'signature' : 'photo',
                'note'      => substr((string)($a['note'] ?? ''), 0, 255),
                'createdAt' => substr((string)($a['createdAt'] ?? ''), 0, 40),
                'dataUrl'   => $url,
            ];
        }
        return $out;
    };
    $sent = $clean($sent);
    if (!is_array($base)) return $sent;

    $known = array_flip(array_map('strval', $base));
    $sentIds = array_flip(array_column($sent, 'id'));
    foreach ($clean($server) as $a) {
        if (!isset($known[$a['id']]) && !isset($sentIds[$a['id']])) $sent[] = $a;
    }
    return $sent;
}

function upsert_job(array $data, string $source, ?string $externalId): string
{
    $pdo = db();
    $testDate = (string)($data['testDate'] ?? gmdate('Y-m-d'));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $testDate)) {
        json_error(400, 'Job test date must be YYYY-MM-DD.');
    }
    $months = max(0, (int)($data['retestMonths'] ?? 12));

    $jobId = (string)($data['id'] ?? '');
    $existing = null;
    if ($jobId !== '') {
        $q = $pdo->prepare('SELECT * FROM tt_jobs WHERE id = ?');
        $q->execute([$jobId]);
        $existing = $q->fetch() ?: null;
    }
    if (!$existing && $externalId) {
        $q = $pdo->prepare('SELECT * FROM tt_jobs WHERE external_id = ?');
        $q->execute([$externalId]);
        $existing = $q->fetch() ?: null;
        if ($existing) $jobId = $existing['id'];
    }

    if ($existing && !$externalId) {
        $externalId = $existing['external_id'];
    }

    $certNumber = trim((string)($data['certNumber'] ?? ''));
    if ($existing) {
        $certNumber = $certNumber !== '' ? $certNumber : $existing['cert_number'];
    } elseif ($certNumber === '') {
        $certNumber = generate_cert_number();
    }

    // Specific duplicate checks so a 409 names the exact clash.
    if (!$existing || $certNumber !== ($existing['cert_number'] ?? null)) {
        $q = $pdo->prepare('SELECT id FROM tt_jobs WHERE cert_number = ?' . ($existing ? ' AND id <> ?' : ''));
        $q->execute($existing ? [$certNumber, $jobId] : [$certNumber]);
        if ($q->fetch()) {
            json_error(409, "Certificate number {$certNumber} is already used by another job. Leave the field blank to auto-generate one.");
        }
    }
    $itemsIn = is_array($data['items'] ?? null) ? $data['items'] : [];
    $seenQr = [];
    foreach ($itemsIn as $it) {
        $qr = strtoupper(trim((string)($it['qrId'] ?? '')));
        if ($qr === '' || !preg_match('/^ZS-[A-Z0-9]{4,8}$/', $qr)) continue;
        if (isset($seenQr[$qr])) {
            json_error(409, "QR ID {$qr} appears twice in this job.");
        }
        $seenQr[$qr] = true;
        $q = $pdo->prepare('SELECT j.cert_number FROM tt_items i JOIN tt_jobs j ON j.id = i.job_id WHERE i.qr_id = ?' . ($existing ? ' AND i.job_id <> ?' : ''));
        $q->execute($existing ? [$qr, $jobId] : [$qr]);
        if ($r = $q->fetch()) {
            json_error(409, "QR ID {$qr} already belongs to job {$r['cert_number']}. Leave the QR field blank to auto-generate.");
        }
    }

    // Create parts tables / add tt_items.part_id outside the transaction:
    // in MySQL a CREATE or ALTER would commit it early.
    parts_ensure_schema();

    tt_ensure_job_columns();
    if ($existing) {
        // Re-read so the new columns are present on an existing row.
        $q = $pdo->prepare('SELECT * FROM tt_jobs WHERE id = ?');
        $q->execute([$existing['id']]);
        $existing = $q->fetch() ?: $existing;
    }
    // Only the extras the caller sent are replaced: the desktop suite doesn't
    // send photos or generator details, and must not wipe them.
    $extra = json_decode((string)($existing['extra_json'] ?? ''), true);
    if (!is_array($extra)) $extra = [];
    $serverAtts = is_array($extra['attachments'] ?? null) ? $extra['attachments'] : [];
    foreach (TT_EXTRA_KEYS as $k) {
        if (array_key_exists($k, $data)) $extra[$k] = $data[$k];
    }
    if (array_key_exists('attachments', $data)) {
        $extra['attachments'] = tt_merge_attachments($serverAtts, $data['attachments'], $data['attachmentsBase'] ?? null);
    }
    $jobType = (string)($data['jobType'] ?? ($existing['job_type'] ?? 'test_tag'));
    if (!in_array($jobType, ['test_tag', 'generator_inspection'], true)) $jobType = 'test_tag';

    // A job pushed again after being deleted elsewhere is alive again:
    // clear its tombstone so other devices don't drop it on their next pull.
    tt_ensure_tombstones();
    if ($externalId) {
        db()->prepare('DELETE FROM tt_deleted WHERE external_id = ?')->execute([$externalId]);
    }

    $pdo->beginTransaction();
    try {
        if ($existing) {
            $jobId = $existing['id'];
            $pdo->prepare(
                'UPDATE tt_jobs SET cert_number=?, client_id=?, client_name=?, client_company=?,
                   client_email=?, client_phone=?, site_address=?, environment=?, retest_months=?,
                   test_date=?, next_test_date=?, tester_name=?, tester_license=?, status=?,
                   source=?, external_id=?, notes=?, last_updated=? WHERE id=?'
            )->execute([
                $certNumber, $data['clientId'] ?? null,
                (string)($data['clientName'] ?? ''), (string)($data['clientCompany'] ?? ''),
                (string)($data['clientEmail'] ?? ''), (string)($data['clientPhone'] ?? ''),
                (string)($data['siteAddress'] ?? ''), (string)($data['environment'] ?? ''),
                $months, $testDate, next_test($testDate, $months),
                (string)($data['testerName'] ?? ''), normalize_license((string)($data['testerLicense'] ?? '')),
                (string)($data['status'] ?? 'draft'), $source, $externalId,
                (string)($data['notes'] ?? ''), now(), $jobId,
            ]);
            $pdo->prepare('DELETE FROM tt_items WHERE job_id = ?')->execute([$jobId]);
        } else {
            $jobId = new_id();
            $pdo->prepare(
                'INSERT INTO tt_jobs (id,cert_number,client_id,client_name,client_company,client_email,
                   client_phone,site_address,environment,retest_months,test_date,next_test_date,
                   tester_name,tester_license,status,source,external_id,notes,created_at,last_updated)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            )->execute([
                $jobId, $certNumber, $data['clientId'] ?? null,
                (string)($data['clientName'] ?? ''), (string)($data['clientCompany'] ?? ''),
                (string)($data['clientEmail'] ?? ''), (string)($data['clientPhone'] ?? ''),
                (string)($data['siteAddress'] ?? ''), (string)($data['environment'] ?? ''),
                $months, $testDate, next_test($testDate, $months),
                (string)($data['testerName'] ?? ''), normalize_license((string)($data['testerLicense'] ?? '')),
                (string)($data['status'] ?? 'draft'), $source, $externalId,
                (string)($data['notes'] ?? ''), now(), now(),
            ]);
        }

        $items = is_array($data['items'] ?? null) ? $data['items'] : [];
        $ins = $pdo->prepare(
            'INSERT INTO tt_items (id,job_id,qr_id,item_type,asset_id,description,make_model,
               serial_number,location,equipment_class,visual,earth_continuity,insulation_resistance,
               insulation_test_voltage,leakage_current,rcd_test,rcd_trip_enabled,rcd_type,rcd_test_mode,
               rcd_trip_current_setting,rcd_measured_trip_time_ms,rcd_measured_trip_current_ma,
               overall_result,override_result,notes,sort_order,part_id)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $order = 0;
        foreach ($items as $it) {
            $qr = strtoupper(trim((string)($it['qrId'] ?? '')));
            if ($qr === '' || !preg_match('/^ZS-[A-Z0-9]{4,8}$/', $qr)) {
                $qr = generate_qr_id();
            }
            $ins->execute([
                new_id(), $jobId, $qr,
                (string)($it['itemType'] ?? 'standard'), (string)($it['assetId'] ?? ''),
                (string)($it['description'] ?? ''), (string)($it['makeModel'] ?? ''),
                (string)($it['serialNumber'] ?? ''), (string)($it['location'] ?? ''),
                (string)($it['equipmentClass'] ?? ''), (string)($it['visual'] ?? 'pass'),
                (string)($it['earthContinuity'] ?? ''), (string)($it['insulationResistance'] ?? ''),
                (string)($it['insulationTestVoltage'] ?? ''), (string)($it['leakageCurrent'] ?? ''),
                (string)($it['rcdTest'] ?? 'n/a'), !empty($it['rcdTripTestEnabled']) ? 1 : 0,
                (string)($it['rcdType'] ?? ''), (string)($it['rcdTestMode'] ?? 'time'),
                (string)($it['rcdTripCurrentSetting'] ?? ''), (string)($it['rcdMeasuredTripTimeMs'] ?? ''),
                (string)($it['rcdMeasuredTripCurrentMa'] ?? ''),
                ($it['overallResult'] ?? 'pass') === 'fail' ? 'fail' : 'pass',
                !empty($it['overrideResult']) ? 1 : 0, (string)($it['notes'] ?? ''), $order++,
                (string)($it['partId'] ?? ''),
            ]);
        }

        $pdo->prepare('UPDATE tt_jobs SET job_type = ?, extra_json = ? WHERE id = ?')
            ->execute([$jobType, $extra ? json_encode($extra) : null, $jobId]);

        // Same transaction as the job: if the save fails, stock doesn't move.
        parts_set_job_usage($pdo, $jobId, $items);

        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        if ($e->getCode() === '23000') {
            json_error(409, 'A duplicate certificate number or QR ID was detected.');
        }
        throw $e;
    }
    return $jobId;
}

// ------------------------------------------------------------ deletion

/** The Bearer token on this request, if any. */
function tt_bearer_token(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    return preg_match('/Bearer\s+(\S+)/i', $h, $m) ? $m[1] : '';
}

/** Rejects the request unless the token is a live testtag token. */
function tt_require_token(string $token): void
{
    $s = db()->prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND scope = ?');
    $s->execute([hash('sha256', $token), 'testtag_push']);
    $tok = $s->fetch();
    if (!$tok) {
        json_error(401, 'Invalid API token.');
    }
    db()->prepare('UPDATE api_tokens SET last_used = ? WHERE id = ?')->execute([now(), $tok['id']]);
}

/**
 * Tombstones: which jobs were deleted, so devices holding a copy can drop
 * it. Plain CREATE TABLE IF NOT EXISTS works on MySQL and SQLite alike.
 */
function tt_ensure_tombstones(): void
{
    static $done = false;
    if ($done) return;
    db()->exec(
        'CREATE TABLE IF NOT EXISTS tt_deleted (
            job_id      VARCHAR(64)  NOT NULL,
            external_id VARCHAR(64)  NULL,
            cert_number VARCHAR(30)  NULL,
            deleted_at  DATETIME     NOT NULL
        )'
    );
    $done = true;
}

/** Deleted jobs from the last year, as the ids the apps know them by. */
function tt_tombstones(): array
{
    tt_ensure_tombstones();
    $s = db()->prepare('SELECT job_id, external_id, cert_number FROM tt_deleted WHERE deleted_at > ?');
    $s->execute([gmdate('Y-m-d H:i:s', time() - 365 * 86400)]);
    return array_map(fn($r) => [
        'id'         => $r['job_id'],
        'externalId' => $r['external_id'],
        'certNumber' => $r['cert_number'],
    ], $s->fetchAll());
}

/** Deletes a job by server id or externalId, returning what happened. */
function tt_delete_job(string $id, string $externalId): array
{
    tt_ensure_tombstones();
    parts_ensure_schema();
    $pdo = db();

    $job = null;
    if ($id !== '') {
        $q = $pdo->prepare('SELECT * FROM tt_jobs WHERE id = ?');
        $q->execute([$id]);
        $job = $q->fetch() ?: null;
    }
    if (!$job && $externalId !== '') {
        $q = $pdo->prepare('SELECT * FROM tt_jobs WHERE external_id = ?');
        $q->execute([$externalId]);
        $job = $q->fetch() ?: null;
    }

    if (!$job) {
        // Already gone. Still leave a tombstone so any device with a copy drops it.
        $pdo->prepare('INSERT INTO tt_deleted (job_id, external_id, cert_number, deleted_at) VALUES (?,?,?,?)')
            ->execute([$id !== '' ? $id : $externalId, $externalId !== '' ? $externalId : null, null, now()]);
        return ['deleted' => false, 'alreadyGone' => true];
    }

    $pdo->beginTransaction();
    try {
        // Put any parts fitted on this job back into stock before it goes.
        parts_set_job_usage($pdo, $job['id'], []);
        $pdo->prepare('DELETE FROM tt_items WHERE job_id = ?')->execute([$job['id']]);
        $pdo->prepare('DELETE FROM tt_jobs WHERE id = ?')->execute([$job['id']]);
        $pdo->prepare('INSERT INTO tt_deleted (job_id, external_id, cert_number, deleted_at) VALUES (?,?,?,?)')
            ->execute([$job['id'], $job['external_id'], $job['cert_number'], now()]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    return ['deleted' => true, 'id' => $job['id'], 'externalId' => $job['external_id'], 'certNumber' => $job['cert_number']];
}
