// 用法：node lines_from_js.mjs <sutra.js>  → 输出 JSON lines
const m = await import(process.argv[2]);
process.stdout.write(JSON.stringify(m.default));
