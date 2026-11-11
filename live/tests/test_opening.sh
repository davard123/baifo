#!/usr/bin/env bash
# 离线验证 live.sh 的 build_list / clock_slot；不进入 live.sh 主循环，也不联网。
set -euo pipefail

TEST_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LIVE_DIR="$(cd -- "$TEST_DIR/.." && pwd)"
REPO_DIR="$(cd -- "$LIVE_DIR/.." && pwd)"
OUTPUT="/d/document/念佛板块/reports/早晚课-live-test-output.txt"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/fopusha-live-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$(dirname "$OUTPUT")" "$TMP/conf" "$TMP/home/media" "$TMP/bin"
exec > >(tee "$OUTPUT") 2>&1

printf '%s\n' '# fopusha live opening offline test' "started=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
  "live_sh=$LIVE_DIR/live.sh" "network=disabled" "main_loop=not_run"

# Qwen venv 自带 tzdata，作为 live.sh 中 python3 的真实实现；不使用 UTC shim。
QWEN_PY="/c/AI/TTS/Qwen3-TTS/.venv/Scripts/python.exe"
INDEX_PY="/c/AI/index-tts/.venv/Scripts/python.exe"
INDEX2_PY="/c/AI/TTS/IndexTTS2/.venv/Scripts/python.exe"
DUIBIAO_PY="/d/video/_tools/duibiao-venv/Scripts/python.exe"
TZ_PROBE='import importlib.util; from zoneinfo import ZoneInfo; z=ZoneInfo("Asia/Taipei"); print("tzdata=" + str(importlib.util.find_spec("tzdata") is not None) + " zoneinfo=" + str(z))'
check_python_tz() {
  local label="$1" exe="$2" result
  if [[ ! -f "$exe" ]]; then
    printf '%s\n' "$label: unavailable ($exe)"
    return 0
  fi
  if result=$("$exe" -c "$TZ_PROBE" 2>&1); then
    printf '%s: %s\n' "$label" "$result"
  else
    printf '%s: zoneinfo-unavailable (%s)\n' "$label" "$(printf '%s\n' "$result" | tail -n 1)"
  fi
}
check_python_tz Qwen3-TTS "$QWEN_PY"
check_python_tz index-tts "$INDEX_PY"
check_python_tz IndexTTS2 "$INDEX2_PY"
check_python_tz duibiao "$DUIBIAO_PY"
[[ -f "$QWEN_PY" ]] || { echo 'FAIL: Qwen Python not found'; exit 1; }

# live.sh 固定调用 python3；这个 wrapper 只选择本机 Qwen Python，不替换时区逻辑。
cat > "$TMP/bin/python3" <<EOF
#!/usr/bin/env bash
exec "$QWEN_PY" "\$@"
EOF
chmod +x "$TMP/bin/python3"
export PATH="$TMP/bin:$PATH"

cat > "$TMP/conf/test.env" <<'EOF'
STREAM_KEY=fake
PLAYLIST="loop-a loop-b"
SESSION_STARTS="08:00 20:00"
SESSION_TZ=Asia/Taipei
END_EARLY_MIN=10
OPENING_0800="lengyan_recite dabeizhou_recite*7 shixiaozhou_recite xinjing_recite*3"
OPENING_2000="amituo_recite wangsheng_recite*3"
EOF
for p in loop-a loop-b lengyan_recite dabeizhou_recite shixiaozhou_recite xinjing_recite amituo_recite wangsheng_recite; do
  printf '%s\n' "$p" > "$TMP/home/media/$p.mp4"
done

# 只 source live.sh 中 clock_slot/build_list 之前的定义和函数，不执行服务主循环。
export CONF_DIR="$TMP/conf" LIVE_HOME="$TMP/home"
source <(sed '/^session_secs=/,$d' "$LIVE_DIR/live.sh") test
log() { printf 'LOG %s\n' "$*"; }
dump_list() {
  sed -E "s#^.*/media/##; s#\.mp4'##" "$LIST_FILE"
}
assert_eq() {
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s: got=%s expected=%s\n' "$label" "$actual" "$expected"
    exit 1
  fi
  printf 'PASS %s=%s\n' "$label" "$actual"
}
assert_slot() {
  local label="$1" now="$2" expected_wait="$3" expected_slot="$4" result wait_s end_s slot
  export CLOCK_NOW="$now"
  result="$(clock_slot)"
  read -r wait_s end_s slot <<< "$result"
  printf 'CLOCK %s now=%s result=%s\n' "$label" "$now" "$result"
  assert_eq "$label.wait" "$wait_s" "$expected_wait"
  assert_eq "$label.slot" "$slot" "$expected_slot"
}

printf '%s\n' '' '## build_list cases'
unset CLOCK_NOW
OPENING_SLOT=0800
build_list
assert_eq early_count "$(wc -l < "$LIST_FILE")" 36
printf '%s\n' 'EARLY_LIST'; dump_list

OPENING_SLOT=2000
build_list
assert_eq late_count "$(wc -l < "$LIST_FILE")" 28
printf '%s\n' 'LATE_LIST'; dump_list

OPENING_SLOT=0800
build_list resume
assert_eq resume_count "$(wc -l < "$LIST_FILE")" 24
printf '%s\n' 'RESUME_LIST'; dump_list

OPENING_SLOT=0600
OPENING=loop-a
OPENING_REPEAT=2
build_list
assert_eq fallback_count "$(wc -l < "$LIST_FILE")" 26
printf '%s\n' 'FALLBACK_LIST'; dump_list

OPENING_SLOT=0800
OPENING_0800="missing_recite*2 loop-a*0 bad*abc"
build_list
assert_eq invalid_missing_count "$(wc -l < "$LIST_FILE")" 24
printf '%s\n' 'INVALID_MISSING_LIST'; dump_list

OPENING_0800="loop-a*08 loop-b*09"
build_list
assert_eq leading_zero_count "$(wc -l < "$LIST_FILE")" 41
printf '%s\n' 'LEADING_ZERO_LIST'; dump_list

OPENING_0800="loop-a*1001"
build_list
assert_eq over_limit_count "$(wc -l < "$LIST_FILE")" 24
printf '%s\n' 'OVER_LIMIT_LIST'; dump_list

OPENING_SLOT=0600
OPENING=loop-a
OPENING_REPEAT=0008
build_list
assert_eq fallback_leading_zero_count "$(wc -l < "$LIST_FILE")" 32
printf '%s\n' 'FALLBACK_LEADING_ZERO_LIST'; dump_list

printf '%s\n' '' '## clock_slot cases (real Asia/Taipei zoneinfo)'
printf '%s\n' 'clock_timezone=Asia/Taipei now_injection=CLOCK_NOW (timezone logic unchanged)'
SESSION_STARTS="08:00 20:00"
SESSION_TZ=Asia/Taipei
END_EARLY_MIN=10
assert_slot taipei_0700 2026-11-10T07:00:00 0 2000
assert_slot taipei_0800 2026-11-10T08:00:00 0 0800
assert_slot taipei_2000 2026-11-10T20:00:00 0 2000
assert_slot taipei_1950_transition 2026-11-10T19:50:00 601 2000
unset CLOCK_NOW

printf '%s\n' '' 'ALL TESTS PASSED' "finished=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
