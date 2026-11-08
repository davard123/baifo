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


def cmd_new_broadcast(name):
    env = read_env(name)
    cfg = load_oauth()
    token = access_token(cfg)
    auth = {"Authorization": f"Bearer {token}"}
    stream_id = find_stream_id(token, env["STREAM_KEY"])

    title = read_text(os.path.join(CONF_DIR, f"{name}.title"), "24小时诵经直播").splitlines()[0][:100]
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


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "auth":
        cmd_auth()
    elif len(sys.argv) >= 4 and sys.argv[1] == "chat":
        cmd_chat(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 3 and sys.argv[1] == "new-broadcast":
        cmd_new_broadcast(sys.argv[2])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
