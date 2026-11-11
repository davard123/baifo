#!/usr/bin/env python3
"""把逐句读诵音频做成有动感的读诵视频（横屏 1280x720，网站和直播都能用）。

用法：python3 render.py <tts 输出目录> <画面配置.json> <输出.mp4> [--preview 秒数]

画面：每一段（section）换一尊佛菩萨像，缓慢推近、左右漂移，段与段之间淡入淡出；
像后面有呼吸的暖光和慢慢转动的光芒，金色光点往上飘；
下方字幕：拼音、当前一句逐字变金色（跟着读音走）、下一句预告；上方显示当前是哪一段。

画面配置.json 例：
{
  "title": "十小咒", "tag": "早课 · 读诵", "site": "fopusha.com/jing/shixiaozhou",
  "images": {"如意宝轮王陀罗尼": "a7-water-moon", ...},   // frontend/public/buddha-variants/<名>-20261024.webp
  "default_image": "a1-gilt"
}
"""
import argparse, json, math, os, subprocess, sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
IMG_DIR = os.path.join(REPO, "frontend", "public", "buddha-variants")
W, H, FPS, SR = 1280, 720, 30, 24000
INTRO, OUTRO, GAP, SECTION_GAP, FADE = 3.5, 4.0, 0.45, 1.2, 1.4
GOLD = (0x7A, 0xD2, 0xF5)  # BGR


def decode(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32)


def timeline(lines):
    """每句的开始时间；段落之间多停一会儿。"""
    t, prev, out = INTRO, None, []
    for l in lines:
        if prev is not None and l.get("section") != prev:
            t += SECTION_GAP
        out.append(t)
        t += l["dur"] + GAP
        prev = l.get("section")
    return out, t + OUTRO


def build_audio(d, lines, starts, total, path):
    buf = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for l, s in zip(lines, starts):
        a = decode(os.path.join(d, f"{l['n']:03d}.mp3"))
        i = int(s * SR)
        buf[i:i + len(a)] += a
    peak = float(np.max(np.abs(buf))) or 1.0
    buf = (buf / peak * 0.89 * 32767).astype("<i2")
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(buf.tobytes())


# ---------- 字幕（ASS） ----------
def ts(t):
    t = max(0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def is_hz(c):
    o = ord(c)
    return 0x3400 <= o <= 0x9FFF or 0x20000 <= o <= 0x2FFFF


def char_times(l):
    """每个汉字几秒开始念：按 TTS 的词边界，词内平均分。"""
    hz = [c for c in l["text"] if is_hz(c)]
    times = []
    for a, b, word in l.get("words", []):
        n = sum(1 for c in word if is_hz(c)) or 1
        for k in range(n):
            times.append(a + (b - a) * k / n)
    if len(times) != len(hz):  # 对不上就平均分
        times = [l["dur"] * 0.04 + l["dur"] * 0.9 * k / max(1, len(hz)) for k in range(len(hz))]
    return times


def karaoke(l):
    """当前句：每个字到点从白变金（\\kf 逐字扫过）。"""
    times = char_times(l)
    out, i, cur = [], 0, 0.0
    text = l["text"]
    for j, c in enumerate(text):
        if is_hz(c):
            nxt = times[i + 1] if i + 1 < len(times) else l["dur"] * 0.98
            lead = times[i] - cur
            if lead > 0.02:
                out.append(f"{{\\k{round(lead * 100)}}}")
            out.append(f"{{\\kf{max(1, round((nxt - times[i]) * 100))}}}{c}")
            cur = nxt
            i += 1
        else:
            out.append(c if c not in "，。：；、" else ("　" if j < len(text) - 1 else ""))
    return "".join(out)


def build_ass(cfg, lines, starts, total, path):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Noto Serif CJK SC,50,&H0050C8F5,&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,4,0,1,3,2,2,40,40,92,1
Style: Py,Noto Sans CJK SC,25,&H10FFFFFF,&H10FFFFFF,&H00101010,&H00000000,0,0,0,0,100,100,1,0,1,2,0,2,40,40,160,1
Style: Next,Noto Serif CJK SC,30,&H66E6E6E6,&H66E6E6E6,&H00101010,&H00000000,0,0,0,0,100,100,3,0,1,2,0,2,40,40,40,1
Style: Head,Noto Sans CJK SC,24,&H007AD2F5,&H007AD2F5,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,2,1,7,36,36,26,1
Style: Sec,Noto Serif CJK SC,34,&H0050C8F5,&H0050C8F5,&H00101010,&H00000000,-1,0,0,0,100,100,6,0,1,3,2,8,40,40,58,1
Style: Big,Noto Serif CJK SC,92,&H0050C8F5,&H0050C8F5,&H00101010,&H00000000,-1,0,0,0,100,100,14,0,1,4,3,5,40,40,0,1
Style: Small,Noto Sans CJK SC,30,&H20FFFFFF,&H20FFFFFF,&H00101010,&H00000000,0,0,0,0,100,100,4,0,1,2,1,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    E = lambda a, b, st, tx, layer=0: ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{st},,0,0,0,,{tx}")
    E(0.3, INTRO - 0.2, "Big", f"{{\\fad(700,500)\\pos({W // 2},{H // 2 - 40})}}{cfg['title']}")
    E(0.8, INTRO - 0.2, "Small", f"{{\\fad(700,500)\\pos({W // 2},{H // 2 + 50})}}{cfg.get('tag', '')}　·　跟着字幕一起念")
    E(INTRO, total, "Head", f"{cfg['title']} · {cfg.get('tag', '读诵')}")
    E(total - OUTRO + 0.3, total, "Small", f"{{\\fad(600,600)\\pos({W // 2},{H // 2 + 10})}}{cfg.get('ending', '愿以此功德　普及于一切')}")
    E(total - OUTRO + 0.8, total, "Head", f"{{\\an2\\fad(600,600)\\pos({W // 2},{H - 60})}}{cfg.get('site', 'fopusha.com')}")
    # 段名
    i = 0
    while i < len(lines):
        sec = lines[i].get("section")
        j = i
        while j + 1 < len(lines) and lines[j + 1].get("section") == sec:
            j += 1
        if sec and sec != cfg["title"]:
            E(starts[i] - 0.6, starts[j] + lines[j]["dur"] + 0.3, "Sec", f"{{\\fad(500,400)}}{sec}")
        i = j + 1
    for k, (l, s) in enumerate(zip(lines, starts)):
        end = s + l["dur"] + GAP * 0.7
        E(s - 0.12, end, "Main", karaoke(l), 2)
        E(s - 0.12, end, "Py", l.get("pinyin", ""), 1)
        if k + 1 < len(lines):
            nxt = lines[k + 1]["text"].rstrip("，。：；")
            E(s - 0.12, end, "Next", "".join("　" if c in "，。：；、" else c for c in nxt), 1)
    open(path, "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")


# ---------- 画面 ----------
def load_img(name):
    p = os.path.join(IMG_DIR, f"{name}-20261024.webp")
    if not os.path.exists(p):
        p = os.path.join(IMG_DIR, name)
    rgba = np.asarray(Image.open(p).convert("RGBA")).astype(np.float32) / 255.0
    s = H * 1.0 / rgba.shape[0]
    rgba = cv2.resize(rgba, (int(rgba.shape[1] * s), H), interpolation=cv2.INTER_AREA)
    alpha = cv2.GaussianBlur(rgba[:, :, 3], (0, 0), 0.8)          # 边缘柔一点，不起锯齿
    im = rgba[:, :, 2::-1] * alpha[..., None]                       # BGR，预乘透明度
    im = np.dstack([im, alpha])                                     # 第 4 通道是遮罩
    glow = cv2.GaussianBlur(cv2.resize(im[:, :, :3], None, fx=0.25, fy=0.25), (0, 0), 9)
    glow = cv2.resize(glow, (im.shape[1], im.shape[0]))
    return im, glow


def place(img, scale, cx, cy):
    """把 img 按 scale 缩放后放到画面 (cx, cy) 为中心的位置。"""
    h, w = img.shape[:2]
    M = np.float32([[scale, 0, cx - w * scale / 2], [0, scale, cy - h * scale / 2]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


class Particles:
    def __init__(self, n=140, seed=7):
        r = np.random.default_rng(seed)
        self.x = r.uniform(0, W, n); self.y = r.uniform(0, H, n)
        self.v = r.uniform(8, 26, n); self.sz = r.uniform(0.8, 2.6, n)
        self.ph = r.uniform(0, 6.28, n); self.sw = r.uniform(6, 22, n)

    def draw(self, t):
        lay = np.zeros((H, W), np.float32)
        y = (self.y - self.v * t) % (H + 40) - 20
        x = self.x + self.sw * np.sin(t * 0.35 + self.ph)
        a = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(t * 1.7 + self.ph * 3))
        for xi, yi, si, ai in zip(x, y, self.sz, a):
            cv2.circle(lay, (int(xi), int(yi)), max(1, int(round(si))), float(ai), -1, cv2.LINE_AA)
        lay = cv2.GaussianBlur(lay, (0, 0), 1.6) * 1.6
        return lay


def rays_texture():
    yy, xx = np.mgrid[-H:H, -H:H].astype(np.float32)
    ang = np.arctan2(yy, xx); rad = np.sqrt(xx ** 2 + yy ** 2) / H
    tex = (0.5 + 0.5 * np.cos(ang * 18)) ** 6 * np.exp(-rad * 2.2)
    return cv2.GaussianBlur(tex.astype(np.float32), (0, 0), 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tts"); ap.add_argument("cfg"); ap.add_argument("out")
    ap.add_argument("--preview", type=float, default=0, help="只渲染前多少秒，看效果用")
    a = ap.parse_args()
    cfg = json.load(open(a.cfg, encoding="utf-8"))
    lines = json.load(open(os.path.join(a.tts, "lines.json"), encoding="utf-8"))["lines"]
    starts, total = timeline(lines)
    work = os.path.splitext(a.out)[0] + "_work"
    os.makedirs(work, exist_ok=True)
    wav, ass = os.path.join(work, "audio.wav"), os.path.join(work, "subs.ass")
    build_audio(a.tts, lines, starts, total, wav)
    build_ass(cfg, lines, starts, total, ass)
    # 时间写出来，网站逐句高亮用（和其他读诵视频的 timing 文件同格式）
    json.dump({"duration": round(total, 2), "lines": [[l["n"], round(s, 2), round(s + l["dur"], 2)] for l, s in zip(lines, starts)]},
              open(os.path.join(work, "timing.json"), "w"), ensure_ascii=False)
    dur = min(total, a.preview) if a.preview else total

    # 每段用哪尊像
    segs, i = [], 0
    while i < len(lines):
        sec = lines[i].get("section"); j = i
        while j + 1 < len(lines) and lines[j + 1].get("section") == sec:
            j += 1
        segs.append([starts[i] - SECTION_GAP / 2, starts[j] + lines[j]["dur"] + GAP, cfg["images"].get(sec, cfg.get("default_image", "a1-gilt"))])
        i = j + 1
    segs[0][0] = 0; segs[-1][1] = total
    cache = {}
    rays = rays_texture()
    parts = Particles()
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vign = np.clip(1.15 - ((xx - W / 2) ** 2 / (W * 0.62) ** 2 + (yy - H / 2) ** 2 / (H * 0.75) ** 2), 0.25, 1)[..., None]
    band = np.clip((yy - H * 0.58) / (H * 0.42), 0, 1)[..., None] ** 1.3  # 下方字幕区压暗
    warm = np.exp(-(((xx - W / 2) / (W * 0.30)) ** 2 + ((yy - H * 0.36) / (H * 0.42)) ** 2))[..., None] * np.float32([0.10, 0.28, 0.55])

    def layer(k, t):
        s0, s1, name = segs[k]
        if name not in cache:
            cache[name] = load_img(name)
        im, glow = cache[name]
        p = (t - s0) / max(1.0, s1 - s0)
        side = -1 if k % 2 else 1
        scale = 0.80 + 0.12 * p                     # 慢慢推近
        cx = W / 2 + side * (70 - 140 * p)          # 左右漂移
        cy = H * 0.47 + 18 * (1 - p)
        body = place(im, scale, cx, cy)
        g = place(glow, scale * 1.18, cx, cy - 10)
        return body, g

    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", wav, "-t", f"{dur:.2f}", "-vf", f"ass={ass}", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-g", str(FPS * 2), "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
    nf = int(dur * FPS)
    for f in range(nf):
        t = f / FPS
        k = next(i for i, s in enumerate(segs) if t < s[1] or i == len(segs) - 1)
        body, glow = layer(k, t)
        # 段落交界淡入淡出
        if k + 1 < len(segs) and t > segs[k][1] - FADE / 2:
            w = min(1, (t - (segs[k][1] - FADE / 2)) / FADE)
            b2, g2 = layer(k + 1, t)
            body = body * (1 - w) + b2 * w; glow = glow * (1 - w) + g2 * w
        elif k > 0 and t < segs[k][0] + FADE / 2:
            w = 0.5 + (t - segs[k][0]) / FADE
            b0, g0 = layer(k - 1, t)
            body = b0 * (1 - w) + body * w; glow = g0 * (1 - w) + glow * w
        breathe = 0.75 + 0.25 * math.sin(t * 0.9)
        M = cv2.getRotationMatrix2D((H, H), t * 2.2, 1.0)
        r = cv2.warpAffine(rays, M, (2 * H, 2 * H))
        cxr = W // 2
        r = r[H - int(H * 0.30):H - int(H * 0.30) + H, H - cxr:H - cxr + W][..., None] * np.float32([0.25, 0.55, 0.85])
        bg = warm * breathe + r * (0.38 + 0.18 * math.sin(t * 0.6)) + glow * 0.45
        # 像用自带的透明度盖在光上，保留像本身的细节，不会被光冲白
        m = body[:, :, 3:4]
        frame = bg * (1 - m) + body[:, :, :3] * (0.92 + 0.08 * breathe)
        frame = frame * vign
        frame = frame * (1 - band * 0.62)
        p = parts.draw(t)[..., None] * np.float32([0.45, 0.80, 1.0])
        frame = 1 - (1 - frame) * (1 - np.clip(p, 0, 1))
        # 片头片尾黑场淡入淡出
        fade = min(1, t / 1.2, (total - t) / 1.5) if t < 1.2 or total - t < 1.5 else 1
        frame = np.clip(frame * fade, 0, 1)
        enc.stdin.write((frame * 255).astype(np.uint8).tobytes())
        if f % (FPS * 20) == 0:
            print(f"  {t:6.1f}/{dur:.0f}s", file=sys.stderr, flush=True)
    enc.stdin.close(); enc.wait()
    print(a.out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
