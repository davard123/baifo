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
if [[ -z "$PLAYLIST" ]]; then
  [[ -s "$MEDIA" ]] || { echo "素材不存在：$MEDIA，先运行 prepare.sh $name" >&2; exit 2; }
fi

# 每场开始时生成播放清单：PLAYLIST 里已生成好的素材随机排序
build_list() {
  local items=() p f
  for p in $PLAYLIST; do
    f="$LIVE_HOME/media/$p.mp4"
    [[ -s "$f" ]] && items+=("$f")
  done
  (( ${#items[@]} )) || { echo "PLAYLIST 里的素材一个都还没生成" >&2; return 1; }
  mkdir -p "$(dirname "$LIST_FILE")"
  printf '%s\n' "${items[@]}" | shuf | sed "s/'/'\\\\''/g; s/^/file '/; s/\$/'/" > "$LIST_FILE"
  log "本场播放顺序：$(sed -e "s#.*/##" -e "s#\.mp4'##" "$LIST_FILE" | paste -sd ' ')"
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
STATE="$LIVE_HOME/run/$name.session"; HEART="$LIVE_HOME/run/$name.heartbeat"
mkdir -p "$LIVE_HOME/run"
( while sleep 30; do [[ -f "$HEART.on" ]] && touch "$HEART"; done ) &
hb_pid=$!
trap 'stop=1; [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null && wait "$pid" 2>/dev/null; kill "$hb_pid" 2>/dev/null' TERM INT
trap 'kill "$hb_pid" 2>/dev/null; rm -f "$HEART.on"' EXIT

resume=0
if [[ -s "$STATE" && -f "$HEART" ]]; then
  age=$(( $(date +%s) - $(stat -c %Y "$HEART") ))
  if (( age < GAP_SECONDS )); then resume=1; fi
fi

while (( ! stop )); do
  if (( resume )); then
    start=$(cat "$STATE"); resume=0
    log "接着上一场直播（$(( ($(date +%s) - start) / 60 )) 分钟前开始），本场还剩 $(( (start + session_secs - $(date +%s)) / 60 )) 分钟"
  else
    start=$(date +%s); echo "$start" > "$STATE"
    log "开始新一场直播，最长 $((session_secs / 60)) 分钟"
  fi
  touch "$HEART" "$HEART.on"
  if [[ -n "$PLAYLIST" ]]; then
    build_list || { sleep 60 & wait $!; continue; }
    input=(-f concat -safe 0 -stream_loop -1 -i "$LIST_FILE")
  else
    input=(-stream_loop -1 -i "$MEDIA")
  fi
  fails=0
  while (( ! stop )); do
    left=$(( start + session_secs - $(date +%s) ))
    (( left > 30 )) || break
    ffmpeg -nostdin -hide_banner -loglevel warning \
      -re "${input[@]}" -t "$left" \
      -c copy -f flv -flvflags no_duration_filesize \
      "$RTMP_URL/$STREAM_KEY" &
    pid=$!
    wait "$pid"; code=$?
    pid=""
    (( stop )) && break
    left=$(( start + session_secs - $(date +%s) ))
    (( left > 30 )) || break
    fails=$((fails + 1))
    # 断线：前几次马上重连接着推同一场；连续失败就慢慢退避，最多等 2 分钟
    wait_s=$(( fails <= 3 ? 5 : (fails * 10 > 120 ? 120 : fails * 10) ))
    log "推流中断（ffmpeg 退出码 $code），${wait_s} 秒后重连，本场还剩 $((left / 60)) 分钟"
    sleep "$wait_s" & wait $!
  done
  (( stop )) && break
  rm -f "$HEART.on"
  log "本场到时，停 ${GAP_SECONDS} 秒等 YouTube 结束这一场"
  sleep "$GAP_SECONDS" & wait $!
done
log "已停止"
