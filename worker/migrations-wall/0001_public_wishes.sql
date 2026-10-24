-- 公开心愿墙。display_name 已在服务器端打码（只留姓），不存原名、年龄、邮箱、IP 原文。
CREATE TABLE IF NOT EXISTS public_wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('buddha', 'caishen', 'blessing', 'ancestor')),
  deity TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL,
  wish TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_public_wishes_visible ON public_wishes (hidden, id DESC);
CREATE INDEX IF NOT EXISTS idx_public_wishes_ip ON public_wishes (ip_hash, created_at);
