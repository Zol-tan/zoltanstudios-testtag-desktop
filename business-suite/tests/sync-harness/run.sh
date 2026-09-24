#!/bin/bash
# End-to-end test of the suite's sync + admin sections against the REAL PHP API.
#
#   tests/sync-harness/run.sh /path/to/public_html/api [--old-server]
#
# Copies the API into a scratch folder, swaps only config.php and the MySQL
# connection in db() for SQLite (sqlite_pdo.php), runs it on `php -S`, and
# drives it with the suite's own Services code (dotnet/). Needs php (pdo_sqlite)
# and the .NET 8 SDK. --old-server swaps in data.php from OLD_DATA_PHP to check
# the fallbacks for a server that hasn't been updated.
set -e
API=${1:?usage: run.sh /path/to/public_html/api [--old-server]}
API=$(cd "$API" && pwd)
H=$(cd "$(dirname "$0")" && pwd)
W=$H/.work
PORT=${PORT:-8765}
[ -f $W/php.pid ] && kill $(cat $W/php.pid) 2>/dev/null || true
rm -rf $W && mkdir -p $W/www $W/sessions
cp -r "$API" $W/www/api
rm -f $W/www/api/error_log $W/www/api/.htaccess
cat > $W/www/api/config.php <<CFG
<?php
define('DB_HOST','x'); define('DB_NAME','x'); define('DB_USER','x'); define('DB_PASS','x');
define('SITE_NAME','ZoltanStudios'); define('SITE_URL','http://127.0.0.1:$PORT');
define('ADMIN_EMAIL','admin@example.test');
define('ALLOWED_ORIGINS',[]); define('INVITE_ONLY',false);
define('SMTP_ENABLED',false); define('SMTP_HOST',''); define('SMTP_PORT',587); define('SMTP_USER','');
define('SMTP_PASS',''); define('SMTP_SECURE','tls'); define('SMTP_FROM','x@example.test'); define('SMTP_FROM_NAME','ZS');
define('UPLOAD_DIR', __DIR__.'/../uploads/'); define('MAX_UPLOAD_BYTES', 1000000);
define('CONFIGURED',true); define('DEBUG_MODE',true);
define('SESSION_PATH','$W/sessions');
CFG
php -r '
[$_, $f, $h, $db] = $argv; $s = file_get_contents($f);
$a = strpos($s, "    \$dsn = sprintf("); $b = strpos($s, "SET time_zone");
if ($a === false || $b === false) { fwrite(STDERR, "db() patch point not found in _lib.php\n"); exit(1); }
$b = strpos($s, "\n", $b);
$rep = "    require_once \"$h/sqlite_pdo.php\";\n    \$pdo = new SqliteStandIn(\"sqlite:$db\", null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);\n    \$pdo->exec(\"PRAGMA busy_timeout=5000\");";
file_put_contents($f, substr($s, 0, $a) . $rep . substr($s, $b));' $W/www/api/_lib.php $H $W/test.db
python3 $H/make_schema.py "$API" $W/schema.sql
php -r '
[$_, $db, $schema] = $argv;
$p = new PDO("sqlite:$db"); $p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$p->exec(file_get_contents($schema));
$now = gmdate("Y-m-d H:i:s");
$p->prepare("INSERT INTO users (id,email,password_hash,first_name,last_name,role,is_admin,created_at) VALUES (?,?,?,?,?,?,1,?)")
  ->execute(["adm00000000000000001","admin@example.test",password_hash("TestPassword123",PASSWORD_DEFAULT),"Test","Admin","admin",$now]);
$p->prepare("INSERT INTO users (id,email,password_hash,first_name,last_name,company,role,created_at) VALUES (?,?,?,?,?,?,?,?)")
  ->execute(["cli00000000000000001","client.one@example.test",password_hash("ClientPass123",PASSWORD_DEFAULT),"Sample","Client","Example Pty Ltd","client",$now]);' $W/test.db $W/schema.sql
if [ "$2" = "--old-server" ]; then cp "${OLD_DATA_PHP:?set OLD_DATA_PHP to the old data.php}" $W/www/api/data.php; fi
php -S 127.0.0.1:$PORT -t $W/www > $W/server.log 2>&1 &
echo $! > $W/php.pid
trap 'kill $(cat $W/php.pid) 2>/dev/null' EXIT
sleep 1
kill -0 $(cat $W/php.pid) 2>/dev/null || { echo "php -S failed to start (port $PORT in use?):"; cat $W/server.log; exit 1; }
cd $H/dotnet && dotnet run -c Release -- http://127.0.0.1:$PORT $W/test.db ${2:-}
