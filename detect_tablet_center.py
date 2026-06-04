"""
Detect the horizontal center of each ancestor PNG's name-slot.

Two color schemes exist:
 - Dark wood + gold inner border (father, grandfather, grandmother, ancestors,
   spouse, general) — use inner-gold-border detection (gold pixel adjacent to dark wood)
 - Light cream body + brass inner border (mother, child) — use light-body run detection
   (find the longest contiguous light-cream horizontal run per row — that's the body)

Outputs per file: detected slot center x (pixels and fraction of W), plus an
annotated PNG with red=detected center, blue=canvas center (W*0.5).
"""

import os
from PIL import Image, ImageDraw

ANCESTOR_DIR = r"D:\document\xiaoxinpad8085_termux_html\frontend\public\ancestors"
OUT_DIR = r"D:\document\xiaoxinpad8085_termux_html\detect_output"
os.makedirs(OUT_DIR, exist_ok=True)

DARK_FILES = {
    "father.png", "grandfather.png", "grandmother.png",
    "ancestors.png", "spouse.png", "general.png",
}
LIGHT_FILES = {"mother.png", "child.png"}
FILES = list(DARK_FILES | LIGHT_FILES)
FILES.sort()


def is_gold(r, g, b):
    return (
        140 <= r <= 250 and 100 <= g <= 220 and 50 <= b <= 170
        and r > g > b and (r - b) > 30
    )


def is_dark_wood(r, g, b):
    return r < 90 and g < 75 and b < 70


def is_light_body(r, g, b):
    """Cream/ivory tablet body."""
    return r > 200 and g > 190 and b > 160 and r >= g and g >= b - 8


def detect_dark_slot_center(img):
    """For dark-wood tablets: find inner gold border (gold next to dark wood)."""
    W, H = img.size
    px = img.load()
    y0, y1 = int(H * 0.32), int(H * 0.52)
    radius = W // 3
    cx0 = W // 2

    centers = []
    for y in range(y0, y1):
        left_gold = None
        for x in range(cx0, max(0, cx0 - radius), -1):
            r, g, b = px[x, y]
            if is_gold(r, g, b):
                for dx in (-4, -6, -9):
                    if x + dx >= 0:
                        lr, lg, lb = px[x + dx, y]
                        if is_dark_wood(lr, lg, lb):
                            left_gold = x
                            break
                if left_gold:
                    break

        right_gold = None
        for x in range(cx0, min(W, cx0 + radius)):
            r, g, b = px[x, y]
            if is_gold(r, g, b):
                for dx in (4, 6, 9):
                    if x + dx < W:
                        rr, rg, rb = px[x + dx, y]
                        if is_dark_wood(rr, rg, rb):
                            right_gold = x
                            break
                if right_gold:
                    break

        if left_gold and right_gold and right_gold > left_gold + 20:
            centers.append((left_gold + right_gold) / 2)

    if not centers:
        return None, 0
    centers.sort()
    return centers[len(centers) // 2], len(centers)


def detect_light_body_center(img):
    """For light-bodied tablets: find longest contiguous light-cream run per row."""
    W, H = img.size
    px = img.load()
    y0, y1 = int(H * 0.30), int(H * 0.55)
    min_width = int(W * 0.12)  # tablet body must be at least 12% wide

    centers = []
    for y in range(y0, y1):
        in_run = False
        run_start = 0
        best_start = -1
        best_len = 0
        for x in range(W):
            r, g, b = px[x, y]
            if is_light_body(r, g, b):
                if not in_run:
                    in_run = True
                    run_start = x
            else:
                if in_run:
                    L = x - run_start
                    if L > best_len:
                        best_len = L
                        best_start = run_start
                    in_run = False
        if in_run:
            L = W - run_start
            if L > best_len:
                best_len = L
                best_start = run_start
        if best_len > min_width:
            centers.append(best_start + best_len / 2)

    if not centers:
        return None, 0
    centers.sort()
    return centers[len(centers) // 2], len(centers)


print(f"{'file':<18}  {'W':>5}  {'H':>5}  {'cx':>8}  {'frac':>8}  rows  scheme")
print("-" * 80)

results = {}
for fname in FILES:
    path = os.path.join(ANCESTOR_DIR, fname)
    img = Image.open(path).convert("RGB")
    W, H = img.size

    if fname in DARK_FILES:
        cx, n = detect_dark_slot_center(img)
        scheme = "dark"
    else:
        cx, n = detect_light_body_center(img)
        scheme = "light"

    if cx is None:
        print(f"{fname:<18}  {W:>5}  {H:>5}     NOT DETECTED          ({scheme})")
        continue

    frac = cx / W
    results[fname] = frac
    print(f"{fname:<18}  {W:>5}  {H:>5}  {cx:>8.1f}  {frac:>8.4f}  {n:>4}  {scheme}")

    annotated = img.copy()
    draw = ImageDraw.Draw(annotated)
    draw.line([(cx, 0), (cx, H)], fill=(255, 0, 0), width=3)
    draw.line([(W // 2, 0), (W // 2, H)], fill=(0, 100, 255), width=2)
    annotated.save(os.path.join(OUT_DIR, fname))

print()
print("# Suggested TABLET_SLOTS.x values (paste into tabletCanvas.js):")
for fname in sorted(results):
    print(f"  '{fname}': x: {results[fname]:.4f},")
