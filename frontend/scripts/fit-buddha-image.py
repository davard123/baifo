# 把 ChatGPT 生成的透明背景佛像，按现有 a1~a8 的版式放到 1672x941 透明画布上：
# 裁掉四周透明边，等比缩放到高度约 98%，水平居中、贴底，输出 webp。
# 用法：python scripts/fit-buddha-image.py 输入.png 输出.webp
import sys
from PIL import Image

W, H = 1672, 941
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
alpha = im.getchannel('A')
# 背景不透明说明 ChatGPT 没给透明图，直接报错，避免把白底图放上网站
corners = [alpha.getpixel(p) for p in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
if max(corners) > 10:
    sys.exit(f'背景不是透明的（四角 alpha={corners}），需要先抠图')
# ChatGPT 的主体 alpha 常是 250 上下，补成完全不透明，免得透出背景
alpha = alpha.point(lambda v: 255 if v >= 200 else v)
im.putalpha(alpha)
im = im.crop(alpha.getbbox())
scale = min((H * 0.98) / im.height, (W * 0.9) / im.width)
im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.paste(im, ((W - im.width) // 2, H - im.height - round(H * 0.01)), im)
canvas.save(dst, 'WEBP', quality=88, method=6)
print(dst, canvas.size, f'figure {im.size}')
