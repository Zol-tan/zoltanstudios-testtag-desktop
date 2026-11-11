<?php
// ============================================================
// Data endpoints  ->  /api/data.php?resource=...&action=...
//
// Clients only ever see their own rows. Admins see everything.
// Every write requires a valid CSRF token.
//
//   users         list(admin) | create(admin) | update(admin) | deactivate(admin)
//   projects      list | create, update, delete, add_member, members, remove_member (admin)
//   events        list | request | create(admin) | update(admin) | update_status(admin) | delete(admin)
//   invoices      list | create(admin) | update_status(admin) | delete(admin)
//   notifications list | mark_read | mark_all_read
// ============================================================

declare(strict_types=1);
require_once __DIR__ . '/_lib.php';

$user     = require_login();
$isAdmin  = (int)$user['is_admin'] === 1;
$resource = (string)($_GET['resource'] ?? '');
$act      = action();

/** Clients may only ever touch their own userId. */
function scoped_user_id(array $user, bool $isAdmin): string
{
    if (!$isAdmin) {
        return $user['id'];
    }
    $requested = (string)field('userId', '');
    return $requested !== '' ? $requested : $user['id'];
}

function bad_action(): void
{
    json_error(400, 'Unknown action for this resource.');
}

switch ($resource) {

    // ========================================================
    case 'users':
        if ($act === 'list') {
            if (!$isAdmin) {
                json_ok([public_user($user)]);
            }
            $rows = db()->query('SELECT * FROM users ORDER BY created_at DESC')->fetchAll();
            json_ok(array_map(fn($r) => public_user($r), $rows));
        }

        if ($act === 'create') {
            require_csrf();
            require_admin();
            $f = require_fields(['firstName', 'lastName', 'email', 'password']);
            $email = strtolower(trim((string)$f['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_error(400, 'Please enter a valid email address.');
            }
            if (strlen((string)$f['password']) < 10) {
                json_error(400, 'Password must be at least 10 characters.');
            }
            $dupe = db()->prepare('SELECT 1 FROM users WHERE email = ?');
            $dupe->execute([$email]);
            if ($dupe->fetch()) {
                json_error(409, 'An account with that email already exists.');
            }
            $id = new_id();
            db()->prepare(
                'INSERT INTO users (id,email,password_hash,first_name,last_name,company,phone,role,created_at)
                 VALUES (?,?,?,?,?,?,?,?,?)'
            )->execute([
                $id, $email,
                password_hash((string)$f['password'], PASSWORD_DEFAULT),
                trim((string)$f['firstName']), trim((string)$f['lastName']),
                trim((string)field('company', '')), trim((string)field('phone', '')),
                'client', now(),
            ]);
            $s = db()->prepare('SELECT * FROM users WHERE id = ?');
            $s->execute([$id]);
            json_ok(public_user($s->fetch()));
        }

        // Edit a client's details (Business Suite). Password is untouched.
        if ($act === 'update') {
            require_csrf();
            require_admin();
            $id = (string)field('id', '');
            $s = db()->prepare('SELECT * FROM users WHERE id = ?');
            $s->execute([$id]);
            $u = $s->fetch();
            if (!$u) {
                json_error(404, 'Client not found.');
            }
            $email = strtolower(trim((string)field('email', $u['email'])));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_error(400, 'Please enter a valid email address.');
            }
            if ($email !== strtolower((string)$u['email'])) {
                $dupe = db()->prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?');
                $dupe->execute([$email, $id]);
                if ($dupe->fetch()) {
                    json_error(409, 'An account with that email already exists.');
                }
            }
            db()->prepare(
                'UPDATE users SET email=?, first_name=?, last_name=?, company=?, phone=? WHERE id=?'
            )->execute([
                $email,
                trim((string)field('firstName', $u['first_name'])),
                trim((string)field('lastName', $u['last_name'])),
                trim((string)field('company', $u['company'])),
                trim((string)field('phone', $u['phone'])),
                $id,
            ]);
            $s->execute([$id]);
            json_ok(public_user($s->fetch()));
        }

        if ($act === 'deactivate') {
            require_csrf();
            require_admin();
            $id = (string)field('id', '');
            if ($id === $user['id']) {
                json_error(400, 'You cannot deactivate your own account.');
            }
            db()->prepare('UPDATE users SET is_active = 0 WHERE id = ?')->execute([$id]);
            json_ok(null);
        }
        bad_action();

    // ========================================================
    case 'projects':
        if ($act === 'list') {
            if ($isAdmin) {
                $rows = db()->query('SELECT * FROM projects ORDER BY last_updated DESC')->fetchAll();
            } else {
                $s = db()->prepare(
                    'SELECT p.* FROM projects p
                     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
                     WHERE p.user_id = ? OR pm.user_id IS NOT NULL
                     ORDER BY p.last_updated DESC'
                );
                $s->execute([$user['id'], $user['id']]);
                $rows = $s->fetchAll();
            }
            json_ok(array_map(fn($r) => [
                'id'          => $r['id'],
                'userId'      => $r['user_id'],
                'projectName' => $r['project_name'],
                'description' => $r['description'],
                'status'      => $r['status'],
                'progress'    => (int)$r['progress'],
                'createdAt'   => iso($r['created_at']),
                'lastUpdated' => iso($r['last_updated']),
            ], $rows));
        }

        if ($act === 'create') {
            require_csrf();
            require_admin();
            $f = require_fields(['projectName', 'userId']);
            $id = new_id();
            db()->prepare(
                'INSERT INTO projects (id,user_id,project_name,description,status,progress,created_at,last_updated)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute([
                $id, (string)$f['userId'], trim((string)$f['projectName']),
                (string)field('description', ''), (string)field('status', 'Queued'),
                max(0, min(100, (int)field('progress', 0))), now(), now(),
            ]);
            json_ok(['id' => $id]);
        }

        if ($act === 'update') {
            require_csrf();
            require_admin();
            $id = (string)field('id', '');
            $s = db()->prepare('SELECT * FROM projects WHERE id = ?');
            $s->execute([$id]);
            $p = $s->fetch();
            if (!$p) {
                json_error(404, 'Project not found.');
            }
            db()->prepare(
                'UPDATE projects SET project_name=?, description=?, status=?, progress=?, user_id=?, last_updated=?
                 WHERE id=?'
            )->execute([
                (string)field('projectName', $p['project_name']),
                (string)field('description', $p['description']),
                (string)field('status', $p['status']),
                max(0, min(100, (int)field('progress', $p['progress']))),
                (string)field('userId', $p['user_id']),
                now(), $id,
            ]);
            json_ok(null);
        }

        if ($act === 'delete') {
            require_csrf();
            require_admin();
            db()->prepare('DELETE FROM projects WHERE id = ?')->execute([(string)field('id', '')]);
            json_ok(null);
        }

        // Replaces the addProjectMember callable
        if ($act === 'add_member') {
            require_csrf();
            require_admin();
            $f = require_fields(['projectId', 'userId']);
            db()->prepare(
                'INSERT INTO project_members (project_id,user_id,role,added_at) VALUES (?,?,?,?)
                 ON DUPLICATE KEY UPDATE role = VALUES(role)'
            )->execute([
                (string)$f['projectId'], (string)$f['userId'],
                (string)field('role', 'member'), now(),
            ]);
            json_ok(null);
        }

        // Who can see a project (Business Suite project access manager).
        if ($act === 'members') {
            require_admin();
            $s = db()->prepare(
                'SELECT pm.user_id, pm.role, pm.added_at, u.first_name, u.last_name, u.email
                 FROM project_members pm JOIN users u ON u.id = pm.user_id
                 WHERE pm.project_id = ? ORDER BY pm.added_at'
            );
            $s->execute([(string)field('projectId', '')]);
            json_ok(array_map(fn($r) => [
                'userId'  => $r['user_id'],
                'name'    => trim($r['first_name'] . ' ' . $r['last_name']),
                'email'   => $r['email'],
                'role'    => $r['role'],
                'addedAt' => iso($r['added_at']),
            ], $s->fetchAll()));
        }

        if ($act === 'remove_member') {
            require_csrf();
            require_admin();
            $f = require_fields(['projectId', 'userId']);
            db()->prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
                ->execute([(string)$f['projectId'], (string)$f['userId']]);
            json_ok(null);
        }
        bad_action();

    // ========================================================
    case 'events':
        if ($act === 'list') {
            if ($isAdmin) {
                $rows = db()->query('SELECT * FROM events ORDER BY event_date DESC')->fetchAll();
            } else {
                $s = db()->prepare('SELECT * FROM events WHERE user_id = ? ORDER BY event_date DESC');
                $s->execute([$user['id']]);
                $rows = $s->fetchAll();
            }
            json_ok(array_map(fn($r) => [
                'id'        => $r['id'],
                'userId'    => $r['user_id'],
                'title'     => $r['title'],
                'date'      => $r['event_date'],
                'time'      => $r['event_time'],
                'status'    => $r['status'],
                'notes'     => $r['notes'],
                'createdAt' => iso($r['created_at']),
            ], $rows));
        }

        // Client-initiated meeting request
        if ($act === 'request' || $act === 'create') {
            require_csrf();
            if ($act === 'create') {
                require_admin();
            }
            $f = require_fields(['title', 'date']);
            $date = (string)$f['date'];
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                json_error(400, 'Date must be in YYYY-MM-DD format.');
            }
            $id = new_id();
            db()->prepare(
                'INSERT INTO events (id,user_id,title,event_date,event_time,status,notes,created_at)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute([
                $id,
                scoped_user_id($user, $isAdmin),
                trim((string)$f['title']),
                $date,
                (string)field('time', '09:00'),
                $act === 'create' ? (string)field('status', 'confirmed') : 'pending',
                (string)field('notes', ''),
                now(),
            ]);
            json_ok(['id' => $id]);
        }

        // Full edit of a booking (Business Suite). Missing fields keep their value.
        if ($act === 'update') {
            require_csrf();
            require_admin();
            $id = (string)field('id', '');
            $s = db()->prepare('SELECT * FROM events WHERE id = ?');
            $s->execute([$id]);
            $ev = $s->fetch();
            if (!$ev) {
                json_error(404, 'Event not found.');
            }
            $date = (string)field('date', $ev['event_date']);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                json_error(400, 'Date must be in YYYY-MM-DD format.');
            }
            $title = trim((string)field('title', $ev['title']));
            if ($title === '') {
                json_error(400, 'Missing required field: title');
            }
            $userId = (string)field('userId', '');
            db()->prepare(
                'UPDATE events SET user_id=?, title=?, event_date=?, event_time=?, status=?, notes=? WHERE id=?'
            )->execute([
                $userId !== '' ? $userId : $ev['user_id'],
                $title, $date,
                (string)field('time', $ev['event_time']),
                (string)field('status', $ev['status']),
                (string)field('notes', $ev['notes']),
                $id,
            ]);
            json_ok(null);
        }

        if ($act === 'update_status') {
            require_csrf();
            require_admin();
            $f = require_fields(['id', 'status']);
            db()->prepare('UPDATE events SET status = ? WHERE id = ?')
                ->execute([(string)$f['status'], (string)$f['id']]);
            json_ok(null);
        }

        if ($act === 'delete') {
            require_csrf();
            require_admin();
            db()->prepare('DELETE FROM events WHERE id = ?')->execute([(string)field('id', '')]);
            json_ok(null);
        }
        bad_action();

    // ========================================================
    case 'invoices':
        if ($act === 'list') {
            if ($isAdmin) {
                $rows = db()->query('SELECT * FROM invoices ORDER BY created_at DESC')->fetchAll();
            } else {
                $s = db()->prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC');
                $s->execute([$user['id']]);
                $rows = $s->fetchAll();
            }
            json_ok(array_map(fn($r) => [
                'id'            => $r['id'],
                'invoiceNumber' => $r['invoice_number'],
                'userId'        => $r['user_id'],
                'projectId'     => $r['project_id'],
                'issueDate'     => $r['issue_date'],
                'dueDate'       => $r['due_date'],
                'paymentTerms'  => $r['payment_terms'],
                'items'         => json_decode($r['items'], true) ?: [],
                'notes'         => $r['notes'],
                'total'         => (float)$r['total'],
                'status'        => $r['status'],
                'createdAt'     => iso($r['created_at']),
            ], $rows));
        }

        if ($act === 'create') {
            require_csrf();
            require_admin();
            $f = require_fields(['userId', 'dueDate']);
            $items = field('items', []);

            // Simple form: a description and a flat amount. Convert it to a
            // single line item so both invoice paths store the same shape.
            if (!is_array($items) || count($items) === 0) {
                $desc = trim((string)field('description', ''));
                $amt  = (float)field('amount', 0);
                if ($desc === '' || $amt <= 0) {
                    json_error(400, 'Provide either line items, or a description and amount.');
                }
                $items = [['description' => $desc, 'quantity' => 1, 'rate' => $amt]];
            }

            // Auto-number when the caller did not supply one
            $invoiceNumber = trim((string)field('invoiceNumber', ''));
            if ($invoiceNumber === '') {
                $seq = (int)db()->query('SELECT COUNT(*) FROM invoices')->fetchColumn() + 1;
                do {
                    $candidate = 'ZS-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                    $chk = db()->prepare('SELECT 1 FROM invoices WHERE invoice_number = ?');
                    $chk->execute([$candidate]);
                    $taken = (bool)$chk->fetch();
                    $seq++;
                } while ($taken);
                $invoiceNumber = $candidate;
            }

            // Recalculate the total server-side - never trust the client's number
            $total = 0.0;
            $clean = [];
            foreach ($items as $it) {
                $qty  = (float)($it['quantity'] ?? 0);
                $rate = (float)($it['rate'] ?? 0);
                $clean[] = [
                    'description' => (string)($it['description'] ?? ''),
                    'quantity'    => $qty,
                    'rate'        => $rate,
                ];
                $total += $qty * $rate;
            }

            $id = new_id();
            try {
                db()->prepare(
                    'INSERT INTO invoices
                     (id,invoice_number,user_id,project_id,issue_date,due_date,payment_terms,items,notes,total,status,created_at)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
                )->execute([
                    $id,
                    $invoiceNumber,
                    (string)$f['userId'],
                    field('projectId') ?: null,
                    (string)field('issueDate', gmdate('Y-m-d')),
                    (string)$f['dueDate'],
                    (string)field('paymentTerms', 'Net 30'),
                    json_encode($clean),
                    (string)field('notes', ''),
                    round($total, 2),
                    'due',
                    now(),
                ]);
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    json_error(409, 'That invoice number has already been used.');
                }
                throw $e;
            }
            json_ok(['id' => $id, 'invoiceNumber' => $invoiceNumber, 'total' => round($total, 2)]);
        }

        if ($act === 'update_status') {
            require_csrf();
            require_admin();
            $f = require_fields(['id', 'status']);
            if (!in_array($f['status'], ['due', 'paid', 'partial', 'overdue', 'refunded', 'cancelled'], true)) {
                json_error(400, 'Invalid invoice status.');
            }
            db()->prepare('UPDATE invoices SET status = ? WHERE id = ?')
                ->execute([(string)$f['status'], (string)$f['id']]);
            json_ok(null);
        }

        if ($act === 'delete') {
            require_csrf();
            require_admin();
            db()->prepare('DELETE FROM invoices WHERE id = ?')->execute([(string)field('id', '')]);
            json_ok(null);
        }
        bad_action();

    // ========================================================
    case 'notifications':
        if ($act === 'list') {
            $s = db()->prepare(
                'SELECT * FROM notifications WHERE recipient_id = ?
                 ORDER BY created_at DESC LIMIT 50'
            );
            $s->execute([$user['id']]);
            json_ok(array_map(fn($r) => [
                'id'         => $r['id'],
                'senderId'   => $r['sender_id'],
                'senderName' => $r['sender_name'],
                'message'    => $r['message'],
                'projectId'  => $r['project_id'],
                'type'       => $r['type'],
                'isRead'     => (bool)$r['is_read'],
                'timestamp'  => iso($r['created_at']),
            ], $s->fetchAll()));
        }

        if ($act === 'mark_read') {
            require_csrf();
            db()->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?')
                ->execute([(string)field('id', ''), $user['id']]);
            json_ok(null);
        }

        if ($act === 'mark_all_read') {
            require_csrf();
            db()->prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?')
                ->execute([$user['id']]);
            json_ok(null);
        }
        bad_action();

    // ========================================================
    default:
        json_error(400, 'Unknown resource.');
}
