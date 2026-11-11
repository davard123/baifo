#!/usr/bin/env bash
# 把一路循环素材推到 YouTube 直播，由 systemd 服务 fopusha-live@<名称> 调用。
#
# 规则：
#   - 每场直播最多 SESSION_HOURS 小时（默认 11.5），超过 12 小时的直播不计入 YPP 时长
#   - 一场结束后停 GAP_SECONDS 秒（默认 180），让 YouTube 自动结束这一场，
#     再推流时自动开新的一场（需要在 YouTube Studio 打开「自动开始」「自动结束」）
#   - 网络断了会在几秒内重连，接着推同一场，不会把场次时长算重
#
# 配置文件：/etc/fopusha-live/<名称>.env
#   STREAM_KEY=xxxx-xxxx-xxxx-xxxx-xxxx      # 必填，YouTube 推流密钥
#   SESSION_HOURS=11.5                        # 可选
#   GAP_SECONDS=180                           # 可选
#   RTMP_URL=rtmp://a.rtmp.youtube.com/live2  # 可选
#   PLAYLIST="dabeizhou xinjing pumen"        # 可选：多部经轮流播，每场随机打乱顺序；
#                                             # 还没生成好的素材自动跳过
#   BLESS=1                                   # 可选：聊天室回向。观众留言后，每隔几分钟把名字合成一条回向发回聊天室
#   BLESS_POLL=180                            # 可选：多久读一次聊天室（秒），BLESS_MAX=20 每场最多回几条
#   TITLE_TZ=America/Los_Angeles              # 可选：<名称>.titles 按哪个时区的钟点挑标题
#   SESSION_STARTS="06:00 18:00"              # 可选：按钟点换场（共修时间）。设了它就不按 SESSION_HOURS，
#                                             # 每场在下一个钟点前 END_EARLY_MIN 分钟结束，到钟点再开新一场
#   SESSION_TZ=America/Los_Angeles            # 可选：SESSION_STARTS 用哪个时区，默认美西
#   END_EARLY_MIN=10                          # 可选：提前几分钟收场，留给 YouTube 结束上一场
#   OPENING_0800="lengyan_recite dabeizhou_recite*7 shixiaozhou_recite xinjing_recite*3"
#                                             # 可选：08:00 场固定开场顺序；名称*N 表示连播 N 遍
#   OPENING_2000="amituo_recite wangsheng_recite*3"
#                                             # 可选：20:00 场固定开场顺序；然后进入轮播
#   OPENING=xinjing_music OPENING_REPEAT=7    # 没有对应 OPENING_HHMM 时的旧版 fallback
set -uo pipefail

name="${1:?用法：live.sh <名称>}"
LIVE_HOME="${LIVE_HOME:-/opt/fopusha-live}"
CONF_DIR="${CONF_DIR:-/etc/fopusha-live}"
env_file="$CONF_DIR/$name.env"
[[ -r "$env_file" ]] || { echo "找不到 $env_file" >&2; exit 2; }
# shellcheck disable=SC1090
source "$env_file"

: "${STREAM_KEY:?$env_file 里没有 STREAM_KEY}"
SESSION_HOURS="${SESSION_HOURS:-11.5}"
GAP_SECONDS="${GAP_SECONDS:-180}"
RTMP_URL="${RTMP_URL:-rtmp://a.rtmp.youtube.com/live2}"
MEDIA="${MEDIA:-$LIVE_HOME/media/$name.mp4}"
PLAYLIST="${PLAYLIST:-}"
LIST_FILE="$LIVE_HOME/run/$name.txt"
SESSION_STARTS="${SESSION_STARTS:-}"
SESSION_TZ="${SESSION_TZ:-America/Los_Angeles}"
END_EARLY_MIN="${END_EARLY_MIN:-10}"
OPENING="${OPENING:-}"
OPENING_REPEAT="${OPENING_REPEAT:-7}"
if [[ -z "$PLAYLIST" ]]; then
  [[ -s "$MEDIA" ]] || { echo "素材不存在：$MEDIA，先运行 prepare.sh $name" >&2; exit 2; }
fi

# 每场开始时生成播放清单：按本场钟点挑 OPENING_HHMM，按顺序连播后再接
# PLAYLIST 随机轮播。名称*N 表示同一条视频连播 N 遍；没有对应变量时保留
# OPENING × OPENING_REPEAT 的旧行为。轮播部分每轮重新打乱、连写多轮，ffmpeg
# 的 -stream_loop 只是兜底。
# 用法：build_list [skip_opening]
build_list() {
  local items=() p f r n=0
  local opening_spec="" opening_slot="${OPENING_SLOT:-}"
  local opening_var="" token base repeat raw_repeat i path
  local session_label="共修" opening_desc="" playlist_desc=""
  local -a opening_paths=() opening_order=() opening_tokens=()
  local max_opening_repeat=1000
  for p in $PLAYLIST; do
    f="$LIVE_HOME/media/$p.mp4"
    if [[ -s "$f" ]]; then
      items+=("$f")
    else
      log "缺少轮播素材，跳过：$p（$f）"
    fi
  done
  (( ${#items[@]} )) || { echo "PLAYLIST 里的素材一个都还没生成" >&2; return 1; }

  case "${opening_slot//:/}" in
    0800) session_label="早课" ;;
    2000) session_label="晚课" ;;
    "")   session_label="常规场" ;;
    *)    session_label="共修 ${opening_slot}" ;;
  esac

  if [[ -n "${1:-}" ]]; then
    opening_desc="续场跳过开场"
    log "本场：$session_label（${opening_slot:-无钟点}），续场跳过固定开场"
  else
    opening_slot="${opening_slot//:/}"
    if [[ -n "$opening_slot" ]]; then
      opening_var="OPENING_$opening_slot"
      # 间接展开只读取由 clock_slot 生成的安全变量名。
      if [[ -n "${!opening_var+x}" && -n "${!opening_var}" ]]; then
        opening_spec="${!opening_var}"
      fi
    fi
    if [[ -z "$opening_spec" && -n "$OPENING" ]]; then
      if [[ "$OPENING_REPEAT" =~ ^[0-9]{1,4}$ ]]; then
        repeat=$((10#$OPENING_REPEAT))
        if (( repeat >= 1 && repeat <= max_opening_repeat )); then
          opening_spec="$OPENING*$repeat"
        else
          log "无效 OPENING_REPEAT=$OPENING_REPEAT（须为 1-$max_opening_repeat），跳过旧版 fallback 开场"
        fi
      else
        log "无效 OPENING_REPEAT=$OPENING_REPEAT（须为 1-$max_opening_repeat），跳过旧版 fallback 开场"
      fi
    fi

    if [[ -n "$opening_spec" ]]; then
      read -r -a opening_tokens <<< "$opening_spec"
      for token in "${opening_tokens[@]}"; do
        base="$token"
        repeat=1
        if [[ "$token" == *"*"* ]]; then
          if [[ "$token" =~ ^([^*]+)\*([0-9]{1,4})$ ]]; then
            base="${BASH_REMATCH[1]}"
            raw_repeat="${BASH_REMATCH[2]}"
            repeat=$((10#$raw_repeat))
            if (( repeat < 1 || repeat > max_opening_repeat )); then
              log "无效开场遍数，跳过：$token（须为 1-$max_opening_repeat）"
              opening_order+=("$token（无效遍数）")
              continue
            fi
          else
            log "无效开场项，跳过：$token（格式应为 name 或 name*N）"
            opening_order+=("$token（无效）")
            continue
          fi
        fi
        path="$LIVE_HOME/media/$base.mp4"
        opening_order+=("$base×$repeat")
        if [[ ! -s "$path" ]]; then
          log "缺少开场素材，跳过：$base（$path）"
          continue
        fi
        for ((i = 0; i < repeat; i++)); do
          opening_paths+=("$path")
        done
      done
    fi
    if (( ${#opening_order[@]} )); then
      opening_desc="${opening_order[0]}"
      for ((i = 1; i < ${#opening_order[@]}; i++)); do
        opening_desc+=" → ${opening_order[i]}"
      done
    elif [[ -n "$opening_slot" ]]; then
      opening_desc="（未配置 $opening_var，使用旧版 fallback）"
    else
      opening_desc="（无固定钟点开场）"
    fi
    log "本场：$session_label（${opening_slot:-无钟点}），开场顺序：$opening_desc"
  fi

  mkdir -p "$(dirname "$LIST_FILE")"
  {
    for path in "${opening_paths[@]}"; do printf '%s\n' "$path"; done
    for ((r = 0; r < 12; r++)); do printf '%s\n' "${items[@]}" | shuf; done
  } | sed "s/'/'\\\\''/g; s/^/file '/; s/\$/'/" > "$LIST_FILE"
  local head="" skip=0
  if (( ${#opening_paths[@]} )); then
    head="开场 $opening_desc，然后"
    skip=${#opening_paths[@]}
  fi
  n=${#items[@]}
  playlist_desc=$(sed -e "s#.*/##" -e "s#\.mp4'##" "$LIST_FILE" | tail -n +$(( skip + 1 )) | head -n "$n" | paste -sd ' ')
  log "本场播放：${head}轮播 $playlist_desc"
}

# 按钟点换场：输出「还要等几秒 本场结束的时间戳 归属钟点(HHMM)」。
# 离下一个钟点不到 END_EARLY_MIN 分钟时（正处在换场空档里），先等到钟点再开播。
clock_slot() {
  python3 - "$SESSION_STARTS" "$SESSION_TZ" "$END_EARLY_MIN" <<'PY'
import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
starts_raw, tz, early = sys.argv[1].split(), ZoneInfo(sys.argv[2]), int(sys.argv[3]) * 60
starts = []
for hm in starts_raw:
    try:
        h, m = (int(x) for x in hm.split(":"))
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError
    except ValueError:
        raise SystemExit(f"invalid SESSION_STARTS item: {hm}")
    starts.append((h, m))
# 离线测试可用 CLOCK_NOW 注入固定时刻；不设置时保持真实当前时间。
now_text = os.environ.get("CLOCK_NOW")
if now_text:
    try:
        now = datetime.fromisoformat(now_text)
    except ValueError:
        raise SystemExit(f"invalid CLOCK_NOW: {now_text}")
    now = now.replace(tzinfo=tz) if now.tzinfo is None else now.astimezone(tz)
else:
    now = datetime.now(tz)
all_cands = []
for d in range(-1, 4):
    day = (now + timedelta(days=d)).date()
    for h, m in starts:
        all_cands.append(datetime(day.year, day.month, day.day, h, m, tzinfo=tz))
cands = sorted(c for c in all_cands if c.timestamp() > now.timestamp())
if not cands:
    raise SystemExit("no future SESSION_STARTS")
b = cands[0]
wait = 0
if b.timestamp() - now.timestamp() <= early + 300:
    wait = int(b.timestamp() - now.timestamp()) + 1
    # 空档内启动：等到 b 这个钟点，本场归属 b；结束时间看下一个钟点。
    slot = b
    b = cands[1]
else:
    # 已经在一场中间启动：归属当前时刻之前最近的钟点。
    past = [c for c in sorted(all_cands) if c.timestamp() <= now.timestamp()]
    if not past:
        raise SystemExit("no past SESSION_STARTS")
    slot = past[-1]
print(wait, int(b.timestamp()) - early, slot.strftime("%H%M"))
PY
}

session_secs=$(awk -v h="$SESSION_HOURS" 'BEGIN{printf "%d", h*3600}')
if (( session_secs > 11*3600 + 55*60 )); then
  echo "SESSION_HOURS 太长，已改成 11.9 小时（超过 12 小时整场不计入 YPP）" >&2
  session_secs=$((11*3600 + 54*60))
fi

log() { echo "[$(date '+%F %T')] [$name] $*"; }
stop=0

# 场次记录：服务重启或断线很快重连时，YouTube 还算同一场直播。
# 所以每场的开始时间记在文件里，推流期间每 30 秒更新一次心跳；
# 重启后如果心跳离现在不到 GAP_SECONDS 秒，就接着上一场计时，保证 YouTube 上一场不会超过 12 小时。
STATE="$LIVE_HOME/run/$name.session"; BID_FILE="$LIVE_HOME/run/$name.bid"; HEART="$LIVE_HOME/run/$name.heartbeat"
mkdir -p "$LIVE_HOME/run"
( while sleep 30; do [[ -f "$HEART.on" ]] && touch "$HEART"; done ) &
hb_pid=$!
trap 'stop=1; [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null && wait "$pid" 2>/dev/null; kill "$hb_pid" 2>/dev/null' TERM INT
trap 'kill "$hb_pid" 2>/dev/null; [[ -n "${bless_pid:-}" ]] && kill "$bless_pid" 2>/dev/null; rm -f "$HEART.on"' EXIT

# 一场最长 11 小时 55 分，无论按时长还是按钟点
max_secs=$((11*3600 + 55*60))

resume=0
if [[ -s "$STATE" && -f "$HEART" ]]; then
  age=$(( $(date +%s) - $(stat -c %Y "$HEART") ))
  read -r s_start s_end state_slot < "$STATE"
  s_end="${s_end:-$(( s_start + session_secs ))}"
  if (( age < GAP_SECONDS && s_end - $(date +%s) > 60 )); then resume=1; fi
fi

while (( ! stop )); do
  if (( resume )); then
    start=$s_start; end=$s_end; resume=0
    OPENING_SLOT="${state_slot:-}"
    # 改了共修钟点后重启：本场最晚在下一个钟点前收，好让共修准点开场
    if [[ -n "$SESSION_STARTS" ]] && slot=$(clock_slot); then
      read -r wait_s c_end c_slot <<< "$slot"
      [[ -n "$OPENING_SLOT" ]] || OPENING_SLOT="$c_slot"
      (( wait_s == 0 && c_end < end )) && { end=$c_end; echo "$start $end $OPENING_SLOT" > "$STATE"; }
    fi
    bid=$(cat "$BID_FILE" 2>/dev/null || true)
    log "接着上一场直播（$(( ($(date +%s) - start) / 60 )) 分钟前开始），本场还剩 $(( (end - $(date +%s)) / 60 )) 分钟"
    opening_skip=1
  else
    opening_skip=""
    OPENING_SLOT=""
    # 按钟点换场：先算好本场到几点结束；正处在换场空档就等到钟点
    if [[ -n "$SESSION_STARTS" ]]; then
      if ! slot=$(clock_slot); then log "SESSION_STARTS 写得不对：$SESSION_STARTS"; exit 2; fi
      read -r wait_s end OPENING_SLOT <<< "$slot"
      if (( wait_s > 0 )); then
        log "等 $((wait_s / 60)) 分钟到下一个共修钟点再开播"
        sleep "$wait_s" & wait $!
        (( stop )) && break
      fi
    fi
    bid=""
    # 授权过 YouTube API 的话，每场先建好一个自动开始/自动结束的直播活动
    if [[ -s "$CONF_DIR/youtube-oauth.json" ]]; then
      if bid=$(CONF_DIR="$CONF_DIR" python3 "$(dirname "$0")/yt_api.py" new-broadcast "$name" 2>&1); then
        log "已在 YouTube 建好新一场：https://www.youtube.com/watch?v=$bid"
        # 开播后往聊天室发欢迎留言（<名称>.chat，每行一条）；直播要先进入「直播中」才能发，所以等一会儿、失败重试
        if [[ -s "$CONF_DIR/$name.chat" ]]; then
          ( for try in $(seq 1 20); do
              sleep 120
              if out=$(CONF_DIR="$CONF_DIR" python3 "$(dirname "$0")/yt_api.py" chat "$name" "$bid" 2>&1); then
                log "$out"; break
              fi
              log "聊天留言第 $try 次没发出去：$out"
            done ) &
        fi
        echo "$bid" > "$BID_FILE"
      else
        # 建场失败（授权过期、配额用完等）也照样推流：频道上这时需要人在 Studio 里点一次开播
        log "YouTube 建场失败，本场先照常推流，需要在 Studio 手动开播：$bid"
        bid=""; rm -f "$BID_FILE"
      fi
    fi
    start=$(date +%s)
    if [[ -n "$SESSION_STARTS" ]]; then
      (( end - start > max_secs )) && end=$(( start + max_secs ))
    else
      end=$(( start + session_secs ))
    fi
    echo "$start $end $OPENING_SLOT" > "$STATE"
    log "开始新一场直播，到 $(date -d "@$end" '+%F %T %Z') 结束（$(( (end - start) / 60 )) 分钟）"
  fi
  # 聊天室回向：BLESS=1 时开一个后台进程，本场结束时一并停掉；服务重启接着上一场时也照样开
  if [[ -n "${bid:-}" && "$(source "$env_file" >/dev/null 2>&1; printf '%s' "${BLESS:-}")" == "1" ]]; then
    CONF_DIR="$CONF_DIR" python3 "$(dirname "$0")/yt_api.py" bless "$name" "$bid" "$(( end - $(date +%s) ))" > >(while IFS= read -r line; do log "$line"; done) 2>&1 &
    bless_pid=$!
    log "聊天室回向已开启（每 $(source "$env_file" >/dev/null 2>&1; printf '%s' "${BLESS_POLL:-180}") 秒读一次聊天室）"
  fi
  touch "$HEART" "$HEART.on"
  # 每场重新读一次 env 里的 PLAYLIST：改了播放列表不用重启，下一场自动生效
  # shellcheck disable=SC1090
  PLAYLIST="$(source "$env_file" >/dev/null 2>&1; printf '%s' "${PLAYLIST:-}")"
  if [[ -n "$PLAYLIST" ]]; then
    build_list $opening_skip || { sleep 60 & wait $!; continue; }
    input=(-f concat -safe 0 -stream_loop -1 -i "$LIST_FILE")
  else
    input=(-stream_loop -1 -i "$MEDIA")
  fi
  fails=0
  while (( ! stop )); do
    left=$(( end - $(date +%s) ))
    (( left > 30 )) || break
    ffmpeg -nostdin -hide_banner -loglevel warning \
      -re "${input[@]}" -t "$left" \
      -c copy -f flv -flvflags no_duration_filesize \
      "$RTMP_URL/$STREAM_KEY" &
    pid=$!
    wait "$pid"; code=$?
    pid=""
    (( stop )) && break
    left=$(( end - $(date +%s) ))
    (( left > 30 )) || break
    fails=$((fails + 1))
    # 断线：前几次马上重连接着推同一场；连续失败就慢慢退避，最多等 2 分钟
    wait_s=$(( fails <= 3 ? 5 : (fails * 10 > 120 ? 120 : fails * 10) ))
    log "推流中断（ffmpeg 退出码 $code），${wait_s} 秒后重连，本场还剩 $((left / 60)) 分钟"
    sleep "$wait_s" & wait $!
  done
  [[ -n "${bless_pid:-}" ]] && { kill "$bless_pid" 2>/dev/null; bless_pid=""; }
  (( stop )) && break
  rm -f "$HEART.on"
  if [[ -n "$SESSION_STARTS" ]]; then
    log "本场到时，等到下一个共修钟点再开新一场"   # 等待在下一轮开头的 clock_slot 里
  else
    log "本场到时，停 ${GAP_SECONDS} 秒等 YouTube 结束这一场"
    sleep "$GAP_SECONDS" & wait $!
  fi
done
log "已停止"
