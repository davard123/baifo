#!/usr/bin/env python3
"""女声读诵：逐句合成，按课诵本拼音纠正多音字和咒语读音。

用法：python3 tts.py <经文.json> <输出目录> [--voice zh-CN-XiaoxiaoNeural] [--rate -12%]
经文 json 就是 frontend/src/data/sutras/<名>.js 的内容（lines: [{n,text,pinyin,section}]）。

做法：TTS 默认按普通话常用读音念，咒语里很多字要念特殊音（南无 nā mó、啰 là……）。
对每个字比较「TTS 默认会念的音」(pypinyin) 和课诵本标的音，不一样的就换成一个只有那个读音的常用同音字
再送去合成；字幕仍然显示原文。
输出：<输出目录>/NNN.mp3（每句一个）和 lines.json（每句的原文、送去合成的文字、时长）。
"""
import argparse, asyncio, json, os, re, subprocess, sys

import certifi
CA = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):
    certifi.where = lambda: CA  # 走代理时用代理的根证书
import edge_tts
import edge_tts.communicate as _c
if os.path.exists(CA):
    _c.certifi.where = lambda: CA
from pypinyin import pinyin, Style
from pypinyin.pinyin_dict import pinyin_dict

HZ = re.compile(r"[㐀-䶿一-鿿\U00020000-\U0002ffff]")


def build_homophones():
    """读音 -> 同音常用字。优先只有一个读音的一级字，其次第一读音就是它的字（一级字优先于二级字）。"""
    cands = {}
    for cp, readings in pinyin_dict.items():
        rs = readings.split(",")
        ch = chr(cp)
        try:
            b = ch.encode("gb2312")
        except UnicodeEncodeError:
            continue
        if len(b) != 2:
            continue
        level = 1 if 0xB0 <= b[0] <= 0xD7 else 2
        rank = (0 if len(rs) == 1 else 1, level)
        if rank < cands.get(rs[0], ((9, 9), ""))[0]:
            cands[rs[0]] = (rank, ch)
    best = {k: v[1] for k, v in cands.items()}
    # 普通话里没有的咒音，按寺院通行念法取最接近的字
    best.update({"ōng": "嗡", "nā": "南", "qié": "茄", "qiē": "切", "suō": "梭", "fó": "佛"})
    return best


HOMO = build_homophones()

# TTS 实际念错、但 pypinyin 以为它会念对的字（按语音识别抽查结果补）：(课诵读音, 送去合成的字)
FORCE = {
    "南": ("nā", "拿"),   # 南无/南谟 TTS 念 nán wú
    "无": ("mó", "摩"),
    "吽": ("hōng", "轰"),  # TTS 念成 ōu
    "噜": ("lū", "撸"),   # TTS 念成 luō
    "娑": ("suō", "梭"),  # TTS 念成 sū
    "唵": ("ōng", "嗡"),
}


def speakable(text, py):
    """把读音和 TTS 默认读音不一样的字换成同音字。返回 (送去合成的文字, 换了哪些字)。"""
    hz = HZ.findall(text)
    sylls = py.split()
    if len(hz) != len(sylls):
        return text, []
    default = [p[0] for p in pinyin("".join(hz), style=Style.TONE, heteronym=False, errors="ignore")]
    if len(default) != len(hz):
        default = [pinyin(c, style=Style.TONE)[0][0] for c in hz]
    out, swaps, i = [], [], 0
    for ch in text:
        if HZ.match(ch):
            want, got = sylls[i], default[i]
            i += 1
            if ch in FORCE and FORCE[ch][0] == want:
                out.append(FORCE[ch][1]); swaps.append(f"{ch}→{FORCE[ch][1]}")
                continue
            if want != got and want in HOMO:
                out.append(HOMO[want]); swaps.append(f"{ch}({got}→{want}){HOMO[want]}")
                continue
            if want != got:
                swaps.append(f"{ch}({got}→{want})找不到同音字")
        out.append(ch)
    return "".join(out), swaps


async def say(text, path, voice, rate):
    for attempt in range(4):
        try:
            words = []
            with open(path, "wb") as f:
                async for ch in edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary").stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":  # 每个词几秒开始念，用来做逐字变色
                        words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
            if os.path.getsize(path) > 1000:
                json.dump(words, open(path + ".words.json", "w", encoding="utf-8"), ensure_ascii=False)
                return
        except Exception as e:  # 网络偶尔断，重试
            print("  重试：", e, file=sys.stderr)
        await asyncio.sleep(2 + attempt * 3)
    raise SystemExit(f"合成失败：{text}")


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sutra"); ap.add_argument("out")
    ap.add_argument("--voice", default="zh-CN-XiaoxiaoNeural")
    ap.add_argument("--rate", default="-12%")
    a = ap.parse_args()
    d = json.load(open(a.sutra, encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    res = []
    for l in d["lines"]:
        spoken, swaps = speakable(l["text"], l["pinyin"])
        p = os.path.join(a.out, f"{l['n']:03d}.mp3")
        stamp = p + ".txt"
        if (not os.path.exists(p) or os.path.getsize(p) < 1000
                or not os.path.exists(stamp) or open(stamp, encoding="utf-8").read() != spoken
                or not os.path.exists(p + ".words.json")):
            await say(spoken, p, a.voice, a.rate)
            open(stamp, "w", encoding="utf-8").write(spoken)
        wp = p + ".words.json"
        words = json.load(open(wp, encoding="utf-8")) if os.path.exists(wp) else []
        res.append({**l, "spoken": spoken, "swaps": swaps, "dur": duration(p), "words": words})
        print(f"{l['n']:3d} {res[-1]['dur']:5.2f}s {l['text']}  {' '.join(swaps)}")
    json.dump({"title": d.get("title"), "lines": res}, open(os.path.join(a.out, "lines.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


asyncio.run(main())
