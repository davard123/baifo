#!/usr/bin/env python3
"""把新的佛像图换进站内，统一成现有规格。

为什么需要处理而不能直接丢进 public/：
  1. 现有 a1-a8 全是 1672x941 的 RGBA 透明图。透明背景是必需的 ——
     佛像要合成到礼佛场景（PrayerStage）上，首页卡片又把图裁成圆形、
     底下垫紫色渐变。带黑底的图放上去就是紫圆里一块黑方块。
  2. 新图有竖构图，直接拉伸会变形；正确做法是等比缩放后居中放进 16:9 画布。

抠底用的是从四边泛洪填充，而不是按亮度阈值：佛像的头发是深蓝近黑，
阈值法会把头发一起吃掉，泛洪只吃与边缘连通的背景。

用法：
    python scripts/replace_buddha_images.py <源目录> [--dry-run]

源目录里放 8 张图，按文件名排序对应：
    1 -> a1 释迦牟尼佛      5 -> a5 文殊菩萨
    2 -> a2 阿弥陀佛        6 -> a6 普贤菩萨
    3 -> a3 药师佛          7 -> a7 观音菩萨
    4 -> a4 弥勒佛          8 -> a8 地藏菩萨
也可以直接把文件命名成 a1.png ... a8.png，脚本会优先按这个匹配。
"""

import os
import re
import shutil
import sys
from collections import deque
from datetime import date

from PIL import Image

CANVAS = (1672, 941)          # 与现有 a1-a8 一致
THUMB_W = 400                 # 与现有较大的一档缩略图一致
MARGIN = 0.04                 # 主体四周留白比例，避免贴边
BG_TOLERANCE = 36             # 判定为背景的亮度上限（0-255）

SLUGS = [
    ('a1', '释迦牟尼佛'), ('a2', '阿弥陀佛'), ('a3', '药师佛'), ('a4', '弥勒佛'),
    ('a5', '文殊菩萨'), ('a6', '普贤菩萨'), ('a7', '观音菩萨'), ('a8', '地藏菩萨'),
]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
THUMBS = os.path.join(PUBLIC, 'thumbs')
BUDDHAS_JS = os.path.join(ROOT, 'src', 'data', 'buddhas.js')


def remove_black_background(im):
    """从四边泛洪，把与边缘连通的近黑像素设为透明。

    只吃连通区域，所以佛像内部的深色（头发、暗部阴影）不会被误伤。
    """
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and max(r, g, b) <= BG_TOLERANCE

    seen = bytearray(w * h)
    q = deque()

    for x in range(w):
        for y in (0, h - 1):
            if not seen[y * w + x] and is_bg(x, y):
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not seen[y * w + x] and is_bg(x, y):
                seen[y * w + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_bg(nx, ny):
                seen[ny * w + nx] = 1
                q.append((nx, ny))

    return im


def fit_to_canvas(im):
    """裁到主体外接框，再等比缩放居中放进 16:9 透明画布。"""
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    cw, ch = CANVAS
    avail_w = int(cw * (1 - MARGIN * 2))
    avail_h = int(ch * (1 - MARGIN * 2))
    scale = min(avail_w / im.width, avail_h / im.height)
    new = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)

    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    canvas.paste(new, ((cw - new.width) // 2, (ch - new.height) // 2), new)
    return canvas


def collect_sources(src_dir):
    files = [f for f in os.listdir(src_dir)
             if os.path.splitext(f)[1].lower() in ('.png', '.jpg', '.jpeg', '.webp')]
    if not files:
        sys.exit(f'源目录里没有图片：{src_dir}')

    by_slug = {}
    for f in files:
        m = re.match(r'^(a[1-8])\b', os.path.splitext(f)[0], re.I)
        if m:
            by_slug[m.group(1).lower()] = f

    if len(by_slug) == 8:
        return [os.path.join(src_dir, by_slug[s]) for s, _ in SLUGS]

    if len(files) != 8:
        sys.exit(f'需要正好 8 张图（或按 a1..a8 命名），当前有 {len(files)} 张：{sorted(files)}')

    def key(f):
        m = re.search(r'\d+', f)
        return (int(m.group()) if m else 0, f)

    return [os.path.join(src_dir, f) for f in sorted(files, key=key)]


def bump_cache_version(dry_run):
    """刷新 buddhas.js 里的 ?v= 版本号，避免 CDN 与浏览器拿旧图。"""
    stamp = date.today().strftime('%Y%m%d')
    with open(BUDDHAS_JS, encoding='utf-8') as fh:
        src = fh.read()

    def repl(m):
        return f"{m.group(1)}?v={stamp}"

    out = re.sub(r"('/(?:a[1-8]\.png|thumbs/buddha-a[1-8]\.webp))(?:\?v=[^']*)?", repl, src)
    changed = out != src
    if changed and not dry_run:
        with open(BUDDHAS_JS, 'w', encoding='utf-8') as fh:
            fh.write(out)
    return stamp, changed


def main():
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    dry_run = '--dry-run' in sys.argv
    if not args:
        sys.exit(__doc__)

    src_dir = args[0]
    if not os.path.isdir(src_dir):
        sys.exit(f'源目录不存在：{src_dir}')

    sources = collect_sources(src_dir)
    backup = os.path.join(PUBLIC, '_buddha_backup')

    print(f'源目录：{src_dir}')
    print(f'画布：{CANVAS[0]}x{CANVAS[1]}   缩略图宽：{THUMB_W}   {"（试跑，不写文件）" if dry_run else ""}\n')

    if not dry_run:
        os.makedirs(backup, exist_ok=True)
        os.makedirs(THUMBS, exist_ok=True)

    for (slug, name), src in zip(SLUGS, sources):
        im = Image.open(src)
        orig = im.size
        im = remove_black_background(im)
        bbox_before = im.getbbox()
        im = fit_to_canvas(im)

        target_png = os.path.join(PUBLIC, f'{slug}.png')
        target_webp = os.path.join(THUMBS, f'buddha-{slug}.webp')

        if not dry_run:
            for t in (target_png, target_webp):
                if os.path.exists(t):
                    shutil.copy2(t, os.path.join(backup, os.path.basename(t)))
            im.save(target_png, 'PNG', optimize=True)
            thumb = im.resize((THUMB_W, round(THUMB_W * CANVAS[1] / CANVAS[0])), Image.LANCZOS)
            thumb.save(target_webp, 'WEBP', quality=86, method=6)

        kb = os.path.getsize(target_png) // 1024 if (not dry_run and os.path.exists(target_png)) else 0
        print(f'  {slug}  {name:<8} ← {os.path.basename(src)}')
        print(f'        原图 {orig[0]}x{orig[1]}  抠底后主体 {bbox_before[2]-bbox_before[0]}x{bbox_before[3]-bbox_before[1]}'
              + (f'  输出 {kb}KB' if kb else ''))

    stamp, changed = bump_cache_version(dry_run)
    print(f'\n缓存版本号 ?v={stamp} ' + ('已写入 buddhas.js' if changed else '（无需改动）'))
    if not dry_run:
        print(f'旧图已备份到 {backup}')
    print('\n接着执行：npm run build，然后部署。')


if __name__ == '__main__':
    main()
