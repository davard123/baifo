#!/usr/bin/env bash
# 在一台全新的 Ubuntu / Debian VPS 上用 root 运行一次：
#   git clone https://github.com/davard123/baifo.git && cd baifo/live && sudo ./install.sh
# 会安装 ffmpeg 和中文字体，把脚本放到 /opt/fopusha-live，并注册 systemd 服务模板。
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "请用 root 运行（sudo ./install.sh）" >&2; exit 1; }

HERE="$(cd "$(dirname "$0")" && pwd)"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg fonts-noto-cjk fontconfig curl bc >/dev/null
fc-cache -f >/dev/null

install -d /opt/fopusha-live/media /etc/fopusha-live
install -m 755 "$HERE/live.sh" "$HERE/prepare.sh" "$HERE/yt_api.py" /opt/fopusha-live/
install -m 644 "$HERE/streams.conf" /opt/fopusha-live/
install -m 644 "$HERE/fopusha-live@.service" /etc/systemd/system/
chmod 700 /etc/fopusha-live
systemctl daemon-reload

cat <<'EOF'

安装完成。接下来：
  1. 生成竖屏素材（单核 VPS 上一部经大约要十几分钟到一小时）：
       cd /opt/fopusha-live && ./prepare.sh dabeizhou
  2. 写入推流密钥：
       echo 'STREAM_KEY=你的推流密钥' > /etc/fopusha-live/dabeizhou.env
       chmod 600 /etc/fopusha-live/dabeizhou.env
  3. 开播并设为开机自动启动：
       systemctl enable --now fopusha-live@dabeizhou
  4. 看日志：
       journalctl -u fopusha-live@dabeizhou -f
EOF
