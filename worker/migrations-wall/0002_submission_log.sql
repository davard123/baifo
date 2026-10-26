-- 累计人次：每次礼佛/祈福/祭祖提交记一行（不管是否公开）。只存类型和打码 IP 哈希（用于限频），不存任何心愿内容或名字。
CREATE TABLE IF NOT EXISTS submission_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('buddha', 'caishen', 'blessing', 'ancestor')),
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_submission_log_ip ON submission_log (ip_hash, created_at);
