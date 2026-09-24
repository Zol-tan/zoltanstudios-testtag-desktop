<?php
// Test stand-in: SQLite PDO that rewrites the few MySQL-only constructs the API uses.
class SqliteStandIn extends PDO {
    public static function fix(string $sql): string {
        $sql = str_replace('ON DUPLICATE KEY UPDATE role = VALUES(role)',
            'ON CONFLICT(project_id,user_id) DO UPDATE SET role = excluded.role', $sql);
        $sql = str_replace('UTC_TIMESTAMP()', "datetime('now')", $sql);
        return $sql;
    }
    public function prepare(string $q, array $o = []): PDOStatement|false { return parent::prepare(self::fix($q), $o); }
    public function query(string $q, ?int $m = null, mixed ...$a): PDOStatement|false {
        return $m === null ? parent::query(self::fix($q)) : parent::query(self::fix($q), $m, ...$a);
    }
    public function exec(string $q): int|false {
        if (stripos($q, 'SET time_zone') === 0) return 0;
        return parent::exec(self::fix($q));
    }
}
