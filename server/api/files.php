<?php
// ============================================================
// Stored photos and signatures  ->  /api/files.php?action=...
//
//   list        GET   ownerType[,ownerId]                 -> [{id, ownerId, ref, kind, note, createdAt, bytes}]
//   get         GET   id                                  -> {..., dataUrl}
//   save        POST  id, ownerType, ownerId[, ref], kind, note, createdAt, dataUrl
//   link        POST  ownerType, ownerId, ref             (records the server id an owner got later)
//   delete      POST  id
//   tester_get  GET                                       -> {dataUrl, version}
//   tester_set  POST  dataUrl ('' clears)                 -> {dataUrl, version}
//
// Admin session (with CSRF on writes) or a test-and-tag API token. Images
// are compressed and stored on disk; see _files.php.
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/_files.php';

// The web app in the desktop/phone shell calls with a Bearer token from its
// own origin (no cookies), so allow that - as services.php does for push.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$isWrite = in_array(action(), ['save', 'link', 'delete', 'tester_set'], true);
if ($isWrite && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_error(405, 'POST required.');
files_require_auth($isWrite);
files_ensure_schema();

switch (action()) {

    case 'list': {
        $type = (string)field('ownerType', '');
        if (!in_array($type, FILES_OWNER_TYPES, true)) json_error(400, 'Unknown owner type.');
        $sql = 'SELECT * FROM zs_files WHERE owner_type = ?';
        $args = [$type];
        $owner = (string)field('ownerId', '');
        if ($owner !== '') { $sql .= ' AND owner_id = ?'; $args[] = $owner; }
        $s = db()->prepare($sql . ' ORDER BY created_at, id');
        $s->execute($args);
        json_ok(array_map('files_meta', $s->fetchAll()));
        break;
    }

    case 'get': {
        $r = files_row((string)field('id', ''));
        if (!$r || $r['filename'] === '') json_error(404, 'File not found.');
        json_ok(files_meta($r) + ['dataUrl' => files_data_url($r)]);
        break;
    }

    case 'save': {
        $type = (string)field('ownerType', '');
        if ($type === 'tester') json_error(400, 'Use tester_set for the tester signature.');
        $r = files_put(
            (string)field('id', ''), $type, trim((string)field('ownerId', '')), trim((string)field('ref', '')),
            (string)field('kind', 'photo'), trim((string)field('note', '')), trim((string)field('createdAt', '')),
            (string)field('dataUrl', '')
        );
        json_ok(files_meta($r));
        break;
    }

    case 'link': {
        $type = (string)field('ownerType', '');
        if (!in_array($type, FILES_OWNER_TYPES, true)) json_error(400, 'Unknown owner type.');
        $s = db()->prepare('UPDATE zs_files SET owner_ref = ? WHERE owner_type = ? AND owner_id = ?');
        $s->execute([substr(trim((string)field('ref', '')), 0, 64), $type, trim((string)field('ownerId', ''))]);
        json_ok(['updated' => $s->rowCount()]);
        break;
    }

    case 'delete': {
        $id = (string)field('id', '');
        if ($id === TESTER_SIG_ID) json_error(400, 'Use tester_set to clear the tester signature.');
        // Deleting something already gone is fine: the goal is that it's gone.
        json_ok(['deleted' => files_delete($id)]);
        break;
    }

    case 'tester_get':
        json_ok(files_tester_get());
        break;

    case 'tester_set':
        json_ok(files_tester_set((string)field('dataUrl', '')));
        break;

    default:
        json_error(400, 'Unknown action.');
}
