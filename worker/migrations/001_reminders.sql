-- 忌日 / 清明 年度提醒 —— 建表
--
-- 背景：现在祭祖表单虽然收了邮箱，但邮箱只用于发一封确认信，用完即丢，没有入库。
-- 所以「用已有邮箱字段做提醒」并不是接一根线就行，需要先有地方存 订阅关系 + 忌日。
--
-- 这份迁移刻意独立成一张表，不往 ancestor_wishes 里加列：
--   1. 祭祖记录是「一次祭拜」，订阅是「长期关系」，生命周期不同；
--   2. 用户退订时应该删订阅，而不该动他的祭拜历史；
--   3. 隔离个人可识别信息（邮箱），方便单独设权限和清理。
--
-- 执行：Supabase SQL Editor 里跑一遍即可。

create table if not exists reminder_subscriptions (
  id            bigserial primary key,
  email         text        not null,
  username      text        not null default '',
  -- 先人显示名与关系，用于邮件正文
  ancestor_name text        not null default '',
  relationship  text        not null default '',
  -- 忌日。只用月/日做匹配，年份仅作展示（可为空）
  death_month   smallint    check (death_month between 1 and 12),
  death_day     smallint    check (death_day between 1 and 31),
  death_year    smallint,
  -- 想收哪些提醒
  notify_anniversary boolean not null default true,   -- 忌日当天
  notify_qingming    boolean not null default true,   -- 清明
  -- 退订令牌，放在邮件退订链接里；不可猜测
  unsub_token   text        not null unique,
  -- 防重复发送：记录最近一次成功发送的日期
  last_sent_on  date,
  created_at    timestamptz not null default now()
);

-- 同一个邮箱 + 同一位先人只订阅一次
create unique index if not exists reminder_subscriptions_unique
  on reminder_subscriptions (lower(email), ancestor_name, relationship);

-- 定时任务每天按 月/日 扫一遍，走这个索引
create index if not exists reminder_subscriptions_md
  on reminder_subscriptions (death_month, death_day);

-- 这张表只应由 worker 的 service_role 访问，前端匿名 key 一律拒绝
alter table reminder_subscriptions enable row level security;
