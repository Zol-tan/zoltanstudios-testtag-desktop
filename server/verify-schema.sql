-- Certificate verification hashes.
-- Run once in phpMyAdmin against zoltanst_portal.

CREATE TABLE IF NOT EXISTS testtag_verify (
  id           VARCHAR(64)  NOT NULL,
  cert_number  VARCHAR(32)  NOT NULL,
  sha256       CHAR(64)     NOT NULL,
  client_name  VARCHAR(160) NOT NULL DEFAULT '',
  site_address VARCHAR(255) NOT NULL DEFAULT '',
  test_date    VARCHAR(32)  NOT NULL DEFAULT '',
  next_due     VARCHAR(32)  NOT NULL DEFAULT '',
  issued_at    DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_cert (cert_number),
  KEY idx_hash (sha256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
