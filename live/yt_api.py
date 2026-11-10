#!/usr/bin/env python3
"""用 YouTube Data API 给每一场直播自动建一个直播活动，绑定到同一个推流密钥。

只用 Python 标准库，不需要装任何包。

一次性授权（在服务器上运行，按提示在手机或电脑浏览器里输入验证码）：
    sudo python3 /opt/fopusha-live/yt_api.py auth
授权信息存到 /etc/fopusha-live/youtube-oauth.json（只有 root 可读）。

live.sh 每开新的一场时会调用：
    python3 yt_api.py new-broadcast <名称>
它从 /etc/fopusha-live/<名称>.env 读 STREAM_KEY，
从 /etc/fopusha-live/<名称>.title 读标题（第一行）、<名称>.desc 读说明，
建一个公开的、自动开始/自动结束的直播，并绑定到这个推流密钥对应的直播流。

按时段换标题（可选）：写一个 /etc/fopusha-live/<名称>.titles，每行「开始小时-结束小时|标题」，
按开播时的当地时间挑一条；时区用 env 里的 TITLE_TZ（默认 America/Los_Angeles）。例如：
    04-11|早课诵经直播｜心经 大悲咒 …
    11-18|午间诵经直播｜…
    18-04|晚课 · 助眠诵经直播｜…
没有 .titles 或没有匹配的时段时，仍用 .title。

聊天室回向（可选，env 里写 BLESS=1 开启）：
    python3 yt_api.py bless <名称> <直播 id> [最长秒数]
每隔 BLESS_POLL 秒（默认 180）读一次聊天室，把这段时间留言的观众名字合成一条回向发回聊天室。
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

CONF_DIR = os.environ.get("CONF_DIR", "/etc/fopusha-live")
OAUTH_FILE = os.path.join(CONF_DIR, "youtube-oauth.json")
SCOPE = "https://www.googleapis.com/auth/youtube"
API = "https://www.googleapis.com/youtube/v3"


def http(method, url, data=None, headers=None, form=False):
    body = None
    headers = dict(headers or {})
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, {"error": raw.decode(errors="replace")}


def load_oauth():
    with open(OAUTH_FILE) as f:
        return json.load(f)


def save_oauth(cfg):
    os.makedirs(CONF_DIR, exist_ok=True)
    tmp = OAUTH_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(cfg, f, indent=2)
    os.chmod(tmp, 0o600)
    os.replace(tmp, OAUTH_FILE)


def access_token(cfg):
    code, res = http("POST", "https://oauth2.googleapis.com/token", {
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "refresh_token": cfg["refresh_token"],
        "grant_type": "refresh_token",
    }, form=True)
    if code != 200:
        sys.exit(f"刷新授权失败（{code}）：{res}。如果提示 invalid_grant，需要重新运行 yt_api.py auth")
    return res["access_token"]


def cmd_auth():
    """设备码授权：OAuth 客户端类型要选「电视和输入受限设备」。"""
    cfg = {}
    if os.path.exists(OAUTH_FILE):
        cfg = load_oauth()
    cid = cfg.get("client_id") or input("OAuth 客户端 ID：").strip()
    secret = cfg.get("client_secret") or input("OAuth 客户端密钥：").strip()
    code, res = http("POST", "https://oauth2.googleapis.com/device/code",
                     {"client_id": cid, "scope": SCOPE}, form=True)
    if code != 200:
        sys.exit(f"申请设备码失败（{code}）：{res}")
    print("\n请在手机或电脑浏览器打开：", res["verification_url"])
    print("输入验证码：", res["user_code"])
    print("用直播频道所在的 Google 账号登录并允许。等待授权中…\n")
    interval = int(res.get("interval", 5))
    deadline = time.time() + int(res.get("expires_in", 1800))
    while time.time() < deadline:
        time.sleep(interval)
        c, tok = http("POST", "https://oauth2.googleapis.com/token", {
            "client_id": cid, "client_secret": secret,
            "device_code": res["device_code"],
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        }, form=True)
        if c == 200 and "refresh_token" in tok:
            save_oauth({"client_id": cid, "client_secret": secret,
                        "refresh_token": tok["refresh_token"]})
            print("授权成功，已保存到", OAUTH_FILE)
            return
        err = tok.get("error")
        if err == "slow_down":
            interval += 5
        elif err != "authorization_pending":
            sys.exit(f"授权失败：{tok}")
    sys.exit("验证码过期了，请重新运行")


def read_env(name):
    env = {}
    with open(os.path.join(CONF_DIR, f"{name}.env")) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def read_text(path, default=""):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return default


def find_stream_id(token, stream_key):
    page = ""
    while True:
        url = f"{API}/liveStreams?part=id,cdn,snippet&mine=true&maxResults=50" + (f"&pageToken={page}" if page else "")
        code, res = http("GET", url, headers={"Authorization": f"Bearer {token}"})
        if code != 200:
            sys.exit(f"查询直播流失败（{code}）：{res}")
        for s in res.get("items", []):
            if s.get("cdn", {}).get("ingestionInfo", {}).get("streamName") == stream_key:
                return s["id"]
        page = res.get("nextPageToken")
        if not page:
            sys.exit("没找到和 STREAM_KEY 对应的直播流：请确认密钥是这个频道的")


def pick_title(name, env, now=None):
    """按开播时的当地时间从 <名称>.titles 里挑标题；挑不到就用 <名称>.title 的第一行。"""
    default = (read_text(os.path.join(CONF_DIR, f"{name}.title"), "24小时诵经直播").splitlines() or ["24小时诵经直播"])[0]
    rows = read_text(os.path.join(CONF_DIR, f"{name}.titles"))
    if not rows:
        return default[:100]
    if now is None:
        try:
            from zoneinfo import ZoneInfo
            now = datetime.now(ZoneInfo(env.get("TITLE_TZ", "America/Los_Angeles")))
        except Exception:
            now = datetime.now()
    hour = now.hour
    for line in rows.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "|" not in line:
            continue
        span, title = line.split("|", 1)
        try:
            start, end = (int(x) for x in span.strip().split("-", 1))
        except ValueError:
            continue
        inside = start <= hour < end if start < end else (hour >= start or hour < end)
        if inside and title.strip():
            return title.strip()[:100]
    return default[:100]


def cmd_new_broadcast(name):
    env = read_env(name)
    cfg = load_oauth()
    token = access_token(cfg)
    auth = {"Authorization": f"Bearer {token}"}
    stream_id = find_stream_id(token, env["STREAM_KEY"])

    title = pick_title(name, env)
    desc = read_text(os.path.join(CONF_DIR, f"{name}.desc"))[:5000]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    body = {
        "snippet": {"title": title, "description": desc, "scheduledStartTime": now},
        "status": {"privacyStatus": env.get("PRIVACY", "public"),
                   "selfDeclaredMadeForKids": False,
                   "containsSyntheticMedia": True},
        "contentDetails": {"enableAutoStart": True, "enableAutoStop": True,
                           "enableDvr": True, "latencyPreference": "normal",
                           "monitorStream": {"enableMonitorStream": False}},
    }
    code, b = http("POST", f"{API}/liveBroadcasts?part=snippet,status,contentDetails", body, auth)
    if code not in (200, 201):
        sys.exit(f"建直播失败（{code}）：{b}")
    bid = b["id"]
    code, res = http("POST", f"{API}/liveBroadcasts/bind?id={bid}&part=id,contentDetails&streamId={stream_id}",
                     headers=auth)
    if code != 200:
        sys.exit(f"绑定推流密钥失败（{code}）：{res}")
    print(bid)


def cmd_chat(name, bid):
    """直播开播后往聊天室发留言：/etc/fopusha-live/<名称>.chat，每行一条（每条最多 200 字）。"""
    lines = [l.strip() for l in read_text(os.path.join(CONF_DIR, f"{name}.chat")).splitlines() if l.strip()]
    if not lines:
        return
    token = access_token(load_oauth())
    auth = {"Authorization": f"Bearer {token}"}
    code, res = http("GET", f"{API}/liveBroadcasts?part=snippet,status&id={bid}", headers=auth)
    items = res.get("items") or []
    if code != 200 or not items:
        sys.exit(f"查不到这场直播（{code}）：{res}")
    status = items[0]["status"].get("lifeCycleStatus")
    chat_id = items[0]["snippet"].get("liveChatId")
    if status != "live" or not chat_id:
        sys.exit(f"直播还没开始（{status}），稍后再发")
    for text in lines:
        code, res = http("POST", f"{API}/liveChat/messages?part=snippet", {
            "snippet": {"liveChatId": chat_id, "type": "textMessageEvent",
                        "textMessageDetails": {"messageText": text[:200]}}}, auth)
        if code not in (200, 201):
            sys.exit(f"发聊天留言失败（{code}）：{res}")
        time.sleep(2)
    print(f"已发 {len(lines)} 条聊天留言")


# 观众七成在台湾等东八区，回向用繁体
BLESS_WORDS = ("願以此功德，迴向{names}：平安吉祥，所求如願。🙏",
               "為{names}迴向：身心安康，闔家平安。🙏",
               "已為{names}一同迴向：消災免難，福慧增長。🙏")


def bless_text(names, index=0):
    """把一批观众名字合成一条回向留言（最多 200 字）。名字去重、保持先后，太多时只列前几位。"""
    seen = []
    for n in names:
        n = " ".join(str(n).split())[:20]
        if n and n not in seen:
            seen.append(n)
    if not seen:
        return ""
    shown = seen[:8]
    label = "、".join(shown) + (f" 等 {len(seen)} 位" if len(seen) > len(shown) else "")
    return BLESS_WORDS[index % len(BLESS_WORDS)].format(names=label)[:200]


def cmd_bless(name, bid, max_seconds=None):
    """聊天室回向：定时读聊天室，把新留言的观众名字合成一条回向发回去。

    只读文字留言，不回应频道自己发的话；每场最多发 BLESS_MAX 条（默认 20），省 API 配额。
    """
    env = read_env(name)
    poll = max(60, int(float(env.get("BLESS_POLL", "180"))))
    limit = int(env.get("BLESS_MAX", "20"))
    deadline = time.time() + (float(max_seconds) if max_seconds else 12 * 3600)
    cfg = load_oauth()

    chat_id = None
    while time.time() < deadline and not chat_id:      # 等直播进入「直播中」
        auth = {"Authorization": f"Bearer {access_token(cfg)}"}
        code, res = http("GET", f"{API}/liveBroadcasts?part=snippet,status&id={bid}", headers=auth)
        items = res.get("items") or [] if code == 200 else []
        if items and items[0]["status"].get("lifeCycleStatus") == "live":
            chat_id = items[0]["snippet"].get("liveChatId")
        if items and items[0]["status"].get("lifeCycleStatus") == "complete":
            return
        if not chat_id:
            time.sleep(120)
    if not chat_id:
        return

    page, sent = "", 0
    while time.time() < deadline and sent < limit:
        auth = {"Authorization": f"Bearer {access_token(cfg)}"}
        url = f"{API}/liveChat/messages?liveChatId={chat_id}&part=snippet,authorDetails&maxResults=200" + (f"&pageToken={page}" if page else "")
        code, res = http("GET", url, headers=auth)
        if code in (403, 404):                           # 聊天室已关（直播结束）或配额用完
            print(f"聊天室回向结束（{code}），本场发了 {sent} 条", flush=True)
            return
        if code == 200:
            page = res.get("nextPageToken", page)
            names = [m["authorDetails"].get("displayName", "")
                     for m in res.get("items", [])
                     if m.get("snippet", {}).get("type") == "textMessageEvent"
                     and not m.get("authorDetails", {}).get("isChatOwner")]
            # 第一次读到的是开播以来的留言，也一并回向；之后靠 pageToken 只拿新留言
            text = bless_text(names, sent)
            if text:
                code, out = http("POST", f"{API}/liveChat/messages?part=snippet", {
                    "snippet": {"liveChatId": chat_id, "type": "textMessageEvent",
                                "textMessageDetails": {"messageText": text}}}, auth)
                if code in (200, 201):
                    sent += 1
                    print(f"已回向：{text}", flush=True)
        time.sleep(poll)
    print(f"聊天室回向结束，本场发了 {sent} 条", flush=True)


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "auth":
        cmd_auth()
    elif len(sys.argv) >= 4 and sys.argv[1] == "chat":
        cmd_chat(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 3 and sys.argv[1] == "new-broadcast":
        cmd_new_broadcast(sys.argv[2])
    elif len(sys.argv) >= 4 and sys.argv[1] == "bless":
        cmd_bless(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) >= 5 else None)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
