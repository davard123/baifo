"""把提词器用的 Vosk 中文小模型打包成 tar.gz，再切成 ≤20MB 的块放 public/nianjing/model/。
Cloudflare Pages 单文件上限 25MB，浏览器端按 manifest 顺序下载后拼回去。
用法：python scripts/pack-vosk-model.py"""
import hashlib, io, json, os, tarfile

SRC = 'D:/document/pc-teleprompter/model-cn'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'nianjing', 'model')
CHUNK = 20 * 1024 * 1024
VERSION = 'cn-small-0.22-v1'

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz', compresslevel=9) as tar:
    tar.add(SRC, arcname='model')
data = buf.getvalue()
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
parts = []
for i in range(0, len(data), CHUNK):
    name = f'part-{i // CHUNK:02d}.bin'
    with open(os.path.join(OUT, name), 'wb') as fh:
        fh.write(data[i:i + CHUNK])
    parts.append(name)
manifest = {'version': VERSION, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'parts': parts}
with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
    json.dump(manifest, fh, indent=1)
print(manifest)
