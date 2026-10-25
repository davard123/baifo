# 把 ChatGPT 生成的透明背景神像放进固定尺寸的透明画布：裁掉透明边，等比缩放，水平居中、贴底，输出 webp。
# 用法：python scripts/fit-figure-image.py 输入.png 输出.webp [宽 高 高度占比]
# 佛像横版：1672 941 0.98（默认）；祈福像竖版：1024 1536 0.96
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1672
H = int(sys.argv[4]) if len(sys.argv) > 4 else 941
ratio = float(sys.argv[5]) if len(sys.argv) > 5 else 0.98

im = Image.open(src).convert('RGBA')
alpha = im.getchannel('A')
# 背景不透明说明没拿到透明图，直接报错，避免把白底图放上网站
corners = [alpha.getpixel(p) for p in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
if max(corners) > 10:
    sys.exit(f'background is not transparent (corner alpha={corners})')
# ChatGPT 的主体 alpha 常是 250 上下，补成完全不透明，免得透出背景
alpha = alpha.point(lambda v: 255 if v >= 200 else v)
im.putalpha(alpha)
im = im.crop(alpha.getbbox())
scale = min((H * ratio) / im.height, (W * 0.96) / im.width)
im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.paste(im, ((W - im.width) // 2, H - im.height - round(H * 0.01)), im)
canvas.save(dst, 'WEBP', quality=88, method=6)
print(dst, canvas.size, 'figure', im.size)
