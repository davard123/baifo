#!/usr/bin/env bash
# 把网站上的横屏诵经视频做成 9:16 竖屏循环素材（模糊背景 + 标题 + 网址），
# 每一路直播一个文件：$LIVE_HOME/media/<名称>.mp4
#
# 用法：
#   ./prepare.sh dabeizhou          # 只做一路
#   ./prepare.sh all                # streams.conf 里全部
# 环境变量（一般不用改）：
#   LIVE_HOME    默认 /opt/fopusha-live
#   SOURCE_BASE  素材来源，默认 https://fopusha.com；也可以是本地目录（例如仓库里的 frontend/public）
#   FONT         字体（fontconfig 名称），默认 Noto Sans CJK TC:bold（画面文字都是繁体）
#   PRESET       x264 预设，默认 veryfast（单核 VPS 上大约 1～2 倍实时）
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LIVE_HOME="${LIVE_HOME:-/opt/fopusha-live}"
SOURCE_BASE="${SOURCE_BASE:-https://fopusha.com}"
FONT="${FONT:-Noto Sans CJK TC:bold}"
PRESET="${PRESET:-veryfast}"
CONF="${CONF:-$HERE/streams.conf}"

W=720; H=1280            # 竖屏 720p：画质够用，VPS 流量也省
VBITRATE=1800k           # 约 1.8 Mbps，24 小时一路大约 20 GB/天
FPS=30
GOP=$((FPS * 2))         # YouTube 要求关键帧间隔不超过 2～4 秒

die() { echo "错误：$*" >&2; exit 1; }
command -v ffmpeg >/dev/null || die "没有安装 ffmpeg"

fetch() { # fetch <相对路径> <保存到>
  local rel="$1" out="$2"
  if [[ -s "$out" ]]; then return; fi
  if [[ "$SOURCE_BASE" == http* ]]; then
    curl -fsSL --retry 3 -o "$out.part" "$SOURCE_BASE$rel" && mv "$out.part" "$out"
  else
    cp "$SOURCE_BASE$rel" "$out"
  fi
}

esc() { # 文字放在单引号里，只需处理单引号本身
  printf '%s' "$1" | sed -e "s/'/'\\\\''/g"
}

build_one() {
  local name="$1" title="$2" sub="$3" path="$4" sources="$5"
  local work="$LIVE_HOME/work/$name" out="$LIVE_HOME/media/$name.mp4"
  mkdir -p "$work" "$LIVE_HOME/media" "$LIVE_HOME/cache"
  echo "== $name：$title"

  local site="fopusha.com${path%/}"
  local font; font="$(esc "$FONT")"
  local t1 t2 t3 t4
  t1="$(esc "$title")"; t2="$(esc "$sub")"
  t3="$(esc "經文全文帶拼音・免費線上誦經")"; t4="$(esc "$site")"
  # 顶部大字是一整句邀请语（如「一起念大悲咒・跟著字念」），按字数定字号：
  # 最大 60（约画面高 4.7%），最长 13 个字时 52（约 4.1%），左右各留约 20 像素不出界
  local n tsize
  n="$(printf '%s' "$title" | LC_ALL=C.UTF-8 wc -m 2>/dev/null || echo 13)"
  n="${n//[[:space:]]/}"
  [[ "$n" =~ ^[0-9]+$ && "$n" -gt 0 ]] || n=13
  (( n > 20 )) && n=$(( n / 3 ))   # 没有 C.UTF-8 时 wc 数的是字节，中文一字 3 字节
  tsize=$(( 680 / n )); (( tsize > 60 )) && tsize=60

  local vf="[0:v]fps=$FPS,split[a][b];"
  # 背景先缩到 1/4 再模糊再放大，效果一样，转码快很多
  vf+="[a]scale=$((W / 4)):$((H / 4)):force_original_aspect_ratio=increase,crop=$((W / 4)):$((H / 4)),boxblur=6:2,scale=$W:$H,eq=brightness=-0.30:saturation=0.8[bg];"
  vf+="[b]scale=$W:-2[fg];[bg][fg]overlay=0:(H-h)/2,"
  vf+="drawtext=font='$font':expansion=none:text='$t1':fontsize=$tsize:fontcolor=0xF5D27A:x=(w-text_w)/2:y=190:shadowcolor=black@0.7:shadowx=3:shadowy=3,"
  vf+="drawtext=font='$font':expansion=none:text='$t2':fontsize=34:fontcolor=white@0.92:x=(w-text_w)/2:y=284:shadowcolor=black@0.6:shadowx=2:shadowy=2,"
  vf+="drawtext=font='$font':expansion=none:text='$t3':fontsize=30:fontcolor=white@0.92:x=(w-text_w)/2:y=$((H - 330)),"
  vf+="drawtext=font='$font':expansion=none:text='$t4':fontsize=32:fontcolor=0xF5D27A:x=(w-text_w)/2:y=$((H - 270)):shadowcolor=black@0.7:shadowx=2:shadowy=2,"
  vf+="format=yuv420p[v]"

  local list="$work/list.txt" i=0
  : > "$list"
  IFS=',' read -r -a items <<< "$sources"
  for rel in "${items[@]}"; do
    i=$((i + 1))
    local src="$LIVE_HOME/cache/$(basename "$rel")"
    local seg; seg="$work/$(printf '%02d' "$i").mp4"
    fetch "$rel" "$src"
    if [[ ! -s "$seg" ]]; then
      echo "   [$i/${#items[@]}] 转码 $(basename "$rel")"
      ffmpeg -nostdin -hide_banner -loglevel error -y -i "$src" \
        -filter_complex "$vf" -map '[v]' -map '0:a:0' \
        -af "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100" -ac 2 \
        -c:v libx264 -preset "$PRESET" -profile:v high -b:v "$VBITRATE" -maxrate "$VBITRATE" -bufsize 3600k \
        -g "$GOP" -keyint_min "$GOP" -sc_threshold 0 -r "$FPS" \
        -c:a aac -b:a 128k -ar 44100 \
        "$seg.part.mp4"
      mv "$seg.part.mp4" "$seg"
    fi
    echo "file '$seg'" >> "$list"
  done

  ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "$list" -c copy -movflags +faststart "$out.part.mp4"
  mv "$out.part.mp4" "$out"
  local dur; dur="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$out")"
  printf '   完成：%s（一轮 %.0f 分钟）\n' "$out" "$(echo "$dur / 60" | bc -l)"
}

target="${1:-}"
[[ -n "$target" ]] || die "用法：$0 <名称|all>，名称见 streams.conf"
found=0
while IFS='|' read -r name title sub path sources; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  if [[ "$target" == all || "$target" == "$name" ]]; then
    found=1
    build_one "$name" "$title" "$sub" "$path" "$sources"
  fi
done < "$CONF"
[[ $found == 1 ]] || die "streams.conf 里没有 $target"
